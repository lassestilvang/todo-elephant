// src/lib/hooks/useAchievementSystem.ts
import { useState, useEffect, createContext, useContext, createEventEmitter } from 'react';
import { nanoid } from 'nanoid';

// Achievement context
export const AchievementContext = createContext(null);
export const useAchievement = () => useContext(AchievementContext);

export const AchievementEvent = createEventEmitter();

// Achievement types
export type AchievementEnum =
  | 'TASK_COMPLETION_STREAK'
  | 'TASK_CREATOR'
  | 'COLLABORATION_CHAMPION'
  | 'PRIORITY_MASTER'
  | 'PRIORITY_NOVICE'
  | '3D_EXPLORER'
  | 'SYNC_POWER_USER'
  | 'VOICE_COMMANDER'
  | 'MUSIC_MAVEN'
  | 'TEAM_CONTRIBUTOR';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  currentProgress: number;
  isUnlocked: boolean;
  category: AchievementEnum;
}

// Achievement tracker hook
export const useAchievementTracker = (userId?: string) => {
  const [achievements, setAchievements] = useState<Array<Achievement>>([
    {
      id: nanoid(),
      name: 'Task Completion Streak',
      description: 'Complete 10 consecutive tasks',
      icon: '🎯',
      threshold: 10,
      currentProgress: 0,
      isUnlocked: false,
      category: 'TASK_COMPLETION_STREAK'
    },
    {
      id: nanoid(),
      name: 'Task Creator',
      description: 'Create 5 tasks',
      icon: '➕',
      threshold: 5,
      currentProgress: 0,
      isUnlocked: false,
      category: 'TASK_CREATOR'
    },
    {
      id: nanoid(),
      name: 'Collaboration Champion',
      description: 'Complete 20 tasks with others',
      icon: '👥',
      threshold: 20,
      currentProgress: 0,
      isUnlocked: false,
      category: 'COLLABORATION_CHAMPION'
    },
    {
      id: nanoid(),
      name: 'Priority Master',
      description: 'Complete 10 high-priority tasks',
      icon: '⚡',
      threshold: 10,
      currentProgress: 0,
      isUnlocked: false,
      category: 'PRIORITY_MASTER'
    },
    {
      id: nanoid(),
      name: 'Priority Novice',
      description: 'Complete 10 low-priority tasks',
      icon: '🌱',
      threshold: 10,
      currentProgress: 0,
      isUnlocked: false,
      category: 'PRIORITY_NOVICE'
    },
    {
      id: nanoid(),
      name: '3D Explorer',
      description: 'Spend 5 minutes in 3D mode',
      icon: '🌍',
      threshold: 5,
      currentProgress: 0,
      isUnlocked: false,
      category: '3D_EXPLORER'
    },
    {
      id: nanoid(),
      name: 'Sync Power User',
      description: 'Send 10 sync events',
      icon: '🔄',
      threshold: 10,
      currentProgress: 0,
      isUnlocked: false,
      category: 'SYNC_POWER_USER'
    },
    {
      id: nanoid(),
      name: 'Voice Commander',
      description: 'Use voice commands 20 times',
      icon: '🎤',
      threshold: 20,
      currentProgress: 0,
      isUnlocked: false,
      category: 'VOICE_COMMANDER'
    },
    {
      id: nanoid(),
      name: 'Music Maven',
      description: 'Experience 5 music-themed achievements',
      icon: '🎶',
      threshold: 5,
      currentProgress: 0,
      isUnlocked: false,
      category: 'MUSIC_MAVEN'
    },
    {
      id: nanoid(),
      name: 'Team Contributor',
      description: 'Add 3 tasks to team board',
      icon: '📋',
      threshold: 3,
      currentProgress: 0,
      isUnlocked: false,
      category: 'TEAM_CONTRIBUTOR'
    }
  ]);

  const [progressMap, setProgressMap] = useState({});

  // Update progress for categories
  const updateProgress = async (category: AchievementEnum, value = 1) => {
    setProgressMap((prev) => ({
      ...prev,
      [category]: (progressMap[category] || 0) + value
    }));

    const achievement = achievements.find(a => a.category === category);
    if (!achievement) return;

    const newProgress = {
      ...achievement,
      currentProgress: (progressMap[category] || 0) + value
    };

    // Check if unlocked
    if (newProgress.currentProgress >= achievement.threshold && !newProgress.isUnlocked) {
      const achievementData = { ...newProgress, isUnlocked: true };
      setAchievements((prev) =>
        prev.map(a => a.category === category ? achievementData : a)
      );

      // Emit event for UI updates
      AchievementEvent.emit('achievementUnlocked', achievementData);
    } else {
      setAchievements((prev) =>
        prev.map(a => a.category === category ? { ...achievement, currentProgress: newProgress.currentProgress } : a)
      );
    }
  };

  // Reset progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Reset progress for certain achievements
      setProgressMap((prev) => {
        const resetCategories = [
          'PRIORITY_NOVICE',
          'PRIORITY_MASTER',
          '3D_EXPLORER',
          'SYNC_POWER_USER'
        ];
        const updated = { ...prev };
        resetCategories.forEach(cat => {
          delete updated[cat];
        });
        return updated;
      });
    }, 86400000); // 24 hours

    return () => clearInterval(interval);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('achievementProgress');
    if (stored) {
      const parsed = JSON.parse(stored);
      setProgressMap(parsed);
    }
  }, []);

  // Save to localStorage when progress changes
  useEffect(() => {
    localStorage.setItem('achievementProgress', JSON.stringify(progressMap));
  }, [progressMap]);

  return {
    achievements,
    updateProgress,
    progressMap,
    getAchievement: (category: AchievementEnum) =>
      achievements.find(a => a.category === category),
    achievementUnlocked: () => {
      const handler = new Audio('/sounds/achievement-unlocked.mp3').play();
      const notification = new Notification('Achievement Unlocked!', {
        body: 'Check your new achievement!',
        icon: '/icons/achievement.png'
      });
      return handler;
    }
  };
};