"use client";

import React, { useMemo } from "react";
import { Brain, Clock, BarChart3, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Task, FocusSession, Label, List } from "@/types";
import {
  calculateCognitiveLoad,
  analyzeProductivityDNA,
  calculateTimeInvestment,
  assessDecisionFatigue,
  generateActivityHeatmap,
} from "@/src/lib/analytics";

interface AnalyticsViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  focusSessions: FocusSession[];
}

export default function AnalyticsView({ tasks, lists, labels, focusSessions }: AnalyticsViewProps) {
  const cognitiveLoad = useMemo(() => calculateCognitiveLoad(tasks), [tasks]);
  const productivityDNA = useMemo(() => analyzeProductivityDNA(tasks, focusSessions), [tasks, focusSessions]);
  const timeInvestment = useMemo(() => calculateTimeInvestment(tasks, focusSessions), [tasks, focusSessions]);
  const decisionFatigue = useMemo(() => assessDecisionFatigue(tasks), [tasks]);
  const heatmap = useMemo(() => generateActivityHeatmap(tasks), [tasks]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-accent" />
          <span>Advanced Analytics</span>
        </h2>
        <p className="text-sm text-muted">Deep insights into your productivity patterns and work habits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Cognitive Load Card */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-purple-500" />
            <span className="font-bold text-sm uppercase tracking-wider">Cognitive Load</span>
          </div>
          <div className="text-4xl font-black mb-2" style={{
            color: cognitiveLoad.level === "high" ? "#ef4444" : cognitiveLoad.level === "medium" ? "#f59e0b" : "#10b981"
          }}>
            {cognitiveLoad.score}
          </div>
          <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-muted/20">
            {cognitiveLoad.level}
          </span>
          {cognitiveLoad.factors.length > 0 && (
            <ul className="mt-3 text-xs text-muted space-y-1">
              {cognitiveLoad.factors.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          )}
        </div>

        {/* Decision Fatigue Card */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className={decisionFatigue.warning ? "text-red-500" : "text-amber-500"} />
            <span className="font-bold text-sm uppercase tracking-wider">Decision Fatigue</span>
          </div>
          <div className="text-4xl font-black mb-2" style={{
            color: decisionFatigue.warning ? "#ef4444" : "#f59e0b"
          }}>
            {decisionFatigue.score}
          </div>
          <p className="text-xs text-muted mt-2">{decisionFatigue.recommendation}</p>
        </div>

        {/* Work Style Card */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-accent" />
            <span className="font-bold text-sm uppercase tracking-wider">Work Style</span>
          </div>
          <div className="text-2xl font-bold mb-2 capitalize">
            {productivityDNA.workStyle.replace("-", " ")}
          </div>
          <div className="text-xs text-muted space-y-1">
            {productivityDNA.preferredWorkPatterns.map((p, i) => <div key={i}>{p}</div>)}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-accent" />
          <span>30-Day Activity Heatmap</span>
        </h3>
        <div className="flex items-end gap-1 h-24">
          {heatmap.map((day, idx) => (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${day.date}: ${day.count} completions`}
            >
              <div
                className="w-full rounded-md transition-all"
                style={{
                  height: `${Math.max(4, day.intensity * 100)}%`,
                  backgroundColor: day.count > 3 ? "#10b981" : day.count > 1 ? "#3b82f6" : day.count > 0 ? "#64748b" : "#334155",
                }}
              />
              <span className="text-[8px] text-muted uppercase">
                {day.date.split("-")[1]}/{day.date.split("-")[2].slice(-1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Investment Breakdown */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md flex-1">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-accent" />
          <span>Time Investment</span>
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span>Total Focus Time</span>
              <span>{Math.round(timeInvestment.totalTimeMinutes)} minutes</span>
            </div>

            <div className="space-y-2">
              {Object.entries(timeInvestment.byPriority).map(([priority, minutes]) => (
                <div key={priority} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize">{priority}</span>
                    <span className="text-muted">{Math.round(minutes)} min</span>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${timeInvestment.totalTimeMinutes > 0 ? (minutes / timeInvestment.totalTimeMinutes) * 100 : 0}%`,
                        backgroundColor: priority === "high" ? "#ef4444" : priority === "medium" ? "#f59e0b" : "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div>
            <h4 className="text-sm font-bold mb-3">Peak Productivity Hours</h4>
            <div className="space-y-2">
              {productivityDNA.peakHours.length > 0 ? (
                productivityDNA.peakHours.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-semibold w-16">{formatHour(h.hour)}</span>
                    <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${h.completionRate * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{Math.round(h.completionRate * 100)}%</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted italic">Not enough data to determine peak hours.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const base = hour % 12 || 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${base}${suffix}`;
}