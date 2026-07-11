import { NextRequest, NextResponse } from "next/server";
import { mutateDB, logActivity } from "@/app/lib/db";
import { Task } from "@/types";
import { buildNextOccurrence, shouldSpawnOnComplete, isRecurrenceKind } from "@/src/lib/recurrence";
import { TASK_STATUS, normalizeStatus } from "@/src/lib/status";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }
    const updates = await request.json();
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    type Result = { updated: Task; spawned?: Task };
    const result = await mutateDB<Result | null>((db) => {
      const idx = db.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return null;
      const original = db.tasks[idx];
      const normalized: Partial<Task> = { ...updates };
      if (typeof updates.status === "string") normalized.status = normalizeStatus(updates.status);
      if (isRecurrenceKind(updates.recurrence)) normalized.recurrence = updates.recurrence;
      const merged: Task = {
        ...original,
        ...normalized,
        id: original.id,
        createdAt: original.createdAt,
        updatedAt: new Date().toISOString(),
      };
      if (updates.status && updates.status !== original.status) {
        merged.completedAt =
          merged.status === TASK_STATUS.COMPLETED ? new Date().toISOString() : null;
      }
      db.tasks[idx] = merged;

      let spawned: Task | undefined;
      if (shouldSpawnOnComplete(original, merged)) {
        const candidate = buildNextOccurrence(original);
        if (candidate) {
          const maxId = db.tasks.reduce((m, t) => Math.max(m, t.id), 0);
          candidate.id = maxId + 1;
          candidate.parentRecurrenceId = original.parentRecurrenceId ?? original.id;
          candidate.createdAt = new Date().toISOString();
          candidate.updatedAt = candidate.createdAt;
          candidate.subtasks =
            candidate.subtasks?.map((s, i) => ({ ...s, id: Date.now() + i })) ?? [];
          db.tasks.push(candidate);
          spawned = candidate;
        }
      }
      return { updated: merged, spawned };
    });

    if (!result) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const logMsg =
      updates.status === TASK_STATUS.COMPLETED && result.updated.status === TASK_STATUS.COMPLETED
        ? `Completed task "${result.updated.title}"`
        : `Updated task "${result.updated.title}"`;
    await logActivity(logMsg, "task", result.updated.id, `Status: ${result.updated.status}, Priority: ${result.updated.priority}`);
    if (result.spawned) {
      await logActivity(
        `Spawned next occurrence of "${result.spawned.title}"`,
        "task",
        result.spawned.id,
        `Recurrence: ${result.spawned.recurrence}`,
      );
    }
    return NextResponse.json(result.updated);
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const removed = await mutateDB<Task | null>((db) => {
      const idx = db.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return null;
      const [removed] = db.tasks.splice(idx, 1);
      return removed ?? null;
    });
    if (!removed) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    await logActivity(`Deleted task "${removed.title}"`, "task", taskId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
