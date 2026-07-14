"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Trophy, PartyPopper, Star, Medal, Crown } from "lucide-react";
import { Task, FocusSession } from "@/types";
import { isCompletedStatus } from "@/src/lib/status";

interface ParadeOfProgressProps {
  tasks: Task[];
  focusSessions: FocusSession[];
}

export default function ParadeOfProgress({ tasks, focusSessions }: ParadeOfProgressProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const completedThisWeek = tasks.filter(t => {
      const completedDate = t.completedAt || t.updatedAt;
      return completedDate && isCompletedStatus(t.status) && new Date(completedDate) >= weekAgo;
    });

    const pomodorosThisWeek = focusSessions.filter(s => {
      const sessionDate = new Date(s.startedAt);
      return sessionDate >= weekAgo;
    }).reduce((sum, s) => sum + 1, 0);

    // Achievements
    const achievements: string[] = [];
    if (completedThisWeek.length >= 20) achievements.push("🏆 Task Crusher");
    if (completedThisWeek.length >= 50) achievements.push("🔥 Legend");
    if (pomodorosThisWeek >= 10) achievements.push("🎯 Focus Master");
    if (pomodorosThisWeek >= 25) achievements.push("⚡ Lightning Fast");

    return {
      tasksCompleted: completedThisWeek.length,
      pomodoros: pomodorosThisWeek,
      achievements,
      topPerformer: completedThisWeek.length > 0
        ? completedThisWeek.reduce((max, t) => (t.completedAt ? t : max), completedThisWeek[0])
        : null,
    };
  }, [tasks, focusSessions]);

  // Auto-show on Fridays or when many tasks completed
  useEffect(() => {
    const today = new Date();
    const isFriday = today.getDay() === 5;
    const lotsCompleted = weeklyStats.tasksCompleted >= 10;

    if (isFriday || lotsCompleted) {
      setIsVisible(true);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [weeklyStats.tasksCompleted]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg">
      <div className="relative w-full max-w-2xl p-8 rounded-3xl border border-accent bg-card/60 overflow-hidden">

        {/* Confetti effect */}
        {showConfetti && (
          <ConfettiEffect />
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <PartyPopper size={48} className="text-accent mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2">Weekly Parade of Progress!</h2>
          <p className="text-muted">
            Celebrating your accomplishments this week 🎉
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-accent/10 text-center">
            <div className="text-4xl font-black text-accent">{weeklyStats.tasksCompleted}</div>
            <p className="text-sm font-medium text-muted uppercase">Tasks Completed</p>
          </div>

          <div className="p-6 rounded-2xl bg-amber-500/10 text-center">
            <div className="text-4xl font-black text-amber-500">{weeklyStats.pomodoros}</div>
            <p className="text-sm font-medium text-muted uppercase">Focus Sessions</p>
          </div>
        </div>

        {/* Achievements */}
        {weeklyStats.achievements.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Crown size={20} className="text-amber-500" />
              <span>Recent Achievements</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {weeklyStats.achievements.map(achievement => (
                <span
                  key={achievement}
                  className="px-4 py-2 rounded-full bg-accent/10 text-accent font-bold text-sm animate-pulse"
                >
                  {achievement}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top performer task */}
        {weeklyStats.topPerformer && (
          <div className="p-4 rounded-xl border border-border bg-background/40 mb-6">
            <p className="text-xs text-muted uppercase mb-1">Top Task</p>
            <p className="font-bold">{weeklyStats.topPerformer.title}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setIsVisible(false)}
            className="px-6 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all"
          >
            Continue Planning
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              localStorage.setItem("last-parade", new Date().toISOString());
            }}
            className="px-6 py-3 rounded-xl border border-border text-muted font-bold hover:text-foreground transition-all"
          >
            Don't Show Again
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => {
        const colors = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"];
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 3;
        const size = 4 + Math.random() * 8;

        return (
          <div
            key={i}
            className="absolute w-1 h-3 animate-confetti"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              width: `${size}px`,
              height: `${size * 2}px`,
              animationDelay: `${animationDelay}s`,
              borderRadius: "2px",
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s linear infinite;
        }
      `}</style>
    </div>
  );
}