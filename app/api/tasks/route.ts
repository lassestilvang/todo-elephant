import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";
import { Task } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    // Return newest tasks first
    const sortedTasks = [...db.tasks].sort((a, b) => b.id - a.id);
    return NextResponse.json(sortedTasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support parsing strings (in case request body was double serialized in older clients)
    const taskData = typeof body === "string" ? JSON.parse(body) : body;

    if (!taskData || !taskData.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const db = readDB();
    const newId = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1;

    const newTask: Task = {
      id: newId,
      title: taskData.title.trim(),
      description: (taskData.description || "").trim(),
      dueDate: taskData.dueDate || new Date().toISOString(),
      priority: taskData.priority || "medium",
      status: taskData.status || "pending",
      subtasks: taskData.subtasks || [],
      listId: taskData.listId ? Number(taskData.listId) : 1, // Default to Inbox (listId: 1)
      labels: taskData.labels || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.tasks.push(newTask);
    writeDB(db);

    logActivity(`Created task "${newTask.title}"`, "task", newTask.id, `Priority: ${newTask.priority}, List: ${newTask.listId}`);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
