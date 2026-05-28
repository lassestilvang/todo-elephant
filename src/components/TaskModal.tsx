"use client";

import React, { memo } from "react";
import { Tag, X, ListTodo } from "lucide-react";
import { Task, List, Label } from "@/types";

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
  taskPriority: "low" | "medium" | "high";
  setTaskPriority: (v: "low" | "medium" | "high") => void;
  taskStatus: Task["status"];
  setTaskStatus: (v: Task["status"]) => void;
  taskListId: number;
  setTaskListId: (v: number) => void;
  taskLabelsSelected: number[];
  setTaskLabelsSelected: React.Dispatch<React.SetStateAction<number[]>>;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (v: string) => void;
  subtasksChecklist: { id: number; title: string; completed: boolean }[];
  onSubmit: (e: React.FormEvent) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (id: number) => void;
  lists: List[];
  labels: Label[];
}

function TaskModal({
  isOpen,
  onClose,
  mode,
  isSubmitting = false,
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
  onSubmit,
  onAddSubtask,
  onRemoveSubtask,
  lists,
  labels,
}: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
            <ListTodo size={16} className="text-accent" />
            <span>{mode === "create" ? "Create New Task" : "Edit Planner Task"}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground hover:bg-muted/20 p-1.5 rounded-xl transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Description</label>
            <textarea
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder="Task details and instructions..."
              rows={2}
              className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Due Date & Priority Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase">Due Date</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase">Priority</label>
              <select
                value={taskPriority}
                onChange={e => setTaskPriority(e.target.value as any)}
                className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Category Folder & Status Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase">List Folder</label>
              <select
                value={taskListId}
                onChange={e => setTaskListId(Number(e.target.value))}
                className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
              >
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase">Workflow Status</label>
              <select
                value={taskStatus}
                onChange={e => setTaskStatus(e.target.value as any)}
                className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="pending">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Labels Multi-Select Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase block">Select Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map(label => {
                const isSelected = taskLabelsSelected.includes(label.id);
                return (
                  <button
                    type="button"
                    key={label.id}
                    onClick={() => {
                      if (isSelected) {
                        setTaskLabelsSelected(prev => prev.filter(id => id !== label.id));
                      } else {
                        setTaskLabelsSelected(prev => [...prev, label.id]);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 ${
                      isSelected
                        ? "bg-accent text-white shadow-sm font-semibold scale-105"
                        : "bg-muted/15 text-muted hover:bg-muted/30 hover:text-foreground"
                    }`}
                  >
                    <Tag size={10} className="shrink-0" style={{ color: label.color }} />
                    <span>{label.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nested Checklist / Subtasks Form */}
          <div className="space-y-3 pt-3 border-t border-border/40">
            <label className="text-xs font-bold text-muted uppercase">Checklist Subtasks</label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask checklist..."
                className="w-full text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddSubtask();
                  }
                }}
              />
              <button
                type="button"
                onClick={onAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5">
              {subtasksChecklist.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 bg-muted/10 p-2 rounded-xl border border-border/40 text-sm"
                >
                  <span className="font-medium text-foreground truncate">{sub.title}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSubtask(sub.id)}
                    className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-muted hover:text-foreground px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/95 shadow-md hover-lift glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                mode === "create" ? "Add Task" : "Save Changes"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default memo(TaskModal);
