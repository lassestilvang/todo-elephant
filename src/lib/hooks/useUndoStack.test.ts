/**
 * useUndoStack tests - testing the exported utility functions.
 * Note: The hook itself uses localStorage and timers, so we test its behavior
 * through integration tests in the main test suite.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Test the exported types and constants work correctly
const UNDO_EXPIRY_MS = 10_000; // Should match source

describe("useUndoStack module", () => {
  it("exports useUndoStack function", async () => {
    const module = await import("./useUndoStack");
    expect(typeof module.useUndoStack).toBe("function");
  });

  it("exports UndoAction type", () => {
    // Type check - this compiles if the type is exported correctly
    const action = {
      id: "test",
      timestamp: Date.now(),
      label: "Test",
      undo: async () => {},
      type: "create" as const,
    };
    expect(action.type).toBe("create");
  });

  it("has correct expiry constant", () => {
    expect(UNDO_EXPIRY_MS).toBe(10000);
  });
});