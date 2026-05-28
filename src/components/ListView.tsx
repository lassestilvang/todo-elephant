"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Tag, 
  CheckSquare, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp,
  Search,
  SlidersHorizontal,
  Plus
} from "lucide-react";
import { Task, List, Label } from "@/types";

interface ListViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskClick: (task: Task) => void;
}

function ListView({
  tasks,
  lists,
  labels,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [sortBy, setSortBy] = useState<"newest" | "dueDate" | "priority">("newest");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // Toggle collapsible subtask checklist accordion
  const toggleExpanded = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  const handleStatusToggle = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCompleted = task.status === "completed" || task.status === "done";
    onTaskUpdate(task.id, {
      status: isCompleted ? "pending" : "completed"
    });
  };

  const handleSubtaskToggle = (task: Task, subtaskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const isCompleted = task.status === "completed" || task.status === "done";
    const isActive = task.status === "pending" || task.status === "todo" || task.status === "in-progress" || task.status === "in_progress";
    const isArchived = task.status === "archived";

    if (statusFilter === "active") return matchesSearch && isActive;
    if (statusFilter === "completed") return matchesSearch && isCompleted;
    if (statusFilter === "archived") return matchesSearch && isArchived;
    return matchesSearch && !isArchived; // "all" shows all except archived by default
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "priority") {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeights[a.priority as "high" | "medium" | "low"] || 0;
      const weightB = priorityWeights[b.priority as "high" | "medium" | "low"] || 0;
      return weightB - weightA;
    }
    // "newest" or default
    return b.id - a.id;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      
      {/* List Header */}
      <div className="px-8 pt-8 pb-4 shrink-0 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">High-Density List</h2>
          <p className="text-sm text-muted">Compact list format featuring advanced filters, sorting utilities, and quick checklists.</p>
        </div>

        {/* Toolbar: Search, Filters, Sorting */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/25 backdrop-blur-md border border-border p-3 rounded-2xl glass-panel">
          {/* Search Box */}
          <div className="flex items-center gap-2.5 px-3 bg-muted/10 border border-border/80 rounded-xl py-2 flex-1 max-w-sm">
            <Search size={16} className="text-muted shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in planner..."
              className="w-full bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted/60 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter Toggles */}
            <div className="flex border border-border rounded-xl p-1 bg-muted/10 shrink-0">
              {(["all", "active", "completed", "archived"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg capitalize transition-all duration-150 ${
                    statusFilter === filter
                      ? "bg-accent text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Sorting Selection */}
            <div className="flex items-center gap-2 border border-border rounded-xl px-2.5 py-1.5 bg-muted/10 shrink-0">
              <SlidersHorizontal size={12} className="text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-0 text-[10px] font-bold text-muted focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-background text-foreground">Sort: Newest</option>
                <option value="dueDate" className="bg-background text-foreground">Sort: Due Date</option>
                <option value="priority" className="bg-background text-foreground">Sort: Priority</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Dynamic List Workspace */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 pr-4">
        {sortedTasks.length === 0 ? (
          <div className="py-24 text-center text-xs text-muted/60 select-none">
            No matching tasks found matching your filter criteria.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map(task => {
              const list = lists.find(l => l.id === task.listId);
              const isExpanded = expandedTaskId === task.id;
              const isDone = task.status === "completed" || task.status === "done";
              
              // Checklist stats
              const subCount = task.subtasks?.length || 0;
              const subCompleted = task.subtasks?.filter(s => s.completed).length || 0;

              const priorityPill = {
                high: "bg-red-500/10 text-red-500",
                medium: "bg-amber-500/10 text-amber-500",
                low: "bg-blue-500/10 text-blue-500"
              }[task.priority || "low"];

              return (
                <div 
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded 
                      ? "border-accent/40 bg-accent/[0.02] shadow-sm" 
                      : "border-border/80 bg-card/45 hover:border-border hover:bg-card/90"
                  }`}
                >
                  {/* Task Header row */}
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Interactive Status Checkbox */}
                      <button
                        onClick={(e) => handleStatusToggle(task, e)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 checkbox-pulse transition-all ${
                          isDone 
                            ? "bg-accent border-accent text-white" 
                            : "border-border hover:border-accent"
                        }`}
                      >
                        {isDone && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </button>

                      {/* Title */}
                      <span className={`text-xs font-semibold truncate ${
                        isDone ? "line-through text-muted" : "text-foreground"
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 shrink-0">
                      {list && (
                        <span className="text-[10px] font-bold bg-muted/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                          <span>{list.name}</span>
                        </span>
                      )}

                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityPill}`}>
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span className="text-[10px] font-medium text-muted flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        </span>
                      )}

                      {/* Subtask checklist gauge */}
                      {subCount > 0 && (
                        <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckSquare size={10} />
                          <span>{subCompleted}/{subCount}</span>
                        </span>
                      )}

                      {/* Accordion expand toggle button */}
                      <button
                        onClick={(e) => toggleExpanded(task.id, e)}
                        className="text-muted hover:text-foreground hover:bg-muted/20 p-1.5 rounded-xl transition-all"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Task Accordion Checklist Panel */}
                  {isExpanded && (
                    <div 
                      className="px-5 pb-5 pt-1 border-t border-border/40 space-y-4 animate-fade-in bg-muted/[0.02]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Description */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted uppercase">Description</span>
                        <p className="text-xs text-foreground leading-relaxed">
                          {task.description || "No description provided."}
                        </p>
                      </div>

                      {/* Subtask check-off checklist */}
                      {subCount > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-muted uppercase">Subtasks Checklist</span>
                          <div className="space-y-1.5">
                            {task.subtasks?.map(sub => (
                              <div 
                                key={sub.id}
                                onClick={(e) => handleSubtaskToggle(task, sub.id, e)}
                                className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/10 cursor-pointer"
                              >
                                <button
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 checkbox-pulse transition-all ${
                                    sub.completed 
                                      ? "bg-accent/80 border-accent/80 text-white" 
                                      : "border-border hover:border-accent"
                                  }`}
                                >
                                  {sub.completed && <span className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                </button>
                                <span className={`text-xs ${
                                  sub.completed ? "line-through text-muted font-medium" : "text-foreground font-medium"
                                }`}>
                                  {sub.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions toolbar */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="text-[10px] text-muted font-semibold">
                          Created {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onTaskDelete(task.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>Delete Task</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default React.memo(ListView);
