import { describe, it, expect } from "vitest";
import { parseQuickAdd } from "@/src/lib/nlp";

describe("parseQuickAdd", () => {
  const now = new Date("2026-03-15T10:00:00.000Z"); // Sunday

  it("extracts priority from !p1 / !high", () => {
    const r = parseQuickAdd("Buy milk !p1", now);
    expect(r.title).toBe("Buy milk");
    expect(r.priority).toBe("high");
  });

  it("extracts labels from #work", () => {
    const r = parseQuickAdd("Send report #work", now);
    expect(r.title).toBe("Send report");
    expect(r.labels).toEqual(["work"]);
  });

  it("parses tomorrow as +1 day", () => {
    const r = parseQuickAdd("Submit expense report tomorrow", now);
    expect(r.title).toBe("Submit expense report");
    expect(r.dueDate?.getUTCDate()).toBe(16);
  });

  it("parses 'next monday' as the next Monday", () => {
    const r = parseQuickAdd("Stand-up next monday", now);
    // March 15 was a Sunday in 2026 → next Monday is Mar 16.
    expect(r.dueDate?.getUTCDate()).toBe(16);
  });

  it("parses 'next week' as +7 days", () => {
    const r = parseQuickAdd("Sprint review next week", now);
    expect(r.dueDate?.getUTCDate()).toBe(22);
  });

  it("parses +3d as three days out", () => {
    const r = parseQuickAdd("Drink water +3d", now);
    expect(r.dueDate?.getUTCDate()).toBe(18);
  });

  it("parses ~daily recurrence", () => {
    const r = parseQuickAdd("Stretch ~daily", now);
    expect(r.recurrence).toBe("daily");
    expect(r.title).toBe("Stretch");
  });

  it("defaults: priority=medium, recurrence=none, no labels", () => {
    const r = parseQuickAdd("Just text", now);
    expect(r.priority).toBe("medium");
    expect(r.recurrence).toBe("none");
    expect(r.labels).toEqual([]);
    expect(r.title).toBe("Just text");
  });
});
