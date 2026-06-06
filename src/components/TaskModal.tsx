"use client";

import React, { memo, useEffect, useRef } from "react";
import { Tag, X, ListTodo, Sparkles } from "lucide-react";
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
  taskDependsOn?: number | null;
  setTaskDependsOn?: (v: number | null) => void;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (v: string) => void;
  subtasksChecklist: { id: number; title: string; completed: boolean }[];
  onSubmit: (e: React.FormEvent) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (id: number) => void;
  onToggleSubtask?: (id: number) => void;
  onMagicBreakdown?: () => void;
  lists: List[];
  labels: Label[];
  tasks?: Task[];
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
  taskDependsOn,
  setTaskDependsOn,
  newSubtaskTitle,
  setNewSubtaskTitle,
  subtasksChecklist,
  onSubmit,
  onAddSubtask,
  onRemoveSubtask,
  onToggleSubtask,
  onMagicBreakdown,
  lists,
  labels,
  tasks = [],
}: TaskModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Synchronize close state when native cancel happens (e.g., Esc key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  // Backdrop click fallback for light dismiss
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="task-modal-title"
      className="w-full max-w-lg rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden p-0 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm max-h-[90vh] focus:outline-none"
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 id="task-modal-title" className="font-bold text-sm leading-tight flex items-center gap-2">
          <ListTodo size={16} className="text-accent" />
          <span>{mode === "create" ? "Create New Task" : "Edit Planner Task"}</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-foreground hover:bg-muted/20 p-1.5 rounded-xl transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Title Field */}
        <div className="space-y-1.5">
          <label htmlFor="task-title" className="text-xs font-bold text-muted uppercase">Task Title</label>
          <input
            id="task-title"
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
          <label htmlFor="task-desc" className="text-xs font-bold text-muted uppercase">Description</label>
          <textarea
            id="task-desc"
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
            <label htmlFor="task-due-date" className="text-[10px] font-black text-muted uppercase tracking-widest">Due Date</label>
            <input
              id="task-due-date"
              type="date"
              value={taskDueDate}
              onChange={e => setTaskDueDate(e.target.value)}
              className="w-full text-sm bg-muted/10 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Priority</label>
            <div className="flex p-1 bg-muted/10 rounded-xl border border-border/60">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    taskPriority === p
                      ? p === "high" ? "bg-red-500 text-white shadow-sm" :
                        p === "medium" ? "bg-amber-500 text-white shadow-sm" :
                        "bg-blue-500 text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Folder & Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="task-list" className="text-[10px] font-black text-muted uppercase tracking-widest">List Folder</label>
            <select
              id="task-list"
              value={taskListId}
              onChange={e => setTaskListId(Number(e.target.value))}
              className="w-full text-sm bg-muted/10 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer transition-all"
            >
              {lists.map(list => (
                <option key={list.id} value={list.id} className="bg-background text-foreground">
                  {list.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="task-status" className="text-[10px] font-black text-muted uppercase tracking-widest">Workflow Status</label>
            <select
              id="task-status"
              value={taskStatus}
              onChange={e => setTaskStatus(e.target.value as Task["status"])}
              className="w-full text-sm bg-muted/10 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer transition-all"
            >
              <option value="pending" className="bg-background text-foreground">Todo</option>
              <option value="in-progress" className="bg-background text-foreground">In Progress</option>
              <option value="completed" className="bg-background text-foreground">Completed</option>
              <option value="archived" className="bg-background text-foreground">Archived</option>
            </select>
          </div>
        </div>

        {/* Labels Multi-Select Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted uppercase block tracking-widest">Select Labels</label>
          <div className="flex flex-wrap gap-1.5 p-3 bg-muted/5 rounded-2xl border border-border/40">
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
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-accent text-white shadow-sm scale-105"
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

        {/* Task Dependency Section */}
        {setTaskDependsOn && (
          <div className="space-y-1.5">
            <label htmlFor="task-dependency" className="text-[10px] font-black text-muted uppercase tracking-widest">Blocks completion of? (Dependency)</label>
            <select
              id="task-dependency"
              value={taskDependsOn || ""}
              onChange={e => setTaskDependsOn(e.target.value ? Number(e.target.value) : null)}
              className="w-full text-sm bg-muted/10 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer transition-all"
            >
              <option value="" className="bg-background text-muted italic">No dependency</option>
              {tasks.filter(t => t.id !== (mode === "edit" ? tasks.find(et => et.title === taskTitle)?.id : -1)).map(t => (
                <option key={t.id} value={t.id} className="bg-background text-foreground">
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nested Checklist / Subtasks Form */}
        <div className="space-y-3 pt-3 border-t border-border/40">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted uppercase">Checklist Subtasks</label>
            {onMagicBreakdown && (
              <button
                type="button"
                onClick={onMagicBreakdown}
                className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-wider"
              >
                <Sparkles size={12} />
                <span>Magic Breakdown</span>
              </button>
            )}
          </div>

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
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 cursor-pointer"
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
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {onToggleSubtask && (
                    <button
                      type="button"
                      onClick={() => onToggleSubtask(sub.id)}
                      aria-label={sub.completed ? "Mark as incomplete" : "Mark as complete"}
                      aria-checked={sub.completed}
                      role="checkbox"
                      className="p-1 -m-1 rounded"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                        sub.completed 
                          ? "bg-accent border-accent text-white" 
                          : "border-border hover:border-accent"
                      }`}>
                        {sub.completed && <span className="w-1 h-1 bg-white rounded-full" />}
                      </span>
                    </button>
                  )}
                  <span className={`font-medium truncate ${sub.completed ? "line-through text-muted" : "text-foreground"}`}>
                    {sub.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSubtask(sub.id)}
                  className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors cursor-pointer shrink-0"
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
            className="text-sm font-semibold text-muted hover:text-foreground px-4 py-2 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/95 shadow-md hover-lift glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none cursor-pointer"
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
    </dialog>
  );
}

export default memo(TaskModal);
