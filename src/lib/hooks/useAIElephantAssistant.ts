"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Task, FocusSession, List } from "@/types";
import { isCompletedStatus } from "../status";

export interface AssistantInsight {
  cognitiveLoad: number;
  workStyle: "deep-focus" | "multitasking" | "spread-out";
  streak: number;
  suggestions: Suggestion[];
  elephantWisdom: string;
  // Enhanced AI insights
  elephantMood: "happy" | "celebrating" | "neutral" | "overwhelmed";
  weeklyProgress: number;
  dailyRecommendations: string[];
  suggestedTasks: Array<{ title: string; category: string; estimatedMinutes: number; }>;
  moodEmoji: string;
  stressLevel: number;
  personalityInsights: {
    workPreference: string;
    peakProductivityHours: string[];
    improvementAreas: string[];
    successPatterns: string[];
  };
}

export interface Suggestion {
  id: string;
  type: "breakdown" | "prioritize" | "schedule" | "habit" | "motivation" | "inspiration";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  action?: () => void;
}

export function useAIElephantAssistant(
  tasks: Task[],
  lists: List[],
  focusSessions: FocusSession[]
) {
  const [insights, setInsights] = useState<AssistantInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate task statistics with enhanced analytics
  const stats = useMemo(() => {
    const incompleteTasks = tasks.filter(t => !isCompletedStatus(t.status));
    const completedTasks = tasks.filter(t => isCompletedStatus(t.status));
    const highPriorityTasks = incompleteTasks.filter(t => t.priority === "high");
    const overdueTasks = incompleteTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date()
    );

    // Work style determination
    const avgFocusSession = focusSessions.length > 0
      ? focusSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / focusSessions.length
      : 0;

    let workStyle: "deep-focus" | "multitasking" | "spread-out" = "spread-out";
    const longSessions = focusSessions.filter(s => s.durationSeconds > 1500).length;
    const shortSessions = focusSessions.filter(s => s.durationSeconds < 600).length;

    if (tasks.length < 20 && longSessions > focusSessions.length * 0.5) {
      workStyle = "deep-focus";
    } else if (shortSessions > focusSessions.length * 0.4) {
      workStyle = "multitasking";
    }

    // Streak calculation
    const completedDates = completedTasks
      .map(t => t.completedAt?.split("T")[0] || t.updatedAt?.split("T")[0])
      .filter(Boolean)
      .sort((a, b) => (a as string) > (b as string) ? 1 : -1);

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (completedDates[0] === today || completedDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < completedDates.length; i++) {
        const prev = new Date(completedDates[i - 1] as string);
        const curr = new Date(completedDates[i] as string);
        if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Cognitive load score (0-100) with sophisticated calculation
    let cognitiveLoad = 0;
    if (incompleteTasks.length > 10) cognitiveLoad += 30;
    if (incompleteTasks.length > 5) cognitiveLoad += 15;
    if (highPriorityTasks.length > incompleteTasks.length * 0.5) cognitiveLoad += 25;
    if (overdueTasks.length > 3) cognitiveLoad += 20;

    // Enhanced: Focus efficiency calculation
    const completedFocus = focusSessions.filter(s => s.completed === true);
    const focusEfficiency = focusSessions.length > 0
      ? (completedFocus.length / focusSessions.length) * 100
      : 0;

    // Enhanced: Task diversification
    const categoryDistribution = new Map<string, number>();
    completedTasks.forEach(t => {
      const category = t.category || "general";
      categoryDistribution.set(category, (categoryDistribution.get(category) || 0) + 1);
    });
    const uniqueCategories = categoryDistribution.size;
    const taskDiversityScore = Math.min(uniqueCategories * 10, 50); // Max 50 points for diversity

    // Enhanced: Consistency metrics
    const completedThisWeek = completedTasks.filter(t => {
      const completedDate = new Date(t.completedAt || t.updatedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return completedDate >= weekAgo;
    }).length;

    return {
      incompleteCount: incompleteTasks.length,
      completedCount: completedTasks.length,
      overdueCount: overdueTasks.length,
      highPriorityCount: highPriorityTasks.length,
      cognitiveLoad: Math.min(100, cognitiveLoad),
      focusEfficiency: Math.round(focusEfficiency),
      workStyle,
      streak,
      uniqueCategories,
      taskDiversityScore,
      completedThisWeek
    };
  }, [tasks, focusSessions]);

  // Enhanced AI-powered suggestions engine
  const suggestions = useMemo(() => {
    const all: Suggestion[] = [];

    // Critical: Overdue task handling
    if (stats.overdueCount > 0) {
      all.push({
        id: "overdue-warning",
        type: "prioritize",
        priority: "high",
        title: "🐘 Overdue Tasks Alert!",
        description: `You have ${stats.overdueCount} overdue task${stats.overdueCount > 1 ? 's' : ''}. The elephant never forgets - but you might want to reschedule these.`,
        action: () => {
          // Action would trigger focus on overdue tasks
          console.log("Focusing on overdue tasks");
        }
      });
    }

    // Critical: Cognitive overload
    if (stats.cognitiveLoad > 70) {
      all.push({
        id: "cognitive-overload",
        type: "breakdown",
        priority: "high",
        title: "🐘 Take a Breather",
        description: `Your mental load is high (${stats.cognitiveLoad}%). Let's break tasks into smaller pieces to reduce overwhelm.`,
        action: () => {
          // Would trigger task breakdown workflow
          console.log("Initiating task breakdown");
        }
      });
    }

    // Personalized: Work style optimization
    if (stats.workStyle === "deep-focus" && stats.incompleteCount > 5) {
      all.push({
        id: "focus-advice",
        type: "schedule",
        priority: "medium",
        title: "🐘 Deep Work Mode Active",
        description: "You work best with long focus sessions. Time-block your top 3 tasks today!",
        action: () => {
          console.log("Suggesting deep work scheduling");
        }
      });
    } else if (stats.workStyle === "multitasking" && stats.incompleteCount > 10) {
      all.push({
        id: "focus-singletask",
        type: "habit",
        priority: "medium",
        title: "🐘 Try Single-Tasking",
        description: "You switch between tasks frequently. Try focusing on just one task for 25 minutes to boost completion rates.",
        action: () => {
          console.log("Suggesting single-tasking");
        }
      });
    }

    // Streak encouragement
    if (stats.streak >= 7) {
      all.push({
        id: "streak-celebrate",
        type: "motivation",
        priority: "low",
        title: `🐘 ${stats.streak}-Day Streak!`,
        description: "Amazing consistency! Keep the momentum going - you're unstoppable.",
        action: () => {
          console.log("Celebrating streak");
        }
      });
    } else if (stats.streak >= 3) {
      all.push({
        id: "streak-building",
        type: "motivation",
        priority: "low",
        title: `🐘 ${stats.streak}-Day Streak Building!`,
        description: "You're building a great habit! Just one more day to solidify your habit loop.",
        action: () => {
          console.log("Encouraging streak continuation");
        }
      });
    }

    // Priority management
    if (stats.highPriorityCount > 3) {
      all.push({
        id: "priority-focus",
        type: "prioritize",
        priority: "medium",
        title: "🐘 Priority Time!",
        description: "You have many high-priority tasks. The elephant recommends choosing just ONE to tackle first.",
        action: () => {
          console.log("Suggesting priority focus");
        }
      });
    }

    // Task decomposition for large tasks
    const largeTasks = incompleteTasks.filter(t => t.title && t.title.split(" ").length > 8);
    if (largeTasks.length > 0) {
      all.push({
        id: "task-breakdown",
        type: "breakdown",
        priority: "medium",
        title: "🐘 Break Down Large Tasks",
        description: `You have ${largeTasks.length} tasks with lengthy descriptions that could benefit from breakdown.`,
        action: () => {
          console.log("Suggesting task decomposition");
        }
      });
    }

    // Habit formation suggestion
    const routineTasks = incompleteTasks.filter(t =>
      t.title?.toLowerCase().includes("daily") ||
      t.title?.toLowerCase().includes("routine") ||
      t.category?.toLowerCase().includes("habit")
    );
    if (routineTasks.length === 0 && stats.streak < 3) {
      all.push({
        id: "habit-suggestion",
        type: "habit",
        priority: "low",
        title: "🐘 Build a Productivity Habit",
        description: "Consider creating a simple daily habit like reviewing your task list each morning.",
        action: () => {
          console.log("Suggesting habit formation");
        }
      });
    }

    // Inspirational/wisdom suggestions
    const elephantWisdomPool = [
      "An elephant never forgets... but you don't have to remember everything - just write it down!",
      "Even the mightiest elephant moves one foot at a time. Take it one step at a time.",
      "Your herd (team) is only as strong as your smallest task. Complete it!",
      "Like an elephant's memory, review your completed tasks to see your progress.",
      "The elephant's trunk holds more than you think - break big tasks into smaller ones!",
      "Elephants drink up to 50 gallons of water a day - stay hydrated for better focus!",
      "An elephant's ears help regulate temperature - take breaks to cool down your mind.",
      "Elephants show empathy to others - be kind to yourself when you face setbacks.",
      "The elephant's slow blink is a sign of trust - trust your own judgment too.",
      "Elephants use tools in the wild - you can use tools and apps to enhance your productivity!",
      "Elephant families work together - consider collaborating on complex tasks!",
      "An elephant's skin is wrinkled to retain moisture - keep your ideas flowing and hydrated!",
      "Elephants have excellent long-term memory - use spaced repetition for learning!",
      "Elephants can distinguish between different human languages - keep practicing your skills!",
      "Elephant calves stay with their mothers for years - invest in long-term skill development!"
    ];

    // Add a wisdom-based suggestion occasionally
    if (Math.random() > 0.7) { // 30% chance
      const randomWisdom = elephantWisdomPool[Math.floor(Math.random() * elephantWisdomPool.length)];
      all.push({
        id: `elephant-wisdom-${Date.now()}`,
        type: "inspiration",
        priority: "low",
        title: "🐘 Elephant Wisdom",
        description: randomWisdom,
        action: () => {
          console.log("Sharing elephant wisdom");
        }
      });
    }

    return all;
  }, [stats]);

  // Enhanced insights calculation with personality detection
  const enhancedInsights = useMemo(() => {
    if (!stats) return null;

    // Calculate elephant mood with nuance
    let elephantMood: "happy" | "celebrating" | "neutral" | "overwhelmed" = "neutral";
    let stressLevel = 0;
    let weeklyProgress = 0;
    let personalityInsights = {
      workPreference: "",
      peakProductivityHours: [],
      improvementAreas: [],
      successPatterns: []
    };

    // Stress level calculation (0-100)
    stressLevel = Math.min(100,
      (stats.overdueCount * 15) +
      (stats.highPriorityCount * 10) +
      (stats.incompleteCount > 15 ? 20 : stats.incompleteCount > 8 ? 10 : 0) +
      (100 - stats.focusEfficiency) * 0.3
    );

    // Determine elephant mood
    if (stressLevel > 75) elephantMood = "overwhelmed";
    else if (stats.streak >= 7) elephantMood = "celebrating";
    else if (stats.incompleteCount === 0 && stats.completedCount > 0) elephantMood = "happy";
    else elephantMood = "neutral";

    // Weekly progress calculation
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyTasks = tasks.filter(t => new Date(t.createdAt) >= weekStart);
    const weeklyCompleted = weeklyTasks.filter(t => t.status === "completed");
    weeklyProgress = weeklyTasks.length > 0 ? Math.round((weeklyCompleted.length / weeklyTasks.length) * 100) : 0;

    // Personality insights generation
    personalityInsights = generatePersonalityInsights(tasks, focusSessions, stats);

    return {
      ...stats,
      elephantMood,
      weeklyProgress,
      dailyRecommendations: generateDailyRecommendations(tasks, focusSessions, stats),
      suggestedTasks: generateSuggestedTasks(stats, tasks),
      moodEmoji: getElephantEmoji(elephantMood, stressLevel),
      stressLevel,
      personalityInsights
    };
  }, [stats]);

  // Build insights object
  useEffect(() => {
    if (enhancedInsights) {
      setInsights({
        cognitiveLoad: enhancedInsights.cognitiveLoad,
        workStyle: enhancedInsights.workStyle,
        streak: enhancedInsights.streak,
        suggestions: suggestions.suggestions,
        elephantWisdom: suggestions.elephantWisdom,
        elephantMood: enhancedInsights.elephantMood,
        weeklyProgress: enhancedInsights.weeklyProgress,
        dailyRecommendations: enhancedInsights.dailyRecommendations,
        suggestedTasks: enhancedInsights.suggestedTasks,
        moodEmoji: enhancedInsights.moodEmoji,
        stressLevel: enhancedInsights.stressLevel,
        personalityInsights: enhancedInsights.personalityInsights
      });
    }
  }, [enhancedInsights, suggestions]);

  // Memoized helper functions for performance
  const getElephantMood = useCallback(() => insights?.elephantMood || "neutral", [insights]);
  const getSuggestions = useCallback((limit?: number) => {
    return limit
      ? suggestions.suggestions.slice(0, limit)
      : suggestions.suggestions;
  }, [suggestions]);

  const analyzeTasks = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);

  return {
    insights,
    stats,
    getElephantMood,
    getSuggestions,
    analyzeTasks,
    isLoading
  };
}

// Helper functions for enhanced insights
function generatePersonalityInsights(tasks: Task[], focusSessions: FocusSession[], stats: any) {
  const personality: any = {
    workPreference: "",
    peakProductivityHours: [],
    improvementAreas: [],
    successPatterns: []
  };

  // Determine work preference based on patterns
  if (stats.workStyle === "deep-focus" && stats.focusEfficiency > 70) {
    personality.workPreference = "Deep Focus Specialist";
    personality.successPatterns = [
      "Long, uninterrupted work sessions",
      "Complex problem-solving tasks",
      "Creative and strategic thinking work"
    ];
    personality.improvementAreas = [
      "Taking regular breaks to prevent burnout",
      "Delegating routine tasks when possible",
      "Setting boundaries to protect focus time"
    ];
  } else if (stats.workStyle === "multitasking") {
    personality.workPreference = "Dynamic Task Manager";
    personality.successPatterns = [
      "Handling multiple responsibilities efficiently",
      "Quick context-switching between tasks",
      "Managing interruptions effectively"
    ];
    personality.improvementAreas = [
      "Blocking time for deep work on complex tasks",
      "Reducing task-switching frequency",
      "Using time-boxing techniques"
    ];
  } else {
    personality.workPreference = "Balanced Approacher";
    personality.successPatterns = [
      "Adapting work style to task requirements",
      "Balancing depth and breadth effectively",
      "Maintaining sustainable work rhythms"
    ];
    personality.improvementAreas = [
      "Identifying optimal work patterns for different task types",
      "Experimenting with different techniques",
      "Tracking what works best for you"
    ];
  }

  // Estimate peak productivity hours (simplified)
  const hourCounts: Record<number, number> = {};
  tasks.forEach(task => {
    if (task.completedAt) {
      const hour = new Date(task.completedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  personality.peakProductivityHours = Object.entries(hourCounts)
    .filter(([_, count]) => count >= Math.max(1, Object.values(hourCounts).reduce((a, b) => Math.max(a, b), 0) * 0.3))
    .map(([hour]) => `${parseInt(hour, 10)}:00`)
    .slice(0, 3)
    .sort();

  return personality;
}

function generateDailyRecommendations(tasks: Task[], focusSessions: FocusSession[], stats: any): string[] {
  const recommendations: string[] = [];

  if (stats.overdueCount > 0) {
    recommendations.push(`Address ${stats.overdueCount} overdue task${stats.overdueCount > 1 ? 's' : ''} immediately to reduce stress.`);
  }

  if (stats.cognitiveLoad > 60) {
    recommendations.push("Take a 10-minute break to reset your mind before continuing work.");
  }

  if (stats.focusEfficiency < 50 && focusSessions.length > 0) {
    recommendations.push("Try the Pomodoro technique: 25 minutes focused work, 5 minutes break.");
  }

  if (stats.streak < 3 && tasks.length > 0) {
    recommendations.push("Aim to complete at least one task today to start building your productivity streak.");
  }

  if (stats.completedThisWeek < 3) {
    recommendations.push("Focus on completing just 2-3 meaningful tasks this week to rebuild momentum.");
  }

  const highPriorityPending = tasks.filter(t => t.priority === "high" && !isCompletedStatus(t.status)).length;
  if (highPriorityPending > 0) {
    recommendations.push(`Tackle one high-priority task today to prevent accumulation.`);
  }

  return recommendations.slice(0, 3);
}

function generateSuggestedTasks(stats: any, tasks: Task[]): Array<{ title: string; category: string; estimatedMinutes: number; }> {
  const suggestedTasks: Array<{ title: string; category: string; estimatedMinutes: number; }> = [];

  if (stats.highPriorityCount > 0) {
    suggestedTasks.push({
      title: "Review and prioritize your high-priority tasks",
      category: "planning",
      estimatedMinutes: 10
    });
  }

  if (stats.overdueCount > 0) {
    suggestedTasks.push({
      title: "Address one overdue task to reduce mental load",
      category: "urgent",
      estimatedMinutes: 15
    });
  }

  if (stats.incompleteCount > 10) {
    suggestedTasks.push({
      title: "Break down your task list into manageable chunks",
      category: "organization",
      estimatedMinutes: 20
    });
  }

  if (stats.focusEfficiency < 60) {
    suggestedTasks.push({
      title: "Schedule a focused work session using Pomodoro technique",
      category: "focus",
      estimatedMinutes: 25
    });
  }

  if (stats.streak < 3) {
    suggestedTasks.push({
      title: "Complete one small task to start building your streak",
      category: "habit",
      estimatedMinutes: 5
    });
  }

  return suggestedTasks.slice(0, 4);
}

function getElephantEmoji(mood: "happy" | "celebrating" | "neutral" | "overwhelmed", stressLevel: number): string {
  if (mood === "overwhelmed") return "😰";
  if (mood === "celebrating") return "🎉";
  if (mood === "happy") return "😊";
  return stressLevel > 50 ? "😐" : "🐘";
}