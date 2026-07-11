import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB } from "@/app/lib/db";
import { ShortcutConfig } from "@/types";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.shortcutConfigs ?? []);
  } catch (error) {
    console.error("GET /api/shortcuts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updated = (await request.json()) as ShortcutConfig;
    if (!updated?.id || !updated?.key) {
      return NextResponse.json({ error: "ID and Key are required" }, { status: 400 });
    }
    const result = await mutateDB<ShortcutConfig | null>((db) => {
      const idx = db.shortcutConfigs.findIndex((s) => s.id === updated.id);
      if (idx === -1) return null;
      db.shortcutConfigs[idx] = updated;
      return updated;
    });
    if (!result) return NextResponse.json({ error: "Shortcut not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/shortcuts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
