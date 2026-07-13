import { NextRequest, NextResponse } from "next/server";
import { mutateDB, nextTaskId, logActivity } from "@/app/lib/db";
import type { Task } from "@/types";
import { parseEmailToTask } from "@/src/lib/integrations";

/**
 * Email import webhook endpoint.
 * Accepts POST requests from email-to-webhook services.
 * In production, should validate a webhook secret token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support multiple formats
    let title: string;
    let description: string;

    if (body.subject && body.body) {
      // Direct subject/body format
      title = body.subject;
      description = body.body;
    } else if (body.text) {
      // Single text field - extract title from first line
      const lines = body.text.split("\n");
      title = lines[0] || "Imported task";
      description = lines.slice(1).join("\n");
    } else {
      return NextResponse.json({ error: "No task content provided" }, { status: 400 });
    }

    // Parse email into task
    const taskData = parseEmailToTask(title, description);

    const now = new Date().toISOString();
    const task: Task = {
      id: 0, // Will be filled by mutateDB
      title: taskData.title ?? title,
      description: (taskData.description ?? description)?.toString().trim() ?? "",
      dueDate: taskData.dueDate ?? now,
      priority: taskData.priority ?? "medium",
      status: taskData.status ?? "todo",
      subtasks: [],
      labels: [],
      completedPomodoros: 0,
      parentRecurrenceId: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const created = await mutateDB<{ task: Task; nextOccurrence?: Task }>((db) => {
      task.id = nextTaskId(db);
      db.tasks.push(task);
      return { task };
    });

    await logActivity(`Created task from email "${title}"`, "task", created.task.id);

    return NextResponse.json(created.task, { status: 201 });
  } catch (error) {
    console.error("Email import error:", error);
    return NextResponse.json({ error: "Failed to import task from email" }, { status: 500 });
  }
}