import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/app/lib/db";
import { ShortcutConfig } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.shortcutConfigs || []);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedShortcut = await request.json() as ShortcutConfig;
    if (!updatedShortcut.id || !updatedShortcut.key) {
      return NextResponse.json({ error: "ID and Key are required" }, { status: 400 });
    }

    const db = readDB();
    const index = db.shortcutConfigs.findIndex(s => s.id === updatedShortcut.id);
    
    if (index !== -1) {
      db.shortcutConfigs[index] = updatedShortcut;
      writeDB(db);
      return NextResponse.json(updatedShortcut);
    } else {
      return NextResponse.json({ error: "Shortcut not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
