import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/app/lib/db";
import { SavedFilter } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.savedFilters);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const filterData = await request.json();
    if (!filterData.name || !filterData.query) {
      return NextResponse.json({ error: "Filter name and query are required" }, { status: 400 });
    }

    const db = readDB();
    const newId = db.savedFilters.length > 0 ? Math.max(...db.savedFilters.map(f => f.id)) + 1 : 1;

    const newFilter: SavedFilter = {
      id: newId,
      name: filterData.name,
      query: filterData.query,
      statusFilter: filterData.statusFilter || "all",
      priorityFilter: filterData.priorityFilter || "all",
      sortBy: filterData.sortBy || "newest"
    };

    db.savedFilters.push(newFilter);
    writeDB(db);

    return NextResponse.json(newFilter, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
