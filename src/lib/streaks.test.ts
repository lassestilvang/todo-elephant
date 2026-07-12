import { describe, it, expect } from "vitest";
import { computeCurrentStreak, statsForLastNDays } from "@/src/lib/streaks";
import type { Task } from "@/types";

const mkTask = (id: number, dueDate: string, status: Task["status"], completedAt?: string): Task => ({
  id,
  title: "t",
  description: "",
  dueDate,
  priority: "medium",
  status,
  completedAt,
  createdAt: dueDate,
  updatedAt: dueDate,
});

describe("streaks", () => {
  it("current streak includes today + yesterday if both done", () => {
    const today = "2026-03-15";
    const yesterday = "2026-03-14";
    const tasks: Task[] = [
      mkTask(1, today, "completed", `${today}T10:00:00.000Z`),
      mkTask(2, yesterday, "completed", `${yesterday}T10:00:00.000Z`),
    ];
    expect(computeCurrentStreak(tasks, new Date("2026-03-15T12:00:00.000Z"))).toBe(2);
  });

  it("streak breaks if a day has no completions", () => {
    const today = "2026-03-15";
    const yesterday = "2026-03-14";
    const twoDaysAgo = "2026-03-13";
    const tasks: Task[] = [
      mkTask(1, today, "completed", `${today}T10:00:00.000Z`),
      mkTask(2, twoDaysAgo, "completed", `${twoDaysAgo}T10:00:00.000Z`),
    ];
    expect(computeCurrentStreak(tasks, new Date("2026-03-15T12:00:00.000Z"))).toBe(1);
  });

  it("streak is zero when today has no completions", () => {
    const tasks: Task[] = [mkTask(1, "2026-03-14", "completed", "2026-03-14T10:00:00.000Z")];
    expect(computeCurrentStreak(tasks, new Date("2026-03-15T12:00:00.000Z"))).toBe(0);
  });

  it("statsForLastNDays counts completions per day", () => {
    const today = "2026-03-15";
    const tasks: Task[] = [
      mkTask(1, today, "completed", `${today}T10:00:00.000Z`),
      mkTask(2, today, "completed", `${today}T12:00:00.000Z`),
      mkTask(3, "2026-03-14", "completed", "2026-03-14T10:00:00.000Z"),
    ];
    const stats = statsForLastNDays(tasks, 7, new Date(`${today}T12:00:00.000Z`));
    expect(stats).toHaveLength(7);
    // stats are oldest-first; index 6 is today (Mar 15), index 5 is yesterday.
    expect(stats[0]).toEqual({ dayKey: "2026-03-09", completions: 0 });
    expect(stats[5]).toEqual({ dayKey: "2026-03-14", completions: 1 });
    expect(stats[6]).toEqual({ dayKey: "2026-03-15", completions: 2 });
  });
});
