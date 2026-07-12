import { describe, it, expect } from "vitest";
import {
  computeNextDueDate,
  buildNextOccurrence,
  shouldSpawnOnComplete,
  isRecurrenceKind,
} from "@/src/lib/recurrence";
import type { Task } from "@/types";

const baseTask: Task = {
  id: 1,
  title: "Test",
  description: "",
  dueDate: "2026-01-10T08:00:00.000Z",
  priority: "medium",
  status: "todo",
  recurrence: "daily",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("recurrence", () => {
  it("returns null next date for non-recurring tasks", () => {
    expect(computeNextDueDate({ dueDate: "x", recurrence: "none" })).toBeNull();
  });

  const ANCHOR_NOW = new Date("2026-01-10T08:00:00.000Z");

  it("computes daily next date as 1 day after due", () => {
    const next = computeNextDueDate({ dueDate: "2026-01-10T08:00:00.000Z", recurrence: "daily" }, ANCHOR_NOW);
    const d = new Date(next!);
    expect(d.getUTCDate()).toBe(11);
    expect(d.getUTCMonth()).toBe(0); // Jan
  });

  it("computes weekly next date as 7 days after due", () => {
    const next = computeNextDueDate({ dueDate: "2026-01-10T08:00:00.000Z", recurrence: "weekly" }, ANCHOR_NOW);
    const d = new Date(next!);
    expect(d.getUTCDate()).toBe(17);
  });

  it("computes monthly next date and clamps day-of-month overflow", () => {
    const next = computeNextDueDate({ dueDate: "2026-01-31T08:00:00.000Z", recurrence: "monthly" }, ANCHOR_NOW);
    const d = new Date(next!);
    expect(d.getUTCMonth()).toBe(1); // Feb
    expect(d.getUTCDate()).toBe(28); // last day of Feb 2026
  });

  it("isRecurrenceKind validates safely", () => {
    expect(isRecurrenceKind("daily")).toBe(true);
    expect(isRecurrenceKind("biweekly")).toBe(false);
    expect(isRecurrenceKind(undefined)).toBe(false);
  });

  it("buildNextOccurrence resets subtasks and status", () => {
    const source: Task = {
      ...baseTask,
      status: "completed",
      subtasks: [{ id: 1, title: "sub1", completed: true }],
      recurrence: "weekly",
    };
    const next = buildNextOccurrence(source);
    expect(next).not.toBeNull();
    expect(next!.status).toBe("todo");
    expect(next!.subtasks![0].completed).toBe(false);
    expect(next!.completedAt).toBeNull();
  });

  it("buildNextOccurrence is null when no recurrence", () => {
    expect(buildNextOccurrence({ ...baseTask, recurrence: "none" })).toBeNull();
  });

  it("shouldSpawnOnComplete only true on fresh completion", () => {
    expect(shouldSpawnOnComplete(baseTask, { status: "completed" })).toBe(true);
    expect(shouldSpawnOnComplete({ ...baseTask, status: "completed" }, { status: "completed" })).toBe(false);
    expect(shouldSpawnOnComplete(baseTask, { status: "todo" })).toBe(false);
    expect(shouldSpawnOnComplete({ ...baseTask, recurrence: "none" }, { status: "completed" })).toBe(false);
  });
});
