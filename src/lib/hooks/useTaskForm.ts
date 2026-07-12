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
    const description = taskDesc.toLowerCase();
    let suggested: string[] = [];

    // Enhanced pattern matching with more categories
    if (title.includes("groceries") || title.includes("shopping") || title.includes("errands")) {
      suggested = ["Make a list of items needed", "Grab reusable bags", "Go to store", "Unpack groceries", "Store items properly"];
    } else if (title.includes("meeting") || title.includes("call") || title.includes("sync")) {
      suggested = ["Prepare agenda", "Review previous notes", "Send calendar invites", "Take meeting notes", "Assign action items", "Send follow-up summary"];
    } else if (title.includes("code") || title.includes("dev") || title.includes("build") || title.includes("fix") || title.includes("bug")) {
      suggested = ["Reproduce the issue", "Find root cause", "Implement fix", "Write tests", "Run tests locally", "Submit pull request", "Deploy to staging"];
    } else if (title.includes("clean") || title.includes("house") || title.includes("room") || title.includes("organize")) {
      suggested = ["Clear clutter from surfaces", "Dust & wipe down", "Vacuum/sweep floors", "Take out trash", "Final walkthrough"];
    } else if (title.includes("workout") || title.includes("exercise") || title.includes("gym") || title.includes("run")) {
      suggested = ["Pack gym bag", "Warm up (5-10 min)", "Main workout set", "Cool down & stretch", "Log workout"];
    } else if (title.includes("trip") || title.includes("travel") || title.includes("vacation") || title.includes("flight")) {
      suggested = ["Book flights/train tickets", "Arrange accommodation", "Check passport/visa requirements", "Pack bags", "Set out-of-office", "Download offline maps"];
    } else if (title.includes("learn") || title.includes("study") || title.includes("read") || title.includes("course")) {
      suggested = ["Set learning goals", "Gather study materials", "Take notes while learning", "Practice examples", "Review key concepts", "Take practice quiz"];
    } else if (title.includes("write") || title.includes("blog") || title.includes("article")) {
      suggested = ["Outline main points", "Write first draft", "Take a break", "Edit and refine", "Add visuals/examples", "Publish and share"];
    } else if (title.includes("design") || title.includes("ui") || title.includes("ux")) {
      suggested = ["Research inspiration", "Sketch wireframes", "Get feedback", "Create high-fidelity mockup", "Prepare handoff specs"];
    } else if (title.includes("plan") || title.includes("strateg")) {
      suggested = ["Define objectives", "Identify constraints", "List available resources", "Create timeline", "Assign responsibilities", "Set success metrics"];
    } else {
      // Intelligent fallback based on word count - break into smaller chunks
      const words = taskTitle.trim().split(/\s+/);
      const actionWord = words.find(w => /^(create|build|make|design|write|implement|prepare|research|analyze|review|update|fix|plan)$/i.test(w));

      if (actionWord) {
        suggested = [
          `Plan the ${actionWord} approach`,
          `Gather necessary resources for ${actionWord}`,
          `Execute the core ${actionWord} work`,
          `Review and refine the ${actionWord} output`,
          `Document or share the ${actionWord} results`
        ];
      } else {
        suggested = ["Identify first step", "Gather necessary resources", "Execute core task", "Review and adjust", "Complete and verify"];
      }
    }

    const newSubtasks = suggested.map((s, index) => ({
      id: Date.now() + index,
      title: s,
      completed: false,
    }));

    setSubtasksChecklist((prev) => [...prev, ...newSubtasks]);
    toast.success(`AI Breakdown: Generated ${newSubtasks.length} actionable steps`, {
      description: "Adjust subtasks as needed before saving.",
    });
  }, [taskTitle, taskDesc]);

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
