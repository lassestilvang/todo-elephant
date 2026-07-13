"use client";

import { useMemo } from "react";
import type { Task, FocusSession } from "@/types";
import { generateSchedulingSuggestion, SchedulingSuggestion } from "@/src/lib/scheduling";

interface UseSchedulingProps {
  tasks: Task[];
  focusSessions: FocusSession[];
}

export function useScheduling({ tasks, focusSessions }: UseSchedulingProps) {
  // Get scheduling suggestions for incomplete high-priority tasks
  const suggestions = useMemo(() => {
    const incomplete = tasks.filter(t => t.status !== "completed" && t.status !== "done");
    return incomplete.map(task => ({
      taskId: task.id,
      suggestion: generateSchedulingSuggestion(task, tasks, focusSessions),
    }));
  }, [tasks, focusSessions]);

  // Get tasks that need attention (high priority or urgent)
  const prioritySuggestions = useMemo(() => {
    return suggestions.filter(s => {
      const task = tasks.find(t => t.id === s.taskId);
      return task?.priority === "high" || task?.isUrgent;
    });
  }, [suggestions, tasks]);

  // Get daily capacity
  const dailyCapacity = useMemo(() => {
    const today = new Date();
    return generateSchedulingSuggestion(
      { id: 0, title: "", description: "", dueDate: today.toISOString(), priority: "medium", status: "todo", createdAt: today.toISOString(), updatedAt: today.toISOString() },
      tasks,
      focusSessions
    );
  }, [tasks, focusSessions]);

  return {
    suggestions,
    prioritySuggestions,
    dailyCapacity: dailyCapacity.suggestedSlots[0],
  };
}

// Helper to get a single suggestion
export function getTaskSuggestion(
  task: Task,
  tasks: Task[],
  focusSessions: FocusSession[]
): SchedulingSuggestion | null {
  return generateSchedulingSuggestion(task, tasks, focusSessions);
}