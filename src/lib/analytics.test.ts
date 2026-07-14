import { describe, it, expect } from "vitest";
import { calculateCognitiveLoad, analyzeProductivityDNA, calculateTimeInvestment, assessDecisionFatigue, generateActivityHeatmap } from "./analytics";
import type { Task, FocusSession } from "@/types";

describe("analytics module", () => {
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

  it("exports calculateCognitiveLoad function", () => {
    expect(typeof calculateCognitiveLoad).toBe("function");
  });

  it("exports analyzeProductivityDNA function", () => {
    expect(typeof analyzeProductivityDNA).toBe("function");
  });

  it("exports calculateTimeInvestment function", () => {
    expect(typeof calculateTimeInvestment).toBe("function");
  });

  it("exports assessDecisionFatigue function", () => {
    expect(typeof assessDecisionFatigue).toBe("function");
  });

  it("exports generateActivityHeatmap function", () => {
    expect(typeof generateActivityHeatmap).toBe("function");
  });

  describe("calculateCognitiveLoad", () => {
    it("returns low cognitive load for empty task list", () => {
      const result = calculateCognitiveLoad([]);
      expect(result.score).toBe(0);
      expect(result.level).toBe("low");
      expect(result.factors).toEqual([]);
    });

    it("calculates high cognitive load for many tasks", () => {
      // Create tasks with todo status (not completed)
      const tasks = Array(15).fill(null).map((_, i) => createTask({ id: i + 1, status: "todo" as const }));
      const result = calculateCognitiveLoad(tasks);
      expect(result.score).toBeGreaterThanOrEqual(15); // At least "Moderate task volume"
      expect(result.factors).toContain("High task volume");
    });

    it("identifies high priority overload factor", () => {
      const tasks = Array(4).fill(null).map((_, i) => createTask({ id: i + 1, priority: "high" as const }));
      const result = calculateCognitiveLoad(tasks);
      expect(result.factors).toContain("High priority overload");
    });
  });

  describe("assessDecisionFatigue", () => {
    it("returns low score for few tasks", () => {
      const tasks = Array(3).fill(null).map((_, i) => createTask({ id: i + 1 }));
      const result = assessDecisionFatigue(tasks);
      expect(result.warning).toBe(false);
      expect(result.score).toBeLessThan(30);
    });

    it("returns warning for many tasks", () => {
      const tasks = Array(25).fill(null).map((_, i) => createTask({ id: i + 1 }));
      const result = assessDecisionFatigue(tasks);
      expect(result.warning).toBe(true);
      expect(result.recommendation).toMatch(/Consider|consider/i);
    });
  });

  describe("generateActivityHeatmap", () => {
    it("generates heatmap for specified days", () => {
      const tasks = [
        createTask({ id: 1, status: "completed" as const, completedAt: "2024-06-15T10:00:00.000Z" }),
        createTask({ id: 2, status: "completed" as const, completedAt: "2024-06-15T11:00:00.000Z" }),
      ];

      const heatmap = generateActivityHeatmap(tasks, 7);
      expect(heatmap.length).toBe(7);
      expect(heatmap[0]).toHaveProperty("date");
      expect(heatmap[0]).toHaveProperty("count");
      expect(heatmap[0]).toHaveProperty("intensity");
    });
  });
});