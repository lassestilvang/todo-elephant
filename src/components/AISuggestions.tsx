"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Lightbulb, RefreshCw, Check, Clock, Target } from "lucide-react";
import { useTaskPlanner } from "@/src/lib/hooks/useTaskPlanner";
import { toast } from "sonner";

interface AISuggestion {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimatedMinutes: number;
  reason: string;
  isAccepted: boolean;
}

export default function AISuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { tasks, currentView, transitionView } = useTaskPlanner();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai-assistant/suggestions");
      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      const mappedSuggestions: AISuggestion[] = data.suggestions.map((s: any, index: number) => ({
        id: `suggestion-${Date.now()}-${index}`,
        title: s.title,
        priority: s.priority,
        category: s.category,
        estimatedMinutes: s.estimatedMinutes,
        reason: s.reason,
        isAccepted: false
      }));

      setSuggestions(mappedSuggestions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Failed to load AI suggestions");
    } finally {
      setIsLoading(false);
    }
  }

  async function acceptSuggestion(suggestionId: string) {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion || suggestion.isAccepted) return;

    try {
      // Create task from suggestion
      const createResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestion.title,
          description: `AI-suggested task: ${suggestion.reason}`,
          priority: suggestion.priority,
          category: suggestion.category,
          dueDate: calculateDueDate(suggestion.estimatedMinutes),
          estimatedMinutes: suggestion.estimatedMinutes
        })
      });

      if (!createResponse.ok) throw new Error("Failed to create task");

      // Mark as accepted
      setSuggestions(prev => prev.map(s =>
        s.id === suggestionId ? { ...s, isAccepted: true } : s
      ));

      toast.success(`Added: ${suggestion.title}`);

      // Refresh tasks in view
      if (currentView !== "dashboard") {
        transitionView("dashboard");
      }
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      toast.error("Failed to add task");
    }
  }

  function calculateDueDate(minutes: number): string {
    const date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    return date.toISOString().split("T")[0];
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high": return "text-red-500 bg-red-500/10";
      case "medium": return "text-amber-500 bg-amber-500/10";
      case "low": return "text-green-500 bg-green-500/10";
      default: return "text-blue-500 bg-blue-500/10";
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
        <p className="text-muted">AI is thinking...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <Lightbulb className="h-12 w-12 text-muted mb-4" />
        <h3 className="font-semibold text-foreground mb-2">No suggestions yet</h3>
        <p className="text-muted text-sm mb-4">
          Click the refresh button to get new AI-powered task suggestions.
        </p>
        <button
          onClick={fetchSuggestions}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Get Suggestions
        </button>
        {lastUpdated && (
          <p className="text-xs text-muted/60 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          AI Suggestions
        </h3>
        <button
          onClick={fetchSuggestions}
          className="p-2 rounded-lg hover:bg-border transition-colors"
          aria-label="Refresh suggestions"
        >
          <RefreshCw className="h-4 w-4 text-muted" />
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-muted">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-3">
        {suggestions.filter(s => !s.isAccepted).map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 rounded-xl bg-card border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{suggestion.estimatedMinutes}m
                  </span>
                </div>
                <h4 className="font-medium text-foreground mb-1">{suggestion.title}</h4>
                <p className="text-sm text-muted mb-2">{suggestion.reason}</p>
                <span className="text-xs text-muted bg-muted/50 px-2 py-1 rounded">
                  {suggestion.category}
                </span>
              </div>

              <button
                onClick={() => acceptSuggestion(suggestion.id)}
                disabled={suggestion.isAccepted}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {suggestions.every(s => s.isAccepted) && (
        <div className="text-center py-4">
          <p className="text-muted">All suggestions accepted! 🎉</p>
        </div>
      )}
    </div>
  );
}