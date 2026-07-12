// POST /api/tasks/from-template
// Body: { templateId: number, overrides?: Partial<NewTask>, count?: number }
//
// Creates one or more new tasks from a saved template. The template must be
// a task with `isTemplate: true`. All non-id, non-createdAt/updatedAt fields
// are copied; `overrides` lets the caller patch in fresh values (e.g. a new
// dueDate).

import { NextRequest, NextResponse } from "next/server";
import { Task, NewTask } from "@/types";
import { mutateDB } from "@/app/lib/db";
import { readDB as _readDB } from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { templateId: number; overrides?: Partial<NewTask>; count?: number };
    const templateId = Number(body.templateId);
    const count = Math.max(1, Math.min(20, Number(body.count) || 1));
    const overrides = body.overrides || {};

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const created = await mutateDB<Task[] | null>((db) => {
      const template = db.tasks.find((t) => t.id === templateId);
      if (!template) return null;
      if (!template.isTemplate) return null;

      const now = new Date().toISOString();
      const out: Task[] = [];
      for (let i = 0; i < count; i++) {
        const nextId = (db.tasks.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1 + i;
        // Deep clone subtasks with fresh ids + reset to incomplete
        const subtasks = template.subtasks?.map((s, idx) => ({
          id: Date.now() + idx + i * 1000,
          title: s.title,
          completed: false,
        }));
        const taskData: NewTask = {
          title: overrides.title ?? template.title,
          description: overrides.description ?? template.description,
          dueDate: overrides.dueDate ?? template.dueDate,
          priority: overrides.priority ?? template.priority,
          status: "pending",
          subtasks,
          listId: overrides.listId ?? template.listId,
          labels: overrides.labels ?? template.labels,
          dependsOnTaskId: overrides.dependsOnTaskId ?? null,
          isImportant: overrides.isImportant ?? template.isImportant,
          isUrgent: overrides.isUrgent ?? template.isUrgent,
          recurrence: overrides.recurrence ?? template.recurrence,
          completedPomodoros: 0,
          parentRecurrenceId: null,
          order: 0,
          archivedAt: null,
          completedAt: null,
          isTemplate: false,
        };
        const newTask: Task = {
          id: nextId,
          ...taskData,
          createdAt: now,
          updatedAt: now,
        };
        db.tasks.unshift(newTask);
        db.activityLogs.unshift({
          id: Date.now() + i,
          action: "task.created.from-template",
          entityType: "task",
          entityId: newTask.id,
          details: `From template: ${template.title}`,
          createdAt: now,
        });
        out.push(newTask);
      }
      return out;
    });

    if (!created) {
      return NextResponse.json(
        { error: "Template not found or is not marked as a template" },
        { status: 404 },
      );
    }
    // Always return an array (even for count=1) for a deterministic response shape.
    return NextResponse.json(created);
  } catch (err) {
    console.error("[from-template] error:", err);
    return NextResponse.json({ error: "Failed to create task(s) from template" }, { status: 500 });
  }
}

// GET /api/tasks/from-template
// Returns the list of all tasks that have isTemplate: true.
export async function GET() {
  try {
    const db = await _readDB();
    const templates = db.tasks.filter((t) => t.isTemplate);
    return NextResponse.json(templates);
  } catch (err) {
    console.error("[from-template GET] error:", err);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}
