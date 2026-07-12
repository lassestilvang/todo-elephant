"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number; // 0-100 for progressive achievements
  target: number;
}

interface GamificationState {
  level: number;
  xp: number;
  nextLevelXp: number;
  achievements: Achievement[];
  streak: number;
}

const ACHIEVEMENTS_KEY = "todo-elephant-achievements";
const LEVEL_XP_BASE = 100;

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "first-task", name: "The Journey Begins", description: "Complete your first task", icon: "🚀", unlockedAt: null, progress: 0, target: 1 },
  { id: "decade", name: "Decade of Deeds", description: "Complete 10 tasks", icon: "🔥", unlockedAt: null, progress: 0, target: 10 },
  { id: "master", name: "Task Master", description: "Complete 50 tasks", icon: "🏆", unlockedAt: null, progress: 0, target: 50 },
  { id: "pomodoro-5", name: "Deep Work Junior", description: "Complete 5 focus sessions", icon: "🎯", unlockedAt: null, progress: 0, target: 5 },
  { id: "pomodoro-25", name: "Deep Work Master", description: "Complete 25 focus sessions", icon: "🧘", unlockedAt: null, progress: 0, target: 25 },
  { id: "early-bird", name: "Early Bird", description: "Complete a task before 9am", icon: "🌅", unlockedAt: null, progress: 0, target: 1 },
  { id: "night-owl", name: "Night Owl", description: "Complete a task after 10pm", icon: "🌙", unlockedAt: null, progress: 0, target: 1 },
  { id: "perfect-week", name: "Perfect Week", description: "Complete tasks 7 days in a row", icon: "📅", unlockedAt: null, progress: 0, target: 7 },
];

export function useGamification() {
  const [state, setState] = useState<GamificationState>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return { level: 1, xp: 0, nextLevelXp: LEVEL_XP_BASE, achievements: INITIAL_ACHIEVEMENTS };
        }
      }
    }
    return { level: 1, xp: 0, nextLevelXp: LEVEL_XP_BASE, achievements: INITIAL_ACHIEVEMENTS };
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addXp = useCallback((amount: number, taskId?: number) => {
    setState(prev => {
      const newXp = prev.xp + amount;
      let newLevel = prev.level;
      let nextLevelXp = prev.nextLevelXp;

      // Level up check
      while (newXp >= nextLevelXp) {
        newLevel += 1;
        nextLevelXp = Math.floor(prev.nextLevelXp * 1.5);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp,
      };
    });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === id);
      if (!achievement || achievement.unlockedAt) return prev;

      const now = new Date().toISOString();
      toast.success(`Achievement Unlocked: ${achievement.name}`, {
        description: `${achievement.icon} ${achievement.description}`,
        duration: 5000,
      });

      return {
        ...prev,
        achievements: prev.achievements.map(a =>
          a.id === id ? { ...a, unlockedAt: now } : a
        ),
      };
    });
  }, []);

  const updateAchievementProgress = useCallback((id: string, progress: number) => {
    setState(prev => ({
      ...prev,
      achievements: prev.achievements.map(a =>
        a.id === id ? { ...a, progress: Math.min(a.target, progress) } : a
      ),
    }));
  }, []);

  const getXpProgress = useCallback(() => {
    return {
      current: state.xp,
      needed: state.nextLevelXp,
      percent: (state.xp / state.nextLevelXp) * 100,
    };
  }, [state]);

  const getUnlockedCount = useCallback(() => {
    return state.achievements.filter(a => a.unlockedAt).length;
  }, [state]);

  return {
    level: state.level,
    xp: state.xp,
    nextLevelXp: state.nextLevelXp,
    achievements: state.achievements,
    streak: state.streak,
    addXp,
    unlockAchievement,
    updateAchievementProgress,
    getXpProgress,
    getUnlockedCount,
  };
}