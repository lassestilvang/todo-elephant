import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";
import { Task } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await request.json();
    
    // Support parsing strings (in case the request body was double-serialized)
    const updates = typeof body === "string" ? JSON.parse(body) : body;

    const db = readDB();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const originalTask = db.tasks[taskIndex];
    
    // Merge the updates safely
    const updatedTask: Task = {
      ...originalTask,
      ...updates,
      id: originalTask.id, // Ensure ID is never changed
      createdAt: originalTask.createdAt, // Ensure createdAt is never changed
      updatedAt: new Date().toISOString()
    };

    // If task status just transitioned to completed, set completedAt
    if (updates.status && updates.status !== originalTask.status) {
      if (updates.status === 'completed' || updates.status === 'done') {
        updatedTask.completedAt = new Date().toISOString();
      } else {
        updatedTask.completedAt = null;
      }
    }

    db.tasks[taskIndex] = updatedTask;
    writeDB(db);

    // Dynamic log details
    let logMsg = `Updated task "${updatedTask.title}"`;
    if (updates.status && updates.status !== originalTask.status) {
      logMsg = `Completed task "${updatedTask.title}"`;
    }
    logActivity(logMsg, "task", updatedTask.id, `Status: ${updatedTask.status}, Priority: ${updatedTask.priority}`);

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const db = readDB();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskToDelete = db.tasks[taskIndex];
    db.tasks.splice(taskIndex, 1);
    writeDB(db);

    logActivity(`Deleted task "${taskToDelete.title}"`, "task", taskId);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
