use client

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { ElephantLogo } from '@/src/components/ElephantLogo';
import { Search, Filter, Grid, List, Heart, Download, Play, Star, Clock, Users, ArrowLeft, TrendingUp, Clock3, Calendar, Timer, ChevronRight, Crown, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorId: string;
  category: 'daily' | 'weekly' | 'project' | 'habit' | 'focus';
  tags: string[];
  thumbnail: string;
  usageCount: number;
  rating: number;
  ratingCount: number;
  isFavorite: boolean;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  elephantPersonality: 'mentor' | 'boss' | 'creative' | 'owl';
  content: TemplateSection[];
  isNew: boolean;
  trending: boolean;
}

interface TemplateSection {
  id: string;
  type: 'task' | 'list' | 'deadline' | 'repeat';
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dependencies?: string[];
  subtasks?: TemplateSubtask[];
  icon?: string;
  color?: string;
}

interface TemplateSubtask {
  id: string;
  title: string;
  completed: boolean;
}

const categories = [
  { id: 'all', name: 'All Templates', icon: Grid, count: 48 },
  { id: 'daily', name: 'Daily', icon: Clock, count: 12 },
  { id: 'weekly', name: 'Weekly', icon: Users, count: 8 },
  { id: 'project', name: 'Project', icon: List, count: 15 },
  { id: 'habit', name: 'Habit', icon: Heart, count: 6 },
  { id: 'focus', name: 'Focus', icon: Star, count: 7 }
];

const sampleTemplates: Template[] = [
  {
    id: 'daily-morning',
    title: 'Morning Elephant Ritual',
    description: 'Start your day like a wise elephant - meditation, planning, and gentle stretching',
    creator: 'Ellie the Mentor',
    creatorId: 'mentor-001',
    category: 'daily',
    tags: ['morning', 'meditation', 'planning', 'gentle'],
    thumbnail: '/templates/morning-ritual.png',
    usageCount: 1247,
    rating: 4.8,
    ratingCount: 892,
    isFavorite: false,
    estimatedTime: '15 min',
    difficulty: 'easy',
    elephantPersonality: 'mentor',
    content: [
      {
        id: 'meditation-1',
        type: 'task',
        title: 'Elephant meditation (5 min)',
        description: 'Sit comfortably, close your eyes, and connect with your inner wisdom',
        status: 'todo',
        priority: 'medium',
        icon: '🧘',
        color: 'from-purple-400 to-pink-400'
      },
      {
        id: 'planning-1',
        type: 'list',
        title: 'Today's herd priorities',
        description: 'Identify 3 most important tasks for the herd today',
        status: 'todo',
        priority: 'high',
        icon: '📋',
        color: 'from-blue-400 to-cyan-400'
      },
      {
        id: 'stretch-1',
        type: 'repeat',
        title: 'Gentle elephant stretch',
        description: 'Stretch like an elephant reaching for the sky',
        status: 'todo',
        priority: 'low',
        dueDate: 'daily',
        icon: '🦏',
        color: 'from-green-400 to-emerald-400'
      }
    ],
    isNew: false,
    trending: true
  },
  {
    id: 'project-kickoff',
    title: 'Project Kickoff (Boss Elephant Style)',
    description: 'Lead your herd with authority and precision',
    creator: 'Brandon the Boss',
    creatorId: 'boss-001',
    category: 'project',
    tags: ['project', 'planning', 'leadership', 'management'],
    thumbnail: '/templates/project-kickoff.png',
    usageCount: 856,
    rating: 4.6,
    ratingCount: 523,
    isFavorite: true,
    estimatedTime: '2 hours',
    difficulty: 'medium',
    elephantPersonality: 'boss',
    content: [
      {
        id: 'scope-1',
        type: 'task',
        title: 'Define project scope',
        description: 'Clarity prevents confusion in the herd',
        status: 'todo',
        priority: 'urgent',
        icon: '🎯',
        color: 'from-red-400 to-pink-400'
      },
      {
        id: 'deadline-1',
        type: 'deadline',
        title: 'MVP delivery deadline',
        description: 'Set realistic timeline for the herd',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-08-15',
        icon: '⏰',
        color: 'from-orange-400 to-red-400'
      },
      {
        id: 'team-1',
        type: 'list',
        title: 'Assign roles',
        description: 'Give each herd member their elephant-sized tasks',
        status: 'todo',
        priority: 'high',
        icon: '👥',
        color: 'from-indigo-400 to-purple-400'
      }
    ],
    isNew: false,
    trending: false
  },
  {
    id: 'creative-spark',
    title: 'Creative Spark Sessions',
    description: 'Ignite innovation like an elephant in a field of dreams',
    creator: 'Luna the Explorer',
    creatorId: 'creative-001',
    category: 'focus',
    tags: ['creative', 'innovation', 'ideas', 'exploration'],
    thumbnail: '/templates/creative-spark.png',
    usageCount: 492,
    rating: 4.9,
    ratingCount: 312,
    isFavorite: false,
    estimatedTime: '45 min',
    difficulty: 'easy',
    elephantPersonality: 'creative',
    content: [
      {
        id: 'brainstorm-1',
        type: 'list',
        title: 'Brainstorm ideas',
        description: 'Free flow of creative thoughts - no judgment',
        status: 'todo',
        priority: 'medium',
        icon: '💡',
        color: 'from-yellow-400 to-orange-400'
      },
      {
        id: 'prototype-1',
        type: 'task',
        title: 'Prototype concept',
        description: 'Build quick mockup of wild ideas',
        status: 'todo',
        priority: 'high',
        icon: '🛠️',
        color: 'from-cyan-400 to-blue-400'
      },
      {
        id: 'review-1',
        type: 'repeat',
        title: 'Creative review session',
        description: 'Weekly creative spark to keep the herd innovative',
        status: 'todo',
        priority: 'low',
        dueDate: 'weekly',
        icon: '🎨',
        color: 'from-pink-400 to-rose-400'
      }
    ],
    isNew: true,
    trending: true
  },
  {
    id: 'focus-deep-work',
    title: 'Deep Work Immersion',
    description: 'Enter the elephant mind - pure focused concentration',
    creator: 'Sam the Night Owl',
    creatorId: 'owl-001',
    category: 'focus',
    tags: ['focus', 'deep work', 'productivity', 'concentration'],
    thumbnail: '/templates/deep-work.png',
    usageCount: 723,
    rating: 4.7,
    ratingCount: 456,
    isFavorite: false,
    estimatedTime: '2 hours',
    difficulty: 'hard',
    elephantPersonality: 'owl',
    content: [
      {
        id: 'preparation-1',
        type: 'task',
        title: 'Prepare environment',
        description: 'Eliminate distractions, charge your mental batteries',
        status: 'todo',
        priority: 'high',
        icon: '🏗️',
        color: 'from-slate-400 to-gray-400'
      },
      {
        id: 'focus-1',
        type: 'repeat',
        title: '90-minute focus block',
        description: 'Elephant-level concentration - deep and uninterrupted',
        status: 'todo',
        priority: 'urgent',
        dueDate: 'daily',
        icon: '🧠',
        color: 'from-violet-400 to-purple-400'
      },
      {
        id: 'review-2',
        type: 'task',
        title: 'Review progress',
        description: 'Wise owl reflection on what was accomplished',
        status: 'todo',
        priority: 'medium',
        icon: '📊',
        color: 'from-teal-400 to-cyan-400'
      }
    ],
    isNew: false,
    trending: false
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(sampleTemplates);

  useEffect(() => {
    let filtered = sampleTemplates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFavorites = !favoritesOnly || template.isFavorite;
      return matchesCategory && matchesSearch && matchesFavorites;
    });

    filtered.sort((a, b) => {
      if (favoritesOnly) {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
      }
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;
      return b.rating - a.rating;
    });

    setFilteredTemplates(filtered);
  }, [selectedCategory, searchQuery, favoritesOnly]);

  const getPersonalityEmoji = (archetype: string) => {
    const emojis = {
      mentor: '🧓',
      boss: '💼',
      creative: '🌟',
      owl: '🦉'
    };
    return emojis[archetype as keyof typeof emojis] || '🐘';
  };

  const getPersonalityColor = (archetype: string) => {
    const colors = {
      mentor: 'from-amber-400 to-orange-500',
      boss: 'from-red-400 to-pink-500',
      creative: 'from-purple-400 to-indigo-500',
      owl: 'from-green-400 to-teal-500'
    };
    return colors[archetype as keyof typeof colors] || 'from-gray-400 to-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    return categoryData?.icon || Grid;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      hard: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
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
          <h1 className="text-4xl font-bold text-white mb-2">Elephant Template Marketplace</h1>
          <p className="text-gray-400">Find the perfect herd routine for any occasion</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${selectedCategory === category.id
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Filters</h3>
                <button
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`w-full p-3 rounded-xl transition-colors flex items-center gap-2 ${favoritesOnly
                    ? 'bg-red-600/20 text-red-400'
                    : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  <Heart size={18} fill={favoritesOnly ? 'currentColor' : 'none'} />
                  Favorites Only
                </button>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 max-w-2xl mx-auto'
              }`}
              >
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/templates/${template.id}`)}
                  >
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 relative overflow-hidden">
                        <div className="absolute top-2 right-2 flex gap-2">
                          {template.isNew && (
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                              NEW
                            </span>
                          )}
                          {template.trending && (
                            <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                              TRENDING
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-2">
                          <span className="text-2xl">{getPersonalityEmoji(template.elephantPersonality)}</span>
                          <span className="px-2 py-1 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium capitalize">
                            {template.elephantPersonality}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{template.title}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs text-gray-500">
                          <div>Creator: {template.creator}</div>
                          <div>{template.usageCount.toLocaleString()} uses</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 fill-current" />
                          <span className="text-white text-sm font-medium">{template.rating}</span>
                          <span className="text-gray-500 text-xs">({template.ratingCount})</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-lg bg-slate-700 text-gray-300 text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock3 size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-400">{template.estimatedTime}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(template.difficulty)}`};
                          {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}