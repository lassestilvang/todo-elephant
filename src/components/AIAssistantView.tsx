"use client";

import React, { useState } from "react";
import { Brain, Lightbulb, Zap, Sparkles, RefreshCw } from "lucide-react";
import { Task, List, Label, FocusSession } from "@/types";
import { useAIElephantAssistant } from "@/src/lib/hooks/useAIElephantAssistant";

interface AIAssistantViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  focusSessions: FocusSession[];
}

export default function AIAssistantView({
  tasks,
  lists,
  labels,
  focusSessions,
}: AIAssistantViewProps) {
  const aiAssistant = useAIElephantAssistant(tasks, lists, focusSessions);
  const { insights, stats } = aiAssistant;
  const [selectedCategory, setSelectedCategory] = useState<string>("suggestions");

  if (!insights) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Brain size={48} className="text-accent mx-auto mb-4 animate-pulse" />
            <p className="text-muted">Analyzing your productivity patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  const moodConfig = {
    happy: { icon: Zap, color: "text-emerald-500", message: "Happy elephant! All caught up!" },
    celebrating: { icon: Sparkles, color: "text-pink-500", message: "Celebrating your streak!" },
    overwhelmed: { icon: Brain, color: "text-red-500", message: "This elephant feels overwhelmed..." },
    neutral: { icon: Brain, color: "text-amber-500", message: "This elephant is thinking..." },
  };

  const currentMood = moodConfig[insights.elephantMood];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain size={24} className="text-accent" />
          <span>AI Elephant Assistant</span>
          {insights.stressLevel > 60 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
              High Load
            </span>
          )}
        </h2>
        <p className="text-sm text-muted mt-1">
          Your productivity companion with elephant wisdom
        </p>
      </div>

      {/* Elephant Mood Display */}
      <div className="mb-6 p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              <currentMood.icon size={40} className={currentMood.color} />
            </div>
            <span className="absolute -bottom-1 -right-1 text-2xl">🐘</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{currentMood.message}</h3>
            <p className="text-sm text-muted">
              {insights.elephantWisdom || "Loading elephant wisdom..."}
            </p>
            {/* Stress level indicator */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted">Stress Level:</span>
              <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    insights.stressLevel > 70
                      ? "bg-red-500"
                      : insights.stressLevel > 40
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, insights.stressLevel))}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted">{Math.round(insights.stressLevel)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Completion Rate"
          value={`${stats.completedCount} / ${tasks.length}`}
          icon={Zap}
          color="text-accent"
        />
        <StatCard
          label="Cognitive Load"
          value={`${stats.cognitiveLoad}%`}
          icon={Brain}
          color={stats.cognitiveLoad > 60 ? "text-red-500" : "text-emerald-500"}
        />
        <StatCard
          label="Focus Efficiency"
          value={`${stats.focusEfficiency}%`}
          icon={Sparkles}
          color="text-accent"
        />
        <StatCard
          label="Streak"
          value={`${stats.streak}d`}
          icon={Zap}
          color="text-amber-500"
        />
      </div>

      {/* Personality Insights */}
      {insights.personalityInsights && (
        <div className="mb-6 p-4 rounded-2xl border border-border bg-card/40">
          <h4 className="font-bold text-sm mb-2">🧠 Personality Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted">Work Preference:</span>
              <p className="text-sm font-medium">{insights.personalityInsights.workPreference}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Peak Hours:</span>
              <p className="text-sm font-medium">
                {insights.personalityInsights.peakProductivityHours.length > 0
                  ? insights.personalityInsights.peakProductivityHours.join(", ")
                  : "Analyzing..."}
              </p>
            </div>
          </div>
          {insights.personalityInsights.improvementAreas.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-muted">Improvement Areas:</span>
              <ul className="mt-1 space-y-1">
                {insights.personalityInsights.improvementAreas.map((area, i) => (
                  <li key={i} className="text-xs text-muted flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "suggestions", label: "Suggestions" },
          { key: "recommended", label: "Suggested Tasks" },
          { key: "daily", label: "Daily Tips" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedCategory(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === tab.key
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted hover:bg-border/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedCategory === "suggestions" && (
          <div className="space-y-3">
            {insights.suggestions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
                <Brain size={48} className="text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-muted">No suggestions right now - you're doing great!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-xl border transition-all hover:bg-card/60 ${
                      suggestion.priority === "high"
                        ? "border-red-500/30 bg-red-500/5"
                        : suggestion.priority === "medium"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-card/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{suggestion.title.split(" ")[0]}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm">{suggestion.title.replace(/^[^\s]+ /, "")}</h4>
                        <p className="text-xs text-muted mt-1">{suggestion.description}</p>
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted/50 text-muted">
                          {suggestion.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedCategory === "recommended" && (
          <div className="space-y-3">
            {insights.suggestedTasks.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
                <Lightbulb size={48} className="text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-muted">No specific task suggestions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.suggestedTasks.map((task, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-card/40"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{task.title}</h4>
                        <p className="text-xs text-muted mt-1">
                          {task.category} • ~{task.estimatedMinutes}min
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                        {task.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedCategory === "daily" && (
          <div className="space-y-3">
            {insights.dailyRecommendations.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
                <Lightbulb size={48} className="text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-muted">Keep up the great work!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.dailyRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-card/40 flex items-start gap-3"
                  >
                    <span className="text-lg flex-shrink-0">🐘</span>
                    <p className="text-sm text-muted">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={() => aiAssistant.analyzeTasks()}
        className="mt-4 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={16} className={aiAssistant.isLoading ? "animate-spin" : ""} />
        {aiAssistant.isLoading ? "Analyzing..." : "Refresh Analysis"}
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
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
