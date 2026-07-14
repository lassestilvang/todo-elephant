"use client";

import React, { useState, useMemo } from "react";
import { Moon, Sun, Bed, Clock, Zap, Heart, Brain, TrendingUp, Plus } from "lucide-react";
import { Task, FocusSession } from "@/types";

interface SleepData {
  date: string;
  hoursSlept: number;
  quality: number; // 1-10
  deepSleepMinutes: number;
}

interface SleepIntegrationViewProps {
  tasks: Task[];
  focusSessions: FocusSession[];
}

export default function SleepIntegrationView({ tasks, focusSessions }: SleepIntegrationViewProps) {
  const [sleepData, setSleepData] = useState<SleepData[]>(() => {
    const saved = localStorage.getItem("todo-elephant-sleep");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showAddSleep, setShowAddSleep] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Correlate sleep with productivity
  const sleepInsights = useMemo(() => {
    if (sleepData.length === 0) return null;

    const avgSleep = sleepData.reduce((sum, d) => sum + d.hoursSlept, 0) / sleepData.length;
    const avgQuality = sleepData.reduce((sum, d) => sum + d.quality, 0) / sleepData.length;

    // Find correlation: good sleep days vs task completion
    const daysWithGoodSleep = sleepData.filter(d => d.hoursSlept >= 7 && d.quality >= 7).length;
    const totalDays = sleepData.length;

    // Task completion rate on good sleep days
    const goodSleepRate = daysWithGoodSleep / totalDays;

    // Recommendations
    const recommendations: string[] = [];
    if (avgSleep < 6) {
      recommendations.push("😴 You're not getting enough sleep. Consider going to bed earlier.");
    }
    if (avgQuality < 6) {
      recommendations.push("⚡ Poor sleep quality detected. Try reducing screen time before bed.");
    }
    if (goodSleepRate < 0.5 && totalDays > 3) {
      recommendations.push("🎯 Better sleep could improve your task completion rate!");
    }

    // Recovery suggestions
    const needsRecovery = avgSleep < 5 || avgQuality < 4;

    return {
      avgSleep,
      avgQuality,
      goodSleepRate,
      recommendations,
      needsRecovery,
    };
  }, [sleepData]);

  const handleSleepSubmit = (hours: number, quality: number, deepMinutes: number) => {
    const newSleep: SleepData = {
      date: selectedDate,
      hoursSlept: hours,
      quality,
      deepSleepMinutes: deepMinutes,
    };

    const existingIndex = sleepData.findIndex(d => d.date === selectedDate);
    let updated: SleepData[];

    if (existingIndex >= 0) {
      updated = [...sleepData];
      updated[existingIndex] = newSleep;
    } else {
      updated = [...sleepData, newSleep];
    }

    setSleepData(updated);
    localStorage.setItem("todo-elephant-sleep", JSON.stringify(updated));
    setShowAddSleep(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Moon size={24} className="text-accent" />
          <span>Sleep Integration</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          Track sleep patterns and optimize your productivity.
        </p>
      </div>

      {/* Sleep Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Bed size={20} className="text-slate-400" />
            <span className="font-bold text-sm">Avg Hours Slept</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {sleepInsights?.avgSleep.toFixed(1) ?? "--"}h
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={20} className="text-amber-500" />
            <span className="font-bold text-sm">Sleep Quality</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {sleepInsights?.avgQuality.toFixed(1) ?? "--"}/10
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <span className="font-bold text-sm">Good Sleep Days</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {sleepInsights ? `${(sleepInsights.goodSleepRate * 100).toFixed(0)}%` : "--"}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {sleepInsights && sleepInsights.recommendations.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Brain size={16} className="text-amber-500" />
            Elephant's Recommendations
          </h3>
          <div className="space-y-2">
            {sleepInsights.recommendations.map((rec, i) => (
              <p key={i} className="text-sm">{rec}</p>
            ))}
          </div>
        </div>
      )}

      {/* Sleep Calendar */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-accent" />
          Sleep History (Last 7 Days)
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const sleep = sleepData.find(d => d.date === dateStr);

            const quality = sleep?.quality ?? 0;
            const color = quality >= 7 ? "bg-emerald-500" : quality >= 4 ? "bg-amber-500" : "bg-red-500";

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowAddSleep(true);
                }}
                className={`p-3 rounded-xl border transition-all ${
                  sleep ? "border-border bg-card/40" : "border-dashed border-border/30"
                }`}
              >
                <div className="text-[10px] text-muted mb-1">
                  {date.toLocaleDateString([], { weekday: "short" })}
                </div>
                {sleep ? (
                  <>
                    <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-1`} />
                    <div className="text-xs font-bold">{sleep.hoursSlept}h</div>
                  </>
                ) : (
                  <Plus size={16} className="text-muted/30 mx-auto" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Sleep Modal */}
      {showAddSleep && (
        <SleepEditor
          date={selectedDate}
          onSubmit={handleSleepSubmit}
          onClose={() => setShowAddSleep(false)}
        />
      )}
    </div>
  );
}

interface SleepEditorProps {
  date: string;
  onSubmit: (hours: number, quality: number, deepMinutes: number) => void;
  onClose: () => void;
}

function SleepEditor({ date, onSubmit, onClose }: SleepEditorProps) {
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(7);
  const [deepMinutes, setDeepMinutes] = useState(60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-card/90 space-y-4">
        <h3 className="text-xl font-bold">Log Sleep for {date}</h3>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Hours Slept: {hours}h</label>
          <input
            type="range"
            min="2"
            max="12"
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Sleep Quality: {quality}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Deep Sleep (minutes)</label>
          <input
            type="number"
            min="0"
            max="480"
            value={deepMinutes}
            onChange={e => setDeepMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
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
            onClick={() => onSubmit(hours, quality, deepMinutes)}
            className="px-4 py-2 rounded-lg bg-accent text-white font-bold hover:bg-accent/90 transition-all"
          >
            Save Sleep
          </button>
        </div>
      </div>
    </div>
  );
}