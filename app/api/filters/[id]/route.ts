import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/app/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = readDB();
    const filterIndex = db.savedFilters.findIndex(f => f.id === id);

    if (filterIndex === -1) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    db.savedFilters.splice(filterIndex, 1);
    writeDB(db);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
