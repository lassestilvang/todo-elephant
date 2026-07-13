"use client";

import { useCallback, useRef } from "react";
import { Task } from "@/types";

interface SnoozePattern {
  taskId: number;
  timesSnoozed: number;
  averageSnoozeDays: number;
  lastSnoozed: string;
}

/**
 * Predictive snooze hook that learns from snooze patterns
 * and suggests optimal snooze times.
 */
export function usePredictiveSnooze() {
  const snoozeHistoryRef = useRef<Map<number, SnoozePattern>>(new Map());

  // Load history from localStorage
  const loadHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("snooze-history");
    if (saved) {
      try {
        const parsed: SnoozePattern[] = JSON.parse(saved);
        snoozeHistoryRef.current = new Map(parsed.map(p => [p.taskId, p]));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    const history = Array.from(snoozeHistoryRef.current.values());
    localStorage.setItem("snooze-history", JSON.stringify(history));
  }, []);

  // Snooze a task with smart suggestion
  const snoozeTask = useCallback((task: Task, days: number = 1) => {
    const now = new Date();
    const pattern = snoozeHistoryRef.current.get(task.id);

    let suggestedDays = days;
    if (pattern && pattern.timesSnoozed >= 2) {
      // Suggest based on average snooze duration
      suggestedDays = Math.round(pattern.averageSnoozeDays);
      if (suggestedDays < 1) suggestedDays = 1;
    }

    // Update pattern
    const updatedPattern: SnoozePattern = {
      taskId: task.id,
      timesSnoozed: (pattern?.timesSnoozed ?? 0) + 1,
      averageSnoozeDays: pattern
        ? (pattern.averageSnoozeDays * pattern.timesSnoozed + suggestedDays) / (pattern.timesSnoozed + 1)
        : suggestedDays,
      lastSnoozed: now.toISOString(),
    };

    snoozeHistoryRef.current.set(task.id, updatedPattern);
    saveHistory();

    // Calculate new due date
    const newDue = new Date(now);
    newDue.setDate(now.getDate() + suggestedDays);
    return newDue.toISOString().split("T")[0];
  }, [saveHistory]);

  // Get smart snooze suggestion
  const getSuggestedSnooze = useCallback((taskId: number): { days: number; confidence: number } => {
    const pattern = snoozeHistoryRef.current.get(taskId);
    if (!pattern || pattern.timesSnoozed < 2) {
      return { days: 1, confidence: 0 };
    }

    // Confidence based on number of patterns
    const confidence = Math.min(1, pattern.timesSnoozed / 5);
    return { days: Math.round(pattern.averageSnoozeDays), confidence };
  }, []);

  // Clear snooze history
  const clearHistory = useCallback(() => {
    snoozeHistoryRef.current.clear();
    saveHistory();
  }, [saveHistory]);

  return {
    snoozeTask,
    getSuggestedSnooze,
    clearHistory,
    loadHistory,
  };
}