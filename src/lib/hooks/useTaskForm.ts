"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types";
import { toast } from "sonner";

/**
 * Encapsulates the create/edit task modal form state, including subtask list
 * management and the magic breakdown heuristic.
 *
 * Why a separate hook: the form state alone is ~15 useState hooks. Keeping it
 * out of the giant useTaskPlanner lets the form evolve independently (e.g.
 * future markdown toolbar) without churn on unrelated state.
 */
export function useTaskForm() {
  // Modal lifecycle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditingTask, setCurrentEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("pending");
  const [taskListId, setTaskListId] = useState(1);
  const [taskLabelsSelected, setTaskLabelsSelected] = useState<number[]>([]);
  const [taskDependsOn, setTaskDependsOn] = useState<number | null>(null);
  const [taskIsImportant, setTaskIsImportant] = useState(false);
  const [taskIsUrgent, setTaskIsUrgent] = useState(false);
  const [taskRecurrence, setTaskRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");

  // Subtask checklist (form-local; persisted as part of taskData on submit)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtasksChecklist, setSubtasksChecklist] = useState<{ id: number; title: string; completed: boolean }[]>([]);

  // Pending delete id (gated by ConfirmDialog)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const resetForm = useCallback(() => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskDueDate("");
    setTaskPriority("medium");
    setTaskStatus("pending");
    setTaskListId(1);
    setTaskLabelsSelected([]);
    setTaskDependsOn(null);
    setTaskIsImportant(false);
    setTaskIsUrgent(false);
    setTaskRecurrence("none");
    setSubtasksChecklist([]);
    setNewSubtaskTitle("");
    setCurrentEditingTask(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  }, [resetForm]);

  /** Hydrate the form from an existing task (used by handleTaskClick). */
  const loadTaskIntoForm = useCallback((task: Task) => {
    setCurrentEditingTask(task);
    setModalMode("edit");
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setTaskPriority(task.priority || "medium");
    setTaskStatus(task.status || "pending");
    setTaskListId(task.listId || 1);
    setTaskLabelsSelected(task.labels || []);
    setTaskDependsOn(task.dependsOnTaskId || null);
    setTaskIsImportant(task.isImportant || false);
    setTaskIsUrgent(task.isUrgent || false);
    setTaskRecurrence(task.recurrence || "none");
    setSubtasksChecklist(task.subtasks || []);
    setIsModalOpen(true);
  }, []);

  /** Kanban quick-add: opens modal with prefilled title and status. */
  const openModalWithTitle = useCallback((title: string, status: string) => {
    setTaskTitle(title);
    setTaskStatus(status as Task["status"]);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  const openModalWithTitleOnly = useCallback((title: string) => {
    setTaskTitle(title);
    setModalMode("create");
    setIsModalOpen(true);
  }, []);

  // Subtask inline ops
  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return;
    const newId = subtasksChecklist.length > 0 ? Math.max(...subtasksChecklist.map((s) => s.id)) + 1 : 101;
    setSubtasksChecklist((prev) => [...prev, { id: newId, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, subtasksChecklist]);

  const handleRemoveSubtask = useCallback((id: number) => {
    setSubtasksChecklist((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleToggleSubtask = useCallback((id: number) => {
    setSubtasksChecklist((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  }, []);

  const handleMagicBreakdown = useCallback(() => {
    if (!taskTitle.trim()) {
      toast.error("Please enter a task title first!");
      return;
    }

    const title = taskTitle.toLowerCase();
    let suggested: string[] = [];

    if (title.includes("groceries") || title.includes("shopping")) {
      suggested = ["Make a list", "Grab reusable bags", "Go to store", "Unpack groceries"];
    } else if (title.includes("meeting") || title.includes("call")) {
      suggested = ["Prepare agenda", "Send invites", "Take notes", "Send follow-up email"];
    } else if (title.includes("code") || title.includes("dev") || title.includes("build") || title.includes("fix")) {
      suggested = ["Research solution", "Write initial code", "Run tests", "Submit PR"];
    } else if (title.includes("clean") || title.includes("house") || title.includes("room")) {
      suggested = ["Tidy up clutter", "Dust surfaces", "Vacuum floors", "Take out trash"];
    } else if (title.includes("workout") || title.includes("exercise") || title.includes("gym")) {
      suggested = ["Pack gym bag", "Warm up", "Main workout", "Cool down & stretch"];
    } else if (title.includes("trip") || title.includes("travel") || title.includes("vacation")) {
      suggested = ["Book flights/train", "Arrange accommodation", "Pack bags", "Set out-of-office"];
    } else {
      suggested = ["Identify first step", "Gather necessary resources", "Execute core task", "Final review"];
    }

    const newSubtasks = suggested.map((s, index) => ({
      id: Date.now() + index,
      title: s,
      completed: false,
    }));

    setSubtasksChecklist((prev) => [...prev, ...newSubtasks]);
    toast.success("Magic! Subtasks generated based on your title.");
  }, [taskTitle]);

  return {
    // Modal
    isModalOpen,
    setIsModalOpen,
    modalMode,
    setModalMode,
    currentEditingTask,
    setCurrentEditingTask,
    isSubmitting,
    setIsSubmitting,
    // Form fields
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
    taskDependsOn,
    setTaskDependsOn,
    taskIsImportant,
    setTaskIsImportant,
    taskIsUrgent,
    setTaskIsUrgent,
    taskRecurrence,
    setTaskRecurrence,
    // Subtasks
    newSubtaskTitle,
    setNewSubtaskTitle,
    subtasksChecklist,
    setSubtasksChecklist,
    // Delete gate (ConfirmDialog)
    pendingDeleteId,
    setPendingDeleteId,
    // Lifecycle
    resetForm,
    openCreateModal,
    loadTaskIntoForm,
    openModalWithTitle,
    openModalWithTitleOnly,
    handleAddSubtask,
    handleRemoveSubtask,
    handleToggleSubtask,
    handleMagicBreakdown,
  };
}
