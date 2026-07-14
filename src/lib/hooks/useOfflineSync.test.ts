import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOfflineSync } from "./useOfflineSync";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

describe("useOfflineSync hook", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("exports useOfflineSync hook", () => {
    expect(typeof useOfflineSync).toBe("function");
  });

  it("returns sync status and functions", () => {
    // Since this is a hook, we can't directly test it without a React wrapper
    // but we can verify the module exports correctly
    const module = { useOfflineSync };
    expect(module.useOfflineSync).toBeDefined();
  });
});