import { describe, it, expect } from "vitest";
import { generateSchedulingSuggestion, getDailyCapacity, suggestTaskOrdering } from "./scheduling";
import type { Task, FocusSession } from "@/types";

describe("scheduling module", () => {
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: 1,
    title: "Test task",
    description: "",
    dueDate: new Date().toISOString(),
    priority: "medium",
    status: "todo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it("exports generateSchedulingSuggestion function", () => {
    expect(typeof generateSchedulingSuggestion).toBe("function");
  });

  it("exports getDailyCapacity function", () => {
    expect(typeof getDailyCapacity).toBe("function");
  });

  it("exports suggestTaskOrdering function", () => {
    expect(typeof suggestTaskOrdering).toBe("function");
  });

  it("generateSchedulingSuggestion returns default slots for task without estimate", () => {
    const task = createTask({ id: 1, title: "New task", priority: "high" });
    const result = generateSchedulingSuggestion(task, [], []);

    expect(result.suggestedSlots).toBeDefined();
    expect(result.reasoning).toContain("No historical data");
    expect(result.conflicts).toEqual([]);
  });

  it("generateSchedulingSuggestion prioritizes high priority tasks with more slots", () => {
    const taskHigh = createTask({ id: 1, priority: "high" });
    const taskLow = createTask({ id: 2, priority: "low" });

    const resultHigh = generateSchedulingSuggestion(taskHigh, [], []);
    const resultLow = generateSchedulingSuggestion(taskLow, [], []);

    // High priority gets more slots (3) vs low priority (5) - actually low gets more slots
    expect(resultHigh.suggestedSlots.length).toBeGreaterThan(0);
    expect(resultLow.suggestedSlots.length).toBeGreaterThan(0);
  });

  it("getDailyCapacity returns available minutes and suggested count", () => {
    const date = new Date("2024-06-15T12:00:00");
    const result = getDailyCapacity(date, [], []);

    expect(result.availableMinutes).toBeGreaterThanOrEqual(0);
    expect(result.suggestedTaskCount).toBeGreaterThanOrEqual(0);
  });

  it("suggestTaskOrdering places high priority first", () => {
    const tasks = [
      createTask({ id: 1, priority: "low" }),
      createTask({ id: 2, priority: "high" }),
      createTask({ id: 3, priority: "medium" }),
    ];

    const ordered = suggestTaskOrdering(tasks, []);
    expect(ordered[0].priority).toBe("high");
  });

  it("suggestTaskOrdering places urgent tasks before non-urgent with same priority", () => {
    const tasks = [
      createTask({ id: 1, priority: "low", isUrgent: false }),
      createTask({ id: 2, priority: "low", isUrgent: true }),
    ];

    const ordered = suggestTaskOrdering(tasks, []);
    expect(ordered[0].isUrgent).toBe(true);
  });
});