import { describe, it, expect } from "vitest";
import {
  computeNextDueDate,
  buildNextOccurrence,
  shouldSpawnOnComplete,
  isRecurrenceKind,
  nextSubtaskIds,
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

  it("anchors to now when dueDate is in the past", () => {
    // dueDate 2025-01-01 is in the past relative to ANCHOR_NOW
    const next = computeNextDueDate({ dueDate: "2025-01-01T08:00:00.000Z", recurrence: "daily" }, ANCHOR_NOW);
    const d = new Date(next!);
    // Should be anchored to now (Jan 10) + 1 day = Jan 11
    expect(d.getUTCDate()).toBe(11);
  });

  it("uses current time as anchor when no dueDate", () => {
    const next = computeNextDueDate({ dueDate: undefined, recurrence: "daily" }, ANCHOR_NOW);
    expect(next).not.toBeNull();
    const d = new Date(next!);
    // Should be Jan 10 + 1 day
    expect(d.getUTCDate()).toBe(11);
  });

  it("isRecurrenceKind validates safely", () => {
    expect(isRecurrenceKind("daily")).toBe(true);
    expect(isRecurrenceKind("weekly")).toBe(true);
    expect(isRecurrenceKind("monthly")).toBe(true);
    expect(isRecurrenceKind("none")).toBe(true);
    expect(isRecurrenceKind("biweekly")).toBe(false);
    expect(isRecurrenceKind("daily ")).toBe(false);
    expect(isRecurrenceKind(undefined)).toBe(false);
    expect(isRecurrenceKind(null)).toBe(false);
    expect(isRecurrenceKind(123)).toBe(false);
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

  it("buildNextOccurrence handles task without subtasks", () => {
    const source: Task = { ...baseTask, recurrence: "daily", subtasks: undefined };
    const next = buildNextOccurrence(source);
    expect(next).not.toBeNull();
    expect(next!.subtasks).toEqual([]);
  });

  it("shouldSpawnOnComplete only true on fresh completion", () => {
    expect(shouldSpawnOnComplete(baseTask, { status: "completed" })).toBe(true);
    expect(shouldSpawnOnComplete({ ...baseTask, status: "completed" }, { status: "completed" })).toBe(false);
    expect(shouldSpawnOnComplete(baseTask, { status: "todo" })).toBe(false);
    expect(shouldSpawnOnComplete({ ...baseTask, recurrence: "none" }, { status: "completed" })).toBe(false);
  });

  it("shouldSpawnOnComplete handles already completed source", () => {
    const completedSource: Task = { ...baseTask, status: "completed", recurrence: "daily" };
    expect(shouldSpawnOnComplete(completedSource, { status: "completed" })).toBe(false);
  });

  describe("nextSubtaskIds", () => {
    it("generates unique IDs based on count", () => {
      const ids = nextSubtaskIds(3);
      expect(ids).toHaveLength(3);
      expect(ids[0]).toBeLessThan(ids[1]);
      expect(ids[1]).toBeLessThan(ids[2]);
    });

    it("generates sequential IDs from base timestamp", () => {
      const ids = nextSubtaskIds(3, 1000);
      expect(ids).toEqual([1000000, 1000001, 1000002]);
    });

    it("handles zero count", () => {
      const ids = nextSubtaskIds(0);
      expect(ids).toEqual([]);
    });
  });
});
