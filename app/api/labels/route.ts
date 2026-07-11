import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, logActivity, nextLabelId } from "@/app/lib/db";
import { Label } from "@/types";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.labels);
  } catch (error) {
    console.error("GET /api/labels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ error: "Label name is required" }, { status: 400 });
    }
    const label = await mutateDB<Label>((db) => {
      const name = String(body.name).trim();
      const existing = db.labels.find((l) => l.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      const newLabel: Label = {
        id: nextLabelId(db),
        name,
        color: body.color || "#64748b",
      };
      db.labels.push(newLabel);
      return newLabel;
    });
    if (label) await logActivity(`Created tag "${label.name}"`, "label", label.id);
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error("POST /api/labels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
