"use client";

import React, { useState, useEffect } from "react";
import { Brain, Lightbulb, TrendingUp, Target, Clock, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdaptiveRecommendation {
  title: string;
  description: string;
  priority: number;
  category: string;
  confidence: number;
  context: string;
  aiConfidence: number;
  userPreferenceMatch: number;
}

interface UserProfile {
  userId: string;
  adaptationLevel: number;
  behaviorPattern: {
    taskCompletionSpeed: number;
    preferredCategories: string[];
    optimalTimes: { day: string; hour: number }[];
  };
  preferences: {
    suggestionThreshold: number;
  };
}

export default function AdaptiveRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id, context]);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/adaptive-learning/recommendations${context ? `?context=${context}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getContextIcon = (ctx: string) => {
    switch (ctx) {
      case 'morning_focus': return <Brain size={16} className="text-blue-500" />;
      case 'creative_exploration': return <Sparkles size={16} className="text-purple-500" />;
      case 'process_improvement': return <TrendingUp size={16} className="text-green-500" />;
      case 'focus_session': return <Clock size={16} className="text-orange-500" />;
      case 'task_batching': return <Target size={16} className="text-indigo-500" />;
      default: return <Lightbulb size={16} className="text-accent" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      prioritization: 'bg-purple-100 text-purple-800',
      exploration: 'bg-pink-100 text-pink-800',
      optimization: 'bg-cyan-100 text-cyan-800',
      focus: 'bg-yellow-100 text-yellow-800',
      efficiency: 'bg-emerald-100 text-emerald-800',
      wellbeing: 'bg-rose-100 text-rose-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.default;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">AI-Powered Recommendations</h3>
          <p className="text-sm text-muted">Personalized suggestions that learn from your work patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1 bg-background text-foreground"
          >
            <option value="">All Contexts</option>
            <option value="morning_focus">Morning Focus</option>
            <option value="creative_exploration">Creative</option>
            <option value="process_improvement">Process</option>
            <option value="focus_session">Focus</option>
          </select>
          <button
            onClick={loadRecommendations}
            disabled={isLoading}
            className="p-2 rounded-lg border border-border hover:bg-border/50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Brain className="animate-pulse text-accent mx-auto mb-2" size={32} />
            <p className="text-sm text-muted">Loading personalized recommendations...</p>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb size={48} className="mx-auto mb-2 text-muted/30" />
          <p className="text-sm text-muted">No recommendations available right now</p>
          <p className="text-xs text-muted mt-1">Complete a few tasks to start learning patterns</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-border bg-background hover:border-accent/20 transition-all"
            >
              <div className="flex items-start gap-3 mb-2">
                {getContextIcon(rec.context)}
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground">{rec.title}</h4>
                  <p className="text-xs text-muted mt-1">{rec.description}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                  {Math.round(rec.confidence * 100)}%
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted">
                <span className={`px-2 py-0.5 rounded ${getCategoryColor(rec.category)}`}>
                  {rec.category.replace('_', ' ').toUpperCase()}
                </span>
                <span>Priority: {rec.priority}/10</span>
                <span>AI Match: {Math.round(rec.userPreferenceMatch * 100)}%</span>
              </div>

              <button className="mt-3 w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
                Apply Recommendation
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Brain size={14} />
          <span>
            <strong>AI Learning Level:</strong> {userProfile?.adaptationLevel || 0}% - {userProfile?.adaptationLevel > 80 ? 'Advanced' : userProfile?.adaptationLevel > 50 ? 'Intermediate' : 'Developing'}
          </span>
        </div>
        <p className="text-xs text-muted mt-1">
          Recommendations improve as the AI learns your work patterns and preferences
        </p>
      </div>
    </div>
  );
}