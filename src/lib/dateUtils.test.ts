import { describe, it, expect } from "vitest";
import { isToday, isOverdue, dayKey, getRelativeDateString, getDueDateBadgeClass } from "@/src/lib/dateUtils";

describe("dateUtils", () => {
  it("dayKey returns YYYY-MM-DD UTC", () => {
    const k = dayKey("2026-03-15T22:30:00.000Z");
    expect(k).toBe("2026-03-15");
  });

  it("dayKey returns empty string for null/undefined", () => {
    expect(dayKey(null)).toBe("");
    expect(dayKey(undefined)).toBe("");
    expect(dayKey("")).toBe("");
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

  it("getDueDateBadgeClass marks overdue red", () => {
    expect(getDueDateBadgeClass("1999-01-01", false)).toMatch(/red/);
    expect(getDueDateBadgeClass("1999-01-01", true)).toBe("text-muted bg-muted/10");
  });
});
