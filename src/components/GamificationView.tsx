"use client";

import React, { useMemo } from "react";
import { Trophy, Star, Zap, Flame, Calendar, Award, Target, CheckCircle2 } from "lucide-react";
import { Task, List, Label } from "@/types";

interface GamificationViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
}

interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  current: number;
  unlocked: boolean;
}

interface WeeklyActivity {
  day: string;
  value: number;
  maxValue: number;
}

export default function GamificationView({ tasks, lists }: GamificationViewProps) {
  // Calculate gamification stats from tasks
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "done");

    // Calculate XP (simple formula: 10 XP per task, bonus for priority)
    const xp = completedTasks.reduce((sum, t) => {
      const priorityBonus = t.priority === "high" ? 1.5 : t.priority === "medium" ? 1.2 : 1;
      return sum + Math.round(10 * priorityBonus);
    }, 0);

    // Calculate level (100 XP per level)
    const level = Math.floor(xp / 100) + 1;
    const nextLevelXp = level * 100;

    // Calculate streak (consecutive days with completions)
    const streak = calculateStreak(tasks);

    // Calculate achievement progress
    const achievements: AchievementData[] = [
      { id: "first-task", name: "The Journey Begins", description: "Complete your first task", icon: "🚀", threshold: 1, current: 0, unlocked: false },
      { id: "decade", name: "Decade of Deeds", description: "Complete 10 tasks", icon: "🔥", threshold: 10, current: 0, unlocked: false },
      { id: "master", name: "Task Master", description: "Complete 50 tasks", icon: "🏆", threshold: 50, current: 0, unlocked: false },
      { id: "pomodoro-5", name: "Deep Work Junior", description: "Complete 5 focus sessions", icon: "🎯", threshold: 5, current: 0, unlocked: false },
      { id: "streak-week", name: "Perfect Week", description: "Complete tasks 7 days in a row", icon: "📅", threshold: 7, current: 0, unlocked: false },
    ].map(a => ({
      ...a,
      current: completedTasks.length >= a.threshold ? a.threshold : completedTasks.length,
      unlocked: completedTasks.length >= a.threshold,
    }));

    // Weekly activity for heat map
    const weeklyActivity = calculateWeeklyActivity(tasks);

    return {
      level,
      xp,
      nextLevelXp,
      streak,
      completedCount: completedTasks.length,
      achievements,
      weeklyActivity,
    };
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in px-8 py-8">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy size={24} className="text-amber-500" />
          <span>Your Progress</span>
        </h2>
        <p className="text-sm text-muted">Level {stats.level} • {stats.xp} XP • {stats.streak}-day streak</p>
      </div>

      {/* Level Progress */}
      <div className="mb-8 p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-accent" />
            <span className="font-bold text-foreground">Level Progress</span>
          </div>
          <span className="text-sm font-bold text-muted">
            {stats.xp} / {stats.nextLevelXp} XP
          </span>
        </div>
        <div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${(stats.xp / stats.nextLevelXp) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted mt-2">
          {stats.nextLevelXp - stats.xp} XP to reach Level {stats.level + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <Star size={24} className="text-accent" />
          </div>
          <div className="text-3xl font-black text-foreground">{stats.completedCount}</div>
          <p className="text-xs font-bold text-muted uppercase">Tasks Completed</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Flame size={24} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{stats.streak}</div>
          <p className="text-xs font-bold text-muted uppercase">Day Streak</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Target size={24} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{lists.length}</div>
          <p className="text-xs font-bold text-muted uppercase">Active Projects</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award size={20} className="text-accent" />
          <span>Achievements</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all ${
                achievement.unlocked
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border bg-card/40 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{achievement.icon}</span>
                <span className="font-bold text-sm">{achievement.name}</span>
                {achievement.unlocked && <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />}
              </div>
              <p className="text-[11px] text-muted">{achievement.description}</p>
              <div className="mt-2 h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    achievement.unlocked ? "bg-emerald-500" : "bg-accent"
                  }`}
                  style={{ width: `${(achievement.current / achievement.threshold) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Heat Map */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-accent" />
          <span>Weekly Activity</span>
        </h3>
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
          <div className="flex items-end justify-between h-32">
            {stats.weeklyActivity.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-[11px] font-bold text-muted">{day.value}</span>
                <div className="w-8 bg-muted/20 rounded-md relative overflow-hidden h-24 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-accent/80 to-accent rounded-md transition-all duration-700"
                    style={{ height: `${day.maxValue > 0 ? (day.value / day.maxValue) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted uppercase">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to calculate streak
function calculateStreak(tasks: Task[]): number {
  const completedDates = tasks
    .filter(t => t.status === "completed" || t.status === "done")
    .map(t => t.completedAt || t.updatedAt || t.createdAt)
    .filter(Boolean)
    .map(d => new Date(d!).toISOString().split("T")[0])
    .sort((a, b) => (a < b ? 1 : -1));

  const uniqueDates = [...new Set(completedDates)];
  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Check if completed today or yesterday to continue streak
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

// Helper to calculate weekly activity
function calculateWeeklyActivity(tasks: Task[]): WeeklyActivity[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const max = Math.max(1, ...tasks.filter(t => t.status === "completed" || t.status === "done").map(t => 1));

  return days.map((day, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() - now.getDay() + idx);
    const dateStr = date.toISOString().split("T")[0];
    const value = tasks.filter(t => {
      const refDate = t.completedAt || t.updatedAt || t.createdAt;
      if (!refDate) return false;
      return refDate.startsWith(dateStr) && (t.status === "completed" || t.status === "done");
    }).length;
    return { day, value, maxValue: max };
  });
}