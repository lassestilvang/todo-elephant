import React, { memo, useEffect, useRef, useState } from "react";
import { useAIPrioritization } from "@/src/lib/hooks/useAIPrioritization";
import { Task, List, Label } from "@/types";
import { MarkdownEditor } from "@/src/components/MarkdownEditor";
import {
  calculateTimeEstimate,
  formatTimeEstimate,
} from "@/src/lib/timeEstimate";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePriority,
  validateStatus,
  validateDate,
  validateTaskForm,
  isValid,
} from "@/src/lib/validation";
import { useAchievement } from "@/src/lib/hooks/useAchievementSystem";
import { useOffline } from "@/src/lib/offline";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  isSubmitting?: boolean;
  taskTitle: string;
  setTaskTitle: (v: string) => void;
  taskDesc: string;
  setTaskDesc: (v: string) => void;
  taskDueDate: string;
  setTaskDueDate: (v: string) => void;
  taskPriority:
    | "low"
    | "medium"
    | "high"
    | undefined;
  setTaskPriority: (v: "low" | "medium" | "high") => void;
  taskStatus: string;
  setTaskStatus: (v: string) => void;
  taskListId: number;
  setTaskListId: (v: number) => void;
  taskLabelsSelected: number[];
  setTaskLabelsSelected: React.Sispatch<React.SetStateAction<number[]>>;
  taskDependsOn?: number | null;
  setTaskDependsOn?: (v: number | null) => void;
  taskIsImportant?: boolean;
  setTaskIsImportant?: (v: boolean) => void;
  taskIsUrgent?: boolean;
  setTaskIsUrgent?: (v: boolean) => void;
  taskRecurrence?: "none" | "daily" | "weekly" | "monthly";
  setTaskRecurrence?: (v: "none" | "daily" | "weekly" | "monthly") => void;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (v: string) => void;
  subtasksChecklist: { id: number; title: string; completed: boolean }[];
  onSubmit: (e: React.FormEvent) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (id: number) => void;
  onToggleSubtask?: (id: number) => void;
  onMagicBreakdown?: () => void;
  onSaveAsTemplate?: (task: Task) => void;
  isTemplate?: boolean;
  lists: List[];
  labels: Label[];
  tasks?: Task[];
  focusSessions?: {
    taskId: number;
    durationSeconds: number;
    completedEarly: boolean;
    startedAt: string;
  }[];
}