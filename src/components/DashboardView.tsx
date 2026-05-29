"use client";

import React, { useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Plus, 
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { Task, List, ActivityLog } from "@/types";
import EmptyState from "./EmptyState";

interface DashboardViewProps {
  tasks: Task[];
  lists: List[];
  activityLogs: ActivityLog[];
  onAddTaskClick: () => void;
  onTaskClick: (task: Task) => void;
}

function DashboardView({
  tasks,
  lists,
  activityLogs,
  onAddTaskClick,
  onTaskClick
}: DashboardViewProps) {
  
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

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let totalSubtasks = 0;
    let completedSubtasks = 0;
    tasks.forEach(t => {
      if (t.subtasks) {
        totalSubtasks += t.subtasks.length;
        completedSubtasks += t.subtasks.filter(s => s.completed).length;
      }
    });

    const highPriority = tasks.filter(t => t.priority === "high").length;
    const mediumPriority = tasks.filter(t => t.priority === "medium").length;
    const lowPriority = tasks.filter(t => t.priority === "low").length;

    const getPriorityPercent = (count: number) => {
      return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    const recentTasks = tasks.slice(0, 5);

    return { total, completed, pending, inProgress, overdueTasks, completionRate, totalSubtasks, completedSubtasks, highPriority, mediumPriority, lowPriority, getPriorityPercent, recentTasks };
  }, [tasks]);

  const { completed, pending, inProgress, overdueTasks, completionRate, totalSubtasks, completedSubtasks, highPriority, mediumPriority, lowPriority, getPriorityPercent, recentTasks } = analytics;

  return (
    <div className="flex-1 scroll-container px-8 py-8 h-screen animate-fade-in">
      <div className="scroll-indicator-top" />
      <div className="space-y-8">
      
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-muted">Here is an elegant overview of your daily task progress.</p>
        </div>
        <button
          onClick={onAddTaskClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/95 shadow-md hover-lift glow-primary transition-all duration-200 shrink-0"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Completion Card */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase">Completion Rate</span>
            <div className="text-3xl font-extrabold">{completionRate}%</div>
            <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-0.5">
              <CheckCircle2 size={10} />
              <span>{completed} completed tasks</span>
            </p>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 radial-progress-ring">
              <circle
                className="text-border/40"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="22"
                cx="28"
                cy="28"
              />
              <circle
                className="text-accent transition-all duration-500"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionRate / 100)}`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="22"
                cx="28"
                cy="28"
              />
            </svg>
            <span className="absolute text-[11px] font-bold">{completionRate}%</span>
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase">In Progress</span>
            <div className="text-3xl font-extrabold">{inProgress + pending}</div>
            <p className="text-[11px] text-amber-500 font-bold flex items-center gap-0.5">
              <Clock size={10} />
              <span>{inProgress} active task states</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
        </div>

        {/* Metric 3: Overdue */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase">Overdue Tasks</span>
            <div className={`text-3xl font-extrabold ${overdueTasks.length > 0 ? "text-red-500" : ""}`}>
              {overdueTasks.length}
            </div>
            <p className="text-[11px] text-muted font-medium">Needs immediate focus</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            overdueTasks.length > 0 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-muted/10 text-muted"
          }`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Metric 4: Subtasks */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase">Subtasks Done</span>
            <div className="text-3xl font-extrabold">
              {completedSubtasks}<span className="text-sm font-semibold text-muted">/{totalSubtasks}</span>
            </div>
            <p className="text-[11px] text-blue-500 font-bold flex items-center gap-0.5">
              <ClipboardList size={10} />
              <span>Checklist efficiency</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ClipboardList size={24} />
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
            <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel space-y-4">
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

            {/* Folder / List Quick Cards */}
            <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel space-y-4">
              <h3 className="text-sm font-bold tracking-tight">Active Folders</h3>
              <div className="grid grid-cols-2 gap-3">
                {lists.map(list => {
                  const listTasks = tasks.filter(t => t.listId === list.id);
                  const listIncomplete = listTasks.filter(t => t.status !== "completed" && t.status !== "done" && t.status !== "archived").length;
                  return (
                    <div 
                      key={list.id} 
                      className="p-3 rounded-xl border border-border/60 bg-muted/10 flex flex-col justify-between hover-lift relative overflow-hidden"
                    >
                      <span className="absolute top-0 right-0 w-12 h-12 opacity-5 rounded-full" style={{ backgroundColor: list.color }} />
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                        <span className="text-xs font-bold truncate">{list.name}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-extrabold">{listIncomplete}</span>
                        <span className="text-[11px] font-semibold text-muted uppercase">remaining</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Detailed High Priority Tasks / Checklist */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <ClipboardList size={16} className="text-accent" />
                <span>Immediate Priority Focus</span>
              </h3>
              <span className="text-[11px] font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full uppercase">Top Checklist</span>
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
                {recentTasks.map(task => {
                  const list = lists.find(l => l.id === task.listId);
                  const isDone = task.status === "completed" || task.status === "done";
                  return (
                    <div 
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/5 px-2 rounded-xl transition-all duration-150 group"
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
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel flex flex-col h-[540px]">
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
                {activityLogs.map((log) => (
                  <div key={log.id} className="relative text-xs">
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
      <div className="scroll-indicator-bottom" />
    </div>
  );
}

export default React.memo(DashboardView);
