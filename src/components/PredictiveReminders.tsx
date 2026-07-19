"use client";

import React, { useMemo } from "react";
import { Task } from "@/types";
import { Bell, AlertCircle, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface PredictiveRemindersProps {
  tasks: Task[];
  onSetReminder: (taskId: string, reminderTime: Date) => void;
}

interface ReminderSuggestion {
  taskId: string;
  taskTitle: string;
  suggestedMinutesBefore: number;
  confidence: number;
  reasoning: string;
}

export function PredictiveReminders({ tasks, onSetReminder }: PredictiveRemindersProps) {
  const suggestions = useMemo(() => {
    const suggestions: ReminderSuggestion[] = [];

    tasks.forEach(task => {
      if (!task.dueDate || task.status === "completed") return;

      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Only suggest for tasks due within 24-72 hours with high priority
      if (hoursUntilDue > 24 && hoursUntilDue <= 72 && task.priority === "high") {
        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          suggestedMinutesBefore: 24 * 60, // 24 hours before
          confidence: 0.85,
          reasoning: "HighPriorityTask"
        });
      }

      // Suggest for medium priority tasks due sooner
      if (hoursUntilDue > 6 && hoursUntilDue <= 24 && task.priority === "medium") {
        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          suggestedMinutesBefore: 6 * 60, // 6 hours before
          confidence: 0.75,
          reasoning: "MediumPriorityTask"
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityDiff = b.confidence - a.confidence;
      if (priorityDiff !== 0) return priorityDiff;
      return tasks.find(t => t.id === a.taskId)?.dueDate?.localeCompare(
        tasks.find(t => t.id === b.taskId)?.dueDate || ""
      ) || 0;
    });
  }, [tasks]);

  const handleSetAllReminders = () => {
    const now = new Date();
    suggestions.forEach(s => {
      const reminderTime = new Date(new Date(suggestedTasks.find(t => t.id === s.taskId)?.dueDate || now.getTime()).getTime() - s.suggestedMinutesBefore * 60 * 1000);
      onSetReminder(s.taskId, reminderTime);
    });
    toast.success(`${suggestions.length} reminders set`);
  };

  return (
    <div className="space-y-4">
      {suggestions.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Bell size={16} className="text-accent" />
              Predictive Reminders (Recommended)
            </h4>
            <button
              onClick={handleSetAllReminders}
              className="text-xs font-medium text-accent hover:underline"
            >
              Set All
            </button>
          </div>

          {suggestions.map((s) => (
            <div
              key={s.taskId}
              className="p-3 rounded-xl border border-border bg-card/40"
            >
              <div className="flex items-start gap-3">
                <Lightbulb size={16} className="text-amber-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{tasks.find(t => t.id === s.taskId)?.title}</p>
                  <p className="text-xs text-muted mt-1">
                    Remind {s.suggestedMinutesBefore / 60} hours before due
                  </p>
                  <button
                    onClick={() => {
                      const reminderTime = new Date(
                        new Date(tasks.find(t => t.id === s.taskId)?.dueDate || Date.now()).getTime() - s.suggestedMinutesBefore * 60 * 1000
                      );
                      onSetReminder(s.taskId, reminderTime);
                      toast.success("Reminder set");
                    }}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    Set reminder for this task
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="p-4 rounded-xl border border-border bg-card/25">
          <div className="flex items-center gap-2 text-muted">
            <Bell size={16} className="opacity-50" />
            <span className="text-sm">No predictive reminders at this time</span>
          </div>
        </div>
      )}

      <div className="text-xs text-muted/60">
        AI analyzes task patterns and suggests optimal reminder times
      </div>
    </div>
  );
}