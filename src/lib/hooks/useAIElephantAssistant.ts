"use client";

import { useMemo, useState, useEffect } from "react";
import { Task, FocusSession, List } from "@/types";
import { isCompletedStatus } from "../status";

interface Suggestion {
  id: string;
  type: "breakdown" | "prioritize" | "schedule" | "habit" | "motivation";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  action?: () => void;
}

interface AssistantInsight {
  cognitiveLoad: number;
  workStyle: "deep-focus" | "multitasking" | "spread-out";
  streak: number;
  suggestions: Suggestion[];
  elephantWisdom: string;
}

export function useAIElephantAssistant(
  tasks: Task[],
  lists: List[],
  focusSessions: FocusSession[]
) {
  const [insights, setInsights] = useState<AssistantInsight | null>(null);

  // Calculate task statistics
  const stats = useMemo(() => {
    const incompleteTasks = tasks.filter(t => !isCompletedStatus(t.status));
    const completedTasks = tasks.filter(t => isCompletedStatus(t.status));
    const highPriorityTasks = incompleteTasks.filter(t => t.priority === "high");
    const overdueTasks = incompleteTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date()
    );

    // Work style determination
    const avgFocusSession = focusSessions.length > 0
      ? focusSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / focusSessions.length
      : 0;

    let workStyle: "deep-focus" | "multitasking" | "spread-out" = "spread-out";
    const longSessions = focusSessions.filter(s => s.durationSeconds > 1500).length;
    const shortSessions = focusSessions.filter(s => s.durationSeconds < 600).length;

    if (tasks.length < 20 && longSessions > focusSessions.length * 0.5) {
      workStyle = "deep-focus";
    } else if (shortSessions > focusSessions.length * 0.4) {
      workStyle = "multitasking";
    }

    // Streak calculation
    const completedDates = completedTasks
      .map(t => t.completedAt?.split("T")[0] || t.updatedAt?.split("T")[0])
      .filter(Boolean)
      .sort((a, b) => (a as string) > (b as string) ? 1 : -1);

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (completedDates[0] === today || completedDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < completedDates.length; i++) {
        const prev = new Date(completedDates[i - 1] as string);
        const curr = new Date(completedDates[i] as string);
        if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Cognitive load score (0-100)
    let cognitiveLoad = 0;
    if (incompleteTasks.length > 10) cognitiveLoad += 30;
    if (incompleteTasks.length > 5) cognitiveLoad += 15;
    if (highPriorityTasks.length > incompleteTasks.length * 0.5) cognitiveLoad += 25;
    if (overdueTasks.length > 3) cognitiveLoad += 20;

    return {
      incompleteCount: incompleteTasks.length,
      completedCount: completedTasks.length,
      overdueCount: overdueTasks.length,
      highPriorityCount: highPriorityTasks.length,
      cognitiveLoad: Math.min(100, cognitiveLoad),
      workStyle,
      streak,
    };
  }, [tasks, focusSessions]);

  // Generate suggestions
  const suggestions = useMemo(() => {
    const all: Suggestion[] = [];

    // Overdue task suggestion
    if (stats.overdueCount > 0) {
      all.push({
        id: "overdue-warning",
        type: "prioritize",
        priority: "high",
        title: "🐘 Overdue Tasks Alert!",
        description: `You have ${stats.overdueCount} overdue task${stats.overdueCount > 1 ? 's' : ''}. The elephant never forgets - but you might want to reschedule these.`,
      });
    }

    // Cognitive overload suggestion
    if (stats.cognitiveLoad > 60) {
      all.push({
        id: "cognitive-overload",
        type: "motivation",
        priority: "high",
        title: "🐘 Elephant Feeling Heavy",
        description: `Your task list is getting heavy! Consider breaking down complex tasks or taking a break.`,
      });
    }

    // Work style suggestion
    if (stats.workStyle === "deep-focus" && stats.incompleteCount > 5) {
      all.push({
        id: "focus-advice",
        type: "schedule",
        priority: "medium",
        title: "🐘 Deep Work Mode Active",
        description: "You work best with long focus sessions. Time-block your top 3 tasks today!",
      });
    }

    // Streak celebration
    if (stats.streak >= 7) {
      all.push({
        id: "streak-celebrate",
        type: "motivation",
        priority: "low",
        title: `🐘 ${stats.streak}-Day Streak!`,
        description: "Amazing consistency! Keep the momentum going - you're unstoppable.",
      });
    }

    // High priority suggestion
    if (stats.highPriorityCount > 3) {
      all.push({
        id: "priority-focus",
        type: "prioritize",
        priority: "medium",
        title: "🐘 Priority Time!",
        description: "You have many high-priority tasks. The elephant recommends choosing just ONE to tackle first.",
      });
    }

    // Simple wisdom
    const elephantWisdom = [
      "An elephant never forgets... but you don't have to remember everything - just write it down!",
      "Even the mightiest elephant moves one foot at a time. Take it one step at a time.",
      "Your herd (team) is only as strong as your smallest task. Complete it!",
      "Like an elephant's memory, review your completed tasks to see your progress.",
      "The elephant's trunk holds more than you think - break big tasks into smaller ones!",
    ];

    return {
      suggestions: all,
      elephantWisdom: elephantWisdom[Math.floor(Math.random() * elephantWisdom.length)],
    };
  }, [stats]);

  // Build insights object
  useEffect(() => {
    setInsights({
      cognitiveLoad: stats.cognitiveLoad,
      workStyle: stats.workStyle,
      streak: stats.streak,
      suggestions: suggestions.suggestions,
      elephantWisdom: suggestions.elephantWisdom,
    });
  }, [stats, suggestions]);

  return {
    insights,
    stats,
    getElephantMood: (): "happy" | "neutral" | "overwhelmed" | "celebrating" => {
      if (stats.streak >= 7) return "celebrating";
      if (stats.cognitiveLoad > 70) return "overwhelmed";
      if (stats.incompleteCount === 0) return "happy";
      return "neutral";
    },
    getSuggestions: (limit?: number) => {
      return limit
        ? suggestions.suggestions.slice(0, limit)
        : suggestions.suggestions;
    },
  };
}