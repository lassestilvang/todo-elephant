import { describe, it, expect } from "vitest";

describe("contextualIntelligence module", () => {
  it("exports getLocationBasedSuggestions function", async () => {
    const module = await import("./contextualIntelligence");
    expect(typeof module.getLocationBasedSuggestions).toBe("function");
  });

  it("exports getWeatherAdjustedTasks function", async () => {
    const module = await import("./contextualIntelligence");
    expect(typeof module.getWeatherAdjustedTasks).toBe("function");
  });

  it("exports findCalendarGaps function", async () => {
    const module = await import("./contextualIntelligence");
    expect(typeof module.findCalendarGaps).toBe("function");
  });

  it("exports getEnergyMatchedTasks function", async () => {
    const module = await import("./contextualIntelligence");
    expect(typeof module.getEnergyMatchedTasks).toBe("function");
  });

  it("getWeatherAdjustedTasks identifies outdoor tasks for bad weather", async () => {
    const module = await import("./contextualIntelligence");
    const tasks = [
      { id: 1, title: "Go for a run", description: "Morning jog in the park", priority: "high", dueDate: new Date().toISOString() },
      { id: 2, title: "Write report", priority: "medium", dueDate: new Date().toISOString() },
    ] as any;

    const weather = { condition: "rainy" as const, temperature: 10, isOutdoorFriendly: false };
    const result = module.getWeatherAdjustedTasks(tasks, weather);

    expect(result).toHaveLength(1);
    expect(result[0].suggestedChange).toContain("Postpone");
  });

  it("findCalendarGaps returns available slots for given duration", async () => {
    const module = await import("./contextualIntelligence");
    const tasks: any[] = [];
    const dateRange = {
      start: new Date("2024-01-01T09:00:00"),
      end: new Date("2024-01-01T17:00:00"),
    };

    const gaps = module.findCalendarGaps(tasks, 60, dateRange);
    expect(gaps.length).toBeGreaterThan(0);
  });

  it("getEnergyMatchedTasks returns high-priority tasks during high energy", async () => {
    const module = await import("./contextualIntelligence");
    const tasks = [
      { id: 1, title: "Creative task", priority: "high", isImportant: true, dueDate: new Date().toISOString() },
      { id: 2, title: "Simple task", priority: "low", dueDate: new Date().toISOString() },
    ] as any;

    const energyProfile = { morning: 0.9, afternoon: 0.5, evening: 0.3 };
    const result = module.getEnergyMatchedTasks(tasks, energyProfile, 9); // Morning hour

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});