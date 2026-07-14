"use client";

import React, { useMemo } from "react";
import { Brain, Lightbulb, Zap, Calendar, Heart, Smile, Meh, Frown } from "lucide-react";
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
  const { insights, getElephantMood } = aiAssistant;

  const moodConfig = {
    happy: { icon: Smile, color: "text-emerald-500", message: "Happy elephant! All caught up!" },
    celebrating: { icon: Heart, color: "text-pink-500", message: "Celebrating your streak!" },
    overwhelmed: { icon: Frown, color: "text-red-500", message: "This elephant feels overwhelmed..." },
    neutral: { icon: Meh, color: "text-amber-500", message: "This elephant is thinking..." },
  };

  const currentMood = moodConfig[getElephantMood()];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain size={24} className="text-accent" />
          <span>AI Elephant Assistant</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          Your productivity companion with elephant wisdom
        </p>
      </div>

      {/* Elephant Mood Display */}
      <div className="mb-8 p-8 rounded-3xl border border-border bg-card/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center">
              <currentMood.icon size={48} className={currentMood.color} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xl">🐘</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{currentMood.message}</h3>
            <p className="text-sm text-muted">
              {insights?.elephantWisdom || "Loading elephant wisdom..."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={20} className="text-accent" />
            <span className="font-bold text-sm">Cognitive Load</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {insights?.cognitiveLoad ?? 0}%
          </div>
          <div className="h-2 w-full bg-muted/20 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (insights?.cognitiveLoad ?? 0) > 70 ? "bg-red-500" :
                (insights?.cognitiveLoad ?? 0) > 40 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${insights?.cognitiveLoad ?? 0}%` }}
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={20} className="text-accent" />
            <span className="font-bold text-sm">Work Style</span>
          </div>
          <div className="text-lg font-bold text-foreground capitalize">
            {insights?.workStyle?.replace("-", " ") ?? "Analyzing..."}
          </div>
          <p className="text-xs text-muted mt-1">
            {(insights?.workStyle === "deep-focus") ? "Long focus sessions work best for you" :
             (insights?.workStyle === "multitasking") ? "You switch between tasks frequently" :
             "You spread work throughout the week"}
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Heart size={20} className="text-accent" />
            <span className="font-bold text-sm">Current Streak</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {insights?.streak ?? 0} days
          </div>
          <p className="text-xs text-muted mt-1">
            {(insights?.streak ?? 0) > 0 ? "Keep the momentum!" : "Complete a task today to start"}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-amber-500" />
          <span>Elephant's Suggestions</span>
        </h3>

        {(insights?.suggestions?.length ?? 0) === 0 ? (
          <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
            <Lightbulb size={48} className="text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No suggestions right now - you're doing great!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights?.suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-xl border transition-all ${
                  suggestion.priority === "high" ? "border-red-500/30 bg-red-500/5" :
                  suggestion.priority === "medium" ? "border-amber-500/30 bg-amber-500/5" :
                  "border-border bg-card/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{suggestion.title.split(" ")[0]}</span>
                  <div>
                    <h4 className="font-bold text-sm">{suggestion.title.replace(/^[^\s]+ /, "")}</h4>
                    <p className="text-xs text-muted mt-1">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}