"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { ElephantLogo } from '@/src/components/ElephantLogo';
import { Clock, Timer, Coffee, Target, TrendingUp, Calendar, Flame, Award, Play, Pause, Square, Settings, Heart, Brain, Sparkles } from 'lucide-react';

interface FocusSession {
  id: string;
  taskId: number;
  taskTitle: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: 'pomodoro' | 'deep-work' | 'quick-break' | 'lunch-break';
  completed: boolean;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  distractionLevel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  elephantPersonality: 'mentor' | 'boss' | 'creative' | 'owl';
}

interface DailyStats {
  date: string;
  totalSessions: number;
  totalFocusTime: number;
  completedSessions: number;
  streak: number;
  bestSession: number;
  averageEnergy: number;
}

const focusTypes = [
  {
    id: 'pomodoro',
    name: 'Pomodoro Focus',
    icon: Timer,
    color: 'from-red-400 to-pink-400',
    description: '25 minutes of deep work, 5 minute break',
    estimatedTime: 25
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    icon: Brain,
    color: 'from-blue-400 to-purple-400',
    description: 'Extended concentration period',
    estimatedTime: 90
  },
  {
    id: 'quick-break',
    name: 'Quick Break',
    icon: Coffee,
    color: 'from-green-400 to-teal-400',
    description: 'Short recovery session',
    estimatedTime: 10
  },
  {
    id: 'lunch-break',
    name: 'Lunch Break',
    icon: Heart,
    color: 'from-orange-400 to-red-400',
    description: 'Mental reset and nourishment',
    estimatedTime: 60
  }
];

const mockFocusSessions: FocusSession[] = [
  {
    id: 'session-1',
    taskId: 123,
    taskTitle: 'Design new dashboard',
    startTime: '2026-07-31T09:00:00Z',
    endTime: '2026-07-31T09:25:00Z',
    duration: 25,
    type: 'pomodoro',
    completed: true,
    energyLevel: 4,
    distractionLevel: 2,
    elephantPersonality: 'mentor'
  },
  {
    id: 'session-2',
    taskId: 124,
    taskTitle: 'Review code changes',
    startTime: '2026-07-31T10:30:00Z',
    endTime: '2026-07-31T11:15:00Z',
    duration: 45,
    type: 'deep-work',
    completed: true,
    energyLevel: 3,
    distractionLevel: 4,
    elephantPersonality: 'boss'
  },
  {
    id: 'session-3',
    taskId: 125,
    taskTitle: 'Create documentation',
    startTime: '2026-07-31T14:00:00Z',
    endTime: '2026-07-31T14:10:00Z',
    duration: 10,
    type: 'quick-break',
    completed: true,
    energyLevel: 2,
    distractionLevel: 1,
    elephantPersonality: 'creative'
  },
  {
    id: 'session-4',
    taskId: 126,
    taskTitle: 'Team standup',
    startTime: '2026-07-31T11:00:00Z',
    endTime: '2026-07-31T11:45:00Z',
    duration: 45,
    type: 'lunch-break',
    completed: true,
    energyLevel: 5,
    distractionLevel: 3,
    elephantPersonality: 'boss'
  },
  {
    id: 'session-5',
    taskId: 127,
    taskTitle: 'Plan weekly goals',
    startTime: '2026-07-31T15:00:00Z',
    endTime: '',
    duration: 0,
    type: 'deep-work',
    completed: false,
    energyLevel: 4,
    distractionLevel: 2,
    elephantPersonality: 'mentor'
  }
];

const dailyStats: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  totalSessions: 4,
  completedSessions: 4,
  totalFocusTime: 165,
  streak: 7,
  bestSession: 45,
  averageEnergy: 3.5
};

export default function FocusSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<FocusSession[]>(mockFocusSessions);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showStartSession, setShowStartSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);

  const filteredSessions = sessions.filter(session => {
    if (selectedType === 'all') return true;
    return session.type === selectedType;
  });

  const completedSessions = sessions.filter(s => s.completed);
  const ongoingSessions = sessions.filter(s => !s.completed);

  const getSessionIcon = (type: string) => {
    const typeData = focusTypes.find(t => t.id === type);
    return typeData?.icon || Clock;
  };

  const getSessionColor = (type: string) => {
    const typeData = focusTypes.find(t => t.id === type);
    return typeData?.color || 'from-gray-400 to-gray-500';
  };

  const getPersonalityEmoji = (archetype: string) => {
    const emojis = {
      mentor: '🧓',
      boss: '💼',
      creative: '🌟',
      owl: '🦉'
    };
    return emojis[archetype as keyof typeof emojis] || '🐘';
  };

  const getTypeLabel = (type: string) => {
    const typeData = focusTypes.find(t => t.id === type);
    return typeData?.name || type;
  };

  const startNewSession = (type: string) => {
    const newSession: FocusSession = {
      id: `session-${Date.now()}`, // mock ID
      taskId: 0,
      taskTitle: 'New focus session',
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      type: type as any,
      completed: false,
      energyLevel: 3,
      distractionLevel: 3,
      elephantPersonality: 'mentor'
    };
    setSessions(prev => [newSession, ...prev]);
    setShowStartSession(false);
    toast.success('Focus session started! 🐘');
  };

  const completeSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const endTime = new Date().toISOString();
        const start = new Date(session.startTime);
        const end = new Date(endTime);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);

        return {
          ...session,
          endTime,
          duration,
          completed: true
        };
      }
      return session;
    }));
    toast.success('Focus session completed! Great job! 🎯');
  };

  const getEnergyColor = (level: number) => {
    if (level <= 2) return 'text-red-400';
    if (level <= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getDistractionColor = (level: number) => {
    if (level <= 2) return 'text-green-400';
    if (level <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <ElephantLogo size={64} mood="happy" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Focus Sessions</h1>
          <p className="text-gray-400">Track your elephant-like concentration and productivity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Timer size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{dailyStats.totalSessions}</div>
                <div className="text-xs text-gray-400">Total Sessions</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Target size={20} className="text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{dailyStats.totalFocusTime}</div>
                <div className="text-xs text-gray-400">Focus Minutes</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{dailyStats.streak}</div>
                <div className="text-xs text-gray-400">Day Streak</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{dailyStats.bestSession}</div>
                <div className="text-xs text-gray-400">Best Session (min)</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Award size={20} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{dailyStats.averageEnergy.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Avg Energy (1-5)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Control Panel */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={() => setShowStartSession(true)}
                  className="w-full p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Play size={16} />
                  Start New Session
                </button>

                <button
                  onClick={() => router.push('/voice-commands')}
                  className="w-full p-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <Brain size={16} />
                  Elephant Voice Commands
                </button>

                <button
                  onClick={() => router.push('/statistics')}
                  className="w-full p-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  View Analytics
                </button>
              </div>

              {/* Session Types */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Session Types</h3>
                <div className="space-y-2">
                  {focusTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${selectedType === type.id
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span className="font-medium">{type.name}</span>
                        </div>
                        <div className="text-xs mt-1 ml-7 opacity-70">
                          {type.estimatedTime} min
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Today's Status */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Today's Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                    <span className="text-sm text-gray-400">Completed</span>
                    <span className="text-green-400 font-bold">{dailyStats.completedSessions}/{dailyStats.totalSessions}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                    <span className="text-sm text-gray-400">Ongoing</span>
                    <span className="text-yellow-400 font-bold">{ongoingSessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                    <span className="text-sm text-gray-400">Focus Time</span>
                    <span className="text-blue-400 font-bold">{Math.floor(dailyStats.totalFocusTime / 60)}h {dailyStats.totalFocusTime % 60}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1">
            <div className="bg-slate-800 rounded-2xl border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Focus Sessions</h3>
                  <div className="text-sm text-gray-400">
                    {filteredSessions.length} sessions
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-700">
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className="p-6 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">{getPersonalityEmoji(session.elephantPersonality)}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{session.taskTitle}</h4>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {session.endTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {session.duration} min
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              {React.createElement(getSessionIcon(session.type), { size: 12, className: 'text-gray-400' })}
                              {getTypeLabel(session.type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {session.endTime && session.completed && (
                          <div className="text-center">
                            <div className={`text-xs ${getEnergyColor(session.energyLevel)} font-bold`}>Energy: {session.energyLevel}/5</div>
                            <div className={`text-xs ${getDistractionColor(session.distractionLevel)}`}>Distractions: {session.distractionLevel}/5</div>
                          </div>
                        )}

                        <div className="text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${session.completed
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                          >
                            {session.completed ? (
                              <>✅ Completed</>
                            ) : (
                              <>⏳ Ongoing</>
                            )}
                          </div>
                        </div>

                        {!session.completed && (
                          <button
                            onClick={() => completeSession(session.id)}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <Square size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredSessions.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">🐘</div>
                    <h3 className="text-lg font-bold text-white mb-2">No sessions found</h3>
                    <p className="text-gray-400 mb-4">
                      {selectedType !== 'all' ? 'No sessions of this type today.' : 'No focus sessions yet.'}
                    </p>
                    <button
                      onClick={() => setShowStartSession(true)}
                      className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      Start Your First Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Start Session Modal */}
        {showStartSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl p-6 rounded-2xl border border-border bg-card/90">
              <h3 className="text-xl font-bold text-white mb-6">Start New Focus Session</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {focusTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => startNewSession(type.id)}
                      className="p-6 rounded-xl border border-border bg-card/50 hover:bg-card/70 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Icon size={24} className="text-purple-400" />
                        <h4 className="font-bold text-white">{type.name}</h4>
                      </div>
                      <p className="text-sm text-gray-400">{type.description}</p>
                      <div className="text-xs text-purple-400 mt-2">Estimated: {type.estimatedTime} min</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowStartSession(false)}
                  className="px-6 py-3 rounded-xl border border-border text-muted hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowStartSession(false)}
                  className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all"
                >
                  Back Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}