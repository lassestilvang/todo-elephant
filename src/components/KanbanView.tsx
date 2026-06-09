"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  Calendar, 
  CheckSquare, 
  Trash2, 
  Inbox,
  Zap,
  CheckCircle2,
  Archive,
  Search,
  SlidersHorizontal,
  Tag,
  Copy,
  Link,
  Target
} from "lucide-react";
import { Task, List, Label, SavedFilter } from "@/types";
import { useDebounce } from "@/src/lib/hooks/useDebounce";

interface KanbanViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (title: string, status: string) => void;
  onTaskDuplicate?: (task: Task) => void;
  onFocusTask?: (id: number) => void;
  selectedListId?: number | null;
  selectedLabelId?: number | null;
  selectedFilter?: SavedFilter | null;
  onSaveFilter?: (name: string, config: Omit<SavedFilter, "id">) => void;
}

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) 
          ? <mark key={i} className="bg-accent/25 text-accent rounded px-0.5 font-semibold">{part}</mark>
          : part
      )}
    </span>
  );
};

const getRelativeDateString = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dDate.getTime() - dNow.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getDueDateBadgeClass = (dateStr: string, isDone: boolean) => {
  if (isDone) return "text-muted bg-muted/10";
  
  const date = new Date(dateStr);
  const now = new Date();
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dDate.getTime() - dNow.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "text-red-500 bg-red-500/10 animate-pulse border border-red-500/20";
  if (diffDays === 0) return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
  if (diffDays === 1) return "text-blue-500 bg-blue-500/10 border border-blue-500/20";
  
  return "text-muted bg-muted/10";
};

function KanbanView({
  tasks,
  lists,
  labels,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick,
  onAddTask,
  onTaskDuplicate,
  onFocusTask,
  selectedListId = null,
  selectedLabelId = null,
  selectedFilter = null,
  onSaveFilter
}: KanbanViewProps) {
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [sortBy, setSortBy] = useState<"newest" | "dueDate" | "priority">("newest");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const activeList = useMemo(() => {
    return lists.find(l => l.id === selectedListId);
  }, [lists, selectedListId]);

  const activeLabel = useMemo(() => {
    return labels.find(l => l.id === selectedLabelId);
  }, [labels, selectedLabelId]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed" || t.status === "done").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [tasks]);

  const columns = [
    { id: "pending", title: "Todo", icon: Inbox, border: "border-t-blue-500", bg: "bg-blue-500/5", text: "text-blue-500", dot: "bg-blue-500" },
    { id: "in-progress", title: "In Progress", icon: Zap, border: "border-t-amber-500", bg: "bg-amber-500/5", text: "text-amber-500", dot: "bg-amber-500" },
    { id: "completed", title: "Completed", icon: CheckCircle2, border: "border-t-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-500", dot: "bg-emerald-500" },
    { id: "archived", title: "Archived", icon: Archive, border: "border-t-slate-500", bg: "bg-slate-500/5", text: "text-slate-500", dot: "bg-slate-500" }
  ];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (task.labels || []).some(labelId => {
          const label = labels.find(l => l.id === labelId);
          return label?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        });
      
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, debouncedSearchQuery, priorityFilter, labels]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
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
      return b.id - a.id;
    });
  }, [filteredTasks, sortBy]);

  // Helper to resolve task status compatibility
  const getTasksByStatus = (statusId: string) => {
    return sortedTasks.filter(t => {
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

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
    
    // Add a visual styling to the dragging element
    const target = e.target as HTMLElement;
    target.style.opacity = "0.4";
  };

  const onDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
  };

  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverCol(colId);
    e.dataTransfer.dropEffect = "move";
  };

  const onDragLeave = () => {
    setDraggedOverCol(null);
  };

  const onDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    if (isNaN(taskId)) return;

    // Map status if needed
    let statusValue = newStatus as Task["status"];
    if (newStatus === "pending") statusValue = "pending";
    if (newStatus === "in-progress") statusValue = "in-progress";
    if (newStatus === "completed") statusValue = "completed";
    if (newStatus === "archived") statusValue = "archived";

    onTaskUpdate(taskId, { status: statusValue });
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
      onTaskUpdate(id, { status: statusFlow[currIndex + 1] as Task["status"] });
    } else if (direction === "prev" && currIndex > 0) {
      onTaskUpdate(id, { status: statusFlow[currIndex - 1] as Task["status"] });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      
      {/* Kanban Header */}
      <div className="px-8 pt-8 pb-4 shrink-0 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {activeList ? (
                <>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeList.color }} />
                  <span>{activeList.name}</span>
                </>
              ) : activeLabel ? (
                <>
                  <Tag size={20} className="shrink-0" style={{ color: activeLabel.color }} />
                  <span>Tag: {activeLabel.name}</span>
                </>
              ) : (
                <span>Kanban Board</span>
              )}
            </h2>
            <p className="text-sm text-muted mt-1">
              {activeList 
                ? activeList.description || "Tasks inside this folder." 
                : activeLabel 
                  ? `Tasks tagged with ${activeLabel.name}.`
                  : "Visualize task statuses, drag workflows, and complete subtasks dynamically."}
            </p>
          </div>
          {(activeList || activeLabel) && stats.total > 0 && (
            <div className="flex items-center gap-3 bg-card/40 border border-border/60 px-4 py-2.5 rounded-2xl shrink-0 max-w-xs w-full shadow-sm">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted">Progress</span>
                  <span className="text-accent">{stats.completed}/{stats.total} ({stats.percent}%)</span>
                </div>
                <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search & Sorting */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/25 backdrop-blur-md border border-border p-3 rounded-2xl glass-panel">
          {/* Search Box */}
          <div className="flex items-center gap-2.5 px-3 bg-muted/10 border border-border/80 rounded-xl py-2 flex-1 max-w-sm">
            <Search size={16} className="text-muted shrink-0" />
            <input
              id="kanban-search"
              name="kanban-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              aria-label="Search kanban cards"
              className="w-full bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted/60 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Save Filter action */}
          {onSaveFilter && (debouncedSearchQuery || priorityFilter !== "all") && !selectedFilter && (
            <button
              onClick={() => {
                const name = window.prompt("Enter a name for this filter:");
                if (name) {
                  onSaveFilter(name, {
                    name,
                    query: debouncedSearchQuery,
                    statusFilter: "all",
                    priorityFilter,
                    sortBy
                  });
                }
              }}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-accent/20 text-accent bg-accent/5 hover:bg-accent/10 transition-all duration-150 cursor-pointer animate-fade-in flex items-center gap-1.5"
            >
              <Link size={12} />
              Save as Filter
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 border border-border rounded-xl px-2.5 py-1.5 bg-muted/10 shrink-0">
            <SlidersHorizontal size={12} className="text-muted" />
            <select
              id="kanban-sort"
              name="kanban-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "dueDate" | "priority")}
              aria-label="Sort kanban cards"
              className="bg-transparent border-0 text-[11px] font-bold text-muted focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-background text-foreground">Sort: Newest</option>
              <option value="dueDate" className="bg-background text-foreground">Sort: Due Date</option>
              <option value="priority" className="bg-background text-foreground">Sort: Priority</option>
            </select>
          </div>

          {/* Priority Filter Selection */}
          <div className="flex items-center gap-2 border border-border rounded-xl px-2.5 py-1.5 bg-muted/10 shrink-0">
            <span className="text-muted text-[11px] font-bold">Priority:</span>
            <select
              id="kanban-priority-filter"
              name="kanban-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | "high" | "medium" | "low")}
              aria-label="Filter by Priority"
              className="bg-transparent border-0 text-[11px] font-bold text-muted focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-background text-foreground">All</option>
              <option value="high" className="bg-background text-foreground">High</option>
              <option value="medium" className="bg-background text-foreground">Medium</option>
              <option value="low" className="bg-background text-foreground">Low</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    {/* Columns Workspace Container */}
      <div className="flex-1 overflow-x-auto px-8 pb-8 flex items-start gap-6 select-none">
        {columns.map((col, colIdx) => {
          const colTasks = getTasksByStatus(col.id);
          const isOver = draggedOverCol === col.id;
          return (
            <div 
              key={col.id} 
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.id)}
              className={`w-80 shrink-0 max-h-full flex flex-col rounded-2xl border transition-all duration-200 bg-card/25 backdrop-blur-md glass-panel ${col.bg} overflow-hidden animate-fade-in ${
                isOver 
                  ? "border-accent ring-2 ring-accent/25 scale-[1.01] bg-card/35" 
                  : "border-border"
              }`}
              style={{ animationDelay: `${colIdx * 80}ms`, animationFillMode: "backwards" }}
            >
              {/* Column Top Bar */}
              <div className={`px-4 py-3.5 border-b border-border border-t-4 ${col.border} flex items-center justify-between`}>
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                  <span>{col.title}</span>
                  <span className="text-[11px] font-bold bg-muted/20 px-2 py-0.5 rounded-full shrink-0 opacity-60">
                    {colTasks.length}
                  </span>
                </span>
                <button 
                  onClick={() => setAddingInColumn(addingInColumn === col.id ? null : col.id)}
                  aria-label={`Add task to ${col.title}`}
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
                {colTasks.length === 0 && !isOver ? (
                  <div className="py-10 text-center space-y-2 select-none">
                    <div className="w-10 h-10 rounded-xl bg-muted/8 border border-border/40 flex items-center justify-center mx-auto">
                      <Plus size={16} className="text-muted/30" />
                    </div>
                    <p className="text-[11px] text-muted/50 font-medium">No tasks here</p>
                    <button
                      onClick={() => setAddingInColumn(col.id)}
                      className="text-[11px] text-accent font-semibold hover:underline"
                    >
                      Add a task
                    </button>
                  </div>
                ) : (
                  <>
                    {colTasks.map((task, taskIdx) => {
                      const list = lists.find(l => l.id === task.listId);
                      
                      // Checklist calculations
                      const subCount = task.subtasks?.length || 0;
                      const subCompleted = task.subtasks?.filter(s => s.completed).length || 0;
                      const subPercent = subCount > 0 ? Math.round((subCompleted / subCount) * 100) : 0;
                      
                      const isDone = task.status === "completed" || task.status === "done";
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

                      // Priority color mappings
                      const priorityPill = {
                        high: "bg-red-500/10 text-red-600 border border-red-500/20",
                        medium: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                        low: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      }[task.priority || "low"];

                      // Staggered entrance animation
                      const animDelay = Math.min(taskIdx * 40, 300);

                      return (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onDragEnd={onDragEnd}
                          onClick={() => onTaskClick(task)}
                          className="p-3.5 rounded-xl border border-border/80 bg-card hover-lift cursor-pointer space-y-3 relative group animate-fade-in shadow-sm hover:shadow-md transition-all active:scale-95 active:rotate-1"
                          style={{ animationDelay: `${animDelay}ms`, animationFillMode: "backwards" }}
                        >
                          {/* Title & Priority */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-xs font-semibold leading-relaxed truncate group-hover:text-accent transition-colors flex-1 ${isDone ? "line-through text-muted" : "text-foreground"}`}>
                                {highlightText(task.title, searchQuery)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const priorities: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
                                  const currIndex = priorities.indexOf(task.priority || "low");
                                  const nextPriority = priorities[(currIndex + 1) % priorities.length];
                                  onTaskUpdate(task.id, { priority: nextPriority });
                                }}
                                title="Click to cycle priority"
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 ${priorityPill}`}
                              >
                                {task.priority}
                              </button>
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                                {highlightText(task.description, searchQuery)}
                              </p>
                            )}
                          </div>

                          {/* Labels display on card */}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.labels.map(labelId => {
                                const label = labels.find(l => l.id === labelId);
                                if (!label) return null;
                                return (
                                  <span 
                                    key={labelId} 
                                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border border-border/45 text-foreground"
                                    style={{ backgroundColor: `${label.color}15`, color: label.color, borderColor: `${label.color}30` }}
                                    title={label.name}
                                  >
                                    {label.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Checklist progress */}
                          {subCount > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-muted font-bold uppercase tracking-tight">
                                <span className="flex items-center gap-1">
                                  <CheckSquare size={10} className="text-accent" />
                                  <span>Checklist</span>
                                </span>
                                <span>{subCompleted}/{subCount}</span>
                              </div>
                              <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${subPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Card metadata footer */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                            {list && (
                              <span className="text-[10px] font-bold bg-muted/25 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                                <span>{list.name}</span>
                              </span>
                            )}
                            
                            {task.dueDate && (
                              <span className={`text-[10px] font-bold flex items-center gap-1 shrink-0 ml-auto px-1.5 py-0.5 rounded-full ${getDueDateBadgeClass(task.dueDate, isDone)}`}>
                                <Calendar size={10} />
                                <span>{getRelativeDateString(task.dueDate)}</span>
                                {isOverdue && <span className="text-[8px] uppercase">!!</span>}
                              </span>
                            )}
                          </div>

                          {/* Dependencies & Focus */}
                          {(task.dependsOnTaskId || (onFocusTask && !isDone)) && (
                            <div className="flex items-center gap-2 pt-1">
                              {task.dependsOnTaskId && (
                                <span className={`text-[9px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                                  tasks.find(t => t.id === task.dependsOnTaskId)?.status === 'completed' || tasks.find(t => t.id === task.dependsOnTaskId)?.status === 'done'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  <Link size={10} />
                                  <span className="max-w-[100px] truncate">
                                    {tasks.find(t => t.id === task.dependsOnTaskId)?.title || 'Dependency'}
                                  </span>
                                </span>
                              )}
                              
                              {onFocusTask && !isDone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onFocusTask(task.id);
                                  }}
                                  className="ml-auto p-1 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all"
                                  title="Focus Session"
                                >
                                  <Target size={12} />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Quick Hover Controls to Shift Column */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent h-10 rounded-b-xl opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center justify-between px-3 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveStatus(task.id, col.id, "prev"); }}
                              disabled={col.id === "pending"}
                              aria-label="Move to previous column"
                              className="text-muted hover:text-foreground hover:bg-muted/30 p-1.5 rounded-lg disabled:opacity-20 transition-all"
                            >
                              <ArrowLeft size={12} />
                            </button>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }}
                              aria-label="Delete task"
                              className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                            >
                              <Trash2 size={12} />
                            </button>

                            {onTaskDuplicate && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onTaskDuplicate(task); }}
                                aria-label="Duplicate task"
                                className="text-muted hover:text-foreground hover:bg-muted/30 p-1.5 rounded-lg transition-all"
                              >
                                <Copy size={12} />
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); moveStatus(task.id, col.id, "next"); }}
                              disabled={col.id === "archived"}
                              aria-label="Move to next column"
                              className="text-muted hover:text-foreground hover:bg-muted/30 p-1.5 rounded-lg disabled:opacity-20 transition-all"
                            >
                              <ArrowRight size={12} />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                    {isOver && (
                      <div className="border-2 border-dashed border-accent/40 rounded-xl h-24 bg-accent/5 flex items-center justify-center text-accent/60 text-xs font-semibold animate-pulse transition-all">
                        Drop Card Here
                      </div>
                    )}
                  </>
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
