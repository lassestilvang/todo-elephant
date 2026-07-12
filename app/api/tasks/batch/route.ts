import { NextRequest, NextResponse } from "next/server";
import { mutateDB, logActivity } from "@/app/lib/db";
import { normalizeStatus } from "@/src/lib/status";

type BatchOp =
  | { type: "delete" }
  | { type: "status"; status: string }
  | { type: "priority"; priority: "low" | "medium" | "high" }
  | { type: "list"; listId: number | null }
  | { type: "labels"; labels: number[] }
  | { type: "archive" };

/**
 * POST /api/tasks/batch { op: BatchOp, ids: number[] }
 * Applies a single mutation to many tasks atomically.
 * Reduces N round-trips to 1 — used by ListView bulk actions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];
    const op: BatchOp = body?.op;
    if (!ids.length || !op || typeof op !== "object") {
      return NextResponse.json({ error: "ids[] and op are required" }, { status: 400 });
    }

    const affected = await mutateDB<{ updated: number; ids: number[] }>((db) => {
      const touched: number[] = [];
      db.tasks = db.tasks.map((t) => {
        if (!ids.includes(t.id)) return t;
        const updated = { ...t, updatedAt: new Date().toISOString() };
        if (op.type === "status") updated.status = normalizeStatus(op.status);
        else if (op.type === "priority") updated.priority = op.priority;
        else if (op.type === "list") updated.listId = op.listId ?? undefined;
        else if (op.type === "labels") updated.labels = op.labels;
        else if (op.type === "archive") {
          updated.status = "archived" as const;
          updated.archivedAt = new Date().toISOString();
        }
        touched.push(t.id);
        return updated;
      });
      if (op.type === "delete") {
        db.tasks = db.tasks.filter((t) => !ids.includes(t.id));
      }
      return { updated: touched.length, ids: touched };
    });

    await logActivity(`Batch ${op.type} on ${affected.updated} tasks`, "system", 0);
    return NextResponse.json(affected);
  } catch (err) {
    console.error("POST /api/tasks/batch error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
