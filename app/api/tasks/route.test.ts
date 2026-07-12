/**
 * Tests for /api/tasks route handlers.
 * These test the HTTP handlers without hitting the real database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("@/app/lib/db", () => ({
  readDB: vi.fn(),
  mutateDB: vi.fn(),
  nextTaskId: vi.fn(() => 1),
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// Mock NextResponse
vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: vi.fn((data: any, init?: any) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ...init,
    })),
  },
}));

describe("tasks API route", () => {
  it("exports GET handler", async () => {
    const module = await import("./route");
    expect(typeof module.GET).toBe("function");
  });

  it("exports POST handler", async () => {
    const module = await import("./route");
    expect(typeof module.POST).toBe("function");
  });
});
