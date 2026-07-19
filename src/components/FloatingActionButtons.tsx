/*
 * Floating Action Button - Quick Access Hub
 *
 * Provides quick access to:
 * - New Task
 * - Voice Input
 * - AI Suggestions
 * - Focus Mode
 * - Calendar Sync Status
 */

import React, { useState } from "react";
import {
  Plus,
  Mic,
  Sparkles,
  Focus,
  Calendar,
  Bell,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/src/lib/i18n";
import { useFeatureFlag } from "@/src/lib/feature-flags";
import { VoiceInput, useVoiceInput } from "@/src/components/VoiceInput";
import { PredictiveReminders } from "@/src/components/PredictiveReminders";
import { Task } from "@/types";

interface FloatingActionButtonsProps {
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
  onQuickAdd: (title: string) => void;
  openCreateModal: () => void;
  openFocusMode: (taskId: number) => void;
  onSetReminder: (taskId: string, reminderTime: Date) => void;
  calendarConnected?: { google?: boolean; outlook?: boolean };
  onConnectCalendar: (provider: "google" | "outlook") => void;
}

export function FloatingActionButtons({
  tasks,
  onAddTask,
  onQuickAdd,
  openCreateModal,
  openFocusMode,
  onSetReminder,
  calendarConnected,
  onConnectCalendar,
}: FloatingActionButtonsProps) {
  const [expanded, setExpanded] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const { t } = useI18n();

  const voiceInput = useVoiceInput();
  const aiSubtasksEnabled = useFeatureFlag("aiSubtasks");
  const voiceInputEnabled = useFeatureFlag("voiceInput");
  const predictiveRemindersEnabled = useFeatureFlag("predictiveReminders");
  const focusModeEnabled = useFeatureFlag("focusMode");

  const handleQuickAdd = () => {
    const title = prompt("Enter task title");
    if (title && title.trim()) {
      onQuickAdd(title.trim());
      toast.success("Task created successfully!");
    }
  };

  const handleVoiceInput = () => {
    setShowVoiceInput(true);
  };

  const handleAISuggestions = async () => {
    try {
      const response = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "generate_suggestions", context: "quick-add" }),
      });

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        const suggestion = data.suggestions[0];
        onAddTask({
          title: suggestion.title,
          priority: suggestion.priority,
          description: data.suggestion.description || "",
        });
        toast.success(`AI created task: ${suggestion.title}`);
      } else {
        toast("No AI suggestions available right now");
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast.error("Could not generate suggestions");
    }
  };

  const handleOpenFocusMode = () => {
    // Find first incomplete task
    const task = tasks.find((t) => t.status !== "completed" && t.status !== "done");
    if (task) {
      openFocusMode(task.id);
    } else {
      toast("No tasks available for focus mode");
    }
  };

  const actions = [
    {
      label: "New Task",
      icon: Plus,
      onClick: handleQuickAdd,
      color: "bg-accent hover:bg-accent/90",
      enabled: true,
    },
    {
      label: "Voice Input",
      icon: Mic,
      onClick: handleVoiceInput,
      color: "bg-purple-500 hover:bg-purple-600",
      enabled: voiceInputEnabled,
    },
    {
      label: "AI Suggestion",
      icon: Sparkles,
      onClick: handleAISuggestions,
      color: "bg-pink-500 hover:bg-pink-600",
      enabled: aiSubtasksEnabled,
    },
    {
      label: "Focus Mode",
      icon: Focus,
      onClick: handleOpenFocusMode,
      color: "bg-emerald-500 hover:bg-emerald-600",
      enabled: focusModeEnabled && !!tasks.find((t) => t.status !== "completed"),
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Predictive Reminders - appears when relevant suggestions exist */}
      {predictiveRemindersEnabled && (
        <div className="mb-4 w-80 animate-fade-in">
          <PredictiveReminders tasks={tasks} onSetReminder={onSetReminder} />
        </div>
      )}

      {/* Expanded action buttons */}
      {expanded && (
        <div className="flex flex-col gap-2 mb-2">
          {actions.map((action) => {
            if (!action.enabled) return null;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`w-12 h-12 rounded-full text-white shadow-lg transition-all duration-200 transform hover:scale-110 ${action.color} flex items-center justify-center group`}
                title={action.label}
              >
                <action.icon size={20} />
                <span className="ml-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full bg-accent text-white shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
        aria-label="Quick actions"
      >
        <Plus
          size={24}
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInput
          onAddTask={onAddTask}
          onClose={() => setShowVoiceInput(false)}
          isOpen={showVoiceInput}
        />
      )}
    </div>
  );
}

// Calendar Sync Status Badge Component
export const CalendarSyncStatus: React.FC<{
  calendarConnected?: { google?: boolean; outlook?: boolean };
  onConnect: (provider: "google" | "outlook") => void;
}> = ({ calendarConnected, onConnect }) => {
  const googleConnected = useFeatureFlag("googleCalendar");
  const outlookConnected = useFeatureFlag("outlookCalendar");

  return (
    <div className="fixed bottom-6 left-6 z-40 flex gap-2">
      {googleConnected && (
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
          <Calendar size={12} />
          <span>Google Calendar</span>
          <CheckCircle size={12} className="text-green-500" />
        </div>
      )}

      {outlookConnected && (
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs">
          <Calendar size={12} />
          <span>Outlook Calendar</span>
          <CheckCircle size={12} className="text-green-500" />
        </div>
      )}
    </div>
  );
};

// Reminder notification toast - appears for predictive reminders
export const ReminderToast: React.FC<{
  taskId: string;
  taskTitle: string;
  onOpenTask: (task: Task) => void;
  reminderTime: Date;
}> = ({ taskId, taskTitle, onOpenTask, reminderTime }) => {
  return (
    <div className="fixed bottom-20 right-6 z-50 max-w-sm w-full">
      <div className="p-4 rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel animate-fade-in-scale">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-foreground">{taskTitle}</h4>
            <p className="text-xs text-muted mt-1">
              Reminder: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {/* Mark as done */}}
            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
          >
            Mark Complete
          </button>
          <button
            onClick={() => {/* Snooze */}}
            className="flex-1 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/10 transition-colors"
          >
            Snooze
          </button>
        </div>
      </div>
    </div>
  );
};