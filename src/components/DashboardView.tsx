"use client";

import React, { useMemo, useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Plus, 
  ChevronRight,
  ClipboardList,
  Zap,
  Star
} from "lucide-react";
import { Task, List, ActivityLog } from "@/types";
import EmptyState from "./EmptyState";

interface DashboardViewProps {
  tasks: Task[];
  lists: List[];
  activityLogs: ActivityLog[];
  onAddTaskClick: () => void;
  onTaskClick: (task: Task) => void;
  onQuickAdd?: (title: string) => void;
}

function DashboardView({
  tasks,
  lists,
  activityLogs,
  onAddTaskClick,
  onTaskClick,
  onQuickAdd
}: DashboardViewProps) {
  const [quickTitle, setQuickTitle] = useState("");
  
  // Calculate analytics (memoized to avoid recalculation on every render)
  const analytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed" || t.status === "done").length;
    const pending = tasks.filter(t => t.status === "pending" || t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "in-progress" || t.status === "in_progress").length;
    
    const overdueTasks = tasks.filter(t => {
      if (t.status === "completed" || t.status === "done") return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    });

    let totalSubtasks = 0;
    let completedSubtasksCount = 0;
    tasks.forEach(t => {
      if (t.subtasks) {
        totalSubtasks += t.subtasks.length;
        completedSubtasksCount += t.subtasks.filter(s => s.completed).length;
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Productivity score (arbitrary but looks cool)
    const productivityScore = Math.min(100, Math.round((completed * 10 + (completedSubtasksCount || 0) * 2) / (total > 0 ? total : 1) * 5));

    const highPriority = tasks.filter(t => t.priority === "high").length;
    const mediumPriority = tasks.filter(t => t.priority === "medium").length;
    const lowPriority = tasks.filter(t => t.priority === "low").length;

    const getPriorityPercent = (count: number) => {
      return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    const recentTasks = tasks.slice(0, 5);
    
    // Find upcoming tasks (due in the next 3 days)
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const upcomingTasks = tasks.filter(t => {
      if (t.status === "completed" || t.status === "done") return false;
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    }).slice(0, 3);

    return { total, completed, pending, inProgress, overdueTasks, completionRate, productivityScore, totalSubtasks, completedSubtasks: completedSubtasksCount, highPriority, mediumPriority, lowPriority, getPriorityPercent, recentTasks, upcomingTasks };
  }, [tasks]);

  const { completed, pending, inProgress, overdueTasks, completionRate, productivityScore, highPriority, mediumPriority, lowPriority, getPriorityPercent, recentTasks, upcomingTasks } = analytics;

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !onQuickAdd) return;
    onQuickAdd(quickTitle.trim());
    setQuickTitle("");
  };

  return (
    <div className="flex-1 scroll-container px-8 py-8 h-screen animate-fade-in">
      <div className="scroll-indicator-top" />
      <div className="space-y-8">
      
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>Welcome back!</span>
            <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-sm text-muted">You have <span className="text-accent font-bold">{pending + inProgress}</span> tasks to focus on today.</p>
        </div>

        {/* Quick Capture Input */}
        <form onSubmit={handleQuickAddSubmit} className="flex-1 max-w-md w-full relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Zap size={16} className="text-accent group-focus-within:animate-pulse" />
          </div>
          <input
            type="text"
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            placeholder="Quick capture: press Enter to save..."
            className="w-full bg-card/40 backdrop-blur-md border border-border rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 p-1.5 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all opacity-0 group-focus-within:opacity-100"
          >
            <Plus size={16} />
          </button>
        </form>

        <button
          onClick={onAddTaskClick}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/95 shadow-md hover-lift glow-primary transition-all duration-200 shrink-0"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Productivity Score */}
        <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-md glass-panel flex flex-col justify-between hover-lift animate-fade-in group" style={{ animationDelay: "0ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Productivity Score</span>
            <div className="p-2 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all">
              <Zap size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-black tabular-nums tracking-tighter">{productivityScore}</div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${productivityScore}%` }} />
              </div>
              <span className="text-[10px] font-bold text-muted">Goal: 100</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Completion Card */}
        <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-md glass-panel flex flex-col justify-between hover-lift animate-fade-in group" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Tasks Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-black tabular-nums tracking-tighter">{completed}</div>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{completionRate}% of total workload</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Active Focus */}
        <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-md glass-panel flex flex-col justify-between hover-lift animate-fade-in group" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Focus</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-accent group-hover:text-white transition-all">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-black tabular-nums tracking-tighter">{inProgress + pending}</div>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{inProgress} currently in progress</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Overdue Alert */}
        <div className={`p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-md glass-panel flex flex-col justify-between hover-lift animate-fade-in group ${overdueTasks.length > 0 ? "border-red-500/30" : ""}`} style={{ animationDelay: "180ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Overdue Items</span>
            <div className={`p-2 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all ${overdueTasks.length > 0 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-muted/10 text-muted"}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className={`text-4xl font-black tabular-nums tracking-tighter ${overdueTasks.length > 0 ? "text-red-500" : ""}`}>{overdueTasks.length}</div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Requires attention</p>
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side (Two Columns): Active List & Priority breakdown */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Priority Breakdown & Folder Categories cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Priority Progress Bars */}
            <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel space-y-4 animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "backwards" }}>
              <h3 className="text-sm font-bold tracking-tight">Priority Distribution</h3>
              
              <div className="space-y-3.5">
                {/* High Priority */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> High
                    </span>
                    <span className="text-muted font-bold">{highPriority} ({getPriorityPercent(highPriority)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-500" 
                      style={{ width: `${getPriorityPercent(highPriority)}%` }} 
                    />
                  </div>
                </div>

                {/* Medium Priority */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
                    </span>
                    <span className="text-muted font-bold">{mediumPriority} ({getPriorityPercent(mediumPriority)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${getPriorityPercent(mediumPriority)}%` }} 
                    />
                  </div>
                </div>

                {/* Low Priority */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Low
                    </span>
                    <span className="text-muted font-bold">{lowPriority} ({getPriorityPercent(lowPriority)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${getPriorityPercent(lowPriority)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel space-y-4 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "backwards" }}>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <span>Upcoming Deadlines</span>
              </h3>
              {upcomingTasks.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted font-medium italic">No immediate deadlines.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => onTaskClick(task)}
                      className="p-2.5 rounded-xl border border-border/40 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate flex-1">{task.title}</span>
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">Soon</span>
                      </div>
                      <div className="text-[10px] text-muted mt-1 font-semibold">
                        Due {new Date(task.dueDate!).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Detailed Focus Checklist */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel space-y-4 animate-fade-in" style={{ animationDelay: "360ms", animationFillMode: "backwards" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <ClipboardList size={16} className="text-accent" />
                <span>Recent Focus</span>
              </h3>
              <span className="text-[11px] font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full uppercase">Activity Feed</span>
            </div>
            
            {recentTasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Create your first task to start tracking your progress and staying organized."
                actionLabel="Create Task"
                onAction={onAddTaskClick}
                variant="tasks"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {recentTasks.map((task, taskIdx) => {
                  const list = lists.find(l => l.id === task.listId);
                  const isDone = task.status === "completed" || task.status === "done";
                  return (
                    <div 
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/5 px-2 rounded-xl transition-all duration-150 group animate-fade-in"
                      style={{ animationDelay: `${taskIdx * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold truncate ${
                            isDone ? "line-through text-muted" : "text-foreground"
                          }`}>
                            {task.title}
                          </span>
                          {task.priority === "high" && (
                            <span className="px-1.5 py-0.5 text-[11px] font-bold bg-red-500/10 text-red-500 rounded uppercase">high</span>
                          )}
                        </div>
                        <p className="text-xs text-muted truncate max-w-md">
                          {task.description || "No description provided."}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {list && (
                          <span className="text-[11px] font-bold bg-muted/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                            <span>{list.name}</span>
                          </span>
                        )}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side (One Column): Elegant Activity Logs Feed */}
        <div className="space-y-6 flex flex-col h-full">
          
          {/* Overdue Alert Widget (Conditional) */}
          {overdueTasks.length > 0 && (
            <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-xs font-bold text-red-500 uppercase">Action Required</span>
              </div>
              <p className="text-xs text-red-600/80 font-medium leading-relaxed">
                You have {overdueTasks.length} tasks that are past their due date. Address them to stay on track.
              </p>
              <div className="mt-3 space-y-1.5">
                {overdueTasks.slice(0, 2).map(task => (
                  <div key={task.id} className="text-[11px] font-bold text-red-700/60 flex items-center gap-1 truncate">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel flex-1 flex flex-col animate-fade-in overflow-hidden" style={{ animationDelay: "420ms", animationFillMode: "backwards" }}>
            <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
              <Layers size={16} className="text-accent" />
              <span>Activity Trail</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activityLogs.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto">
                    <Layers size={24} className="text-muted/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No activity yet</p>
                    <p className="text-xs text-muted mt-1 max-w-[200px] mx-auto leading-relaxed">
                      Activity will appear here as you work on tasks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative border-l border-border pl-4 ml-2 space-y-5 py-2">
                  {activityLogs.map((log, logIdx) => (
                    <div key={log.id} className="relative text-xs animate-fade-in" style={{ animationDelay: `${logIdx * 50}ms`, animationFillMode: "backwards" }}>
                      {/* Circle Dot Marker */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background shadow-sm shrink-0" />
                      
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{log.action}</div>
                        {log.details && (
                          <p className="text-[11px] text-muted leading-relaxed font-medium">{log.details}</p>
                        )}
                        <div className="text-[11px] text-muted/60 font-semibold uppercase">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      </div>
      <div className="scroll-indicator-bottom" />
    </div>
  );
}

export default React.memo(DashboardView);
