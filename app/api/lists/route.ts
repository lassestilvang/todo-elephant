
// Validation schema
const listSchema = createInsertSchema(lists, {
  name: z.string().min(1, 'List name is required').max(255),
  description: z.string().optional(),
});

const listSelectSchema = createSelectSchema(lists);

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = listSchema.parse(body);
    
    const [result] = await db
      .insert(lists)
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
      { error: 'Failed to create list', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET_BY_ID(id: number) {
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

export async function PUT(id: number, request: Request) {
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

export async function DELETE(id: number) {
  try {
    const list = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    
    if (list.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
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