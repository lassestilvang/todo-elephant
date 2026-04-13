
// Validation schemas
const activityLogSchema = createInsertSchema(activityLogs);
const activityLogSelectSchema = createSelectSchema(activityLogs);

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

export async function GET_BY_ID(id: number) {
  try {
    const result = await db.select().from(activityLogs).where(eq(activityLogs.id, id)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Activity log not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch activity log', details: err.message },
      { status: 500 }
    );
  }
}