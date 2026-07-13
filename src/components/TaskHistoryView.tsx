"use client";

import React, { useMemo } from "react";
import { History, GitCompare, RefreshCw, FileText } from "lucide-react";
import { Task } from "@/types";
import { extractTaskHistory, analyzeTitleEvolution } from "@/src/lib/taskHistory";

interface TaskHistoryViewProps {
  tasks: Task[];
}

export default function TaskHistoryView({ tasks }: TaskHistoryViewProps) {
  const history = useMemo(() => extractTaskHistory(tasks), [tasks]);
  const significantTasks = useMemo(
    () => tasks.filter(t => (history.get(t.id)?.length ?? 0) >= 2),
    [tasks, history]
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History size={24} className="text-accent" />
          <span>Task Archaeology</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          See how your tasks evolved over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {significantTasks.slice(0, 6).map(task => {
          const taskHistory = history.get(task.id) ?? [];
          const titleEvolution = analyzeTitleEvolution(task.id, history);

          return (
            <div key={task.id} className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <FileText size={16} className="text-accent" />
                </div>
                <h3 className="font-bold truncate">{task.title}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Status Changes</span>
                  <span className="font-semibold">{taskHistory.length}</span>
                </div>

                {titleEvolution && titleEvolution.changes.length > 0 && (
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="text-xs font-bold text-muted mb-2">Title Evolution</div>
                    <div className="space-y-2">
                      {titleEvolution.changes.slice(0, 3).map((change, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <GitCompare size={12} className="text-accent shrink-0" />
                          <span className="line-through text-muted/60 truncate">{change.from || "original"}</span>
                          <span className="text-accent">→</span>
                          <span className="truncate">{change.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <RefreshCw size={12} className="text-muted" />
                  <span className="text-[10px] text-muted">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {significantTasks.length === 0 && (
          <div className="lg:col-span-2 p-12 rounded-2xl border border-border bg-card/25 text-center">
            <History size={48} className="text-muted/30 mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground">No task history yet</p>
            <p className="text-xs text-muted mt-1">
              As you modify and complete tasks, their history will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}