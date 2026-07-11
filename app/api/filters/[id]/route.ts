import { NextRequest, NextResponse } from "next/server";
import { mutateDB } from "@/app/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const filterId = Number(id);
    if (Number.isNaN(filterId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const removed = await mutateDB<boolean>((db) => {
      const idx = db.savedFilters.findIndex((f) => f.id === filterId);
      if (idx === -1) return false;
      db.savedFilters.splice(idx, 1);
      return true;
    });
    if (!removed) return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/filters/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
