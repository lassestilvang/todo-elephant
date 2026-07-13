"use client";

import React, { useState, useEffect } from "react";
import { Users, Share2, UserPlus, MessageCircle, Calendar, Zap, CheckCircle2 } from "lucide-react";
import { Task, List, Label, FocusSession } from "@/types";

interface CollaborationViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  focusSessions: FocusSession[];
}

export default function CollaborationView({ tasks, lists, focusSessions }: CollaborationViewProps) {
  const [activeUsers, setActiveUsers] = useState(3);
  const [sharedStreak, setSharedStreak] = useState(0);

  // Calculate shared task streak
  useEffect(() => {
    const sharedTasks = tasks.filter(t => (t as any).sharedWith?.length);
    const dates = sharedTasks
      .map(t => (t as any).lastEditedBy?.at || t.updatedAt)
      .filter(Boolean)
      .map((d: string) => d.split("T")[0])
      .sort((a, b) => (a < b ? 1 : -1));

    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length === 0) {
      setSharedStreak(0);
      return;
    }

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    setSharedStreak(streak);
  }, [tasks]);

  // Mock team members
  const teamMembers = [
    { id: "1", name: "Alex Chen", avatar: "AC", online: true, tasks: 12 },
    { id: "2", name: "Sam Rivera", avatar: "SR", online: true, tasks: 8 },
    { id: "3", name: "Taylor Kim", avatar: "TK", online: false, tasks: 5 },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users size={24} className="text-accent" />
          <span>Team Collaboration</span>
        </h2>
        <p className="text-sm text-muted mt-1">Share tasks, collaborate in real-time, and track team progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md text-center">
          <Users size={32} className="text-accent mx-auto mb-3" />
          <div className="text-3xl font-black">{activeUsers}</div>
          <p className="text-xs font-bold text-muted uppercase">Active Collaborators</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md text-center">
          <Share2 size={32} className="text-emerald-500 mx-auto mb-3" />
          <div className="text-3xl font-black">{sharedStreak}</div>
          <p className="text-xs font-bold text-muted uppercase">Shared Streak (days)</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md text-center">
          <Zap size={32} className="text-amber-500 mx-auto mb-3" />
          <div className="text-3xl font-black">{focusSessions.filter(s => s.completedEarly).length}</div>
          <p className="text-xs font-bold text-muted uppercase">Early Completions</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-accent" />
          <span>Team Members</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => (
            <div key={member.id} className="p-4 rounded-xl border border-border bg-card/40 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold">
                  {member.avatar}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                  member.online ? "bg-emerald-500" : "bg-muted"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{member.name}</div>
                <div className="text-xs text-muted">{member.tasks} tasks</div>
              </div>
              <button className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors">
                <MessageCircle size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Tasks */}
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Share2 size={20} className="text-accent" />
          <span>Shared Tasks</span>
        </h3>

        <div className="space-y-3">
          {tasks
            .filter((t: any) => t.sharedWith?.length)
            .slice(0, 5)
            .map(task => (
              <div key={task.id} className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{task.title}</div>
                  <div className="text-xs text-muted mt-1">
                    Shared with {(task as any).sharedWith?.length} collaborator(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-muted">
                    {(task as any).completedPomodoros ?? 0} sessions
                  </span>
                </div>
              </div>
            ))}

          {tasks.filter((t: any) => t.sharedWith?.length).length === 0 && (
            <div className="p-12 rounded-2xl border border-border bg-card/25 text-center">
              <Share2 size={48} className="text-muted/30 mx-auto mb-4" />
              <p className="text-sm font-semibold text-foreground">No shared tasks yet</p>
              <p className="text-xs text-muted mt-1">Share tasks with your team to collaborate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}