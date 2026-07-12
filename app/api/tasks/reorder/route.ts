// POST /api/tasks/reorder
// Body: { items: [{ id: number, order: number }] }
//
// Atomically updates the `order` field for many tasks in a single mutateDB
// transaction. Used by KanbanView's drag-to-reorder so a partial failure
// can't leave the board in a half-applied state.
//
// Response: { updated: number, ids: number[] } on success, 4xx on bad input,
// 5xx on server error.

import { NextRequest, NextResponse } from "next/server";
import { mutateDB } from "@/app/lib/db";

interface ReorderItem {
  id: number;
  order: number;
}

function isValidItem(x: unknown): x is ReorderItem {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return Number.isFinite(Number(r.id)) && Number.isFinite(Number(r.order));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw: unknown[] = Array.isArray(body?.items) ? (body.items as unknown[]) : [];
    const items: ReorderItem[] = raw
      .filter(isValidItem)
      .map((x) => ({ id: Number(x.id), order: Number(x.order) }));

    if (items.length === 0) {
      return NextResponse.json(
        { error: "items[] with at least one valid { id, order } is required" },
        { status: 400 },
      );
    }

    // Cap payload size to prevent runaway writes.
    if (items.length > 500) {
      return NextResponse.json(
        { error: "items[] cannot exceed 500 entries per request" },
        { status: 413 },
      );
    }

    const result = await mutateDB<{ updated: number; ids: number[] }>((db) => {
      // Build a quick lookup so we only touch requested ids.
      const orderById = new Map<number, number>();
      for (const it of items) orderById.set(it.id, it.order);

      const touched: number[] = [];
      const now = new Date().toISOString();
      db.tasks = db.tasks.map((t) => {
        if (!orderById.has(t.id)) return t;
        const desiredOrder = orderById.get(t.id) as number;
        // Skip no-op writes to avoid bloating the activity log.
        if (t.order === desiredOrder) return t;
        touched.push(t.id);
        return { ...t, order: desiredOrder, updatedAt: now };
      });
      return { updated: touched.length, ids: touched };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/tasks/reorder error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
