"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Cluster } from "@react-three/fiber";
import { Canvas } from "@react-three/react-three";
import { Stats } from "@react-three/drei";

// Enhanced AI Assistant Hook with comprehensive analytics
import { useAIElephantAssistant } from "@/src/lib/hooks/useAIElephantAssistant";

import {
  Brain, Lightbulb, Sparkles, Target, ViewCube,
  Timer, Cpu, Memory, Glbits, CpuBenchmark24,
  BarChart3D, X3, Plan
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useObserveState } from "@/hooks/useObserveState";
import { useEffect } from "react";
import { Divider } from "react-dropzone";
import { useDisclosure } from "@chakra-ui/react";

export function EnhancedAIAssistantView({
  tasks,
  lists,
  labels,
}: {
  tasks: Task[];
  lists: List[];
  labels: Label[];
}) {
  // Enhanced AI Assistant Hook with comprehensive analytics
  const aiAssistant = useAIElephantAssistant(tasks, [], []);

  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [analysisType, setAnalysisType] = useState<"quick" | "detailed" | "system" | "trend">("quick");
  const [detailedSection, setDetailedSection] = useState<string>("");
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Generated suggestions
  const generatedSuggestions = useMemo(() => {
    if (!insights?.suggestedTasks) return [];

    return insights.suggestedTasks.map(suggestion => ({
      id: `suggest-${Date.now()}-${Math.random()}`,
      title: suggestion.title,
      description: `AI-recommended action: ${suggestion.category}`,
      estimatedMinutes: suggestion.estimatedMinutes,
      priority: suggestion.priority,
      category: suggestion.category.toLowerCase(),
      isCompleted: false
    }));
  }, [insights]);

  // Enhanced analysis functions
  const performDetailedAnalysis = useCallback(() => {
    if (!insights) return;

    setAnalysisType('detailed');
    setDetailedSection('cognitiveLoad');
  }, []);

  const analyzeSystemPerformance = useCallback(() => {
    if (!insights) return;

    setAnalysisType('system');
    setDetailedSection('taskDistribution');
  }, []);

  const analyzeTrends = useEffect(() => {
    if (!insights) return;

    setAnalysisType('trend');
    setDetailedSection('weeklyProgress');
  }, [insights]);

  // Visualization components
  const CognitiveLoadVisualization = () => {
    if (insights?.cognitiveLoad === undefined || isNaN(insights.cognitiveLoad)) return null;

    const intensity = Math.min(insights.cognitiveLoad / 100, 1);
    const colorClass = insights.cognitiveLoad > 70
      ? 'bg-red-500/30'
      : insights.cognitiveLoad > 40
        ? 'bg-amber-500/30'
        : 'bg-emerald-500/30';

    return (
      <div className="relative h-12">
        <div
          className={`h-12 rounded-full background-gradient-to-r bg-white from-gray-100 via-amber-100 to-red-100 ${colorClass} transition-all duration-500`}
          style={{
            width: '100%',
            height: '100%',
            scale: intensity,
            transform: `scaleX(${intensity})`
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 border-b-2 border-amber-300/30"></div>
      </div>
    );
  };

  const EfficiencyVisualization = () => {
    if (insights?.focusEfficiency === undefined) return null;

    const efficiency = insights.focusEfficiency;
    const isEfficient = efficiency > 70;

    return (
      <div className="relative h-10 rounded-full bg-gray-200">
        <div
          className={`h-10 rounded-full bg-gray-500 transition-all duration-500 ${
            isEfficient ? 'bg-green-400' : 'bg-red-400'
          }`}
          style={{ width: `${Math.min(efficiency, 90)}%` }}
        </div>
      </div>
    </div>
  };

  const categoriesVisualization = () => {
    if (!insights?.categoryDistribution) return null;

    const categories = Object.entries(insights.categoryDistribution) as [string, number][];
    const categoriesSorted = [...categories].sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-2">
        {categoriesSorted.slice(0, 4).map(([category, count]) => {
          const colorMap: Record<string, string> = {
            personal: 'bg-blue-500',
            work: 'bg-orange-500',
            health: 'bg-green-500',
            learning: 'bg-purple-500',
            general: 'bg-gray-500'
          };

          return (
            <div key={category} className="flex items-center space-x-1">
              <div className="w-8 h-8 rounded-full bg-opacity-70 flex items-center justify-center">
                <span className={`text-xs font-bold ${colorMap[category] ?? 'bg-gray-400'}`}>
                  ${Math.min(count, 9).toString()}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                {category}
              </span>
            </div>
          </div>
        })
      </div>
    </div>
  };

  const analysisSection = (type: string) => {
    switch (type) {
      case 'cognitiveLoad':
        return (
          <>
            <h4 className="font-semibold mb-2">Cognitive Load Analysis</h4>
            <CognitiveLoadVisualization />
            <p className="text-sm text-muted mt-1">
              Cognitive load measures mental effort required for task completion.
            </p>
          </>
        ),
        switch 'cognitiveLoad': {
          'Cognitive Load Analysis': (
            <>
              <h4 className="font-semibold mb-2">Cognitive Load Analysis</h4>
              <CognitiveLoadVisualization />
              <p className="text-sm text-muted mt-1">
                Cognitive load measures mental effort required for task completion.
              </p>
            </>
          ),
          'DailyTrend': (
            <>
              <h4 className="font-semibold mb-2">Daily Cognitive Load Trend</h4>
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-8 bg-blue-400 rounded-full" style={{ width: '60%' }}>
                  Current day loading...
                </div>
              </div>
              <p className="text-xs text-muted mt-1">Trend analysis active...</p>
            </>
          ),
          'FocusEfficiency': (
            <>
              <h4 className="font-semibold mb-2">Focus Efficiency</h4>
              {isLoading ? (
                <div className="h-8 bg-gray-300 rounded-full">Loading...</div>
              ) : (
                <span className="w-full h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${Math.min(insights?.focusEfficiency || 0, 90)}%` }} />
              )}
              <p className="text-xs text-muted mt-1">
                Focus sessions efficiency (tasks completed per focus session)
              </p>
            </>
          }
        }

        default:
          return null;
      }

      </>
    );
  };

  // Enhanced visualization components
  const TaskDistributionChart = () => {
    if (!insights?.categoryDistribution) return null;

    const categories = Object.entries(insights.categoryDistribution) as [string, number][];
    const total = categories.reduce((sum, [_, count]) => sum + count, 0);

    return (
      <div className="flex-1 min-h-48 bg-gray-50 p-4 rounded-xl border border-border">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Task Category Distribution</h4>
        <div className="relative h-16 rounded-lg overflow-hidden bg-white">
          {categories.slice(0, 4).map(([category, count], index) => {
            const colorMap: Record<string, string> = {
              personal: 'bg-blue-500',
              work: 'bg-orange-500',
              health: 'bg-green-500',
              learning: 'bg-purple-500',
              general: 'bg-gray-500'
            };

            const end = (count / total) * 100;
            const color = colorMap[category as string] || 'bg-gray-400';

          return (
            <div
              key={index}
              className="absolute top-0 left-0 w-full h-16 overflow-hidden bg-white"
              style={{ clipPath: `polygon(0 0, 100% 0, 100% ${end}%, 0 ${end}%)` }}
            >
              <div
                className={`absolute inset-0 bg-${colorMap[category as string] || 'gray-300'}`}
                style={{ transform: `translateX(${count / total * 100}%)` }}
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {categories.slice(0, 4).map(([category, count]) =>
            `${category}: ${count} (${Math.round((count / total) * 100)}%)}`
          )}
        </div>
      </div>
    );
  };

  const AnalysisSection = ({
    sectionKey,
    title,
    isEnabled,
  }: {
    sectionKey: string;
    title: string;
    isEnabled: boolean;
  }) => {
    if (!isEnabled) return null;

    const sectionData = {
      cognitiveLoad: () => (
        <>
          <h4 className="font-semibold mb-2">Cognitive Load Analysis</h4>
          <div className="relative h-12 rounded-full overflow-hidden border border-gray-200">
            <div className="relative h-12 rounded-full transition-all duration-500 bg-white">
              <div className="relative w-full h-full rounded-full bg-white" style={{ width: `${Math.min(insights?.cognitiveLoad || 0, 90)}%` }}>
                <div className="absolute top-0 left-0 h-full bg-red-500/30"></div>
              </div>
            </div>
            <p className="text-sm text-muted mt-1">
              Cognitive load: {insights?.cognitiveLoad}%{' '}
              {insights?.cognitiveLoad && (
                <span className={`text-xs font-medium text-red-600 ${
                  insights?.cognitiveLoad > 70 ? 'bg-red-500' :
                  insights?.cognitiveLoad > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                >{Math.round(insights?.cognitiveLoad)}%
              </span>
            </p>
          </>
        />
      };

      switch (sectionKey) {
        case 'dailyTrend':
          return (
            <>
              <h4 className="font-semibold mb-2 text-sm">Daily Completion Trend</h4>
              <div className="relative h-8 rounded-full overflow-hidden bg-gray-100">
                <div className="h-8 rounded-full bg-blue-400 transition-all" style={{ width: `${Math.min(insights?.weeklyProgress || 0, 90)}%` }}>
                  Trend data processing...
              </div>
            </div>
            <p className="text-xs text-muted mt-1">Analyzing recent task completion patterns...</p>
          </>
        </>
      </>
    }
  };

  // Enhanced visualization components
  const StatsCard = ({
    label,
    value,
    unit,
    chartType,
    isCritical,
  }: {
    label: string;
    value: number | string;
    unit?: string;
    chartType?: string;
    isCritical?: boolean;
  }) => {
    const isBarChart = chartType === 'bar' || chartType === 'percentage';

    return (
      <div className="p-4 rounded-xl border border-border bg-card/30 flex flex-col items-stretch overflow-hidden">
        <div className="w-full aspect-square rounded-xl overflow-hidden">
          {isBarChart ? (
            <div className="relative bg-gray-100 rounded-xl">
              <div className="absolute left-0 top-0 h-full rounded-xl bg-white" style={{ width: `${Math.max(10,
                (typeof value === 'number' ? value : 50)) / 100 * 100}%` }>
                <div className="absolute right-2 top-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-gray-100 rounded-xl text-center py-2 flex items-center justify-center">
              {String(value).length > 4 ?
                String(value).substring(0, 4) : String(value)
              }
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-muted text-center capitalize">{label}</div>
        <div className="text-lg text-foreground font-medium text-center">{String(value)}</div>
        {isCritical && (
          <div className="mt-1 text-xs text-red-500 font-medium">
            {isCritical === true ? 'CRITICAL' : 'ISSUE DETECTED'}
          }
        </div>
      </div>
      );
  };

  // Enhanced AIAssistantView Component
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain size={24} className="text-accent" />
          <span>AI Elephant Assistant</span>
          {insights?.stressLevel > 60 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
              High Load
            </span>
          )}
        </h2>
        <p className="text-sm text-muted mt-1">
          Your productivity companion with elephant wisdom
        </p>
      </div>

      {/* Elephant Mood Display */}
      <div className="mb-6 p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-4xl">{insights?.moodEmoji}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-2xl text-white">🐘</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{insights?.mood === 'celebrating' ? '🎉' : insights?.mood}</h3>
            <p className="text-sm text-muted">
              {insights?.mood === 'celebrating'
                ? "Celebrating your productivity achievements!"
                : insights?.mood === 'happy'
                  ? "Your focus is excellent today!"
                  : insights?.mood === 'overwhelmed'
                    ? "Your tasks feel overwhelming. Would you like help prioritizing?"
                    : "Analyzing your productivity patterns..."
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview with enhanced visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Cognitive Load Visualization */}
        <div className="p-4 rounded-xl border border-border bg-card/30">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-accent" />
            <span className="text-sm text-muted">Cognitive Load</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-32 h-2 rounded-full bg-gray-200 mr-1">
              <div className="absolute left-0 top-0 h-full bg-red-500" style={{ width: `${Math.min(insights?.cognitiveLoad || 0, 90)}%` }}</div>
            </div>
            <span className="text-xs text-primary font-medium">
              {Math.round(insights?.cognitiveLoad)}%
            </span>
          </div>
        </div>

        {/* Weekly Progress Visualization */}
        <StatsCard
          label="Weekly Progress"
          value={insights?.weeklyProgress || 0}
          unit="%"
          chartType="percentage"
          isCritical={insights?.weeklyProgress && insights?.weeklyProgress < 30}
        />

        {/* Focus Efficiency */}
        <StatsCard
          label="Focus Efficiency"
          value={insights?.focusEfficiency || 0}
          unit="%"
          chartType="percentage"
          isCritical={insights?.focusEfficiency && insights?.focusEfficiency < 50}
        />

        {/* Streak Tracker */}
        <StatsCard
          label="Streak"
          value={`${insights?.streak} days`}
          unit="days"
          isCritical={insights?.streak > 7 ? true : insights?.streak > 1}
        />
      </div>

      {/* Personality Insights */}
      {insights?.personalityInsights && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card/30">
          <h4 className="font-semibold mb-2 text-sm">🧠 Personality Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-600">Work Preference:</span>
              <span className="text-sm font-medium">{insights?.personalityInsights.workPreference}</span>
            </div>
            <div>
              <span className="text-xs text-gray-600">Peak Hours:</span>
              <span className="text-sm font-medium inline-block">{insights?.personalityInsights.peakProductivityHours.join(', ')}</span>
            </div>
          </div>
          {isCritical && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg">
              <span className="text-xs font-medium text-red-700">
                {insights?.personalityInsights.improvementAreas?.[0]}
              </div>
            </div>
          }
        </div>
      }

      {/* AI Suggestions Section */}
      <div className="space-y-3 mt-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-3">
          {[
            { key: 'suggestions', label: 'Suggestions' },
            { key: 'recommended', label: 'Recommended Tasks' },
            { key: 'daily', label: 'Daily Tips' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedSection(tab.key)}
              className={`
                px-4 py-2 rounded-full text-sm
                ${selectedSection === tab.key
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border text-muted hover:bg-border/50'
                '
              }`
            >
              {tab.label}
            </button>
          </}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Suggestions */}
          {selectedSection === 'suggestions' && (
            <>
              <h4 className="text-lg font-semibold mb-2">AI-Powered Suggestions</h4>
              {generatedSuggestions.length > 0 ? (
                <>
                  {generatedSuggestions.map((suggestion: any) => (
                    <div key={suggestion.id} className="p-3 rounded-xl bg-card/40 hover:bg-card/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-medium text-primary mt-0.5 capitalize">{suggestion.title.split(' ')[0]}</span>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm text-muted mt-0.5 break-all">{suggestion.title.replace(/^[^\s]+ /, '')}</h5>
                          <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                          <span className="inline-block mt-1 px-2 py-1 rounded bg-emerald-50 text-primary text-xs">
                            {suggestion.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              ) : (
                <div className="p-8 rounded-2xl text-center">
                  <Lightbulb size={48} className="text-muted/50 mx-auto mb-2" />
                  <p className="text-sm text-muted">No suggestions yet - let AI analyze your activity</p>
                </div>
              </>
            </>
          </>
        )

        {/* Recommended Tasks */}
        {selectedSection === 'recommended' && (
          <div className="space-y-3">
            {generatedSuggestions.length > 0 ? (
              generatedSuggestions.map(suggestion => (
                <div key={suggestion.id} className="p-4 rounded-xl border border-border bg-card/40 flex items-start gap-3">
                  <span className="text-lg font-medium flex-shrink-0">{suggestion.title.split(' ')[0]}</span>
                  <div>
                    <h4 className="text-sm text-primary">{suggestion.title.replace(/^[^\s]+ /, '')}</h5>
                    <p className="text-xs text-muted mt-0.5">{suggestion.description}</h5>
                    <span className="inline-block mt-1 rounded px-2 py-1 bg-primary/10 text-primary text-xs">
                      {suggestion.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Tips */}
        {selectedSection === 'daily' && (
          <>
            <h4 className="text-lg font-semibold mb-2">Daily Recommendations</h4>
            {insights?.dailyRecommendations.length > 0 ? (
              <ul className="mt-1 space-y-1 text-sm text-muted">
                {insights?.dailyRecommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">🦖 {recommendation}</span>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* AI Action Buttons */}
      <div className="mt-4 flex justify-between">
        {selectedSection !== 'recommended' && (
          <button
            onClick={() => {
              // Trigger detailed analysis
              performDetailedAnalysis();
            }
            className="px-4 py-2 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            {analysisType === 'detailed' ? (
              <Stats className="text-sm" />
            } : (
              <>
                {analysisType !== 'detailed' && (
                  <>
                    <Stats size={16} className="text-sm" />
                  </>
                </>
              </>
            )}
          </button>
        )}

        {selectedSection !== 'daily' && (
          <button
            onClick={() => {
              analyzeTrends();
            }
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            {analysisType === 'trend' ? (
              <>
                <Stats size={14} className="text-sm" />
                <span className="ml-2">Trending Analysis</span>
              </>
            ) : (
              <>
                <Stats size={14} className="text-sm" />
                <span className="ml-2">Analyze Trends</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}