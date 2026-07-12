import React from "react";
/**
 * Shared date / search helpers extracted from KanbanView and ListView to remove duplication.
 */

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Truncate to midnight UTC for date-only comparisons. */
function toDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function getRelativeDateString(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diffDays = Math.ceil((toDayUTC(d).getTime() - toDayUTC(new Date()).getTime()) / MS_PER_DAY);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getDueDateBadgeClass(dateStr: string | undefined | null, isDone: boolean): string {
  if (isDone) return "text-muted bg-muted/10";
  if (!dateStr) return "text-muted bg-muted/10";
  const diffDays = Math.ceil(
    (toDayUTC(new Date(dateStr)).getTime() - toDayUTC(new Date()).getTime()) / MS_PER_DAY,
  );
  if (diffDays < 0) return "text-red-500 bg-red-500/10 animate-pulse border border-red-500/20";
  if (diffDays === 0) return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
  if (diffDays === 1) return "text-blue-500 bg-blue-500/10 border border-blue-500/20";
  return "text-muted bg-muted/10";
}

export function isOverdue(dateStr: string | undefined | null, isDone: boolean): boolean {
  if (isDone || !dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export function isToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return toDayUTC(d).getTime() === toDayUTC(new Date()).getTime();
}

/** YYYY-MM-DD key (UTC) for grouping by day (e.g. calendar view). */
export function dayKey(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const ESCAPE_RE = /[-\/\\^$*+?.()|[\]{}]/g;

/**
 * Build React nodes with the matching substring wrapped in <mark>.
 * Uses createElement so this helper can stay in a .ts module (no JSX syntax).
 */
export function highlightText(text: string, highlight: string): React.ReactNode {
  if (!highlight.trim()) return text;
  const regex = new RegExp(`(${highlight.replace(ESCAPE_RE, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? React.createElement(
          "mark",
          { key: i, className: "bg-accent/25 text-accent rounded px-0.5 font-semibold" },
          part,
        )
      : React.createElement(React.Fragment, { key: i }, part),
  );
}
