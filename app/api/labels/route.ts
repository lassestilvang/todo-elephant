import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";
import { Label } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.labels);
  } catch (error) {
    console.error("GET /api/labels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const labelData = typeof body === "string" ? JSON.parse(body) : body;

    if (!labelData || !labelData.name) {
      return NextResponse.json({ error: "Label name is required" }, { status: 400 });
    }

    const db = readDB();
    
    // Check if label with exact name already exists
    const existingLabel = db.labels.find(l => l.name.toLowerCase() === labelData.name.toLowerCase().trim());
    if (existingLabel) {
      return NextResponse.json(existingLabel, { status: 200 }); // Return existing
    }

    const newId = db.labels.length > 0 ? Math.max(...db.labels.map(l => l.id)) + 1 : 1;

    const newLabel: Label = {
      id: newId,
      name: labelData.name.trim(),
      color: labelData.color || "#64748b"
    };

    db.labels.push(newLabel);
    writeDB(db);

    logActivity(`Created tag "${newLabel.name}"`, "label", newLabel.id);

    return NextResponse.json(newLabel, { status: 201 });
  } catch (error) {
    console.error("POST /api/labels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
