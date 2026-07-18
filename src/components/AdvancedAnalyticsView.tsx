"use client";

import React, { useMemo, useState } from 'react';
import { Brain, Clock, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Activity, Zap } from 'lucide-react';
import { Task, FocusSession, Label, List } from '@/types';

interface CognitiveLoadResult {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

interface ProductivityDNA {
  peakHours: { hour: number; completionRate: number }[];
  workStyle: string;
  averageTaskTime: number;
}

export default function AdvancedAnalyticsView({ tasks, lists, labels, focusSessions }: { tasks: Task[]; lists: List[]; labels: Label[]; focusSessions: FocusSession[] }) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'cognitive' | 'patterns' | 'predictions'>('overview');

  const cognitiveLoad = useMemo(() => calculateCognitiveLoadAdvanced(tasks), [tasks]);
  const productivityDNA = useMemo(() => analyzeProductivityDNAAdvanced(tasks, focusSessions), [tasks, focusSessions]);
  const predictions = useMemo(() => calculatePredictiveMetricsAdvanced(tasks, focusSessions), [tasks, focusSessions]);

  const stats = useMemo(() => ({
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
    averageFocusTime: focusSessions.length > 0
      ? Math.round(focusSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / focusSessions.length / 60)
      : 0,
    overdueTasks: tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()).length,
    streakDays: calculateStreakDays(tasks),
    bestCategory: getBestCategory(tasks),
  }), [tasks, focusSessions]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-accent" />
            <span>Advanced Analytics</span>
          </h2>
          <p className="text-sm text-muted mt-1">Deep insights into your productivity patterns and cognitive state</p>
        </div>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border text-muted hover:bg-border/50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'cognitive', label: 'Cognitive', icon: Brain },
          { key: 'patterns', label: 'Patterns', icon: TrendingUp },
          { key: 'predictions', label: 'Predictions', icon: Zap },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-muted hover:bg-border/50'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={CheckCircle2} color="text-emerald-500" />
        <StatCard label="Focus Time" value={`${stats.averageFocusTime}m`} icon={Clock} color="text-blue-500" />
        <StatCard label="Overdue" value={String(stats.overdueTasks)} icon={AlertCircle} color={stats.overdueTasks > 0 ? 'text-red-500' : 'text-muted'} />
        <StatCard label="Streak" value={`${stats.streakDays}d`} icon={TrendingUp} color="text-amber-500" />
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-auto">
          <CognitiveLoadCard cognitiveLoad={cognitiveLoad} />
          <WorkStyleCard productivityDNA={productivityDNA} />
          <BestCategoryCard bestCategory={stats.bestCategory} />
          <PredictionsCard predictions={predictions} />
        </div>
      )}

      {activeTab === 'cognitive' && (
        <div className="space-y-4 flex-1 overflow-auto">
          <CognitiveLoadCard cognitiveLoad={cognitiveLoad} />
          <CognitiveLoadTrend tasks={tasks} focusSessions={focusSessions} />
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-4 flex-1 overflow-auto">
          <WorkStyleCard productivityDNA={productivityDNA} />
          <PatternBreakdown tasks={tasks} focusSessions={focusSessions} />
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-4 flex-1 overflow-auto">
          <PredictionsCard predictions={predictions} />
          <ForecastTimeline predictions={predictions} />
        </div>
      )}
    </div>
  );
}

function CognitiveLoadCard({ cognitiveLoad }: { cognitiveLoad: CognitiveLoadResult }) {
  const getColor = (level: string) => level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981';
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={20} className="text-purple-500" />
        <span className="font-bold text-sm uppercase tracking-wider">Cognitive Load</span>
      </div>
      <div className="text-4xl font-black mb-2" style={{ color: getColor(cognitiveLoad.level) }}>
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
  );
}

function WorkStyleCard({ productivityDNA }: { productivityDNA: ProductivityDNA }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-accent" />
        <span className="font-bold text-sm uppercase tracking-wider">Work Style Profile</span>
      </div>
      <div className="text-2xl font-bold mb-2 capitalize">{productivityDNA.workStyle.replace('-', ' ')}</div>
      <p className="text-xs text-muted mt-2">Average task time: {productivityDNA.averageTaskTime} min</p>
      {productivityDNA.peakHours.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-bold mb-2">Peak Hours</h4>
          <div className="flex gap-2">
            {productivityDNA.peakHours.map((h, i) => (
              <div key={i} className="flex-1 text-center p-2 rounded-lg bg-muted/30">
                <p className="text-sm font-bold">{h.hour}:00</p>
                <p className="text-xs text-muted">{Math.round(h.completionRate * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PredictionsCard({ predictions }: { predictions: any }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={20} className="text-yellow-500" />
        <span className="font-bold text-sm uppercase tracking-wider">Forecasts</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted">Completion Probability (7d)</span>
          <span className="text-sm font-bold">{Math.round(predictions.completionProbability)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted">Predicted Bottlenecks</span>
          <span className="text-sm font-bold text-amber-500">{predictions.bottlenecks?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted">Optimal Work Window</span>
          <span className="text-sm font-bold">{predictions.optimalTime || 'Not enough data'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted">Burnout Risk</span>
          <span className={`text-sm font-bold ${predictions.burnoutRisk > 60 ? 'text-red-500' : predictions.burnoutRisk > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {Math.round(predictions.burnoutRisk)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function BestCategoryCard({ bestCategory }: { bestCategory: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} className="text-accent" />
        <span className="font-bold text-sm uppercase tracking-wider">Top Category</span>
      </div>
      <div className="text-2xl font-bold capitalize">{bestCategory}</div>
      <p className="text-xs text-muted mt-2">Based on completed tasks</p>
    </div>
  );
}

// Helper functions
function calculateCognitiveLoadAdvanced(tasks: Task[]): CognitiveLoadResult {
  const incomplete = tasks.filter(t => t.status !== 'completed');
  let score = 0;
  const factors: string[] = [];

  if (incomplete.length > 10) { score += 30; factors.push('High task volume'); }
  if (tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length > 5) { score += 20; factors.push('Many high-priority items'); }
  if (tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length > 3) { score += 25; factors.push('Overdue tasks detected'); }
  if (incomplete.length < 3 && incomplete.length > 0) { score = Math.max(score - 10, 0); factors.push('Manageable workload'); }

  score = Math.min(100, Math.max(0, score));
  const level = score > 60 ? 'high' : score > 30 ? 'medium' : 'low';

  return { score: Math.round(score), level, factors };
}

function analyzeProductivityDNAAdvanced(tasks: Task[], focusSessions: FocusSession[]): ProductivityDNA {
  const completed = tasks.filter(t => t.status === 'completed');

  const hourCounts: Record<number, number> = {};
  const hourTimes: Record<number, number[]> = {};

  completed.forEach(t => {
    const hour = t.completedAt ? new Date(t.completedAt).getHours() : 12;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    if (t.completedAt && t.createdAt) {
      const time = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
      hourTimes[hour] = [...(hourTimes[hour] || []), time];
    }
  });

  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      completionRate: hourTimes[parseInt(hour)]?.length
        ? Math.min(1, hourTimes[parseInt(hour)].length / (count || 1))
        : 0.5,
    }));

  const avgTaskTime = completed.length > 0
    ? completed.reduce((sum, t) => {
        const start = new Date(t.createdAt).getTime();
        const end = t.completedAt ? new Date(t.completedAt).getTime() : Date.now();
        return sum + (end - start) / 60000;
      }, 0) / completed.length
    : 30;

  const workStyle = focusSessions.length > 0
    ? (focusSessions.filter(s => (s.durationSeconds || 0) > 1500).length > focusSessions.length * 0.5
      ? 'deep-focus' : 'multitasking')
    : 'spread-out';

  return { peakHours, workStyle, averageTaskTime: Math.round(avgTaskTime) };
}

function calculatePredictiveMetricsAdvanced(tasks: Task[], focusSessions: FocusSession[]) {
  const completed = tasks.filter(t => t.status === 'completed');
  const incomplete = tasks.filter(t => t.status !== 'completed');
  const pastWeek = incomplete.filter(t => t.dueDate && new Date(t.dueDate).getTime() > Date.now() - 7 * 86400000);
  const overdue = incomplete.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const burnoutRisk = Math.min(100, overdue.length * 15 + pastWeek.length * 5 + (focusSessions.length === 0 ? 20 : 0));
  const completionProbability = tasks.length > 0 ? Math.min(95, Math.round((completed.length / tasks.length) * 100 + 10)) : 50;
  const optimalHour = peakHourForProductivity(tasks);

  return {
    completionProbability,
    bottleneckIds: pastWeek.map(t => t._id?.toString() || t.id || '').slice(0, 3),
    optimalTime: optimalHour,
    burnoutRisk,
  };
}

function peakHourForProductivity(tasks: Task[]): string {
  const hourCounts: Record<number, number> = {};
  tasks.filter(t => t.status === 'completed').forEach(t => {
    const hour = t.completedAt ? new Date(t.completedAt).getHours() : 12;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const maxHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  return maxHour ? `${maxHour[0]}:00` : '12:00';
}

function calculateStreakDays(tasks: Task[]): number {
  const completedDates = tasks
    .filter(t => t.status === 'completed' && t.completedAt)
    .map(t => new Date(t.completedAt!).toISOString().split('T')[0])
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  if (completedDates[0] !== today && completedDates[0] !== new Date(Date.now() - 86400000).toISOString().split('T')[0]) return 0;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    if ((prev.getTime() - curr.getTime()) / 86400000 === 1) streak++;
    else break;
  }

  return streak;
}

function getBestCategory(tasks: Task[]): string {
  const catCounts: Record<string, number> = {};
  tasks.filter(t => t.status === 'completed').forEach(t => {
    const cat = t.category || 'general';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  return Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
}

function CognitiveLoadTrend({ tasks, focusSessions }: { tasks: Task[]; focusSessions: FocusSession[] }) {
  const trendData = useMemo(() => {
    const days: Record<string, number> = {};
    const completed = tasks.filter(t => t.completedAt);
    completed.forEach(t => {
      const day = t.completedAt!.split('T')[0];
      days[day] = (days[day] || 0) + 1;
    });
    return Object.entries(days).slice(-14).map(([date, count]) => ({ date, count }));
  }, [tasks]);

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40">
      <h3 className="font-bold mb-4">14-Day Cognitive Load Trend</h3>
      <div className="flex items-end gap-1 h-32">
        {trendData.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-muted/20 rounded-md overflow-hidden" style={{ height: '100%' }}>
              <div
                className="w-full bg-accent rounded-md"
                style={{ height: `${Math.min(100, day.count * 10)}%`, minHeight: '4px' }}
              />
            </div>
            <span className="text-[8px] text-muted">{new Date(day.date).getDate()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternBreakdown({ tasks, focusSessions }: { tasks: Task[]; focusSessions: FocusSession[] }) {
  const byPriority = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      counts[t.priority as keyof typeof counts] = (counts[t.priority as keyof typeof counts] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const cat = t.category || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40">
      <h3 className="font-bold mb-4">Task Breakdown</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-bold mb-2">By Priority</h4>
          {Object.entries(byPriority).map(([priority, count]) => (
            <div key={priority} className="flex justify-between text-sm mb-1">
              <span className="capitalize">{priority}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-sm font-bold mb-2">By Category</h4>
          {byCategory.slice(0, 5).map(([cat, count]) => (
            <div key={cat} className="flex justify-between text-sm mb-1">
              <span className="capitalize">{cat}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForecastTimeline({ predictions }: { predictions: any }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40">
      <h3 className="font-bold mb-4">Next 7-Day Forecast</h3>
      <div className="space-y-3">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const probability = predictions.completionProbability
            ? Math.max(10, predictions.completionProbability + Math.sin(i * 0.9) * 15)
            : 50;
          return (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs text-muted w-16">{date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
              <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${probability}%` }} />
              </div>
              <span className="text-xs font-bold w-8">{Math.round(probability)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card/40">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={color} />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
