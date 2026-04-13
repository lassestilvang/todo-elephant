
// Validation schema
const labelSchema = createInsertSchema(labels, {
  name: z.string().min(1, 'Label name is required').max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const labelSelectSchema = createSelectSchema(labels);

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validatedData = labelSchema.parse(body);
    
    const [result] = await db
      .insert(labels)
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
      { error: 'Failed to create label', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET_BY_ID(id: number) {
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

export async function PUT(id: number, request: Request) {
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

export async function DELETE(id: number) {
  try {
    const label = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
    
    if (label.length === 0) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }
    
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