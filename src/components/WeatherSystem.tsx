"use client";

import React, { useMemo } from "react";
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake } from "lucide-react";
import { Task } from "@/types";

interface WeatherSystemProps {
  tasks: Task[];
}

type WeatherType = "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy";

export default function WeatherSystem({ tasks }: WeatherSystemProps) {
  const weather = useMemo(() => {
    const incompleteTasks = tasks.filter(
      t => t.status !== "completed" && t.status !== "done"
    );
    const overdueTasks = incompleteTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date()
    );
    const dueToday = incompleteTasks.filter(t => {
      if (!t.dueDate) return false;
      const today = new Date().toISOString().split("T")[0];
      return t.dueDate.startsWith(today);
    });
    const highPriority = incompleteTasks.filter(t => t.priority === "high");

    // Determine weather based on task pressure
    if (overdueTasks.length > 3) return "stormy";
    if (overdueTasks.length > 0 || (dueToday.length > 5 && highPriority.length > 2)) return "rainy";
    if (dueToday.length > 2 || highPriority.length > 3) return "cloudy";
    if (dueToday.length > 0) return "partly-cloudy";
    return "sunny";
  }, [tasks]);

  const weatherConfig = {
    sunny: {
      icon: Sun,
      color: "text-amber-400",
      message: "All caught up! Enjoy the sunshine.",
      bgOpacity: "opacity-20",
    },
    "partly-cloudy": {
      icon: Cloud,
      color: "text-slate-400",
      message: "Some tasks on the horizon...",
      bgOpacity: "opacity-30",
    },
    cloudy: {
      icon: Cloud,
      color: "text-slate-500",
      message: "Storm clouds approaching - prioritize your tasks!",
      bgOpacity: "opacity-40",
    },
    rainy: {
      icon: CloudRain,
      color: "text-blue-400",
      message: "Overdue tasks need attention.",
      bgOpacity: "opacity-50",
    },
    stormy: {
      icon: CloudLightning,
      color: "text-purple-400",
      message: "Emergency mode - tackle the most critical task first!",
      bgOpacity: "opacity-60",
    },
  };

  const config = weatherConfig[weather];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Animated background based on weather */}
      <div className={`absolute inset-0 bg-gradient-to-b from-sky-300 via-white to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 ${config.bgOpacity} transition-all duration-1000`} />

      {/* Weather particles animation */}
      {weather === "rainy" && (
        <RainAnimation />
      )}
      {weather === "stormy" && (
        <StormAnimation />
      )}

      {/* Weather indicator in corner */}
      <div className="fixed bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-card/60 backdrop-blur-md border border-border">
        <Icon size={18} className={config.color} />
        <span className="text-xs font-medium text-muted">{config.message}</span>
      </div>
    </div>
  );
}

function RainAnimation() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-8 bg-blue-400/30 rounded-full animate-fall"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${0.5 + Math.random() * 1}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          from { transform: translateY(-100px); }
          to { transform: translateY(100vh); }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

function StormAnimation() {
  return (
    <div className="absolute inset-0">
      {/* Lightning flashes */}
      <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
      {/* Rain + wind effect */}
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-10 bg-purple-300/40 rounded-full animate-storm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes storm {
          0% { transform: translate(-100px, -100px) rotate(15deg); }
          100% { transform: translate(200px, 100vh) rotate(15deg); }
        }
        .animate-storm {
          animation-name: storm;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}