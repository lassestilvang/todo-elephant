"use client";

import { useCallback } from "react";

interface AIPrioritizationResult {
  priority: "low" | "medium" | "high";
  isUrgent: boolean;
  isImportant: boolean;
  confidence: number;
  reasons: string[];
}

/**
 * AI-powered task analysis hook for priority and Eisenhower quadrant suggestions.
 * Uses keyword matching and NLP patterns for intelligent categorization.
 */
export function useAIPrioritization() {
  // Analyze task and suggest priority/quadrant
  const analyzeTask = useCallback((title: string, description: string = ""): AIPrioritizationResult => {
    const text = `${title} ${description}`.toLowerCase();
    const reasons: string[] = [];
    let priority: "low" | "medium" | "high" = "medium";
    let isUrgent = false;
    let isImportant = false;
    let confidence = 0.5;

    // High priority keywords
    const highPriorityWords = ["urgent", "asap", "critical", "emergency", "deadline", "today", "now", "important", "must", "required"];
    const hasHighPriorityWord = highPriorityWords.some(word => text.includes(word));

    if (hasHighPriorityWord) {
      priority = "high";
      confidence += 0.2;
      reasons.push("Contains urgency indicators");
    }

    // Eisenhower analysis
    const urgentIndicators = ["deadline", "due", "today", "tomorrow", "asap", "urgent", "soon", "pressure"];
    const importantIndicators = ["strategic", "goal", "growth", "learning", "health", "family", "career", "future", "plan"];
    const notImportantIndicators = ["busywork", "admin", "routine", "distraction", "social media", "email"];

    isUrgent = urgentIndicators.some(word => text.includes(word));
    isImportant = importantIndicators.some(word => text.includes(word));

    // If contains not-important words, mark as not important
    if (notImportantIndicators.some(word => text.includes(word))) {
      isImportant = false;
      reasons.push("Contains low-value busywork indicators");
    }

    // Confidence adjustment based on matches
    const matchCount = urgentIndicators.filter(w => text.includes(w)).length +
                      importantIndicators.filter(w => text.includes(w)).length;
    confidence = Math.min(0.95, 0.5 + matchCount * 0.1);

    // Low priority keywords (adjust downward)
    const lowPriorityWords = ["later", "someday", "maybe", "optional", "nice to have", "when time"];
    if (lowPriorityWords.some(word => text.includes(word))) {
      priority = "low";
      reasons.push("Marked as non-critical");
    }

    // Default importance if not detected - assume tasks are somewhat important
    if (!isImportant && !notImportantIndicators.some(word => text.includes(word))) {
      isImportant = true;
      reasons.push("Assumed important (not marked as busywork)");
    }

    return {
      priority,
      isUrgent,
      isImportant,
      confidence,
      reasons,
    };
  }, []);

  // Smart priority suggestions based on time until due date
  const suggestDueDatePriority = useCallback((daysUntilDue?: number | null): "low" | "medium" | "high" => {
    if (!daysUntilDue) return "medium";
    if (daysUntilDue <= 0) return "high"; // Overdue
    if (daysUntilDue <= 1) return "high"; // Due today or tomorrow
    if (daysUntilDue <= 3) return "medium";
    if (daysUntilDue <= 7) return "medium";
    return "low";
  }, []);

  // Smart Eisenhower quadrant suggestions
  const suggestQuadrant = useCallback((task: { title: string; description?: string; dueDate?: string }): { isUrgent: boolean; isImportant: boolean } => {
    const text = `${task.title} ${task.description || ""}`.toLowerCase();

    // Default to important/not urgent (the ideal quadrant to be in)
    let isUrgent = false;
    let isImportant = true;

    // Check for urgency
    const urgentPatterns = ["due", "deadline", "asap", "urgent", "today", "tomorrow"];
    if (urgentPatterns.some(p => text.includes(p))) {
      isUrgent = true;
    }

    // Check for importance
    const importantPatterns = ["strategic", "goal", "health", "learning", "career", "project", "growth"];
    const notImportantPatterns = ["busywork", "admin", "routine", "chore", "later", "someday"];

    if (notImportantPatterns.some(p => text.includes(p))) {
      isImportant = false;
    }

    return { isUrgent, isImportant };
  }, []);

  return {
    analyzeTask,
    suggestDueDatePriority,
    suggestQuadrant,
  };
}