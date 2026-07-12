import { describe, it, expect } from "vitest";
import { parseQuickAdd } from "@/src/lib/nlp";

describe("parseQuickAdd", () => {
  const now = new Date("2026-03-15T10:00:00.000Z"); // Sunday

  it("extracts priority from !p1 / !high", () => {
    const r = parseQuickAdd("Buy milk !p1", now);
    expect(r.title).toBe("Buy milk");
    expect(r.priority).toBe("high");
  });

  it("extracts priority from !low", () => {
    const r = parseQuickAdd("Read book !low", now);
    expect(r.priority).toBe("low");
  });

  it("extracts priority from !p2 / !medium", () => {
    const r = parseQuickAdd("Email team !p2", now);
    expect(r.priority).toBe("medium");
  });

  it("extracts priority from !!1 (double exclamation)", () => {
    const r = parseQuickAdd("Urgent task !!1", now);
    expect(r.priority).toBe("high");
  });

  it("extracts labels from #work", () => {
    const r = parseQuickAdd("Send report #work", now);
    expect(r.title).toBe("Send report");
    expect(r.labels).toEqual(["work"]);
  });

  it("extracts multiple labels", () => {
    const r = parseQuickAdd("Project work #work #urgent", now);
    expect(r.labels).toEqual(["work", "urgent"]);
  });

  it("strips punctuation from labels", () => {
    const r = parseQuickAdd("Fix bug #work!", now);
    expect(r.labels).toContain("work");
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

  it("parses +2w as two weeks out", () => {
    const r = parseQuickAdd("Vacation planning +2w", now);
    expect(r.dueDate?.getUTCDate()).toBe(29); // 15 + 14 = 29
  });

  it("parses ~daily recurrence", () => {
    const r = parseQuickAdd("Stretch ~daily", now);
    expect(r.recurrence).toBe("daily");
    expect(r.title).toBe("Stretch");
  });

  it("parses ~weekly recurrence", () => {
    const r = parseQuickAdd("Team review ~weekly", now);
    expect(r.recurrence).toBe("weekly");
  });

  it("parses ~monthly recurrence", () => {
    const r = parseQuickAdd("Pay rent ~monthly", now);
    expect(r.recurrence).toBe("monthly");
  });

  it("defaults: priority=medium, recurrence=none, no labels", () => {
    const r = parseQuickAdd("Just text", now);
    expect(r.priority).toBe("medium");
    expect(r.recurrence).toBe("none");
    expect(r.labels).toEqual([]);
    expect(r.title).toBe("Just text");
  });

  it("handles today keyword", () => {
    const r = parseQuickAdd("Buy groceries today", now);
    expect(r.title).toBe("Buy groceries");
    expect(r.dueDate?.getUTCDate()).toBe(15);
  });

  it("handles weekday names (monday, tuesday, etc)", () => {
    // Sunday March 15, so next Monday is March 16
    const r = parseQuickAdd("Meeting monday", now);
    expect(r.dueDate?.getUTCDate()).toBe(16);
  });

  it("handles weekday short names (mon, tue, etc)", () => {
    // Sunday March 15, so next Monday is March 16
    const r = parseQuickAdd("Standup mon", now);
    expect(r.dueDate?.getUTCDate()).toBe(16);
  });

  it("handles all weekday names", () => {
    // Sunday - next Sunday is March 22 (7 days ahead)
    const sun = parseQuickAdd("Sunday task", now);
    expect(sun.dueDate?.getUTCDate()).toBe(22);

    // Monday - March 16
    const mon = parseQuickAdd("Tuesday task", now);
    expect(mon.dueDate?.getUTCDate()).toBe(17);

    // Wednesday
    const wed = parseQuickAdd("Wednesday task", now);
    expect(wed.dueDate?.getUTCDate()).toBe(18);

    // Thursday
    const thu = parseQuickAdd("Thursday task", now);
    expect(thu.dueDate?.getUTCDate()).toBe(19);

    // Friday
    const fri = parseQuickAdd("Friday task", now);
    expect(fri.dueDate?.getUTCDate()).toBe(20);

    // Saturday
    const sat = parseQuickAdd("Saturday task", now);
    expect(sat.dueDate?.getUTCDate()).toBe(21);
  });

  it("handles all weekday short names", () => {
    // Sunday March 15, next sun is March 22
    const sun = parseQuickAdd("sun task", now);
    expect(sun.dueDate?.getUTCDate()).toBe(22);

    const tue = parseQuickAdd("tue task", now);
    expect(tue.dueDate?.getUTCDate()).toBe(17); // March 17 (Tuesday)
  });

  it("handles offset with +d suffix", () => {
    const r = parseQuickAdd("Wait +7d", now);
    expect(r.dueDate?.getUTCDate()).toBe(22); // March 15 + 7 = 22
  });

  it("handles empty input gracefully", () => {
    const r = parseQuickAdd("", now);
    expect(r.title).toBe("");
  });

  it("handles whitespace-only input", () => {
    const r = parseQuickAdd("   ", now);
    expect(r.title).toBe("");
  });

  it("preserves original casing in title", () => {
    const r = parseQuickAdd("URGENT TASK tomorrow !p1", now);
    expect(r.title).toBe("URGENT TASK");
  });

  it("combines multiple modifiers", () => {
    const r = parseQuickAdd("Submit PR !p1 #work ~daily tomorrow", now);
    expect(r.priority).toBe("high");
    expect(r.labels).toEqual(["work"]);
    expect(r.recurrence).toBe("daily");
    expect(r.title).toBe("Submit PR");
  });
});
