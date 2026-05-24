import { NextResponse } from "next/server";
import { readDB } from "@/app/lib/db";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.activityLogs);
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
