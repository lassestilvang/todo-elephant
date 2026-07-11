import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, nextFilterId } from "@/app/lib/db";
import { SavedFilter } from "@/types";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.savedFilters);
  } catch (error) {
    console.error("GET /api/filters error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const filterConfig = await request.json();
    if (!filterConfig?.name || !filterConfig?.query) {
      return NextResponse.json({ error: "Filter name and query are required" }, { status: 400 });
    }
    const newFilter = await mutateDB<SavedFilter>((db) => {
      const f: SavedFilter = {
        id: nextFilterId(db),
        name: String(filterConfig.name),
        query: String(filterConfig.query),
        statusFilter: filterConfig.statusFilter ?? "all",
        priorityFilter: filterConfig.priorityFilter ?? "all",
        sortBy: filterConfig.sortBy ?? "newest",
      };
      db.savedFilters.push(f);
      return f;
    });
    return NextResponse.json(newFilter, { status: 201 });
  } catch (error) {
    console.error("POST /api/filters error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
