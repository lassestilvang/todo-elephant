"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Task, List, Label, ActivityLog } from "@/types";

export function useTaskPlanner() {
  // App views: dashboard, kanban, list
  const [currentView, setView] = useState<"dashboard" | "kanban" | "list">("dashboard");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);

  // States loaded from backend
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Task Creation & Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditingTask, setCurrentEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("pending");
  const [taskListId, setTaskListId] = useState(1);
  const [taskLabelsSelected, setTaskLabelsSelected] = useState<number[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtasksChecklist, setSubtasksChecklist] = useState<{ id: number; title: string; completed: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accent-color") || "#3b82f6";
    }
    return "#3b82f6";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Ref for tasks lookup to avoid stale closures
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Fetch initial data in parallel
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);

        const [tRes, lRes, tagRes, logRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/lists"),
          fetch("/api/labels"),
          fetch("/api/activity-logs"),
        ]);

        const [tData, lData, tagData, logData] = await Promise.all([
          tRes.ok ? tRes.json() : [],
          lRes.ok ? lRes.json() : [],
          tagRes.ok ? tagRes.json() : [],
          logRes.ok ? logRes.json() : [],
        ]);

        setTasks(tData);
        setLists(lData);
        setLabels(tagData);
        setActivityLogs(logData);
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to load initial planner data");
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, []);

  // Refresh logs helper
  const refreshLogs = useCallback(async () => {
    try {
      const logRes = await fetch("/api/activity-logs");
      if (logRes.ok) {
        const logData = await logRes.json();
        setActivityLogs(logData);
      }
    } catch (err) {
      console.error("Log refresh error:", err);
    }
  }, []);

  const resetForm = useCallback(() => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskDueDate("");
    setTaskPriority("medium");
    setTaskStatus("pending");
    setTaskListId(1);
    setTaskLabelsSelected([]);
    setSubtasksChecklist([]);
    setNewSubtaskTitle("");
    setCurrentEditingTask(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  }, [resetForm]);

  const transitionView = useCallback((v: "dashboard" | "kanban" | "list") => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setView(v);
      });
    } else {
      setView(v);
    }
  }, []);

  // Create or Update task handler
  const handleTaskSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const taskData = {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          dueDate: taskDueDate || new Date().toISOString(),
          priority: taskPriority,
          status: taskStatus,
          listId: Number(taskListId),
          labels: taskLabelsSelected,
          subtasks: subtasksChecklist
        };

        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        });

        if (res.ok) {
          const newTask = await res.json();
          setTasks(prev => [newTask, ...prev]);
          toast.success(`Task "${newTask.title}" created successfully!`);
          refreshLogs();
        } else {
          throw new Error("API error creating task");
        }

      } else if (modalMode === "edit" && currentEditingTask) {
        const taskData = {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          dueDate: taskDueDate,
          priority: taskPriority,
          status: taskStatus,
          listId: Number(taskListId),
          labels: taskLabelsSelected,
          subtasks: subtasksChecklist
        };

        const res = await fetch(`/api/tasks/${currentEditingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        });

        if (res.ok) {
          const updatedTask = await res.json();
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
          toast.success(`Task "${updatedTask.title}" updated successfully!`);
          refreshLogs();
        } else {
          throw new Error("API error updating task");
        }
      }

      setIsModalOpen(false);
      resetForm();

    } catch (err) {
      console.error(err);
      toast.error("Failed to persist task details");
    } finally {
      setIsSubmitting(false);
    }
  }, [taskTitle, taskDesc, taskDueDate, taskPriority, taskStatus, taskListId, taskLabelsSelected, subtasksChecklist, modalMode, currentEditingTask, refreshLogs, resetForm, isSubmitting]);

  // Direct fast inline updates (e.g. checkbox status, subtask checked state)
  const handleTaskUpdateDirect = useCallback(async (id: number, updates: Partial<Task>) => {
    try {
      const originalTask = tasksRef.current.find(t => t.id === id);

      if (originalTask) {
        if (updates.status && (updates.status === "completed" || updates.status === "done")) {
          if (originalTask.status !== "completed" && originalTask.status !== "done") {
            toast.success(`Completed: "${originalTask.title}" 🎉`);
          }
        } else if (updates.status) {
          if (originalTask.status === "completed" || originalTask.status === "done") {
            toast("Reopened task", { description: `"${originalTask.title}" is now active again.` });
          }
        }

        if (updates.subtasks && originalTask.subtasks) {
          const newlyCompleted = updates.subtasks.find(
            s => s.completed && !originalTask.subtasks!.find(ps => ps.id === s.id)?.completed
          );
          if (newlyCompleted) {
            toast.success(`Subtask completed: "${newlyCompleted.title}"!`);
          }
        }
      }

      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.status && (updates.status === "completed" || updates.status === "done")) {
            updated.completedAt = new Date().toISOString();
          } else if (updates.status) {
            updated.completedAt = null;
          }
          return updated;
        }
        return t;
      }));

      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        throw new Error("Inline update failed");
      }
      refreshLogs();
    } catch (err) {
      console.error(err);
      toast.error("Network synchronization failed");
    }
  }, [refreshLogs]);

  // Task deletion handler
  const handleTaskDelete = useCallback(async (id: number) => {
    const taskToDelete = tasksRef.current.find(t => t.id === id);
    if (!taskToDelete) return;

    // Optimistic Update
    const previousTasks = tasksRef.current;
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE"
      });

      if (res.ok || res.status === 204) {
        toast.success(`Deleted task "${taskToDelete.title}"`, {
          action: {
            label: "Undo",
            onClick: async () => {
              // Simple undo: re-create the task
              try {
                const recoverRes = await fetch("/api/tasks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(taskToDelete)
                });
                if (recoverRes.ok) {
                  const restoredTask = await recoverRes.json();
                  setTasks(prev => [restoredTask, ...prev]);
                  toast.success("Task restored");
                  refreshLogs();
                }
              } catch {
                toast.error("Failed to restore task");
              }
            }
          }
        });
        refreshLogs();
      } else {
        throw new Error("API error deleting task");
      }
    } catch (err) {
      console.error(err);
      setTasks(previousTasks); // Rollback
      toast.error("Failed to delete task. Please try again.");
    }
  }, [refreshLogs]);

  const requestDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId !== null) {
      handleTaskDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, handleTaskDelete]);

  // Add folder helper
  const handleCreateList = useCallback(async (name: string, color: string) => {
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color })
      });
      if (res.ok) {
        const newList = await res.json();
        setLists(prev => [...prev, newList]);
        toast.success(`Created Folder "${newList.name}"`);
        refreshLogs();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create folder category");
    }
  }, [refreshLogs]);

  // Add Label helper
  const handleCreateLabel = useCallback(async (name: string, color: string) => {
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color })
      });
      if (res.ok) {
        const newLabel = await res.json();
        setLabels(prev => [...prev, newLabel]);
        toast.success(`Added Label "${newLabel.name}"`);
        refreshLogs();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create label");
    }
  }, [refreshLogs]);

  const handleTaskClick = useCallback((task: Task) => {
    setCurrentEditingTask(task);
    setModalMode("edit");
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
    setTaskPriority(task.priority || "medium");
    setTaskStatus(task.status || "pending");
    setTaskListId(task.listId || 1);
    setTaskLabelsSelected(task.labels || []);
    setSubtasksChecklist(task.subtasks || []);
    setIsModalOpen(true);
  }, []);

  const handleKanbanAddTask = useCallback((title: string, status: string) => {
    setTaskTitle(title);
    setTaskStatus(status as Task["status"]);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleCreateTaskFromCommand = useCallback((title: string) => {
    setTaskTitle(title);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const handleQuickAdd = useCallback(async (title: string) => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const taskData = {
        title: title.trim(),
        description: "",
        dueDate: new Date().toISOString(),
        priority: "medium",
        status: "pending",
        listId: 1, // Default list
        labels: [],
        subtasks: []
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [newTask, ...prev]);
        toast.success(`Task "${newTask.title}" created successfully!`);
        refreshLogs();
      } else {
        throw new Error("API error creating task");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to quick-add task");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, refreshLogs]);

  // Add subtask inline helper
  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return;
    const newId = subtasksChecklist.length > 0 ? Math.max(...subtasksChecklist.map(s => s.id)) + 1 : 101;
    setSubtasksChecklist(prev => [...prev, { id: newId, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, subtasksChecklist]);

  const handleRemoveSubtask = useCallback((id: number) => {
    setSubtasksChecklist(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    currentView,
    setView,
    selectedListId,
    setSelectedListId,
    selectedLabelId,
    setSelectedLabelId,
    tasks,
    lists,
    labels,
    activityLogs,
    loading,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    currentEditingTask,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskDueDate,
    setTaskDueDate,
    taskPriority,
    setTaskPriority,
    taskStatus,
    setTaskStatus,
    taskListId,
    setTaskListId,
    taskLabelsSelected,
    setTaskLabelsSelected,
    newSubtaskTitle,
    setNewSubtaskTitle,
    subtasksChecklist,
    isSubmitting,
    pendingDeleteId,
    setPendingDeleteId,
    isSidebarOpen,
    setIsSidebarOpen,
    accentColor,
    setAccentColor,
    isSettingsOpen,
    setIsSettingsOpen,
    openCreateModal,
    handleTaskSubmit,
    handleTaskUpdateDirect,
    requestDelete,
    confirmDelete,
    handleCreateList,
    handleCreateLabel,
    handleTaskClick,
    handleKanbanAddTask,
    handleCreateTaskFromCommand,
    handleQuickAdd,
    handleAddSubtask,
    handleRemoveSubtask,
    transitionView
  };
}
