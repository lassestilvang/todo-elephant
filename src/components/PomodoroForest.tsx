"use client";

import React, { useMemo } from "react";
import { TreePine, Leaf, Flower, Sprout, Apple, Cherry } from "lucide-react";
import { Task } from "@/types";
import { Flower2, TreeDeciduous } from "lucide-react";

interface PomodoroForestProps {
  tasks: Task[];
}

interface Tree {
  x: number;
  y: number;
  size: number;
  icon: "sprout" | "leaf" | "flower" | "apple" | "cherry" | "tree";
  count: number;
}

export default function PomodoroForest({ tasks }: PomodoroForestProps) {
  // Calculate forest density based on Pomodoro completions
  const trees = useMemo(() => {
    const totalPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros ?? 0), 0);
    const completedTasks = tasks.filter(t => t.status === "completed").length;

    const treeCount = Math.floor(totalPomodoros / 5); // One tree per 5 pomodoros
    const maxSize = 6; // Maximum trees in a cluster

    const forest: Tree[] = [];
    let remaining = treeCount;

    // Generate tree clusters
    while (remaining > 0) {
      const clusterSize = Math.min(maxSize, Math.floor(Math.random() * 3) + 1);
      const baseX = Math.random() * 400 + 50;
      const baseY = Math.random() * 200 + 100;

      for (let i = 0; i < Math.min(clusterSize, remaining); i++) {
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 40;

        let icon: Tree["icon"] = "sprout";
        if (remaining > 20) icon = "tree";
        else if (remaining > 10) icon = "flower";
        else if (remaining > 5) icon = "leaf";
        else icon = "sprout";

        forest.push({
          x: baseX + offsetX,
          y: baseY + offsetY,
          size: remaining > 15 ? 2 : remaining > 8 ? 1.5 : 1,
          icon,
          count: remaining,
        });
        remaining--;
      }
    }

    return forest;
  }, [tasks]);

  const totalPomodoros = tasks.reduce((sum, t) => sum + (t.completedPomodoros ?? 0), 0);

  const renderTree = (tree: Tree, idx: number) => {
    const size = tree.size * 24;
    let color = "#3b82f6"; // Default blue

    switch (tree.icon) {
      case "sprout":
        color = "#10b981";
        break;
      case "leaf":
        color = "#059669";
        break;
      case "flower":
        color = "#8b5cf6";
        break;
      case "apple":
        color = "#ef4444";
        break;
      case "cherry":
        color = "#ec4899";
        break;
      case "tree":
        color = "#065f46";
        break;
    }

    return (
      <g key={idx}>
        <circle cx={tree.x} cy={tree.y} r={size / 2} fill="none" />
        <g transform={`translate(${tree.x - size / 2}, ${tree.y - size / 2})`}>
          {tree.icon === "sprout" && <Sprout size={size} color={color} />}
          {tree.icon === "leaf" && <Leaf size={size} color={color} />}
          {tree.icon === "flower" && <Flower2 size={size} color={color} />}
          {tree.icon === "apple" && <Apple size={size} color={color} />}
          {tree.icon === "cherry" && <Cherry size={size} color={color} />}
          {tree.icon === "tree" && <TreeDeciduous size={size} color={color} />}
        </g>
      </g>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TreePine size={24} className="text-emerald-500" />
          <span>Pomodoro Forest</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          Your forest grows with every focus session you complete.
        </p>
      </div>

      <div className="flex-1 relative">
        <svg viewBox="0 0 800 600" className="w-full h-full rounded-2xl border border-border bg-card/25">
          {/* Ground */}
          <path d="M0 500 L800 500 L800 600 L0 600 Z" fill="#065f46" opacity={0.2} />

          {/* Trees */}
          {trees.map(renderTree)}

          {/* Sun in background */}
          <circle cx={650} cy={80} r={40} fill="#f59e0b" opacity={0.2} />
        </svg>

        <div className="absolute top-4 right-4 p-4 rounded-xl bg-card/40 backdrop-blur-md border border-border">
          <div className="text-xs font-bold text-muted uppercase mb-1">Forest Stats</div>
          <div className="text-2xl font-black text-foreground">{totalPomodoros}</div>
          <div className="text-xs text-muted">Pomodoros planted</div>
        </div>
      </div>
    </div>
  );
}