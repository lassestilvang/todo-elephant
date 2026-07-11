import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, logActivity } from "@/app/lib/db";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.activityLogs);
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    await mutateDB((db) => {
      db.activityLogs = [];
    });
    await logActivity("Cleared Activity Trail", "system", 0, "All logs cleared by user");
    const fresh = await readDB();
    return NextResponse.json({ success: true, activityLogs: fresh.activityLogs });
  } catch (error) {
    console.error("DELETE /api/activity-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
