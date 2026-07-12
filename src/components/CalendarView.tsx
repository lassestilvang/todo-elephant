"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import type { Task, List, Label } from "@/types";
import { isCompletedStatus } from "@/src/lib/status";
import { dayKey, isToday, isOverdue } from "@/src/lib/dateUtils";

interface CalendarViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (title: string, dueDate: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function monthGrid(year: number, month0: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(Date.UTC(year, month0, 1));
  const firstDayOfWeek = first.getUTCDay();
  const start = new Date(first);
  start.setUTCDate(1 - firstDayOfWeek);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    cells.push({ date: d, inMonth: d.getUTCMonth() === month0 });
  }
  return cells;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

function CalendarView({ tasks, lists, labels: _labels, onTaskClick, onAddTask }: CalendarViewProps) {
  // Note: labels are surfaced via the day detail panel; the day-grid dots use priority colors.
  const today = useMemo(() => toDayUTC(new Date()), []);
  const [viewDate, setViewDate] = useState<Date>(() => new Date(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const cells = useMemo(
    () => monthGrid(viewDate.getUTCFullYear(), viewDate.getUTCMonth()),
    [viewDate],
  );

  // Group tasks by day key in a single pass via Map.
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const k = dayKey(t.dueDate);
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }
    // Sort each bucket: overdue first, then priority, then title
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (isOverdue(a.dueDate, isCompletedStatus(a.status)) !== isOverdue(b.dueDate, isCompletedStatus(b.status))) {
          return isOverdue(a.dueDate, isCompletedStatus(a.status)) ? -1 : 1;
        }
        const ap = a.priority === "high" ? 3 : a.priority === "medium" ? 2 : 1;
        const bp = b.priority === "high" ? 3 : b.priority === "medium" ? 2 : 1;
        if (ap !== bp) return bp - ap;
        return a.title.localeCompare(b.title);
      });
    }
    return map;
  }, [tasks]);

  const monthLabel = viewDate.toLocaleDateString([], { year: "numeric", month: "long" });

  const selectedTasks = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      {/* Calendar header */}
      <div className="px-8 pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalIcon size={20} className="text-accent" />
            <span>Calendar</span>
          </h2>
          <p className="text-sm text-muted mt-1">
            {tasks.filter((t) => !isCompletedStatus(t.status)).length} tasks plotted across {monthLabel}.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card/40 border border-border/60 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewDate(new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth() - 1, 1)))}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted/20 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setViewDate(new Date(today))}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-foreground hover:bg-muted/20 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth() + 1, 1)))}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted/20 transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <span className="px-3 text-sm font-bold text-accent">{monthLabel}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="bg-card/45 backdrop-blur-md border border-border rounded-2xl glass-panel overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center py-3 text-xs font-bold text-muted uppercase tracking-wider">
                {w}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 auto-rows-[110px]">
            {cells.map((cell, idx) => {
              const k = dayKey(cell.date.toISOString());
              const dayTasks = byDay.get(k) ?? [];
              const isCurrentMonth = cell.inMonth;
              const isTodayCell = isToday(cell.date.toISOString());
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (dayTasks.length === 0 && onAddTask) {
                      // Empty-day affordance: prefill the modal with today's date.
                      onAddTask("", cell.date.toISOString());
                    } else {
                      setSelectedDay(selectedDay === k ? null : k);
                    }
                  }}
                  className={`relative border-b border-r border-border/40 p-2 text-left align-top transition-colors hover:bg-muted/15 ${
                    !isCurrentMonth ? "bg-muted/[0.03] text-muted/50" : ""
                  } ${isTodayCell ? "ring-2 ring-inset ring-accent/40 bg-accent/[0.04]" : ""}`}
                >
                  <span
                    className={`text-xs font-bold ${isTodayCell ? "text-accent" : ""}`}
                  >
                    {cell.date.getUTCDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-1.5 text-[10px] truncate"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.low
                            } ${isCompletedStatus(t.status) ? "opacity-30" : ""}`}
                          />
                          <span
                            className={`truncate ${isCompletedStatus(t.status) ? "line-through text-muted/70" : "text-foreground"}`}
                          >
                            {t.title}
                          </span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[10px] text-muted font-bold">+{dayTasks.length - 3} more</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && selectedTasks.length > 0 && (
          <div className="mt-4 p-5 rounded-2xl bg-card/55 border border-border/60 glass-panel animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm">
                  {new Date(selectedDay + "T12:00:00.000Z").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <p className="text-[11px] text-muted">{selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"}</p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-[11px] font-bold text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="space-y-1.5">
              {selectedTasks.map((t) => {
                const list = lists.find((l) => l.id === t.listId);
                const done = isCompletedStatus(t.status);
                return (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:border-accent/40 hover:bg-accent/5 transition-all text-left ${done ? "opacity-60" : ""}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.low}`} />
                    <span className={`flex-1 text-xs font-semibold truncate ${done ? "line-through text-muted" : "text-foreground"}`}>
                      {t.title}
                    </span>
                    {list && (
                      <span className="text-[10px] font-bold text-muted">
                        <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: list.color }} />
                        {list.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CalendarView);
