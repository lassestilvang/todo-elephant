"use client";

import React, { useState } from 'react';
import { Trophy, CheckCircle2, Calendar, Target, Brain, Sticker, Award, Crown, Star, Flame } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  points: number;
  unlocked: boolean;
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-task',
    title: 'First Steps',
    description: 'Complete your first task',
    icon: CheckCircle2,
    points: 10,
    unlocked: true,
    requirement: 'Complete 1 task',
    rarity: 'common',
  },
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Complete tasks for 3 days in a row',
    icon: Calendar,
    points: 25,
    unlocked: true,
    requirement: '3-day streak',
    rarity: 'common',
  },
  {
    id: 'streak-7',
    title: 'Consistent',
    description: 'Complete tasks for 7 days in a row',
    icon: Flame,
    points: 50,
    unlocked: true,
    requirement: '7-day streak',
    rarity: 'rare',
  },
  {
    id: 'streak-30',
    title: 'Dedicated',
    description: 'Complete tasks for 30 days in a row',
    icon: Crown,
    points: 200,
    unlocked: false,
    requirement: '30-day streak',
    rarity: 'epic',
  },
  {
    id: 'focus-master',
    title: 'Focus Master',
    description: 'Complete 50 focus sessions',
    icon: Brain,
    points: 150,
    unlocked: false,
    requirement: '50 focus sessions',
    rarity: 'rare',
  },
  {
    id: 'kanban-pro',
    title: 'Kanban Pro',
    description: 'Complete 100 tasks in Kanban view',
    icon: Target,
    points: 100,
    unlocked: false,
    requirement: '100 Kanban tasks',
    rarity: 'rare',
  },
  {
    id: 'all-categories',
    title: 'Renaissance Person',
    description: 'Complete tasks in 5 different categories',
    icon: Sticker,
    points: 75,
    unlocked: false,
    requirement: '5 categories completed',
    rarity: 'epic',
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete 100% of planned tasks for a week',
    icon: Award,
    points: 300,
    unlocked: false,
    requirement: '100% completion for 7 days',
    rarity: 'legendary',
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 20 tasks between 10pm-6am',
    icon: Star,
    points: 120,
    unlocked: false,
    requirement: '20 night tasks',
    rarity: 'epic',
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 20 tasks before 10am',
    icon: Trophy,
    points: 120,
    unlocked: false,
    requirement: '20 morning tasks',
    rarity: 'epic',
  },
];

const RARITY_COLORS = {
  common: 'bg-gray-400/20 text-gray-600',
  rare: 'bg-blue-400/20 text-blue-600',
  epic: 'bg-purple-400/20 text-purple-600',
  legendary: 'bg-yellow-400/20 text-yellow-600',
};

export function AchievementBadges({ className }: { className?: string }) {
  const [showAll, setShowAll] = useState(false);
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalPoints = ACHIEVEMENTS.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Achievements</h3>
          <p className="text-sm text-muted">
            {unlockedCount} of {ACHIEVEMENTS.length} unlocked • {totalPoints} points
          </p>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-accent hover:underline"
        >
          {showAll ? 'Hide' : 'View All'}
        </button>
      </div>

      <div className={`grid ${showAll ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'} gap-3`}>
        {ACHIEVEMENTS.slice(0, showAll ? 100 : 6).map(achievement => {
          const Icon = achievement.icon;
          const isUnlocked = achievement.unlocked;

          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-xl border transition-all ${
                isUnlocked
                  ? 'bg-card border-border'
                  : 'bg-muted/20 border-border/50 grayscale'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${RARITY_COLORS[achievement.rarity]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    <Badge variant="outline" className={RARITY_COLORS[achievement.rarity]}>
                      {achievement.points}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  <p className="text-xs text-muted/60 mt-2">{achievement.requirement}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook for managing achievements
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);

  const checkAchievement = (id: string) => {
    // Logic to check if achievement is earned
    // This would typically check against user data
    return achievements.find(a => a.id === id);
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prev => prev.map(a =>
      a.id === id ? { ...a, unlocked: true } : a
    ));
  };

  const getProgress = () => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    const points = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

    return { unlocked, total, points, progress: (unlocked / total) * 100 };
  };

  return { achievements, checkAchievement, unlockAchievement, getProgress };
}