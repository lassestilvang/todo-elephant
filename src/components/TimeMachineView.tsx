"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Clock, RotateCcw, ArrowLeft, ArrowRight, History } from "lucide-react";
import { Task } from "@/types";

interface TimeMachineViewProps {
  tasks: Task[];
}

export default function TimeMachineView({ tasks }: TimeMachineViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"snapshot" | "timeline">("snapshot");

  // Filter tasks for selected date (based on creation, completion, or due date)
  const snapshotTasks = useMemo(() => {
    return tasks.filter(task => {
      const dateStr = task.dueDate || task.createdAt;
      if (!dateStr) return false;
      return dateStr.startsWith(selectedDate);
    });
  }, [tasks, selectedDate]);

  // Generate timeline of task activity
  const timeline = useMemo(() => {
    const events: { date: string; task: Task; type: string }[] = [];
    tasks.forEach(task => {
      if (task.createdAt.startsWith(selectedDate)) {
        events.push({ date: task.createdAt, task, type: "created" });
      }
      if (task.completedAt && task.completedAt.startsWith(selectedDate)) {
        events.push({ date: task.completedAt, task, type: "completed" });
      }
      if (task.dueDate && task.dueDate.startsWith(selectedDate)) {
        events.push({ date: task.dueDate, task, type: "due" });
      }
    });
    return events.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [tasks, selectedDate]);

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    if (direction === "prev") {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <History size={24} className="text-accent" />
              <span>Time Machine</span>
            </h2>
            <p className="text-sm text-muted mt-1">View your task system on any date in the past.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "snapshot" ? "timeline" : "snapshot")}
              className="px-4 py-2 rounded-xl border border-border text-muted hover:text-foreground transition-all"
            >
              {viewMode === "snapshot" ? "Timeline View" : "Snapshot View"}
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 rounded-xl border border-border text-muted hover:text-foreground transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-lg font-bold bg-card/40 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => navigateDate("next")}
            className="p-2 rounded-xl border border-border text-muted hover:text-foreground transition-all"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {viewMode === "snapshot" ? (
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={18} className="text-accent" />
            <span>State on {selectedDate}</span>
          </h3>

          {snapshotTasks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
              <History size={48} className="text-muted/30 mx-auto mb-4" />
              <p className="text-muted font-medium">No task activity on this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshotTasks.map(task => (
                <div key={task.id} className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
                  <h4 className="font-bold text-sm">{task.title}</h4>
                  <p className="text-xs text-muted line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full ${
                      task.status === "completed" ? "bg-emerald-500/20 text-emerald-500" :
                      task.status === "in-progress" ? "bg-amber-500/20 text-amber-500" :
                      "bg-blue-500/20 text-blue-500"
                    }`}>
                      {task.status}
                    </span>
                    {task.priority && (
                      <span className={`px-2 py-0.5 rounded-full ${
                        task.priority === "high" ? "bg-red-500/20 text-red-500" :
                        task.priority === "medium" ? "bg-amber-500/20 text-amber-500" :
                        "bg-blue-500/20 text-blue-500"
                      }`}>
                        {task.priority} priority
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            <span>Activity Timeline</span>
          </h3>

          {timeline.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
              <History size={48} className="text-muted/30 mx-auto mb-4" />
              <p className="text-muted font-medium">No activity logged for this date.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-border pl-6 space-y-6">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-8 top-1 w-4 h-4 rounded-full bg-accent border-4 border-background" />
                  <span className="text-[10px] font-bold text-muted uppercase">{event.type}</span>
                  <p className="text-sm font-semibold mt-1">{event.task.title}</p>
                  <p className="text-[11px] text-muted">{new Date(event.date).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}