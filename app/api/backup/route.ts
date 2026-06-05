import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";
import { Task, List, Label } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    const backupData = {
      version: "1.0.0",
      tasks: db.tasks,
      lists: db.lists,
      labels: db.labels,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(backupData);
  } catch (error) {
    console.error("GET /api/backup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backupData = typeof body === "string" ? JSON.parse(body) : body;

    if (!backupData || !Array.isArray(backupData.tasks) || !Array.isArray(backupData.lists) || !Array.isArray(backupData.labels)) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    const db = readDB();
    
    // Replace DB items
    db.tasks = backupData.tasks as Task[];
    db.lists = backupData.lists as List[];
    db.labels = backupData.labels as Label[];
    
    writeDB(db);

    logActivity("Restored database from backup", "system", 0, `Tasks: ${db.tasks.length}, Folders: ${db.lists.length}, Labels: ${db.labels.length}`);

    return NextResponse.json({
      success: true,
      tasks: db.tasks,
      lists: db.lists,
      labels: db.labels,
    });
  } catch (error) {
    console.error("POST /api/backup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
