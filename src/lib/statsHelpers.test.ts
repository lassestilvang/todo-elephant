import { describe, it, expect } from "vitest";
import {
  mostProductiveWeekday,
  weekdayName,
  labelDistribution,
  priorityDistribution,
  listDistribution,
  completionRate,
} from "@/src/lib/statsHelpers";
import type { Task } from "@/types";

const baseTask: Omit<Task, "id" | "status"> = {
  title: "t",
  description: "",
  dueDate: "2026-03-15T00:00:00.000Z",
  priority: "medium",
  createdAt: "2026-03-15T00:00:00.000Z",
  updatedAt: "2026-03-15T00:00:00.000Z",
};

const mkCompleted = (id: number, completedAt: string): Task => ({
  ...baseTask,
  id,
  status: "completed",
  completedAt,
});

describe("statsHelpers", () => {
  it("mostProductiveWeekday returns null when there are no completions", () => {
    expect(mostProductiveWeekday([])).toBeNull();
  });

  it("mostProductiveWeekday picks the weekday with most completions", () => {
    // 2026-03-15 is a Sunday (UTC).
    const tasks: Task[] = [
      mkCompleted(1, "2026-03-15T10:00:00.000Z"), // Sunday
      mkCompleted(2, "2026-03-16T10:00:00.000Z"), // Monday
      mkCompleted(3, "2026-03-16T11:00:00.000Z"), // Monday
      mkCompleted(4, "2026-03-17T10:00:00.000Z"), // Tuesday
    ];
    expect(mostProductiveWeekday(tasks)).toBe(1); // Monday
  });

  it("weekdayName maps index to weekday", () => {
    expect(weekdayName(0)).toBe("Sunday");
    expect(weekdayName(6)).toBe("Saturday");
    expect(weekdayName(null)).toBe("—");
  });

  it("labelDistribution aggregates and sorts", () => {
    const tasks: Task[] = [
      { ...baseTask, id: 1, status: "todo", labels: [1, 2] },
      { ...baseTask, id: 2, status: "todo", labels: [1] },
    ];
    const labels = [
      { id: 1, name: "Work", color: "#3b82f6" },
      { id: 2, name: "Home", color: "#10b981" },
    ];
    expect(labelDistribution(tasks, labels)).toEqual([
      { labelId: 1, name: "Work", color: "#3b82f6", count: 2 },
      { labelId: 2, name: "Home", color: "#10b981", count: 1 },
    ]);
  });

  it("priorityDistribution counts each priority", () => {
    const tasks: Task[] = [
      { ...baseTask, id: 1, status: "todo", priority: "high" },
      { ...baseTask, id: 2, status: "todo", priority: "low" },
      { ...baseTask, id: 3, status: "todo", priority: "low" },
    ];
    expect(priorityDistribution(tasks)).toEqual({ high: 1, medium: 0, low: 2 });
  });

  it("listDistribution excludes lists with zero tasks", () => {
    const tasks: Task[] = [
      { ...baseTask, id: 1, status: "todo", listId: 2 },
    ];
    const lists = [
      { id: 1, name: "Inbox", color: "#3b82f6" },
      { id: 2, name: "Work", color: "#ec4899" },
    ];
    expect(listDistribution(tasks, lists)).toEqual([
      { listId: 2, name: "Work", color: "#ec4899", count: 1 },
    ]);
  });

  it("completionRate excludes archived tasks from denominator", () => {
    const tasks: Task[] = [
      { ...baseTask, id: 1, status: "completed" },
      { ...baseTask, id: 2, status: "todo" },
      { ...baseTask, id: 3, status: "archived" },
    ];
    // 1 of 2 relevant tasks is completed = 50%
    expect(completionRate(tasks)).toBe(50);
  });

  it("completionRate returns 0 for empty input", () => {
    expect(completionRate([])).toBe(0);
  });
});
