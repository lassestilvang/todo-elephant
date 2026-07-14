"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Users, UserPlus, Share2, MessageCircle, Bell, Zap, Crown, Shield } from "lucide-react";
import { Task, List } from "@/types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "focusing";
  currentTaskId?: number;
  lastSeen: string;
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  sharedTasks: number[]; // task IDs
  createdAt: string;
}

interface HerdTeamsViewProps {
  tasks: Task[];
  lists: List[];
}

// Mock presence data - in production, this would use WebSockets
const mockPresence: Record<string, TeamMember[]> = {
  "engineering": [
    { id: "1", name: "Lasse", email: "lasse@example.com", status: "online", lastSeen: new Date().toISOString() },
    { id: "2", name: "Alex", email: "alex@example.com", status: "focusing", currentTaskId: 123, lastSeen: new Date().toISOString() },
    { id: "3", name: "Sam", email: "sam@example.com", status: "away", lastSeen: new Date().toISOString() },
  ],
  "design": [
    { id: "4", name: "Taylor", email: "taylor@example.com", status: "online", lastSeen: new Date().toISOString() },
    { id: "5", name: "Jordan", email: "jordan@example.com", status: "offline", lastSeen: "2026-07-21T10:00:00.000Z" },
  ],
};

export default function HerdTeamsView({ tasks, lists }: HerdTeamsViewProps) {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem("todo-elephant-teams");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Initialize with mock teams
    return [
      {
        id: "engineering",
        name: "🐘 Engineering Herd",
        members: mockPresence.engineering,
        sharedTasks: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: "design",
        name: "🎨 Design Herd",
        members: mockPresence.design,
        sharedTasks: [],
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(teams[0] || null);
  const [showInvite, setShowInvite] = useState(false);

  // Simulate presence updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTeams(prev => prev.map(team => ({
        ...team,
        members: team.members.map(member => ({
          ...member,
          status: Math.random() > 0.7 ? "focusing" : Math.random() > 0.4 ? "online" : "away",
        })),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const teamStats = useMemo(() => {
    if (!selectedTeam) return null;

    const sharedTasksList = tasks.filter(t => selectedTeam.sharedTasks.includes(t.id));
    const completedShared = sharedTasksList.filter(
      t => t.status === "completed" || t.status === "done"
    ).length;

    return {
      totalTasks: sharedTasksList.length,
      completed: completedShared,
      activeMembers: selectedTeam.members.filter(m => m.status === "online" || m.status === "focusing").length,
    };
  }, [selectedTeam, tasks]);

  const shareTask = (taskId: number) => {
    if (!selectedTeam) return;
    setTeams(teams.map(t =>
      t.id === selectedTeam.id
        ? { ...t, sharedTasks: [...new Set([...t.sharedTasks, taskId])] }
        : t
    ));
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden animate-fade-in">

      {/* Teams Sidebar */}
      <div className="w-80 border-r border-border bg-card/40 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users size={20} className="text-accent" />
            Your Herds
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                selectedTeam?.id === team.id
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card/40 hover:bg-card/60"
              }`}
            >
              <div className="font-bold mb-2">{team.name}</div>
              <div className="flex items-center gap-1">
                <Users size={14} className="text-muted" />
                <span className="text-xs text-muted">
                  {team.members.length} members
                </span>
                <div className="flex-1" />
                {team.members.filter(m => m.status === "online" || m.status === "focusing").length > 0 && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowInvite(true)}
          className="m-3 p-3 rounded-xl bg-accent/10 text-accent font-bold flex items-center justify-center gap-2 hover:bg-accent/20 transition-all"
        >
          <UserPlus size={16} />
          Create Herd
        </button>
      </div>

      {/* Main Team View */}
      <div className="flex-1 flex flex-col p-8">

        {selectedTeam ? (
          <>
            {/* Team Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{selectedTeam.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>{teamStats?.totalTasks ?? 0} shared tasks</span>
                <span>{teamStats?.completed ?? 0} completed</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {teamStats?.activeMembers ?? 0} active
                </span>
              </div>
            </div>

            {/* Members Grid */}
            <div className="mb-8">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted mb-3">
                Herd Members
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedTeam.members.map(member => {
                  const StatusIcon = getStatusIcon(member.status);
                  const statusColor = getStatusColor(member.status);

                  return (
                    <div
                      key={member.id}
                      className="p-4 rounded-xl border border-border bg-card/40 text-center"
                    >
                      <div className="relative w-12 h-12 mx-auto mb-2">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-accent">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${statusColor} flex items-center justify-center`}>
                          <StatusIcon size={12} className="text-white" />
                        </div>
                      </div>
                      <div className="font-bold text-sm">{member.name}</div>
                      {member.currentTaskId && (
                        <div className="text-[10px] text-muted mt-1">
                          Working on task #{member.currentTaskId}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shared Tasks */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted mb-3">
                Shared Tasks
              </h3>
              <div className="space-y-2">
                {tasks.filter(t => selectedTeam.sharedTasks.includes(t.id)).map(task => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-border bg-card/40 flex items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "completed" || task.status === "done"}
                      readOnly
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="flex-1">{task.title}</span>
                    <Share2 size={14} className="text-muted" />
                  </div>
                ))}

                <div className="p-4 rounded-xl border border-dashed border-border bg-card/25">
                  <button
                    onClick={() => {
                      const taskId = window.prompt("Enter task ID to share:");
                      if (taskId) shareTask(Number(taskId));
                    }}
                    className="flex items-center gap-2 text-sm text-muted hover:text-accent"
                  >
                    <Plus size={14} />
                    Share a task with this herd
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Users size={64} className="text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-muted mb-2">Select a herd to collaborate</h3>
              <p className="text-sm text-muted/60">
                Create or join herds to work together on tasks
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onCreate={team => setTeams([...teams, team])}
        />
      )}
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "online": return Zap;
    case "focusing": return Shield;
    case "away": return Moon;
    default: return Moon;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "online": return "bg-emerald-500";
    case "focusing": return "bg-accent";
    case "away": return "bg-amber-500";
    default: return "bg-slate-500";
  }
}

interface InviteModalProps {
  onClose: () => void;
  onCreate: (team: Team) => void;
}

function InviteModal({ onClose, onCreate }: InviteModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name,
      members: [{
        id: crypto.randomUUID(),
        name: email.split("@")[0] || "You",
        email,
        status: "online",
        lastSeen: new Date().toISOString(),
      }],
      sharedTasks: [],
      createdAt: new Date().toISOString(),
    };

    onCreate(newTeam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-card/90 space-y-4">
        <h3 className="text-xl font-bold">Create New Herd</h3>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Herd Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Engineering Elephants"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Your Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@herd.com"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-accent text-white font-bold hover:bg-accent/90 transition-all"
          >
            Create Herd
          </button>
        </div>
      </div>
    </div>
  );
}