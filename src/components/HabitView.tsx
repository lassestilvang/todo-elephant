"use client";

import React, { useMemo, useState } from "react";
import { Task } from "@/types";
import { Calendar, CheckCircle2, Flame, Target, Plus, BarChart2 } from "lucide-react";

// Footprint icon for visualization
const Footprint = ({ completed, streak }: { completed: boolean; streak: number }) => {
  const fillColor = completed
    ? "#10b981"
    : streak > 0
      ? "#f59e0b"
      : "#64748b";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
      <path
        d="M6 12c2-3 4-3 6 0c2-3 4-3 6 0"
        stroke={fillColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="6" cy="12" r="1.5" fill={fillColor} />
      <circle cx="12" cy="12" r="1.5" fill={fillColor} />
      <circle cx="18" cy="12" r="1.5" fill={fillColor} />
    </svg>
  );
};

interface HabitViewProps {
  tasks: Task[];
}

interface HabitData {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  lastCompleted?: string;
}

export default function HabitView({ tasks }: HabitViewProps) {
  const [habits, setHabits] = useState<HabitData[]>(() => {
    const saved = localStorage.getItem("todo-elephant-habits");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Derive habits from recurring tasks
  const derivedHabits = useMemo(() => {
    const recurringTasks = tasks.filter(t => t.recurrence && t.recurrence !== "none");
    return recurringTasks.map(t => ({
      id: `task-${t.id}`,
      name: t.title,
      streak: calculateHabitStreak(t, tasks),
      completed: isHabitCompletedToday(t),
    }));
  }, [tasks]);

  // Combine saved habits with derived habits
  const allHabits = useMemo(() => {
    const combined = [...habits];
    derivedHabits.forEach(dh => {
      if (!combined.find(h => h.id === dh.id)) {
        combined.push(dh);
      }
    });
    return combined;
  }, [habits, derivedHabits]);

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    setHabits(prev => {
      const existing = prev.find(h => h.id === id);
      if (existing) {
        // Toggle completion
        const updated = prev.map(h =>
          h.id === id
            ? {
                ...h,
                completed: !h.completed,
                streak: !h.completed && h.lastCompleted !== today
                  ? h.streak + 1
                  : h.completed
                    ? Math.max(0, h.streak - 1)
                    : h.streak,
                lastCompleted: !h.completed ? today : h.lastCompleted,
              }
            : h
        );
        localStorage.setItem("todo-elephant-habits", JSON.stringify(updated));
        return updated;
      }
      // Create new habit
      const newHabit: HabitData = {
        id,
        name: `Habit ${prev.length + 1}`,
        streak: 1,
        completed: true,
        lastCompleted: today,
      };
      const result = [...prev, newHabit];
      localStorage.setItem("todo-elephant-habits", JSON.stringify(result));
      return result;
    });
  };

  // Generate heat map data
  const heatMap = useMemo(() => {
    const days = 30;
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      // Count how many habits were completed on this day
      const completedCount = tasks.filter(t => {
        const refDate = t.completedAt || t.updatedAt;
        if (!refDate) return false;
        return refDate.startsWith(dateStr) && (t.status === "completed" || t.status === "done");
      }).length;
      return { date: dateStr, count: completedCount };
    }).reverse();
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Target size={24} className="text-accent" />
          <span>Micro-Habits</span>
        </h2>
        <p className="text-sm text-muted">Build consistency with daily micro-habits derived from recurring tasks.</p>
      </div>

      {/* Heat Map */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-accent" />
          <span>30-Day Activity Heat Map</span>
        </h3>
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
          <div className="flex items-end gap-1 h-32">
            {heatMap.map((day, idx) => {
              const maxCount = Math.max(...heatMap.map(d => d.count), 1);
              const intensity = day.count / maxCount;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${day.date}: ${day.count} completions`}
                >
                  <div
                    className="w-full rounded-md transition-all bg-accent hover:scale-y-110 cursor-pointer"
                    style={{
                      height: `${Math.max(4, intensity * 100)}%`,
                      backgroundColor: intensity > 0.7 ? "#10b981" : intensity > 0.4 ? "#3b82f6" : intensity > 0 ? "#64748b" : "#334155",
                    }}
                  />
                  <span className="text-[8px] text-muted uppercase">
                    {day.date.split("-")[1]}/{day.date.split("-")[2].slice(-1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habits Grid with Footprints */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allHabits.map(habit => (
          <div
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`p-6 rounded-2xl border transition-all text-left cursor-pointer ${
              habit.completed
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-border bg-card/40 hover:border-accent/40"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm">{habit.name}</span>
              {habit.completed && <CheckCircle2 size={16} className="text-emerald-500" />}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-amber-500" />
              <span className="text-2xl font-black text-foreground">{habit.streak}</span>
              <span className="text-xs text-muted uppercase">day streak</span>
            </div>

            {/* Footprint trail visualization */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(habit.streak, 7) }).map((_, i) => (
                <Footprint
                  key={i}
                  completed={true}
                  streak={habit.streak}
                />
              ))}
              {habit.streak > 7 && (
                <span className="text-[10px] text-muted ml-1">+{habit.streak - 7} more</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateHabitStreak(task: Task, allTasks: Task[]): number {
  const completedDates = allTasks
    .filter(t => t.id === task.id || t.title === task.title)
    .flatMap(t => (t.status === "completed" || t.status === "done") ? [t.completedAt || t.updatedAt] : [])
    .filter(Boolean)
    .map(d => d?.split("T")[0])
    .sort((a, b) => (a < b ? 1 : -1));

  const uniqueDates = [...new Set(completedDates)];
  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      if ((prevDate.getTime() - currDate.getTime()) / 86400000 === 1) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
}

function isHabitCompletedToday(task: Task): boolean {
  const today = new Date().toISOString().split("T")[0];
  return (task.status === "completed" || task.status === "done") &&
    (task.completedAt || task.updatedAt || "").startsWith(today);
}