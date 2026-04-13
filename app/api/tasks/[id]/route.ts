import { NextResponse } from 'next/server';
import { db, tasks, lists, labels, taskLabels, activityLogs } from '@/db/index';
import { eq, desc, asc, sql } from '@vercel/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Validation schemas
const taskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  listId: z.number().int().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.number().int().min(0).max(10).optional(),
  dueDate: z.string().datetime().optional(),
});

const listSchema = createInsertSchema(lists, {
  name: z.string().min(1, 'List name is required').max(255),
  description: z.string().optional(),
});

const labelSchema = createInsertSchema(labels, {
  name: z.string().min(1, 'Label name is required').max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const activityLogSchema = createSelectSchema(activityLogs);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');

  try {
    let query = activityLogs.select().orderBy(desc(activityLogs.createdAt));

    if (entityType) {
      query = query.where(eq(activityLogs.entityType, entityType));
    }
    if (entityId) {
      query = query.where(eq(activityLogs.entityId, Number(entityId)));
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = activityLogSchema.parse(body);
    
    const [result] = await db
      .insert(activityLogs)
      .values(validatedData)
      .returning();
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create activity log', details: err.message },
      { status: 500 }
    );
  }
}

// Task Routes
export async function GET_TASKS() {
  try {
    const result = await db.select().from(tasks).orderBy(desc(tasks.dueDate));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST_TASKS(request: Request) {
  try {
    const body = await request.json();
    
    // Validate list exists if provided
    if (body.listId) {
      const list = await db.select().from(lists).where(eq(lists.id, body.listId)).limit(1);
      if (list.length === 0) {
        return NextResponse.json(
          { error: 'List not found' },
          { status: 404 }
        );
      }
    }

    const validatedData = taskSchema.parse(body);
    
    const [result] = await db
      .insert(tasks)
      .values({
        ...validatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    // Log activity
    await db.insert(activityLogs).values({
      action: 'create',
      entityType: 'task',
      entityId: result.id,
      newValue: JSON.stringify(result),
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create task', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET_TASK_BY_ID(id: number) {
  try {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch task', details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT_TASK(id: number, request: Request) {
  try {
    const body = await request.json();
    
    // Validate list exists if provided
    if (body.listId !== undefined) {
      const list = await db.select().from(lists).where(eq(lists.id, body.listId)).limit(1);
      if (list.length === 0) {
        return NextResponse.json(
          { error: 'List not found' },
          { status: 404 }
        );
      }
    }

    const validatedData = taskSchema.partial().parse(body);
    
    const [result] = await db
      .update(tasks)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Log activity
    await db.insert(activityLogs).values({
      action: 'update',
      entityType: 'task',
      entityId: id,
      previousValue: JSON.stringify({ id, ...await getTaskForUpdate(id) }),
      newValue: JSON.stringify(result),
    });
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update task', details: err.message },
      { status: 500 }
    );
  }
}

async function getTaskForUpdate(id: number) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return task;
}

export async function DELETE_TASK(id: number) {
  try {
    const task = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    
    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Log activity before deletion
    await db.insert(activityLogs).values({
      action: 'delete',
      entityType: 'task',
      entityId: id,
      previousValue: JSON.stringify(task[0]),
      newValue: null,
    });
    
    await db.delete(tasks).where(eq(tasks.id, id));
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to delete task', details: err.message },
      { status: 500 }
    );
  }
}

// List Routes
export async function GET_LISTS() {
  try {
    const result = await db.select().from(lists).orderBy(asc(lists.name));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch lists', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST_LISTS(request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = listSchema.parse(body);
    
    const [result] = await db
      .insert(lists)
      .values(validatedData)
      .returning();
    
    // Log activity
    await db.insert(activityLogs).values({
      action: 'create',
      entityType: 'list',
      entityId: result.id,
      newValue: JSON.stringify(result),
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create list', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET_LIST_BY_ID(id: number) {
  try {
    const result = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch list', details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT_LIST(id: number, request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = listSchema.partial().parse(body);
    
    const [result] = await db
      .update(lists)
      .set({
        ...validatedData,
      })
      .where(eq(lists.id, id))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    // Log activity
    await db.insert(activityLogs).values({
      action: 'update',
      entityType: 'list',
      entityId: id,
      previousValue: JSON.stringify({ id, ...await getListForUpdate(id) }),
      newValue: JSON.stringify(result),
    });
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update list', details: err.message },
      { status: 500 }
    );
  }
}

async function getListForUpdate(id: number) {
  const [list] = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
  return list;
}

export async function DELETE_LIST(id: number) {
  try {
    const list = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    
    if (list.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    // Log activity before deletion
    await db.insert(activityLogs).values({
      action: 'delete',
      entityType: 'list',
      entityId: id,
      previousValue: JSON.stringify(list[0]),
      newValue: null,
    });
    
    await db.delete(lists).where(eq(lists.id, id));
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to delete list', details: err.message },
      { status: 500 }
    );
  }
}

// Label Routes
export async function GET_LABELS() {
  try {
    const result = await db.select().from(labels).orderBy(asc(labels.name));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch labels', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST_LABELS(request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = labelSchema.parse(body);
    
    const [result] = await db
      .insert(labels)
      .values(validatedData)
      .returning();
    
    // Log activity
    await db.insert(activityLogs).values({
      action: 'create',
      entityType: 'label',
      entityId: result.id,
      newValue: JSON.stringify(result),
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create label', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET_LABEL_BY_ID(id: number) {
  try {
    const result = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch label', details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT_LABEL(id: number, request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = labelSchema.partial().parse(body);
    
    const [result] = await db
      .update(labels)
      .set({
        ...validatedData,
      })
      .where(eq(labels.id, id))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }
    
    // Log activity
    await db.insert(activityLogs).values({
      action: 'update',
      entityType: 'label',
      entityId: id,
      previousValue: JSON.stringify({ id, ...await getLabelForUpdate(id) }),
      newValue: JSON.stringify(result),
    });
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update label', details: err.message },
      { status: 500 }
    );
  }
}

async function getLabelForUpdate(id: number) {
  const [label] = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
  return label;
}

export async function DELETE_LABEL(id: number) {
  try {
    const label = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
    
    if (label.length === 0) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }
    
    // Log activity before deletion
    await db.insert(activityLogs).values({
      action: 'delete',
      entityType: 'label',
      entityId: id,
      previousValue: JSON.stringify(label[0]),
      newValue: null,
    });
    
    await db.delete(labels).where(eq(labels.id, id));
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to delete label', details: err.message },
      { status: 500 }
    );
  }
}