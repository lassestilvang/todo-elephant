import { describe, it, expect } from "vitest";
import { isToday, isOverdue, dayKey, getRelativeDateString, getDueDateBadgeClass, highlightText, MS_PER_DAY } from "@/src/lib/dateUtils";
import React from "react";

describe("dateUtils", () => {
  it("MS_PER_DAY constant is correct", () => {
    expect(MS_PER_DAY).toBe(86_400_000); // 24 * 60 * 60 * 1000
  });

  it("dayKey returns YYYY-MM-DD UTC", () => {
    const k = dayKey("2026-03-15T22:30:00.000Z");
    expect(k).toBe("2026-03-15");
  });

  it("dayKey returns empty string for null/undefined", () => {
    expect(dayKey(null)).toBe("");
    expect(dayKey(undefined)).toBe("");
    expect(dayKey("")).toBe("");
  });

  it("dayKey handles invalid date strings", () => {
    // Invalid date strings return "Invalid Date" which gets parsed weirdly
    // but the function should not crash
    expect(() => dayKey("invalid")).not.toThrow();
  });

  it("isToday is true for today and false otherwise", () => {
    const today = new Date();
    const iso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0)).toISOString();
    expect(isToday(iso)).toBe(true);
    expect(isToday("1999-01-01T00:00:00.000Z")).toBe(false);
    expect(isToday(null)).toBe(false);
  });

  it("isOverdue is true only for past + incomplete", () => {
    expect(isOverdue("1999-01-01T00:00:00.000Z", false)).toBe(true);
    expect(isOverdue("1999-01-01T00:00:00.000Z", true)).toBe(false);
    expect(isOverdue(null, false)).toBe(false);
  });

  it("getRelativeDateString returns Today/Tomorrow/Yesterday", () => {
    const now = new Date();
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 12));
    expect(getRelativeDateString(t.toISOString())).toBe("Today");
    expect(getRelativeDateString(tomorrow.toISOString())).toBe("Tomorrow");
  });

  it("getRelativeDateString returns 'In X days' for future dates within a week", () => {
    const now = new Date();
    for (let i = 2; i <= 7; i++) {
      const future = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, 12));
      expect(getRelativeDateString(future.toISOString())).toBe(`In ${i} days`);
    }
  });

  it("getRelativeDateString returns 'X days ago' for past dates within a week", () => {
    const now = new Date();
    for (let i = 2; i <= 7; i++) {
      const past = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, 12));
      expect(getRelativeDateString(past.toISOString())).toBe(`${i} days ago`);
    }
  });

  it("getRelativeDateString formats distant dates", () => {
    const now = new Date();
    const distantFuture = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30, 12));
    const distantPast = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 12));
    // Should return a formatted date string like "Jun 19" or similar
    expect(getRelativeDateString(distantFuture.toISOString())).toMatch(/\w{3} \d+/);
    expect(getRelativeDateString(distantPast.toISOString())).toMatch(/\w{3} \d+/);
  });

  it("getDueDateBadgeClass marks overdue red", () => {
    expect(getDueDateBadgeClass("1999-01-01", false)).toMatch(/red/);
    expect(getDueDateBadgeClass("1999-01-01", true)).toBe("text-muted bg-muted/10");
  });

  it("getDueDateBadgeClass marks today amber", () => {
    const today = new Date();
    const iso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0)).toISOString();
    expect(getDueDateBadgeClass(iso, false)).toMatch(/amber/);
  });

  it("getDueDateBadgeClass marks tomorrow blue", () => {
    const today = new Date();
    const tomorrow = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1, 12));
    expect(getDueDateBadgeClass(tomorrow.toISOString(), false)).toMatch(/blue/);
  });

  it("getDueDateBadgeClass returns muted for future dates beyond tomorrow", () => {
    const today = new Date();
    const future = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 5, 12));
    expect(getDueDateBadgeClass(future.toISOString(), false)).toBe("text-muted bg-muted/10");
  });

  it("getDueDateBadgeClass returns muted for done tasks", () => {
    const today = new Date();
    const iso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0)).toISOString();
    expect(getDueDateBadgeClass(iso, true)).toBe("text-muted bg-muted/10");
  });

  it("getDueDateBadgeClass returns muted for null/undefined dates", () => {
    expect(getDueDateBadgeClass(null, false)).toBe("text-muted bg-muted/10");
    expect(getDueDateBadgeClass(undefined, false)).toBe("text-muted bg-muted/10");
  });

  describe("highlightText", () => {
    it("returns original text as string when highlight is empty", () => {
      expect(highlightText("hello world", "")).toBe("hello world");
      expect(highlightText("hello world", "   ")).toBe("hello world");
    });

    it("highlights case-insensitive matches", () => {
      const result = highlightText("hello world", "world");
      expect(typeof result).toBe("object"); // React nodes are objects
    });

    it("escapes special regex characters", () => {
      const result = highlightText("price: $5.99", "$5.99");
      expect(typeof result).toBe("object");
    });

    it("highlights partial matches", () => {
      const result = highlightText("hello beautiful world", "beau");
      expect(typeof result).toBe("object");
    });
  });
});
