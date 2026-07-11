import { NextRequest, NextResponse } from "next/server";
import {
  readDB,
  writeDB,
  logActivity,
  mutateDB,
  nextTaskId,
} from "@/app/lib/db";
import { Task } from "@/types";
import {
  buildNextOccurrence,
  isRecurrenceKind,
  shouldSpawnOnComplete,
} from "@/src/lib/recurrence";
import { normalizeStatus, TASK_STATUS } from "@/src/lib/status";

export async function GET() {
  try {
    const db = await readDB();
    const sorted = [...db.tasks].sort((a, b) => b.id - a.id);
    return NextResponse.json(sorted);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const recurrence = isRecurrenceKind(body.recurrence) ? body.recurrence : "none";
    const newTask: Task = {
      id: 0, // filled in by mutateDB
      title: String(body.title).trim(),
      description: (body.description ?? "").toString().trim(),
      dueDate: body.dueDate || new Date().toISOString(),
      priority: body.priority || "medium",
      status: normalizeStatus(body.status),
      subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
      listId: body.listId ? Number(body.listId) : undefined,
      labels: Array.isArray(body.labels) ? body.labels.map(Number) : [],
      dependsOnTaskId: body.dependsOnTaskId ? Number(body.dependsOnTaskId) : null,
      isImportant: !!body.isImportant,
      isUrgent: !!body.isUrgent,
      recurrence,
      completedPomodoros: 0,
      parentRecurrenceId: null,
      order: undefined,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await mutateDB<{ task: Task; nextOccurrence?: Task }>((db) => {
      newTask.id = nextTaskId(db);
      db.tasks.push(newTask);
      return { task: newTask };
    });

    await logActivity(`Created task "${created.task.title}"`, "task", created.task.id, `Priority: ${newTask.priority}, List: ${newTask.listId}, Recurrence: ${recurrence}`);
    return NextResponse.json(created.task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
