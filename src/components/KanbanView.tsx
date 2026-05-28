"use client";

import React, { useState } from "react";
import { 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  Calendar, 
  CheckSquare, 
  Tag, 
  AlertCircle,
  Archive,
  Trash2
} from "lucide-react";
import { Task, List, Label } from "@/types";

interface KanbanViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (title: string, status: string) => void;
}

function KanbanView({
  tasks,
  lists,
  labels,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick,
  onAddTask
}: KanbanViewProps) {
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const columns = [
    { id: "pending", title: "📥 Todo", border: "border-t-blue-500", bg: "bg-blue-500/5", text: "text-blue-500" },
    { id: "in-progress", title: "⚡ In Progress", border: "border-t-amber-500", bg: "bg-amber-500/5", text: "text-amber-500" },
    { id: "completed", title: "✨ Completed", border: "border-t-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-500" },
    { id: "archived", title: "🗄️ Archived", border: "border-t-slate-500", bg: "bg-slate-500/5", text: "text-slate-500" }
  ];

  // Helper to resolve task status compatibility
  const getTasksByStatus = (statusId: string) => {
    return tasks.filter(t => {
      const s = t.status.toLowerCase();
      if (statusId === "pending") return s === "pending" || s === "todo";
      if (statusId === "in-progress") return s === "in-progress" || s === "in_progress";
      if (statusId === "completed") return s === "completed" || s === "done";
      if (statusId === "archived") return s === "archived";
      return false;
    });
  };

  const handleQuickAdd = (status: string) => {
    if (!quickTitle.trim()) return;
    onAddTask(quickTitle.trim(), status);
    setQuickTitle("");
    setAddingInColumn(null);
  };

  const moveStatus = (id: number, currentStatus: string, direction: "next" | "prev") => {
    const statusFlow = ["pending", "in-progress", "completed", "archived"];
    let currIndex = statusFlow.indexOf(currentStatus);
    
    // Fallback status mappings
    if (currIndex === -1) {
      if (currentStatus === "todo") currIndex = 0;
      else if (currentStatus === "in_progress") currIndex = 1;
      else if (currentStatus === "done") currIndex = 2;
    }

    if (direction === "next" && currIndex < statusFlow.length - 1) {
      onTaskUpdate(id, { status: statusFlow[currIndex + 1] as any });
    } else if (direction === "prev" && currIndex > 0) {
      onTaskUpdate(id, { status: statusFlow[currIndex - 1] as any });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      
      {/* Kanban Header */}
      <div className="px-8 pt-8 pb-4 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kanban Board</h2>
          <p className="text-sm text-muted">Visualize task statuses, drag workflows, and complete subtasks dynamically.</p>
        </div>
      </div>

      {/* Columns Workspace Container */}
      <div className="flex-1 overflow-x-auto px-8 pb-8 flex items-start gap-6 select-none">
        {columns.map(col => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div 
              key={col.id} 
              className={`w-80 shrink-0 max-h-full flex flex-col rounded-2xl border border-border bg-card/25 backdrop-blur-md glass-panel ${col.bg} overflow-hidden`}
            >
              {/* Column Top Bar */}
              <div className={`px-4 py-3.5 border-b border-border border-t-4 ${col.border} flex items-center justify-between`}>
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{col.title}</span>
                  <span className="text-[11px] font-bold bg-muted/20 px-2 py-0.5 rounded-full shrink-0 opacity-60">
                    {colTasks.length}
                  </span>
                </span>
                <button 
                  onClick={() => setAddingInColumn(addingInColumn === col.id ? null : col.id)}
                  className="text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Quick Add Form inside Column */}
              {addingInColumn === col.id && (
                <div className="p-3 border-b border-border/40 space-y-2 bg-muted/5 animate-fade-in">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    placeholder="Enter task name..."
                    autoFocus
                    className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent"
                    onKeyDown={e => {
                      if (e.key === "Enter") handleQuickAdd(col.id);
                    }}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setAddingInColumn(null)}
                      className="text-[11px] font-semibold text-muted hover:text-foreground px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickAdd(col.id)}
                      className="text-[11px] font-semibold bg-accent text-white hover:bg-accent/95 px-2.5 py-1 rounded glow-primary"
                    >
                      Add Card
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted/60 select-none">
                    Empty Column
                  </div>
                ) : (
                  colTasks.map(task => {
                    const list = lists.find(l => l.id === task.listId);
                    
                    // Checklist calculations
                    const subCount = task.subtasks?.length || 0;
                    const subCompleted = task.subtasks?.filter(s => s.completed).length || 0;
                    const subPercent = subCount > 0 ? Math.round((subCompleted / subCount) * 100) : 0;

                    // Priority color mappings
                    const priorityPill = {
                      high: "bg-red-500/10 text-red-500 border-red-500/20",
                      medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                      low: "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }[task.priority || "low"];

                    return (
                      <div 
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="p-3.5 rounded-xl border border-border/80 bg-card hover-lift cursor-pointer space-y-3 relative group"
                      >
                        {/* Title & Priority */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold leading-relaxed text-foreground truncate group-hover:text-accent transition-colors flex-1">
                              {task.title}
                            </span>
                            <span className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${priorityPill}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Checklist progress */}
                        {subCount > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-muted font-semibold">
                              <span className="flex items-center gap-1">
                                <CheckSquare size={10} />
                                <span>Checklist</span>
                              </span>
                              <span>{subCompleted}/{subCount} ({subPercent}%)</span>
                            </div>
                            <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent rounded-full transition-all duration-300"
                                style={{ width: `${subPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Card metadata footer */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40">
                          {list && (
                            <span className="text-[11px] font-bold bg-muted/25 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                              <span>{list.name}</span>
                            </span>
                          )}
                          
                          {task.dueDate && (
                            <span className="text-[11px] font-semibold text-muted flex items-center gap-1 shrink-0 ml-auto">
                              <Calendar size={10} />
                              <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                            </span>
                          )}
                        </div>

                        {/* Quick Hover Controls to Shift Column */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent h-10 rounded-b-xl opacity-0 group-hover:opacity-100 flex items-center justify-between px-3 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStatus(task.id, col.id, "prev"); }}
                            disabled={col.id === "pending"}
                            className="text-muted hover:text-foreground hover:bg-muted/30 p-1.5 rounded-lg disabled:opacity-20 transition-all"
                          >
                            <ArrowLeft size={12} />
                          </button>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }}
                            className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                          >
                            <Trash2 size={12} />
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); moveStatus(task.id, col.id, "next"); }}
                            disabled={col.id === "archived"}
                            className="text-muted hover:text-foreground hover:bg-muted/30 p-1.5 rounded-lg disabled:opacity-20 transition-all"
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

export default React.memo(KanbanView);
