import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";
import { List } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.lists);
  } catch (error) {
    console.error("GET /api/lists error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listData = typeof body === "string" ? JSON.parse(body) : body;

    if (!listData || !listData.name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    const db = readDB();
    const newId = db.lists.length > 0 ? Math.max(...db.lists.map(l => l.id)) + 1 : 1;

    const newList: List = {
      id: newId,
      name: listData.name.trim(),
      description: listData.description || "",
      color: listData.color || "#3b82f6",
      createdAt: new Date().toISOString()
    };

    db.lists.push(newList);
    writeDB(db);

    logActivity(`Created category "${newList.name}"`, "list", newList.id);

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
