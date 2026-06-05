import { NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.activityLogs);
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = readDB();
    db.activityLogs = [];
    writeDB(db);
    logActivity("Cleared Activity Trail", "system", 0, "All logs cleared by user");
    return NextResponse.json({ success: true, activityLogs: db.activityLogs });
  } catch (error) {
    console.error("DELETE /api/activity-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
