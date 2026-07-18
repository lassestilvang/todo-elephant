"use client";

import React, { useState, useEffect } from "react";
import { Target, Sparkles, Trophy, Users, Brain, Clock, Activity, Medal, Zap } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  level: number; // 0-100
  xp: number;
  xpToNext: number;
  category: string;
  lastPracticed: Date | null;
  relatedTasks: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  earned: boolean;
  dateEarned: Date | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

interface UserStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  focusHours: number;
  skillsMastered: number; // skills at level 90+
  achievementsEarned: number;
}

export default function SkillsGamificationCenter() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    tasksCompleted: 0,
    focusHours: 0,
    skillsMastered: 0,
    achievementsEarned: 0,
  });
  const [selectedTab, setSelectedTab] = useState<'skills' | 'achievements' | 'progress'>('skills');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load skills
      const skillsResponse = await fetch('/api/skills/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setSkills(skillsData.skills || []);
      }

      // Load achievements
      const achievementsResponse = await fetch('/api/achievements/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData.achievements || []);
      }

      // Load stats
      const statsResponse = await fetch('/api/stats/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {});
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const getLevelFromXP = (xp: number): number => {
    // Simple level calculation: level = sqrt(xp / 100)
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  const getSkillCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-blue-100 text-blue-800',
      creative: 'bg-purple-100 text-purple-800',
      analytical: 'bg-green-100 text-green-800',
      communication: 'bg-yellow-100 text-yellow-800',
      leadership: 'bg-pink-100 text-pink-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.default;
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors: Record<Achievement['rarity'], string> = {
      common: 'bg-gray-100 text-gray-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-pink-100 text-pink-800',
    };
    return colors[rarity] || colors.common;
  };

  const handleSkillPractice = (skillId: string) => {
    console.log(`Practicing skill: ${skillId}`);
    // Would update skill XP in real implementation
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Skills & Growth</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTab('skills')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              selectedTab === 'skills'
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-muted hover:bg-border/50'
            }`}
          >
            Skills
          </button>
          <button
            onClick={() => setSelectedTab('achievements')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              selectedTab === 'achievements'
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-muted hover:bg-border/50'
            }`}
          >
            Achievements
          </button>
          <button
            onClick={() => setSelectedTab('progress')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              selectedTab === 'progress'
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-muted hover:bg-border/50'
            }`}
          >
            Progress
          </button>
        </div>
      </div>

      {selectedTab === 'skills' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold">Skill Development</h4>
            <button
              onClick={() => console.log('View skill tree')}
              className="px-2 py-1 rounded-lg text-xs text-muted hover:text-foreground"
            >
              Skill Tree
            </button>
          </div>
          {skills.length > 0 ? (
            <div className="space-y-2">
              {skills.map((skill) => (
                <div key={skill.id} className="p-3 rounded-xl border border-border bg-background">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{skill.name}</h4>
                      <p className="text-xs text-muted">{skill.category}</p>
                    </div>
                    <div className="text-xs font-semibold">
                      Level {skill.level}
                    </div>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2.5 mb-2 overflow-hidden">
                    <div
                      className={`h-full bg-${getSkillCategoryColor(skill.category).split(' ')[1]} rounded-full h-2.5`}
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>{skill.xp}/${skill.xpToNext} XP</span>
                    <span>{skill.relatedTasks} related tasks</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => handleSkillPractice(skill.id)}
                      className="px-2 py-1 rounded bg-blue-500/20 text-blue-600 text-xs"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Sparkles size={32} className="text-muted/30 mx-auto mb-2" />
              <p className="text-sm text-muted">No skills tracked yet</p>
              <p className="text-xs text-muted">Complete tasks to start developing skills</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'achievements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold">Achievements & Trophies</h4>
          </div>
          {achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {[
                          'Target',
                          'Sparkles',
                          'Trophy',
                          'Users',
                          'Brain',
                          'Clock',
                          'Activity',
                          'Medal',
                          'Zap',
                        ].includes(achievement.icon as any) ? (
                          (achievement.icon as any) === 'Target' && <Target size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Sparkles' && <Sparkles size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Trophy' && <Trophy size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Users' && <Users size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Brain' && <Brain size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Clock' && <Clock size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Activity' && <Activity size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Medal' && <Medal size={20} className={getRarityColor(achievement.rarity)} />
                        ) : (
                          (achievement.icon as any) === 'Zap' && <Zap size={20} className={getRarityColor(achievement.rarity)} />
                        )}
                      </div>
                      <h4 className="font-semibold text-sm">{achievement.name}</h4>
                      <p className="text-xs text-muted">{achievement.description}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                      {achievement.earned ? 'EARNED' : 'LOCKED'}
                    </div>
                  </div>
                  {achievement.earned && (
                    <div className="mt-2 text-xs text-muted">
                      Earned: {achievement.dateEarned ? new Date(achievement.dateEarned).toLocaleDateString() : 'Recently'}
                    </div>
                  )}
                  {!achievement.earned && (
                    <div className="mt-2 text-xs text-muted text-center">
                      +{achievement.xpReward} XP when earned
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy size={32} className="text-muted/30 mx-auto mb-2" />
              <p className="text-sm text-muted">No achievements earned yet</p>
              <p className="text-xs text-muted">Complete tasks and develop skills to unlock achievements</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'progress' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold">Progress Overview</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl border border-border bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Current Level</h4>
                  <p className="text-2xl font-bold">{stats.level}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-right">Total XP</p>
                  <p className="text-2xl font-bold text-right">{stats.totalXP}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted/20 rounded-full h-4 mb-2 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full h-4"
                    style={{ width: `${Math.min(100, (stats.totalXP % 1000) / 10)}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted">XP to next level: ${Math.max(0, 100 - (stats.totalXP % 1000) / 10)}%</p>
              </div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Focus Time</h4>
                  <p className="text-2xl font-bold">{stats.focusHours}h</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-right">Streak</p>
                  <p className="text-2xl font-bold text-right">{stats.currentStreak} days</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted/20 rounded-full h-4 mb-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500/20 rounded-full h-4"
                    style={{ width: `${Math.min(100, (stats.currentStreak / stats.longestStreak) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted">Best streak: ${stats.longestStreak} days</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-background">
            <h4 className="font-semibold text-sm">Skills Mastered (90+)</h4>
            <p className="text-2xl font-bold">{stats.skillsMastered}</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-background">
            <h4 className="font-semibold text-sm">Achievements Earned</h4>
            <p className="text-2xl font-bold">{stats.achievementsEarned}</p>
          </div>
        </div>
      )}
    </div>
  );
}