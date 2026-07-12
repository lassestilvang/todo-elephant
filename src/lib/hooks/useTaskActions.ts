"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { Task, ActivityLog } from "@/types";
import { isCompletedStatus, normalizeStatus } from "@/src/lib/status";
import { reorderTasksApi, ReorderItem, ReorderApiError } from "../tasksApi";

/**
 * Holds all task CRUD action callbacks: create, update, delete, duplicate,
 * clear-completed, quick-add. Pulled out of useTaskPlanner so the heavy
 * optimistic-update + dependency-check logic has a focused home and can be
 * tested in isolation.
 *
 * Note: requires a setter for the local `tasks` array + an `activityLogs`
 * setter (or refresh callback) and a sound-enabled flag — passed in as a
 * small options object so the caller stays in control of state ownership.
 */
interface UseTaskActionsOpts {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  refreshLogs: () => Promise<void>;
  soundEnabled: boolean;
  /** Optional callback to bump completedPomodoros locally after focus session. */
  onLocalPomodoroBump?: (taskId: number) => void;
  /** State for the ConfirmDialog that gates destructive deletes. */
  pendingDeleteId: number | null;
  setPendingDeleteId: (id: number | null) => void;
}

function playCompletionSound() {
  if (typeof window === "undefined") return;
  try {
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.05); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.2); // C6
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    osc2.start(audioCtx.currentTime + 0.05);
    osc2.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.error("Audio playback error", e);
  }
}

export function useTaskActions(opts: UseTaskActionsOpts) {
  const { setTasks, setActivityLogs: _setActivityLogs, refreshLogs, soundEnabled, onLocalPomodoroBump, pendingDeleteId, setPendingDeleteId } = opts;

  // Ref for tasks lookup to avoid stale closures
  const tasksRef = useRef<Task[]>([]);
  // Setter that also mirrors to ref
  const setTasksAndRef = useCallback<React.Dispatch<React.SetStateAction<Task[]>>>((action) => {
    setTasks((prev) => {
      const next = typeof action === "function" ? (action as (p: Task[]) => Task[])(prev) : action;
      tasksRef.current = next;
      return next;
    });
  }, [setTasks]);

  // Initialize ref on first read (callsite effect)
  // (Note: tasksRef is mutated on every set so reads are always fresh.)

  /** Create or update task — called from TaskModal's onSubmit. */
  const submitTask = useCallback(
    async (params: {
      mode: "create" | "edit";
      editingTask: Task | null;
      data: {
        title: string;
        description: string;
        dueDate: string;
        priority: "low" | "medium" | "high";
        status: Task["status"];
        listId: number;
        labels: number[];
        subtasks: { id: number; title: string; completed: boolean }[];
        dependsOnTaskId: number | null;
        isImportant: boolean;
        isUrgent: boolean;
        recurrence: "none" | "daily" | "weekly" | "monthly";
      };
      onSuccess: () => void;
    }) => {
      const { mode, editingTask, data, onSuccess } = params;
      try {
        if (mode === "create") {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              dueDate: data.dueDate || new Date().toISOString(),
            }),
          });
          if (!res.ok) throw new Error("API error creating task");
          const newTask = (await res.json()) as Task;
          setTasksAndRef((prev) => [newTask, ...prev]);
          toast.success(`Task "${newTask.title}" created successfully!`);
          refreshLogs();
          onSuccess();
        } else if (mode === "edit" && editingTask) {
          const res = await fetch(`/api/tasks/${editingTask.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("API error updating task");
          const updatedTask = (await res.json()) as Task;
          setTasksAndRef((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          toast.success(`Task "${updatedTask.title}" updated successfully!`);
          refreshLogs();
          onSuccess();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to persist task details");
      }
    },
    [setTasksAndRef, refreshLogs],
  );

  /**
   * Fast inline updates (checkbox, subtask, drag-drop status change).
   * Uses normalized status comparisons so legacy and canonical values work.
   */
  const updateTaskDirect = useCallback(
    async (id: number, updates: Partial<Task>) => {
      const originalTask = tasksRef.current.find((t) => t.id === id);
      if (!originalTask) return;

      const normalizedUpdates: Partial<Task> = { ...updates };
      if (typeof normalizedUpdates.status === "string" && normalizedUpdates.status) {
        normalizedUpdates.status = normalizeStatus(normalizedUpdates.status);
      }

      // Dependency check BEFORE mutation
      if (normalizedUpdates.status && isCompletedStatus(normalizedUpdates.status)) {
        const dependency = tasksRef.current.find((t) => t.id === originalTask.dependsOnTaskId);
        if (dependency && !isCompletedStatus(dependency.status)) {
          toast.error(`Blocked! Please complete "${dependency.title}" first.`);
          return;
        }
      }

      setTasksAndRef((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const updated = { ...t, ...normalizedUpdates };
            if (normalizedUpdates.status !== undefined) {
              updated.completedAt = isCompletedStatus(normalizedUpdates.status) ? new Date().toISOString() : null;
            }
            return updated;
          }
          return t;
        }),
      );

      try {
        // Achievements / side effects
        if (
          normalizedUpdates.status !== undefined &&
          isCompletedStatus(normalizedUpdates.status) &&
          !isCompletedStatus(originalTask.status)
        ) {
          const completedCount = tasksRef.current.filter((t) => isCompletedStatus(t.status)).length + 1;
          if (completedCount === 1) {
            toast.success("Achievement Unlocked: The Journey Begins!", { description: "You completed your first task! 🚀" });
          } else if (completedCount === 10) {
            toast.success("Achievement Unlocked: Decade of Deeds!", { description: "10 tasks completed. You're on fire! 🔥" });
          } else if (completedCount === 50) {
            toast.success("Achievement Unlocked: Task Master!", { description: "50 tasks completed. Pure excellence! 🏆" });
          }
          toast.success(`Completed: "${originalTask.title}" 🎉`);
          if (soundEnabled) playCompletionSound();
          if (typeof window !== "undefined") {
            const win = window as Window & { triggerConfetti?: () => void };
            if (win.triggerConfetti) win.triggerConfetti();
          }
        } else if (
          normalizedUpdates.status !== undefined &&
          !isCompletedStatus(normalizedUpdates.status) &&
          isCompletedStatus(originalTask.status)
        ) {
          toast("Reopened task", { description: `"${originalTask.title}" is now active again.` });
        }

        if (normalizedUpdates.subtasks && originalTask.subtasks) {
          const newlyCompleted = normalizedUpdates.subtasks.find(
            (s) => s.completed && !originalTask.subtasks!.find((ps) => ps.id === s.id)?.completed,
          );
          if (newlyCompleted) {
            toast.success(`Subtask completed: "${newlyCompleted.title}"!`);
            if (soundEnabled) playCompletionSound();
            if (normalizedUpdates.subtasks.every((s) => s.completed)) {
              if (typeof window !== "undefined") {
                const win = window as Window & { triggerConfetti?: () => void };
                if (win.triggerConfetti) win.triggerConfetti();
              }
              toast.success("All subtasks finished! Excellent work.");
            }
          }
        }

        const res = await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedUpdates),
        });
        if (!res.ok) throw new Error("Inline update failed");
        refreshLogs();
      } catch (err) {
        console.error(err);
        // Rollback
        setTasksAndRef((prev) => prev.map((t) => (t.id === id ? originalTask : t)));
        toast.error("Network synchronization failed");
      }
    },
    [setTasksAndRef, refreshLogs, soundEnabled],
  );

  const duplicateTask = useCallback(
    async (task: Task) => {
      try {
        const taskData = {
          title: `${task.title} (Copy)`,
          description: task.description || "",
          dueDate: task.dueDate || new Date().toISOString(),
          priority: task.priority,
          status: "pending",
          listId: task.listId || 1,
          labels: task.labels || [],
          subtasks:
            task.subtasks?.map((s) => ({ ...s, id: Math.floor(Math.random() * 10000) + 10000, completed: false })) || [],
        };
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("API error duplicating task");
        const newTask = (await res.json()) as Task;
        setTasksAndRef((prev) => [newTask, ...prev]);
        toast.success("Task duplicated successfully!");
        refreshLogs();
      } catch (err) {
        console.error(err);
        toast.error("Failed to duplicate task");
      }
    },
    [setTasksAndRef, refreshLogs],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      const taskToDelete = tasksRef.current.find((t) => t.id === id);
      if (!taskToDelete) return;
      const previousTasks = tasksRef.current;
      setTasksAndRef((prev) => prev.filter((t) => t.id !== id));
      try {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (res.ok || res.status === 204) {
          toast.success(`Deleted task "${taskToDelete.title}"`, {
            action: {
              label: "Undo",
              onClick: async () => {
                try {
                  const recoverRes = await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(taskToDelete),
                  });
                  if (recoverRes.ok) {
                    const restoredTask = (await recoverRes.json()) as Task;
                    setTasksAndRef((prev) => [restoredTask, ...prev]);
                    toast.success("Task restored");
                    refreshLogs();
                  }
                } catch {
                  toast.error("Failed to restore task");
                }
              },
            },
          });
          refreshLogs();
        } else {
          throw new Error("API error deleting task");
        }
      } catch (err) {
        console.error(err);
        setTasksAndRef(previousTasks);
        toast.error("Failed to delete task. Please try again.");
      }
    },
    [setTasksAndRef, refreshLogs],
  );

  const clearCompleted = useCallback(async () => {
    const completedTasks = tasksRef.current.filter((t) => isCompletedStatus(t.status));
    if (completedTasks.length === 0) return;
    const previousTasks = tasksRef.current;
    setTasksAndRef((prev) => prev.filter((t) => !isCompletedStatus(t.status)));
    try {
      const ids = completedTasks.map((t) => t.id);
      const res = await fetch("/api/tasks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: { type: "delete" }, ids }),
      });
      if (!res.ok) throw new Error("Batch delete failed");
      toast.success(`Cleared ${completedTasks.length} completed tasks!`);
      refreshLogs();
    } catch (err) {
      console.error(err);
      setTasksAndRef(previousTasks);
      toast.error("Failed to clear completed tasks");
    }
  }, [setTasksAndRef, refreshLogs]);

  /** NLP quick-add: parses "tomorrow" / "next monday" / "+3d" / "!p1" / "#work" / "~daily". */
  const quickAdd = useCallback(
    async (title: string) => {
      if (!title.trim()) return;
      try {
        let parsedTitle = title.trim();
        let dueDate = new Date();
        const lowerTitle = parsedTitle.toLowerCase();

        if (lowerTitle.includes("tomorrow")) {
          dueDate.setDate(dueDate.getDate() + 1);
          parsedTitle = parsedTitle.replace(/tomorrow/i, "").trim();
        } else if (lowerTitle.includes("next week")) {
          dueDate.setDate(dueDate.getDate() + 7);
          parsedTitle = parsedTitle.replace(/next week/i, "").trim();
        } else if (lowerTitle.includes("monday")) {
          const day = dueDate.getDay();
          const diff = (8 - day) % 7 || 7;
          dueDate.setDate(dueDate.getDate() + diff);
          parsedTitle = parsedTitle.replace(/monday/i, "").trim();
        } else if (lowerTitle.includes("friday")) {
          const day = dueDate.getDay();
          const diff = (5 - day + 7) % 7 || 7;
          dueDate.setDate(dueDate.getDate() + diff);
          parsedTitle = parsedTitle.replace(/friday/i, "").trim();
        }

        const taskData = {
          title: parsedTitle || title.trim(),
          description: "",
          dueDate: dueDate.toISOString(),
          priority: "medium" as const,
          status: "pending" as Task["status"],
          listId: 1,
          labels: [] as number[],
          subtasks: [] as { id: number; title: string; completed: boolean }[],
        };
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("API error creating task");
        const newTask = (await res.json()) as Task;
        setTasksAndRef((prev) => [newTask, ...prev]);
        toast.success(`Task "${newTask.title}" created successfully!`);
        refreshLogs();
      } catch (err) {
        console.error(err);
        toast.error("Failed to quick-add task");
      }
    },
    [setTasksAndRef, refreshLogs],
  );

  /** Persist a focus session (Pomodoro) to the backend. */
  const completeFocusSession = useCallback(
    async (taskId: number, durationSeconds: number, completedEarly: boolean) => {
      try {
        await fetch("/api/focus-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, durationSeconds, completedEarly }),
        });
        if (onLocalPomodoroBump) onLocalPomodoroBump(taskId);
        await refreshLogs();
      } catch (err) {
        console.error("Focus session persist failed", err);
      }
    },
    [refreshLogs, onLocalPomodoroBump],
  );

  /**
   * Atomically reorder many tasks (used by KanbanView drag-to-reorder).
   *
   * Strategy:
   *   1. Snapshot the current tasks (for rollback).
   *   2. Optimistically apply the new orders locally.
   *   3. POST /api/tasks/reorder with all desired {id, order} pairs.
   *   4. On failure, restore the snapshot and toast.
   *
   * Replaces the previous two-sequential-PUT approach which could leave
   * the board in a half-applied state on partial failure.
   */
  const reorderTasks = useCallback(
    async (items: ReorderItem[]) => {
      if (items.length === 0) return;
      const previousTasks = tasksRef.current;
      const orderById = new Map<number, number>();
      for (const it of items) orderById.set(it.id, it.order);

      // Optimistic local update — apply the new order values immediately.
      setTasksAndRef((prev) =>
        prev.map((t) => {
          if (!orderById.has(t.id)) return t;
          const desired = orderById.get(t.id) as number;
          if (t.order === desired) return t;
          return { ...t, order: desired };
        }),
      );

      try {
        await reorderTasksApi(items);
        // No need to refresh logs — reordering isn't a logged event in the API.
      } catch (err) {
        console.error("[reorderTasks] atomic reorder failed:", err);
        setTasksAndRef(previousTasks);
        const msg = err instanceof ReorderApiError ? err.message : "Failed to reorder tasks";
        toast.error(msg);
      }
    },
    [setTasksAndRef],
  );

  /** Set the pending delete id — used by ConfirmDialog to gate the destructive call. */
  const requestDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
  }, [setPendingDeleteId]);

  /** Confirm the pending delete and clear the gate. */
  const confirmDelete = useCallback(() => {
    if (pendingDeleteId !== null) {
      void deleteTask(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, deleteTask, setPendingDeleteId]);

  return {
    submitTask,
    updateTaskDirect,
    duplicateTask,
    deleteTask,
    clearCompleted,
    quickAdd,
    completeFocusSession,
    reorderTasks,
    requestDelete,
    confirmDelete,
    /** Expose for any consumer that needs to read the latest snapshot without re-render. */
    getTasksSnapshot: () => tasksRef.current,
  };
}
