import { describe, it, expect } from "vitest";
import { computeTodaySummary } from "./todaySummary";
import type { Task } from "@/types";

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: "Test task",
    description: "",
    dueDate: new Date().toISOString(),
    priority: "medium",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe("computeTodaySummary", () => {
  it("returns zeros when tasks array is empty", () => {
    const result = computeTodaySummary([]);
    expect(result).toEqual({ dueToday: 0, overdue: 0, thisWeek: 0 });
  });

  it("counts tasks due today", () => {
    const today = new Date();
    const taskToday = createMockTask({
      id: 1,
      dueDate: today.toISOString(),
      status: "pending",
    });

    const result = computeTodaySummary([taskToday], today);
    expect(result.dueToday).toBe(1);
  });

  it("counts overdue tasks (due before today)", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueTask = createMockTask({
      id: 1,
      dueDate: yesterday.toISOString(),
      status: "pending",
    });

    const result = computeTodaySummary([overdueTask], today);
    expect(result.overdue).toBe(1);
    expect(result.dueToday).toBe(0);
  });

  it("counts tasks due this week (up to 7 days)", () => {
    const today = new Date();
    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const soonTask = createMockTask({
      id: 1,
      dueDate: inThreeDays.toISOString(),
      status: "in_progress",
    });

    const result = computeTodaySummary([soonTask], today);
    expect(result.thisWeek).toBe(1);
  });

  it("excludes completed tasks from counts", () => {
    const today = new Date();
    const task = createMockTask({
      id: 1,
      dueDate: today.toISOString(),
      status: "completed",
    });

    const result = computeTodaySummary([task], today);
    expect(result.dueToday).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.thisWeek).toBe(0);
  });

  it("excludes tasks without dueDate from counts", () => {
    const task = createMockTask({
      id: 1,
      dueDate: undefined as unknown as string,
      status: "pending",
    });

    const result = computeTodaySummary([task]);
    expect(result).toEqual({ dueToday: 0, overdue: 0, thisWeek: 0 });
  });

  it("handles multiple tasks correctly", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const inTwoDays = new Date(today);
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    const inTenDays = new Date(today);
    inTenDays.setDate(inTenDays.getDate() + 10);

    const tasks = [
      createMockTask({ id: 1, dueDate: yesterday.toISOString(), status: "pending" }), // overdue
      createMockTask({ id: 2, dueDate: today.toISOString(), status: "pending" }), // today
      createMockTask({ id: 3, dueDate: inTwoDays.toISOString(), status: "in_progress" }), // this week
      createMockTask({ id: 4, dueDate: inTenDays.toISOString(), status: "pending" }), // NOT this week
      createMockTask({ id: 5, dueDate: yesterday.toISOString(), status: "completed" }), // completed, excluded
    ];

    const result = computeTodaySummary(tasks, today);
    expect(result.overdue).toBe(1);
    expect(result.dueToday).toBe(1);
    // thisWeek includes dueToday (since the condition is due >= today)
    expect(result.thisWeek).toBe(2);
  });

  it("uses custom 'now' date", () => {
    const customNow = new Date("2026-07-20T12:00:00Z");
    const yesterday = new Date(customNow);
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueTask = createMockTask({
      id: 1,
      dueDate: yesterday.toISOString(),
      status: "todo",
    });

    const result = computeTodaySummary([overdueTask], customNow);
    expect(result.overdue).toBe(1);
  });

  it("handles status variations for completed detection", () => {
    const today = new Date();
    const tasks = [
      createMockTask({ id: 1, dueDate: today.toISOString(), status: "done" }),
      createMockTask({ id: 2, dueDate: today.toISOString(), status: "DONE" }),
      createMockTask({ id: 3, dueDate: today.toISOString(), status: "completed" }),
      createMockTask({ id: 4, dueDate: today.toISOString(), status: "todo" }),
      createMockTask({ id: 5, dueDate: today.toISOString(), status: "in_progress" }),
    ];

    const result = computeTodaySummary(tasks, today);
    expect(result.dueToday).toBe(2);
  });
});