import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, logActivity, nextListId } from "@/app/lib/db";
import { List } from "@/types";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.lists);
  } catch (error) {
    console.error("GET /api/lists error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }
    const list = await mutateDB<List>((db) => {
      const newList: List = {
        id: nextListId(db),
        name: String(body.name).trim(),
        description: body.description ?? "",
        color: body.color || "#3b82f6",
        createdAt: new Date().toISOString(),
      };
      db.lists.push(newList);
      return newList;
    });
    await logActivity(`Created category "${list.name}"`, "list", list.id);
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("POST /api/lists error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
