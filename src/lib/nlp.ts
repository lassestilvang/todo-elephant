/**
 * Natural-language quick-add parser. Designed to recognize:
 *   - single-token dates: today, tomorrow, mon, monday, +3d, +1w
 *   - multi-token dates: "next monday", "next week"
 *   - priority markers: !p1, !high, !!2
 *   - labels: #work
 *   - recurrence: ~daily, ~weekly, ~monthly
 *
 * Returns { cleanTitle, dueDate, priority, labels, recurrence }.
 *
 * IMPORTANT: priority/recur/label detection runs on the RAW lower-cased token so
 * that "!p1" survives punctuation processing (we must NOT strip "!" before checking).
 */

import type { RecurrenceKind } from "./recurrence";

const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const WEEKDAY_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const PRIORITY_MAP: Record<string, "low" | "medium" | "high"> = {
  "1": "high",
  "2": "medium",
  "3": "low",
  "high": "high",
  "medium": "medium",
  "low": "low",
};

export type ParsedQuickAdd = {
  title: string;
  dueDate: Date | null;
  priority: "low" | "medium" | "high";
  labels: string[];
  recurrence: RecurrenceKind;
};

function nextWeekday(target: number, from: Date = new Date()): Date {
  const day = from.getUTCDay();
  let diff = (target - day + 7) % 7;
  if (diff === 0) diff = 7; // skip ahead to NEXT occurrence on same weekday
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function setEndOfDayUTC(d: Date): Date {
  d.setUTCHours(23, 59, 0, 0);
  return d;
}

export function parseQuickAdd(input: string, now: Date = new Date()): ParsedQuickAdd {
  let text = ` ${input.trim()} `;
  let priority: "low" | "medium" | "high" = "medium";
  let dueDate: Date | null = null;
  let recurrence: RecurrenceKind = "none";
  const labels: string[] = [];

  // Multi-token dates first.
  const multi: [RegExp, () => void][] = [
    [/ next week /i, () => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + 7); dueDate = setEndOfDayUTC(d); }],
    [/ next monday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(1, now)); }],
    [/ next tuesday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(2, now)); }],
    [/ next wednesday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(3, now)); }],
    [/ next thursday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(4, now)); }],
    [/ next friday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(5, now)); }],
    [/ next saturday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(6, now)); }],
    [/ next sunday /i, () => { dueDate = setEndOfDayUTC(nextWeekday(0, now)); }],
  ];
  for (const [re, apply] of multi) {
    if (re.test(text)) {
      apply();
      text = text.replace(re, " ");
    }
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  const newTokens: string[] = [];

  for (const tok of tokens) {
    const raw = tok.toLowerCase();

    // Priority BEFORE punctuation strip — "!" must survive.
    const priMatch = raw.match(/^!+(p?[123]|high|medium|low)$/);
    if (priMatch) {
      const key = priMatch[1].replace(/^p/, "");
      priority = PRIORITY_MAP[key] ?? priority;
      continue;
    }

    // Recurrence (~daily).
    const recMatch = raw.match(/^~(daily|weekly|monthly)$/);
    if (recMatch) {
      recurrence = recMatch[1] as RecurrenceKind;
      continue;
    }

    // Label — must start with "#"; allow dashes/underscores.
    if (raw.startsWith("#") && raw.length > 1) {
      labels.push(raw.slice(1).replace(/[.,!?]/g, ""));
      continue;
    }

    // Strip punctuation DOWNSTREAM — after we've matched priority/recurrence/label.
    const lower = raw.replace(/[.,!?]/g, "");

    if (lower === "today") { dueDate = setEndOfDayUTC(new Date(now)); continue; }
    if (lower === "tomorrow") {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() + 1); dueDate = setEndOfDayUTC(d); continue;
    }
    if ((WEEKDAY_NAMES as readonly string[]).includes(lower)) {
      const idx = WEEKDAY_NAMES.indexOf(lower as (typeof WEEKDAY_NAMES)[number]);
      dueDate = setEndOfDayUTC(nextWeekday(idx, now));
      continue;
    }
    if ((WEEKDAY_SHORT as readonly string[]).includes(lower)) {
      const idx = WEEKDAY_SHORT.indexOf(lower as (typeof WEEKDAY_SHORT)[number]);
      dueDate = setEndOfDayUTC(nextWeekday(idx, now));
      continue;
    }

    const offsetMatch = lower.match(/^\+(\d+)([dw])$/);
    if (offsetMatch) {
      const n = parseInt(offsetMatch[1], 10);
      const unit = offsetMatch[2];
      const d = new Date(now);
      if (unit === "d") d.setUTCDate(d.getUTCDate() + n);
      else if (unit === "w") d.setUTCDate(d.getUTCDate() + n * 7);
      dueDate = setEndOfDayUTC(d);
      continue;
    }

    newTokens.push(tok); // Preserve original casing in the title.
  }

  const title = newTokens.join(" ").trim();
  return { title, dueDate, priority, labels, recurrence };
}
