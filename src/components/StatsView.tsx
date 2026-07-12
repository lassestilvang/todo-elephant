"use client";

import React, { useMemo } from "react";
import { TrendingUp, Award, CheckCircle2, Clock, BarChart2, Tag, ListChecks, Flame } from "lucide-react";
import type { Task, List, Label } from "@/types";
import { isCompletedStatus, isActiveStatus, isArchivedStatus } from "@/src/lib/status";
import { computeCurrentStreak, statsForLastNDays } from "@/src/lib/streaks";
import {
  completionRate,
  labelDistribution,
  listDistribution,
  mostProductiveWeekday,
  priorityDistribution,
  weekdayName,
} from "@/src/lib/statsHelpers";
import EmptyState from "./EmptyState";

interface StatsViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
}

const PRIORITY_COLORS = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
} as const;

const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low" } as const;

function StatsView({ tasks, lists, labels }: StatsViewProps) {
  const computed = useMemo(() => {
    const now = new Date();
    // Exclude templates so they don't pollute analytics (they're not real work).
    const relevant = tasks.filter((t) => !isArchivedStatus(t.status) && !t.isTemplate);
    const active = relevant.filter((t) => isActiveStatus(t.status));
    const completed = relevant.filter((t) => isCompletedStatus(t.status));
    const overdue = active.filter((t) => t.dueDate && new Date(t.dueDate) < now);
    const streak = computeCurrentStreak(tasks, now);
    const last30 = statsForLastNDays(tasks, 30, now);
    const last30Total = last30.reduce((s, d) => s + d.completions, 0);
    const labels30Compare = last30.slice(-7).reduce((s, d) => s + d.completions, 0);
    const prior30Compare = last30.slice(0, 7).reduce((s, d) => s + d.completions, 0);
    const trendPct = prior30Compare === 0 ? null : Math.round(((labels30Compare - prior30Compare) / prior30Compare) * 100);
    const completion = completionRate(relevant);
    const weekday = mostProductiveWeekday(tasks);
    const labelRows = labelDistribution(relevant, labels);
    const listRows = listDistribution(relevant, lists);
    const priorityCounts = priorityDistribution(relevant);
    return {
      now,
      relevant,
      activeCount: active.length,
      completedCount: completed.length,
      overdueCount: overdue.length,
      streak,
      last30,
      last30Total,
      trendPct,
      completion,
      weekday,
      labelRows,
      listRows,
      priorityCounts,
    };
  }, [tasks, lists, labels]);

  const maxBar = Math.max(1, ...computed.last30.map((d) => d.completions));

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="flex-1 overflow-y-auto px-8 py-8 pr-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-accent" />
              <span>Insights &amp; Stats</span>
            </h2>
            <p className="text-sm text-muted mt-1">
              {computed.completedCount} completed · {computed.activeCount} active ·{" "}
              {computed.last30Total} in last 30 days.
            </p>
          </div>
          {computed.streak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Flame size={16} />
              <span className="text-sm font-black uppercase tracking-wider">{computed.streak}-day streak</span>
            </div>
          )}
        </div>

        {computed.relevant.length === 0 ? (
          <EmptyState
            title="No insights yet"
            description="Add a few tasks and complete them to unlock productivity trends."
            variant="default"
          />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard icon={<Award size={14} className="text-amber-500" />} label="Current Streak" value={computed.streak} unit="days" />
              <StatCard
                icon={<CheckCircle2 size={14} className="text-emerald-500" />}
                label="Completion Rate"
                value={`${computed.completion}%`}
                hint={`${computed.completedCount}/${computed.relevant.length}`}
              />
              <StatCard
                icon={<Clock size={14} className="text-red-500" />}
                label="Overdue"
                value={computed.overdueCount}
                unit={computed.overdueCount === 1 ? "task" : "tasks"}
              />
              <StatCard
                icon={<BarChart2 size={14} className="text-blue-500" />}
                label="30-Day Completions"
                value={computed.last30Total}
              />
              <StatCard
                icon={<TrendingUp size={14} className={computed.trendPct == null || computed.trendPct >= 0 ? "text-emerald-500" : "text-red-500"} />}
                label="Week-over-Week"
                value={
                  computed.trendPct == null
                    ? "—"
                    : `${computed.trendPct > 0 ? "+" : ""}${computed.trendPct}%`
                }
              />
              <StatCard
                icon={<Award size={14} className="text-accent" />}
                label="Most Productive Day"
                value={weekdayName(computed.weekday)}
              />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Donut: completion rate */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-card/45 backdrop-blur-md border border-border glass-panel">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Task Completion Rate
                </h3>
                <div className="relative flex items-center justify-center">
                  <Donut percent={computed.completion} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black tabular-nums">{computed.completion}%</span>
                    <span className="text-[10px] font-bold uppercase text-muted tracking-widest mt-1">
                      {computed.completedCount} of {computed.relevant.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar: 30-day */}
              <div className="lg:col-span-3 p-6 rounded-2xl bg-card/45 backdrop-blur-md border border-border glass-panel">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <BarChart2 size={14} className="text-blue-500" />
                  Last 30 Days
                </h3>
                <BarChart data={computed.last30} max={maxBar} />
              </div>
            </div>

            {/* Distribution rows: priority / labels / lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
              <DistCard title="Priority Mix">
                <ul className="space-y-3">
                  {(["high", "medium", "low"] as const).map((p) => {
                    const count = computed.priorityCounts[p];
                    const total = computed.priorityCounts.high + computed.priorityCounts.medium + computed.priorityCounts.low;
                    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                    return (
                      <li key={p}>
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                          <span className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${PRIORITY_COLORS[p]}`}>
                              {PRIORITY_LABELS[p]}
                            </span>
                          </span>
                          <span className="text-muted">{count} · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/15 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              p === "high" ? "bg-red-500" : p === "medium" ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </DistCard>

              <DistCard title="Top Labels">
                {computed.labelRows.length === 0 ? (
                  <span className="text-xs text-muted">No labels in use yet.</span>
                ) : (
                  <ul className="space-y-2">
                    {computed.labelRows.slice(0, 6).map((row) => (
                      <li key={row.labelId} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                        <span className="font-semibold flex-1 truncate">{row.name}</span>
                        <span className="text-muted font-bold">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DistCard>

              <DistCard title="Top Folders">
                {computed.listRows.length === 0 ? (
                  <span className="text-xs text-muted">No folders in use yet.</span>
                ) : (
                  <ul className="space-y-2">
                    {computed.listRows.slice(0, 6).map((row) => (
                      <li key={row.listId} className="flex items-center gap-2 text-xs">
                        <ListChecks size={12} className="text-muted shrink-0" />
                        <span className="font-semibold flex-1 truncate">{row.name}</span>
                        <span className="text-muted font-bold">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DistCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card/45 backdrop-blur-md border border-border glass-panel hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-black text-foreground tabular-nums">
        {value}
        {unit && <span className="text-xs font-normal text-muted ml-1">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  );
}

function DistCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-card/45 backdrop-blur-md border border-border glass-panel">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Tag size={14} className="text-accent" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  const radius = 70;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * percent) / 100;
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
      <circle cx="90" cy="90" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/15" />
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-emerald-500 transition-[stroke-dashoffset] duration-1000 ease-out"
      />
    </svg>
  );
}

function BarChart({ data, max }: { data: { dayKey: string; completions: number }[]; max: number }) {
  // Layout: 30 bars over a 400-wide viewBox; bar width 6, step 13.5, baseline at y=80, max bar height 64.
  const barW = 6;
  const step = 13.5;
  const baseline = 80;
  const maxH = 64;
  return (
    <div className="relative">
      <svg viewBox="0 0 405 100" className="w-full h-32 overflow-visible">
        {/* baseline */}
        <line x1="0" y1={baseline} x2="405" y2={baseline} className="stroke-muted/20" strokeWidth="1" />
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const height = (d.completions / max) * maxH;
          const x = i * step;
          const y = baseline - Math.max(2, height - (height === 0 ? -2 : 0));
          return (
            <g key={d.dayKey}>
              <title>{`${d.dayKey}: ${d.completions}`}</title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, height)}
                rx={2}
                className={`transition-all duration-700 ${
                  isLast ? "fill-[color:var(--accent)]" : "fill-accent/40 hover:fill-accent"
                }`}
              />
              {i % 7 === 0 && (
                <text x={x} y={94} fontSize={8} className="fill-muted/60 font-bold">
                  d{i + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {data.length > 0 && (
        <div className="text-[10px] text-muted mt-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-sm" /> today
          <span className="w-2 h-2 bg-accent/40 rounded-sm ml-3" /> earlier days
        </div>
      )}
    </div>
  );
}

export default React.memo(StatsView);
