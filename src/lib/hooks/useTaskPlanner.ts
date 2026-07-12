"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Task, SavedFilter, List, Label } from "@/types";
import { isCompletedStatus } from "@/src/lib/status";
import { useTaskForm } from "@/src/lib/hooks/useTaskForm";
import { useTaskActions } from "@/src/lib/hooks/useTaskActions";
import { usePlannerView, ViewName } from "@/src/lib/hooks/usePlannerView";
import { usePlannerSettings } from "@/src/lib/hooks/usePlannerSettings";
import { usePlannerData } from "@/src/lib/hooks/usePlannerData";

/**
 * Composition hook: assembles the focused sub-hooks into a single object so
 * the existing call sites in app/page.tsx and any other consumer don't have
 * to change. Internal logic is now distributed across:
 *
 *   - useTaskForm        – modal + form state + subtasks + magic breakdown
 *   - useTaskActions     – CRUD with optimistic updates + dependency check + achievements
 *   - usePlannerView     – current view + sidebar selection + date scope + transitionView
 *   - usePlannerSettings – theme, accent, sound, sidebar, focus mode, zen, settings
 *   - usePlannerData     – tasks, lists, labels, logs, filters, shortcuts fetching
 *
 * Each sub-hook is independently testable; this file is just the wiring.
 */
export function useTaskPlanner() {
  const data = usePlannerData();
  const view = usePlannerView();
  const settings = usePlannerSettings();
  const form = useTaskForm();

  const actions = useTaskActions({
    setTasks: data.setTasks,
    setActivityLogs: data.setActivityLogs,
    refreshLogs: data.refreshLogs,
    soundEnabled: settings.soundEnabled,
    pendingDeleteId: form.pendingDeleteId,
    setPendingDeleteId: form.setPendingDeleteId,
    onLocalPomodoroBump: (taskId) => {
      data.setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completedPomodoros: (t.completedPomodoros ?? 0) + 1 } : t,
        ),
      );
    },
  });

  // Adapters that combine form + actions so the consumer gets the same
  // single-call submit/click ergonomics as before.
  const handleTaskSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.taskTitle.trim() || form.isSubmitting) return;
      form.setIsSubmitting(true);
      try {
        await actions.submitTask(
          {
            mode: form.modalMode,
            editingTask: form.currentEditingTask,
            data: {
              title: form.taskTitle.trim(),
              description: form.taskDesc.trim(),
              dueDate: form.taskDueDate,
              priority: form.taskPriority,
              status: form.taskStatus,
              listId: Number(form.taskListId),
              labels: form.taskLabelsSelected,
              subtasks: form.subtasksChecklist,
              dependsOnTaskId: form.taskDependsOn,
              isImportant: form.taskIsImportant,
              isUrgent: form.taskIsUrgent,
              recurrence: form.taskRecurrence,
            },
            onSuccess: () => {
              form.setIsModalOpen(false);
              form.resetForm();
            },
          },
        );
      } finally {
        form.setIsSubmitting(false);
      }
    },
    [actions, form],
  );

  const handleTaskClick = useCallback(
    (task: Task) => {
      form.loadTaskIntoForm(task);
    },
    [form],
  );

  const handleKanbanAddTask = useCallback(
    (title: string, status: string) => {
      form.openModalWithTitle(title, status);
    },
    [form],
  );

  const handleCreateTaskFromCommand = useCallback(
    (title: string) => {
      form.openModalWithTitleOnly(title);
    },
    [form],
  );

  const handleQuickAdd = useCallback(
    async (title: string) => {
      if (!title.trim() || form.isSubmitting) return;
      form.setIsSubmitting(true);
      try {
        await actions.quickAdd(title);
      } finally {
        form.setIsSubmitting(false);
      }
    },
    [actions, form],
  );

  // requestDelete + confirmDelete come from useTaskActions now (gated by
  // pendingDeleteId, which is part of useTaskForm). They forward into
  // actions.deleteTask which already implements optimistic update + undo.

  const handleFocusSessionComplete = useCallback(
    async (taskId: number, durationSeconds: number, completedEarly: boolean) => {
      await actions.completeFocusSession(taskId, durationSeconds, completedEarly);
    },
    [actions],
  );

  return {
    // View
    ...view,
    // Settings
    ...settings,
    // Form
    ...form,
    // Data
    ...data,
    // Actions
    handleTaskSubmit,
    handleTaskUpdateDirect: actions.updateTaskDirect,
    handleTaskDuplicate: actions.duplicateTask,
    reorderTasks: actions.reorderTasks,
    requestDelete: actions.requestDelete,
    confirmDelete: actions.confirmDelete,
    handleClearCompleted: actions.clearCompleted,
    handleClearLogs: data.clearLogs,
    handleCreateList: data.createList,
    handleCreateLabel: data.createLabel,
    handleSaveFilter: data.saveFilter,
    handleDeleteFilter: data.deleteFilter,
    handleTaskClick,
    handleKanbanAddTask,
    handleCreateTaskFromCommand,
    handleQuickAdd,
    handleFocusSessionComplete,
  };
}

// Re-export for callers that need the type
export type { ViewName };
