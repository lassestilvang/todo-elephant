import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateTimeEstimate, formatTimeEstimate } from "./timeEstimate";
import type { Task } from "@/types";

// Mock localStorage for cache testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: "Test task",
  description: "",
  dueDate: new Date().toISOString(),
  priority: "medium",
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("calculateTimeEstimate", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("returns null when no relevant sessions exist", () => {
    const task = createMockTask({ id: 1, title: "Write tests" });
    const sessions = [
      { taskId: 2, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, sessions, [task]);
    expect(result).toBeNull();
  });

  it("calculates estimate from task's own sessions", () => {
    const task = createMockTask({ id: 1, title: "Write tests" });
    const sessions = [
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 1800, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, sessions, [task]);
    expect(result).not.toBeNull();
    // With recency weighting: 1500 * 1 + 1800 * 1.15 = weighted average / 60
    expect(result!.basedOnCount).toBe(2);
  });

  it("excludes completedEarly sessions from calculation", () => {
    const task = createMockTask({ id: 1 });
    const sessions = [
      { taskId: 1, durationSeconds: 1500, completedEarly: true, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 1800, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, sessions, [task]);
    expect(result!.basedOnCount).toBe(1);
    // 1800 seconds = 30 minutes
    expect(result!.minutes).toBe(30);
  });

  it("finds similar tasks by keyword similarity", () => {
    const task = createMockTask({ id: 1, title: "Write unit tests for React components" });
    const similarTask = createMockTask({ id: 2, title: "Write integration tests for components", status: "completed" });
    const sessions = [
      { taskId: 2, durationSeconds: 2700, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, sessions, [task, similarTask]);
    expect(result).not.toBeNull();
    expect(result!.basedOnCount).toBe(1);
  });

  it("returns null when only similar tasks have sessions but similarity is too low", () => {
    const task = createMockTask({ id: 1, title: "Cook dinner" });
    const differentTask = createMockTask({ id: 2, title: "Write React components", status: "completed" });
    const sessions = [
      { taskId: 2, durationSeconds: 2700, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, sessions, [task, differentTask]);
    expect(result).toBeNull();
  });

  it("applies cache with cacheKey", () => {
    const task = createMockTask({ id: 1 });
    const sessions = [
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    // First call
    const result1 = calculateTimeEstimate(task, sessions, [task], "cache-key");
    expect(result1).not.toBeNull();

    // Modify sessions - result should still be cached
    const modifiedSessions = [...sessions, { taskId: 1, durationSeconds: 3600, completedEarly: false, startedAt: new Date().toISOString() }];
    const result2 = calculateTimeEstimate(task, modifiedSessions, [task], "cache-key");

    // Should still have the cached result (only basedOnCount: 1 instead of 2)
    expect(result2!.basedOnCount).toBe(1);
  });

  it("does not use cache when cacheKey is not provided", () => {
    const task = createMockTask({ id: 1 });
    const sessions = [
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result1 = calculateTimeEstimate(task, sessions, [task]);
    const result2 = calculateTimeEstimate(task, [...sessions, { taskId: 1, durationSeconds: 1800, completedEarly: false, startedAt: new Date().toISOString() }], [task]);

    expect(result1!.basedOnCount).toBe(1);
    expect(result2!.basedOnCount).toBe(2);
  });

  it("calculates confidence based on variance", () => {
    const task = createMockTask({ id: 1 });
    // Consistent durations - should have high confidence
    const consistentSessions = [
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, consistentSessions, [task]);
    expect(result!.confidence).toBeGreaterThan(0.7);
  });

  it("calculates confidence decreases with high variance", () => {
    const task = createMockTask({ id: 1 });
    // Highly variable durations - should have lower confidence
    const variableSessions = [
      { taskId: 1, durationSeconds: 300, completedEarly: false, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 1500, completedEarly: false, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 3600, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, variableSessions, [task]);
    expect(result!.confidence).toBeLessThan(0.5);
  });

  it("only considers completed tasks for similarity matching", () => {
    const task = createMockTask({ id: 1, title: "Write tests" });
    const pendingTask = createMockTask({ id: 2, title: "Write tests", status: "pending" }); // Same title but not completed
    const completedTask = createMockTask({ id: 3, title: "Write tests", status: "completed" });
    const sessions = [
      { taskId: 3, durationSeconds: 1800, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, sessions, [task, pendingTask, completedTask]);
    expect(result!.basedOnCount).toBe(1); // Only completed task's session counts
  });

  it("calculates confidence near minimum for extreme variance", () => {
    const task = createMockTask({ id: 1 });
    // Extreme variance sessions to hit near-minimum confidence
    const extremeSessions = [
      { taskId: 1, durationSeconds: 60, completedEarly: false, startedAt: new Date().toISOString() },
      { taskId: 1, durationSeconds: 3600, completedEarly: false, startedAt: new Date().toISOString() },
    ];

    const result = calculateTimeEstimate(task, extremeSessions, [task]);
    // Confidence should be very low but above minimum due to the formula
    expect(result!.confidence).toBeLessThan(0.2);
    expect(result!.confidence).toBeGreaterThanOrEqual(0.1);
  });
});

describe("formatTimeEstimate", () => {
  it("returns em dash for null estimate", () => {
    expect(formatTimeEstimate(null)).toBe("—");
  });

  it("formats low confidence estimate with question marks", () => {
    const lowConfidence = { minutes: 30, confidence: 0.2, basedOnCount: 1 };
    expect(formatTimeEstimate(lowConfidence)).toBe("⏱️ ?? min");
  });

  it("formats high confidence estimate without variance indicator", () => {
    const highConfidence = { minutes: 30, confidence: 0.9, basedOnCount: 1 };
    expect(formatTimeEstimate(highConfidence)).toBe("⏱️ ~30 min");
  });

  it("formats medium confidence estimate with variance indicator", () => {
    const mediumConfidence = { minutes: 45, confidence: 0.5, basedOnCount: 5 };
    expect(formatTimeEstimate(mediumConfidence)).toBe("⏱️ ~45±20% min");
  });

  it("formats high confidence without variance but confidence below 0.7", () => {
    const midLowConfidence = { minutes: 30, confidence: 0.6, basedOnCount: 3 };
    expect(formatTimeEstimate(midLowConfidence)).toBe("⏱️ ~30±20% min");
  });
});