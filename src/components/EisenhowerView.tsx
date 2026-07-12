"use client";

import React, { useMemo, useState } from "react";
import {
  Zap,
  Clock,
  Users,
  Trash2,
  Target,
  AlertCircle,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { Task } from "@/types";

interface EisenhowerViewProps {
  tasks: Task[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onFocusTask: (id: number) => void;
  onTaskDelete: (id: number) => void;
}

const quadrantConfig = {
  urgentImportant: { isUrgent: true, isImportant: true },
  importantNotUrgent: { isUrgent: false, isImportant: true },
  urgentNotImportant: { isUrgent: true, isImportant: false },
  neither: { isUrgent: false, isImportant: false },
};

export default function EisenhowerView({
  tasks,
  onTaskUpdate,
  onTaskClick,
  onFocusTask,
  onTaskDelete
}: EisenhowerViewProps) {

  // Drag and drop state for quadrant reassignment
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);

  const quadrants = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "done" && t.status !== "archived");

    return {
      urgentImportant: activeTasks.filter(t => t.isUrgent && t.isImportant),
      importantNotUrgent: activeTasks.filter(t => !t.isUrgent && t.isImportant),
      urgentNotImportant: activeTasks.filter(t => t.isUrgent && !t.isImportant),
      neither: activeTasks.filter(t => !t.isUrgent && !t.isImportant)
    };
  }, [tasks]);

  // Drag and drop handlers
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, quadrantId: string) => {
    e.preventDefault();
    setDragOverQuadrant(quadrantId);
  };

  const handleDrop = (e: React.DragEvent, quadrantId: string) => {
    e.preventDefault();
    setDragOverQuadrant(null);

    if (draggedTask) {
      const config = quadrantConfig[quadrantId as keyof typeof quadrantConfig];
      onTaskUpdate(draggedTask.id, config);
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverQuadrant(null);
  };

  const Quadrant = ({
    title,
    subtitle,
    items,
    icon: Icon,
    colorClass,
    bgClass,
    action,
    quadrantId
  }: {
    title: string;
    subtitle: string;
    items: Task[];
    icon: any;
    colorClass: string;
    bgClass: string;
    action: string;
    quadrantId: keyof typeof quadrantConfig;
  }) => {
    const isDragOver = dragOverQuadrant === quadrantId;

    return (
      <div
        onDragOver={(e) => handleDragOver(e, quadrantId)}
        onDragLeave={() => setDragOverQuadrant(null)}
        onDrop={(e) => handleDrop(e, quadrantId)}
        className={`flex flex-col h-full rounded-3xl border border-border/60 ${bgClass} backdrop-blur-md overflow-hidden animate-fade-in group transition-all ${
          isDragOver ? "ring-2 ring-accent scale-[1.02]" : ""
        }`}
      >
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${colorClass} text-white shadow-lg`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">{title}</h3>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-muted/20 px-2 py-0.5 rounded-full">{items.length}</span>
            <p className="text-[9px] text-accent font-bold uppercase mt-0.5">{action}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
              <Icon size={32} className="mb-2" />
              <p className="text-xs font-medium italic">Empty quadrant</p>
              {isDragOver && (
                <p className="text-[10px] text-accent font-semibold mt-2">Drop here to assign</p>
              )}
            </div>
          ) : (
            items.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("taskId", task.id.toString());
                  handleDragStart(task);
                }}
                onDragEnd={handleDragEnd}
                onClick={() => onTaskClick(task)}
                className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-accent/40 transition-all cursor-pointer group/card hover:shadow-md relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-bold leading-tight line-clamp-2 flex-1 group-hover/card:text-accent transition-colors">
                    {task.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskUpdate(task.id, { status: "completed" });
                    }}
                    className="w-5 h-5 rounded-full border-2 border-border hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center transition-all shrink-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-emerald-500/20" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {task.dueDate && (
                    <span className="text-[9px] font-bold text-muted flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <div className="flex gap-1 ml-auto opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onFocusTask(task.id); }}
                      className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all"
                      title="Focus"
                    >
                      <Target size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Eisenhower Matrix</h2>
          <p className="text-sm text-muted mt-1 italic">Prioritize by importance and urgency. Don't just do things, do the <span className="text-accent font-bold">right</span> things.</p>
        </div>
        <div className="flex items-center gap-4 bg-card/40 border border-border/60 p-4 rounded-3xl backdrop-blur-xl">
          <div className="text-center">
            <p className="text-[10px] font-black text-muted uppercase">Strategy</p>
            <p className="text-xs font-bold text-accent">Efficiency Focus</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div className="text-center">
            <p className="text-[10px] font-black text-muted uppercase">Active</p>
            <p className="text-xs font-bold">{tasks.filter(t => t.status !== "completed" && t.status !== "done").length} Tasks</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
        <Quadrant
          title="Do First"
          subtitle="Urgent & Important"
          items={quadrants.urgentImportant}
          icon={Zap}
          colorClass="bg-red-500"
          bgClass="bg-red-500/[0.03]"
          action="Execute Immediately"
          quadrantId="urgentImportant"
        />
        <Quadrant
          title="Schedule"
          subtitle="Not Urgent & Important"
          items={quadrants.importantNotUrgent}
          icon={Clock}
          colorClass="bg-blue-500"
          bgClass="bg-blue-500/[0.03]"
          action="Plan for later"
          quadrantId="importantNotUrgent"
        />
        <Quadrant
          title="Delegate"
          subtitle="Urgent & Not Important"
          items={quadrants.urgentNotImportant}
          icon={Users}
          colorClass="bg-amber-500"
          bgClass="bg-amber-500/[0.03]"
          action="Minimize or Outsource"
          quadrantId="urgentNotImportant"
        />
        <Quadrant
          title="Eliminate"
          subtitle="Not Urgent & Not Important"
          items={quadrants.neither}
          icon={AlertCircle}
          colorClass="bg-slate-500"
          bgClass="bg-slate-500/[0.03]"
          action="Ignore or Automate"
          quadrantId="neither"
        />
      </div>
    </div>
  );
}