"use client";

import React, { useState, useMemo } from "react";
import { 
  Calendar, 
  CheckSquare, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Search,
  SlidersHorizontal,
  Tag,
  Archive,
  Copy,
  X,
  Target,
  Link
} from "lucide-react";
import { Task, List, Label, SavedFilter } from "@/types";
import EmptyState from "./EmptyState";
import { useDebounce } from "@/src/lib/hooks/useDebounce";
import MarkdownRenderer from "./MarkdownRenderer";
import { getRelativeDateString, getDueDateBadgeClass, highlightText } from "@/src/lib/dateUtils";

interface ListViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskClick: (task: Task) => void;
  selectedListId?: number | null;
  selectedLabelId?: number | null;
  onTaskDuplicate?: (task: Task) => void;
  onClearCompleted?: () => void;
  onFocusTask?: (id: number) => void;
  selectedFilter?: SavedFilter | null;
  onSaveFilter?: (name: string, config: Omit<SavedFilter, "id">) => void;
}// Local date helpers removed — use src/lib/dateUtils shared implementations.

function ListView({
  tasks,
  lists,
  labels,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick,
  selectedListId = null,
  selectedLabelId = null,
  onTaskDuplicate,
  onClearCompleted,
  onFocusTask,
  selectedFilter = null,
  onSaveFilter
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"newest" | "dueDate" | "priority">("newest");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

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
  const filteredTasks = useMemo(() => {
    // Override filters if a saved filter is selected
    const activeSearch = selectedFilter ? selectedFilter.query : debouncedSearchQuery;
    const activeStatus = selectedFilter ? selectedFilter.statusFilter : statusFilter;
    const activePriority = selectedFilter ? selectedFilter.priorityFilter : priorityFilter;

    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(activeSearch.toLowerCase()) ||
        (task.labels || []).some(labelId => {
          const label = labels.find(l => l.id === labelId);
          return label?.name.toLowerCase().includes(activeSearch.toLowerCase());
        });
      
      const matchesPriority = activePriority === "all" || task.priority === activePriority;
      if (!matchesPriority) return false;
      
      const isCompleted = task.status === "completed" || task.status === "done";
      const isActive = task.status === "pending" || task.status === "todo" || task.status === "in-progress" || task.status === "in_progress";
      const isArchived = task.status === "archived";

      if (activeStatus === "active") return matchesSearch && isActive;
      if (activeStatus === "completed") return matchesSearch && isCompleted;
      if (activeStatus === "archived") return matchesSearch && isArchived;
      return matchesSearch && !isArchived;
    });
  }, [tasks, debouncedSearchQuery, statusFilter, priorityFilter, labels, selectedFilter]);

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

  const handleSelectTask = (id: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    selectedTaskIds.forEach(id => {
      onTaskUpdate(id, { status: "completed" });
    });
    setSelectedTaskIds([]);
  };

  const handleBulkPending = () => {
    selectedTaskIds.forEach(id => {
      onTaskUpdate(id, { status: "pending" });
    });
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    selectedTaskIds.forEach(id => {
      onTaskDelete(id);
    });
    setSelectedTaskIds([]);
  };

  const handleBulkPriority = (priority: "high" | "medium" | "low") => {
    selectedTaskIds.forEach(id => {
      onTaskUpdate(id, { priority });
    });
    setSelectedTaskIds([]);
  };

  const handleSelectAllToggle = () => {
    if (selectedTaskIds.length === sortedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(sortedTasks.map(t => t.id));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      
      {/* List Header */}
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
                <span>High-Density List</span>
              )}
            </h2>
            <p className="text-sm text-muted mt-1">
              {activeList 
                ? activeList.description || "Tasks inside this folder." 
                : activeLabel 
                  ? `Tasks tagged with ${activeLabel.name}.`
                  : "Compact list format featuring advanced filters, sorting utilities, and quick checklists."}
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

        {/* Toolbar: Search, Filters, Sorting */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/25 backdrop-blur-md border border-border p-3 rounded-2xl glass-panel">
          {/* Search Box */}
          <div className="flex items-center gap-2.5 px-3 bg-muted/10 border border-border/80 rounded-xl py-2 flex-1 max-w-sm">
            <Search size={16} className="text-muted shrink-0" />
            <input
              id="list-search"
              name="list-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in planner..."
              aria-label="Search tasks"
              className="w-full bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted/60 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Bulk Selection toggle */}
            <button
              onClick={handleSelectAllToggle}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-border bg-muted/10 text-muted hover:text-foreground hover:bg-muted/20 transition-all duration-150"
            >
              {selectedTaskIds.length === sortedTasks.length && sortedTasks.length > 0 ? "Deselect All" : "Select All"}
            </button>

            {/* Clear Completed tasks action button */}
            {onClearCompleted && tasks.some(t => t.status === "completed" || t.status === "done") && (
              <button
                onClick={onClearCompleted}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all duration-150 cursor-pointer animate-fade-in"
              >
                Clear Completed
              </button>
            )}
            
            {/* Save Filter action */}
            {onSaveFilter && (debouncedSearchQuery || statusFilter !== "all" || priorityFilter !== "all") && !selectedFilter && (
              <button
                onClick={() => {
                  const name = window.prompt("Enter a name for this filter:");
                  if (name) {
                    onSaveFilter(name, {
                      name,
                      query: debouncedSearchQuery,
                      statusFilter,
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

            {/* Status Filter Toggles */}
            <div className="flex border border-border rounded-xl p-1 bg-muted/10 shrink-0">
              {(["all", "active", "completed", "archived"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg capitalize transition-all duration-150 ${
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
                id="list-sort"
                name="list-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "dueDate" | "priority")}
                aria-label="Sort tasks"
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
                id="list-priority-filter"
                name="list-priority-filter"
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

      {/* Dynamic List Workspace */}
      <div className="flex-1 scroll-container px-8 pb-8 pr-4">
        <div className="scroll-indicator-top" />
        {sortedTasks.length === 0 ? (
          <EmptyState
            title={debouncedSearchQuery ? "No matching tasks" : "No tasks found"}
            description={
              debouncedSearchQuery
                ? "Try adjusting your search terms or clearing the filter."
                : "Your list is empty. Create a task to get started!"
            }
            variant={debouncedSearchQuery ? "search" : "filter"}
          />
        ) : (
          <div className="space-y-2">
            {sortedTasks.map(task => {
              const list = lists.find(l => l.id === task.listId);
              const isExpanded = expandedTaskId === task.id;
              const isDone = task.status === "completed" || task.status === "done";
              
              // Checklist stats
              const subCount = task.subtasks?.length || 0;
              const subCompleted = task.subtasks?.filter(s => s.completed).length || 0;
              const subPercent = subCount > 0 ? Math.round((subCompleted / subCount) * 100) : 0;

              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

              const priorityPill = {
                high: "bg-red-500/10 text-red-600 border border-red-500/20",
                medium: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                low: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              }[task.priority || "low"];

              return (
                <div 
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded 
                      ? "border-accent/40 bg-accent/[0.02] shadow-sm scale-[1.01]" 
                      : "border-border/80 bg-card/45 hover:border-border hover:bg-card/90"
                  }`}
                >
                  {/* Task Header row */}
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Bulk Selection Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTask(task.id);
                        }}
                        aria-label="Select task for bulk action"
                        className="p-1 -m-1 rounded-md shrink-0"
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          selectedTaskIds.includes(task.id)
                            ? "bg-accent/25 border-accent text-accent"
                            : "border-border/60 hover:border-accent"
                        }`}>
                          {selectedTaskIds.includes(task.id) && <span className="w-1.5 h-1.5 bg-accent rounded-sm animate-scale-in" />}
                        </span>
                      </button>

                      {/* Interactive Status Checkbox */}
                      <button
                        onClick={(e) => handleStatusToggle(task, e)}
                        aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
                        aria-checked={isDone}
                        role="checkbox"
                        className="p-1 -m-1 rounded-full"
                      >
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center checkbox-pulse transition-all ${
                          isDone 
                            ? "bg-accent border-accent text-white" 
                            : "border-border hover:border-accent"
                        }`}>
                          {isDone && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                      </button>

                      {/* Title */}
                      <span className={`text-xs font-semibold truncate ${
                        isDone ? "line-through text-muted" : "text-foreground"
                      }`}>
                        {highlightText(task.title, searchQuery)}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 shrink-0">
                      {onFocusTask && !isDone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFocusTask(task.id);
                          }}
                          className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all group-hover:scale-110"
                          title="Start Focus Session"
                        >
                          <Target size={14} />
                        </button>
                      )}
                      {list && (
                        <span className="text-[11px] font-bold bg-muted/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                          <span>{list.name}</span>
                        </span>
                      )}

                      {task.labels && task.labels.length > 0 && (
                        <div className="flex items-center gap-1">
                          {task.labels.map(labelId => {
                            const label = labels.find(l => l.id === labelId);
                            if (!label) return null;
                            return (
                              <span 
                                key={labelId} 
                                className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-border/40 text-foreground"
                                style={{ backgroundColor: `${label.color}15`, color: label.color, borderColor: `${label.color}35` }}
                              >
                                {label.name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const priorities: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
                          const currIndex = priorities.indexOf(task.priority || "low");
                          const nextPriority = priorities[(currIndex + 1) % priorities.length];
                          onTaskUpdate(task.id, { priority: nextPriority });
                        }}
                        title="Click to cycle priority"
                        className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer ${priorityPill}`}
                      >
                        {task.priority}
                      </button>

                      {task.dueDate && (
                        <span className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${getDueDateBadgeClass(task.dueDate, isDone)}`}>
                          <Calendar size={10} />
                          <span>{getRelativeDateString(task.dueDate)}</span>
                          {isOverdue && <span className="text-[9px] uppercase">Overdue</span>}
                        </span>
                      )}

                      {task.dependsOnTaskId && (
                        <span className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          tasks.find(t => t.id === task.dependsOnTaskId)?.status === 'completed' || tasks.find(t => t.id === task.dependsOnTaskId)?.status === 'done'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          <Link size={10} />
                          <span className="max-w-[80px] truncate">
                            {tasks.find(t => t.id === task.dependsOnTaskId)?.title || 'Dependency'}
                          </span>
                        </span>
                      )}
                      {/* Subtask checklist gauge */}
                      {subCount > 0 && (
                        <div className="text-[11px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1.5">
                          <CheckSquare size={10} />
                          <span>{subCompleted}/{subCount}</span>
                          <div className="w-8 h-1 bg-accent/20 rounded-full overflow-hidden hidden sm:block">
                            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${subPercent}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Accordion expand toggle button */}
                      <button
                        onClick={(e) => toggleExpanded(task.id, e)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                        className="text-muted hover:text-foreground hover:bg-muted/20 p-2 rounded-xl transition-all"
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
                        <span className="text-[11px] font-bold text-muted uppercase">Description</span>
                        <div className="text-xs text-foreground leading-relaxed">
                          {task.description ? <MarkdownRenderer content={task.description} /> : "No description provided."}
                        </div>
                      </div>

                      {/* Subtask check-off checklist */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted uppercase">Subtasks Checklist</span>
                          {subCount > 0 && (
                            <span className="text-[11px] font-bold text-accent">{subPercent}% complete</span>
                          )}
                        </div>
                        
                        {subCount > 0 && (
                          <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${subPercent}%` }}
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          {task.subtasks?.map(sub => (
                            <div 
                              key={sub.id}
                              onClick={(e) => handleSubtaskToggle(task, sub.id, e)}
                              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/10 cursor-pointer transition-colors group/subtask"
                            >
                              <button
                                role="checkbox"
                                aria-checked={sub.completed}
                                aria-label={sub.completed ? `Mark "${sub.title}" as incomplete` : `Mark "${sub.title}" as complete`}
                                className="p-0.5 -m-0.5 rounded"
                              >
                                <span className={`w-4 h-4 rounded-md border flex items-center justify-center checkbox-pulse transition-all ${
                                  sub.completed 
                                    ? "bg-accent/80 border-accent/80 text-white" 
                                    : "border-border hover:border-accent"
                                }`}>
                                  {sub.completed && <CheckSquare size={10} className="text-white" />}
                                </span>
                              </button>
                              <span className={`text-xs ${
                                sub.completed ? "line-through text-muted font-medium" : "text-foreground font-medium"
                              }`}>
                                {sub.title}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updatedSubs = task.subtasks?.filter(s => s.id !== sub.id) || [];
                                  onTaskUpdate(task.id, { subtasks: updatedSubs });
                                }}
                                aria-label={`Remove subtask "${sub.title}"`}
                                className="ml-auto opacity-0 group-hover/subtask:opacity-100 text-muted hover:text-red-500 p-1 rounded transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Inline Add Subtask Input */}
                        <div className="pt-1">
                          <input
                            type="text"
                            placeholder="Add a checklist item..."
                            className="w-full text-xs bg-background/50 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const input = e.target as HTMLInputElement;
                                if (input.value.trim()) {
                                  const newSub = { id: Date.now(), title: input.value.trim(), completed: false };
                                  const updatedSubs = [...(task.subtasks || []), newSub];
                                  onTaskUpdate(task.id, { subtasks: updatedSubs });
                                  input.value = "";
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions toolbar */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="text-[11px] text-muted font-semibold">
                          Created {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex gap-2">
                          {onTaskDuplicate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskDuplicate(task);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted text-[11px] font-bold hover:bg-muted/10 hover:text-foreground transition-colors"
                            >
                              <Copy size={12} />
                              <span>Duplicate</span>
                            </button>
                          )}
                          {task.status === "archived" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskUpdate(task.id, { status: "pending" });
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-accent/25 text-accent text-[11px] font-bold hover:bg-accent/10 transition-colors"
                            >
                              <Archive size={12} />
                              <span>Restore Task</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskUpdate(task.id, { status: "archived" });
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted text-[11px] font-bold hover:bg-muted/10 hover:text-foreground transition-colors"
                            >
                              <Archive size={12} />
                              <span>Archive Task</span>
                            </button>
                          )}
                          <button
                            onClick={() => onTaskDelete(task.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 text-[11px] font-bold hover:bg-red-500/10 transition-colors"
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
        <div className="scroll-indicator-bottom" />
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-card/90 backdrop-blur-md border border-accent/20 shadow-2xl animate-slide-up">
          <span className="text-[11px] font-bold text-foreground">
            {selectedTaskIds.length} selected
          </span>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={handleBulkComplete}
            className="text-[11px] font-bold text-accent hover:underline transition-all"
          >
            Complete
          </button>
          <button
            onClick={handleBulkPending}
            className="text-[11px] font-bold text-muted hover:text-foreground transition-all"
          >
            Mark Active
          </button>
          <button
            onClick={handleBulkDelete}
            className="text-[11px] font-bold text-red-500 hover:text-red-400 transition-all"
          >
            Delete
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => handleBulkPriority("high")}
            className="text-[11px] font-bold text-red-500/80 hover:text-red-500 transition-all"
          >
            High
          </button>
          <button
            onClick={() => handleBulkPriority("medium")}
            className="text-[11px] font-bold text-amber-500/80 hover:text-amber-500 transition-all"
          >
            Medium
          </button>
          <button
            onClick={() => handleBulkPriority("low")}
            className="text-[11px] font-bold text-blue-500/80 hover:text-blue-500 transition-all"
          >
            Low
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => setSelectedTaskIds([])}
            className="text-[11px] font-bold text-muted hover:text-foreground transition-all"
          >
            Cancel
          </button>
        </div>
      )}

    </div>
  );
}

export default React.memo(ListView);
