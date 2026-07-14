"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, Zap, Shield, ArrowRight, Trash2, Archive, X, Siren } from "lucide-react";
import { Task } from "@/types";
import { isCompletedStatus } from "@/src/lib/status";

interface StampedeAlertViewProps {
  tasks: Task[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskArchive: (id: number) => void;
}

export default function StampedeAlertView({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskArchive,
}: StampedeAlertViewProps) {
  const [isStampedeMode, setIsStampedeMode] = useState(false);

  // Detect crisis conditions
  const crisisAnalysis = useMemo(() => {
    const incompleteTasks = tasks.filter(t => !isCompletedStatus(t.status));
    const overdueTasks = incompleteTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date()
    );

    // Crisis level detection
    const taskVolume = incompleteTasks.length;
    const overdueVolume = overdueTasks.length;
    const highPriority = incompleteTasks.filter(t => t.priority === "high").length;

    let level: "calm" | "caution" | "warning" | "stampede" = "calm";

    if (taskVolume > 30 || overdueVolume > 10) {
      level = "stampede";
    } else if (taskVolume > 20 || overdueVolume > 5) {
      level = "warning";
    } else if (taskVolume > 10 || overdueVolume > 2) {
      level = "caution";
    }

    // Top critical tasks (overdue + high priority)
    const criticalTasks = [...overdueTasks, ...incompleteTasks.filter(t => t.priority === "high")]
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, 5);

    return {
      level,
      taskVolume,
      overdueVolume,
      criticalTasks,
      panicTasks: incompleteTasks.filter(t => task.title.toLowerCase().includes("urgent")).length,
    };
  }, [tasks]);

  const getAlertColor = () => {
    switch (crisisAnalysis.level) {
      case "stampede": return "bg-red-500/20 border-red-500 text-red-500";
      case "warning": return "bg-amber-500/20 border-amber-500 text-amber-500";
      case "caution": return "bg-blue-500/20 border-blue-500 text-blue-500";
      default: return "bg-emerald-500/20 border-emerald-500 text-emerald-500";
    }
  };

  const handlePanicMode = () => {
    setIsStampedeMode(true);
    // Archive all non-critical tasks
    const criticalIds = new Set(crisisAnalysis.criticalTasks.map(t => t.id));
    tasks.forEach(task => {
      if (!criticalIds.has(task.id) && !isCompletedStatus(task.status)) {
        onTaskArchive(task.id);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">

      {/* Crisis Alert Banner */}
      <div className={`mb-8 p-6 rounded-3xl border ${getAlertColor()} flex items-center gap-4`}>
        <Siren size={32} className="shrink-0" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold capitalize">
            {crisisAnalysis.level} Mode
          </h2>
          <p className="text-sm opacity-80">
            {crisisAnalysis.level === "stampede" && "Emergency! Multiple critical issues detected."}
            {crisisAnalysis.level === "warning" && "Several urgent tasks need attention."}
            {crisisAnalysis.level === "caution" && "Some tasks approaching deadlines."}
            {crisisAnalysis.level === "calm" && "All quiet on the task front!"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Stress Level</div>
          <div className="text-3xl font-black">
            {Math.round((crisisAnalysis.overdueVolume / Math.max(crisisAnalysis.taskVolume, 1)) * 100)}%
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl border border-border bg-card/40 text-center">
          <div className="text-2xl font-bold text-red-500">{crisisAnalysis.overdueVolume}</div>
          <div className="text-xs text-muted uppercase">Overdue</div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 text-center">
          <div className="text-2xl font-bold text-amber-500">{crisisAnalysis.taskVolume}</div>
          <div className="text-xs text-muted uppercase">Total Active</div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/40 text-center">
          <div className="text-2xl font-bold text-accent">{crisisAnalysis.criticalTasks.length}</div>
          <div className="text-xs text-muted uppercase">Critical</div>
        </div>
      </div>

      {/* Critical Tasks First */}
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-red-500" />
          <span>Your Top {crisisAnalysis.criticalTasks.length} Critical Tasks</span>
        </h3>

        {crisisAnalysis.criticalTasks.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border bg-card/40 text-center">
            <Shield size={48} className="text-emerald-500/30 mx-auto mb-2" />
            <p className="text-muted">No critical tasks! Take a breather.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {crisisAnalysis.criticalTasks.map((task, idx) => {
              const isLast = idx === crisisAnalysis.criticalTasks.length - 1;
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isLast ? "border-red-500 bg-red-500/10" : "border-border bg-card/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${
                        isLast ? "text-red-500" : "text-muted"
                      }`}>
                        #{idx + 1}
                      </span>
                      <h4 className="font-medium">{task.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTaskUpdate(task.id, { status: "completed" })}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                        title="Complete task"
                      >
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => onTaskArchive(task.id)}
                        className="p-2 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all"
                        title="Archive task"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={() => onTaskDelete(task.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panic Button */}
      {crisisAnalysis.level !== "calm" && (
        <div className="mt-8">
          <button
            onClick={handlePanicMode}
            className="w-full p-4 rounded-2xl border-2 border-red-500 bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            🚨 Panic Mode: Archive Everything Except Critical Tasks
          </button>
        </div>
      )}

      {/* Panic Mode Exit */}
      {isStampedeMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg">
          <div className="p-8 rounded-3xl border border-accent bg-card/80 max-w-md text-center">
            <Shield size={64} className="text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Calm Restored</h2>
            <p className="text-muted mb-4">
              Non-critical tasks have been archived. Focus on your priority list.
            </p>
            <button
              onClick={() => setIsStampedeMode(false)}
              className="px-6 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all"
            >
              Back to Work
            </button>
          </div>
        </div>
      )}
    </div>
  );
}