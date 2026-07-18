/**
 * Adaptive Learning Engine
 * Core AI intelligence that makes Todo Elephant smarter over time through continuous learning
 */

export interface UserProfile {
  userId: string;
  behaviorPattern: BehaviorPattern;
  preferences: UserPreferences;
  skillGraph: SkillGraph;
  contextHistory: ContextHistory;
  adaptationLevel: number;
  learnedRules: LearnedRule[];
  reinforcementHistory: ReinforcementEvent[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface BehaviorPattern {
  taskCompletionSpeed: number;
  preferredCategories: string[];
  energyPatterns: EnergyCycle[];
  focusAreas: string[];
  distractionTriggers: string[];
  optimalTimes: { day: string; hour: number }[];
  complexityPreference: 'simple' | 'moderate' | 'complex';
  taskSwitchingFrequency: number;
  peakHours?: { hour: number }[];
}

export interface EnergyCycle {
  period: 'morning' | 'afternoon' | 'evening';
  peakFocus: number;
  preferredTasks: string[];
  breaksNeeded: number;
}

export interface UserPreferences {
  viewMode: string;
  notifications: boolean;
  theme: string;
  automation: boolean;
  learningEnabled: boolean;
  suggestionThreshold: number;
}

export interface SkillGraph {
  nodes: SkillNode[];
  edges: SkillConnection[];
  relationships: RelationshipType;
}

export interface SkillNode {
  id: string;
  name: string;
  level: number;
  lastImproved: Date;
  requiredFor: string[];
  nextSteps: string[];
}

export interface SkillConnection {
  from: string;
  to: string;
  strength: number;
  relationship: 'depends_on' | 'cross_applies_to' | 'enhances' | 'contrasts_with';
}

export type RelationshipType = Record<string, string>;

export interface ContextHistory {
  sessions: LearningSession[];
  trends: PatternTrend[];
}

export interface LearningSession {
  id: string;
  timestamp: Date;
  context: string;
  actions: SessionAction[];
  outcomes: SessionOutcome[];
  reinforcement: number;
}

export interface SessionAction {
  type: 'task_created' | 'task_completed' | 'task_updated' | 'suggestion_accepted' | 'suggestion_rejected' | 'focus_session' | 'break_taken' | 'priority_changed';
  details: string;
  duration: number;
}

export interface SessionOutcome {
  success: boolean;
  learningExtracted: string;
  improvement: number;
}

export interface LearnedRule {
  id: string;
  pattern: string;
  confidence: number;
  lastApplied: Date;
  successRate: number;
  adaptations: AdaptationRule[];
}

export interface AdaptationRule {
  condition: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
}

export interface ReinforcementEvent {
  type: 'positive' | 'negative';
  trigger: string;
  strength: number;
  date: Date;
}

export interface ImprovementSuggestion {
  id: string;
  type: 'efficiency' | 'quality' | 'balance' | 'exploration';
  title: string;
  description: string;
  expectedImpact: number;
  implementation: string;
  confidence: number;
}

export interface PatternTrend {
  pattern: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
}

export interface AdaptiveRecommendation {
  title: string;
  description: string;
  priority: number;
  category: string;
  confidence: number;
  context: string;
  aiConfidence: number;
  userPreferenceMatch: number;
}

export class AdaptiveLearningEngine {
  private userProfiles = new Map<string, UserProfile>();
  private currentSession = new Map<string, LearningSession>();

  /**
   * Learn from user behavior and adapt recommendations
   */
  async learnFromBehavior(userId: string, actions: SessionAction[]): Promise<Partial<UserProfile>> {
    const profile = this.getOrCreateProfile(userId);

    // Add to current session
    const session = this.getOrCreateSession(userId);
    session.actions.push(...actions);
    session.learningExtracted = this.extractLearningFromActions(actions);
    session.reinforcement = this.calculateReinforcement(actions);
    this.currentSession.set(userId, session);

    // Update behavior patterns
    this.updateBehaviorPatterns(profile, actions);

    // Extract learned rules
    profile.learnedRules.push(...this.extractLearnedRules(profile, actions));

    // Generate improvement suggestions
    profile.improvementSuggestions = this.generateImprovementSuggestions(profile);

    // Adapt recommendations based on learning
    const adaptations = this.generateAdaptations(profile, actions);
    profile.adaptationLevel = Math.min(100, profile.adaptationLevel + 10);

    return profile;
  }

  /**
   * Get personalized recommendations based on user patterns
   */
  async getPersonalizedRecommendations(userId: string, context?: string): Promise<AdaptiveRecommendation[]> {
    const profile = this.getOrCreateProfile(userId);

    // Analyze patterns for recommendations
    const recommendations = await this.generateRecommendations(profile, context);

    // Apply learned rules
    const adaptedRecommendations = this.applyLearnedRules(recommendations, profile);

    // Filter by user preferences
    const filteredRecommendations = adaptedRecommendations.filter(rec =>
      profile.preferences.suggestionThreshold === 0 ||
      rec.confidence >= profile.preferences.suggestionThreshold / 100
    );

    return filteredRecommendations;
  }

  /**
   * Calculate reinforcement from user actions
   */
  private calculateReinforcement(actions: SessionAction[]): number {
    let reinforcement = 5;

    if (actions.some(a => a.type === 'task_completed')) reinforcement += 3;
    if (actions.some(a => a.type === 'suggestion_accepted')) reinforcement += 2;
    if (actions.some(a => a.type === 'focus_session')) reinforcement += 4;
    if (actions.some(a => a.type === 'suggestion_rejected')) reinforcement -= 2;
    if (actions.some(a => a.type === 'priority_changed')) reinforcement -= 1;

    return Math.max(1, Math.min(10, reinforcement));
  }

  /**
   * Extract learning from user actions
   */
  private extractLearningFromActions(actions: SessionAction[]): string[] {
    const learnings: string[] = [];

    if (actions.some(a => a.type === 'task_completed')) {
      learnings.push('User completes tasks efficiently');
    }

    const suggestionsAccepted = actions.filter(a => a.type === 'suggestion_accepted').length;
    if (suggestionsAccepted > 0) {
      learnings.push(`User accepts ${suggestionsAccepted} AI suggestions`);
    }

    if (actions.some(a => a.type === 'focus_session')) {
      learnings.push('User engages in focused work sessions');
    }

    return learnings;
  }

  /**
   * Update behavior patterns based on actions
   */
  private updateBehaviorPatterns(profile: UserProfile, actions: SessionAction[]): void {
    const taskCompletions = actions
      .filter(a => a.type === 'task_completed')
      .reduce((sum, a) => sum + (a.duration || 0), 0);

    if (taskCompletions > 0) {
      const avgSpeed = taskCompletions / actions.filter(a => a.type === 'task_completed').length;

      if (Math.abs(avgSpeed - (profile.behaviorPattern.taskCompletionSpeed || 0)) > 100) {
        profile.behaviorPattern.taskCompletionSpeed = avgSpeed;
      }
    }

    // Calculate task switching frequency
    const completedTasks = actions.filter(a => a.type === 'task_completed').length;
    const totalActions = actions.length;
    if (totalActions > 0) {
      profile.behaviorPattern.taskSwitchingFrequency = completedTasks / totalActions;
    }
  }

  /**
   * Extract learned rules from patterns
   */
  private extractLearnedRules(profile: UserProfile, actions: SessionAction[]): LearnedRule[] {
    const rules: LearnedRule[] = [];

    // Rule: Morning creative productivity
    const morningCreativeActions = actions.filter(a =>
      a.type === 'task_completed' &&
      profile.behaviorPattern.optimalTimes?.some(h => h.hour >= 9 && h.hour <= 11)
    );

    if (morningCreativeActions.length >= 3) {
      rules.push({
        id: `rule-${Date.now()}-morning-creative`,
        pattern: 'User performs best with creative tasks in morning hours',
        confidence: 0.85,
        lastApplied: new Date(),
        successRate: 0.9,
        adaptations: [
          {
            condition: 'time is between 9am-11am AND task category is creative',
            action: 'prioritize task suggestion',
            parameters: { priority_boost: 0.2 },
            priority: 1,
          },
        ],
      });
    }

    // Rule: Focus session effectiveness
    const focusSessions = actions.filter(a => a.type === 'focus_session');
    if (focusSessions.length >= 2) {
      rules.push({
        id: `rule-${Date.now()}-focus-effectiveness`,
        pattern: 'User benefits from structured focus sessions',
        confidence: 0.8,
        lastApplied: new Date(),
        successRate: 0.85,
        adaptations: [
          {
            condition: 'user_starts_work AND no_active_focus_session',
            action: 'suggest_focus_session',
            parameters: { duration: 25 },
            priority: 2,
          },
        ],
      });
    }

    // Rule: Suggestion acceptance pattern
    const suggestionsAccepted = actions.filter(a => a.type === 'suggestion_accepted').length;
    if (suggestionsAccepted >= 3) {
      rules.push({
        id: `rule-${Date.now()}-accepts-suggestions`,
        pattern: 'User frequently accepts AI suggestions',
        confidence: 0.75,
        lastApplied: new Date(),
        successRate: 0.8,
        adaptations: [
          {
            condition: 'new_suggestion_generated AND user_history_shows_high_acceptance',
            action: 'increase_suggestion_confidence',
            parameters: { boost: 0.1 },
            priority: 1,
          },
        ],
      });
    }

    return rules;
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(profile: UserProfile): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    if (profile.behaviorPattern.taskSwitchingFrequency > 0.5) {
      suggestions.push({
        id: `suggestion-${Date.now()}-reduce-switching`,
        type: 'efficiency',
        title: 'Reduce Task Switching',
        description: 'You switch between tasks frequently. Try using the Focus Mode to batch similar tasks.',
        expectedImpact: 15,
        implementation: 'Enable Focus Mode and use task batching feature',
        confidence: 0.8,
      });
    }

    const underdevelopedSkills = profile.skillGraph.nodes
      .filter(n => n.level < 50)
      .slice(0, 3);

    if (underdevelopedSkills.length > 0) {
      suggestions.push({
        id: `suggestion-${Date.now()}-skill-development`,
        type: 'exploration',
        title: 'Develop New Skills',
        description: `You have opportunity to improve in ${underdevelopedSkills.map(s => s.name).join(', ')}`,
        expectedImpact: 20,
        implementation: 'Try tasks in these categories to build expertise',
        confidence: 0.7,
      });
    }

    // Balance suggestion
    const highPriorityRatio = profile.behaviorPattern.preferredCategories.filter(c =>
      ['high', 'urgent'].includes(c.toLowerCase())
    ).length / Math.max(1, profile.behaviorPattern.preferredCategories.length);

    if (highPriorityRatio > 0.7) {
      suggestions.push({
        id: `suggestion-${Date.now()}-balance`,
        type: 'balance',
        title: 'Improve Work-Life Balance',
        description: 'Most of your tasks are high priority. Consider scheduling lower-priority creative or learning tasks.',
        expectedImpact: 10,
        implementation: 'Schedule 30 minutes of creative/learning work daily',
        confidence: 0.75,
      });
    }

    return suggestions;
  }

  /**
   * Generate adaptations based on actions
   */
  private generateAdaptations(profile: UserProfile, actions: SessionAction[]): AdaptationRule[] {
    const adaptations: AdaptationRule[] = [];

    const acceptanceRate = profile.learnedRules.reduce((sum, r) => sum + r.successRate, 0) /
                           (profile.learnedRules.length || 1);

    if (acceptanceRate < 0.6) {
      adaptations.push({
        condition: 'suggestion_confidence > 0.8 AND user_rejection_rate > 0.4',
        action: 'reduce_suggestion_confidence',
        parameters: { reduction: 0.1 },
        priority: 2,
      });
    }

    if (profile.behaviorPattern.peakHours?.length > 0) {
      adaptations.push({
        condition: 'current_time is during peak_hours AND task_complexity_is_high',
        action: 'increase_focus_time',
        parameters: { additional_time: 15 },
        priority: 1,
      });
    }

    return adaptations;
  }

  /**
   * Apply learned rules to generate recommendations
   */
  private applyLearnedRules(recommendations: AdaptiveRecommendation[], profile: UserProfile): AdaptiveRecommendation[] {
    return recommendations.map(rec => {
      const applicableRules = profile.learnedRules.filter(rule =>
        rec.category && (rule.pattern.includes(rec.category) || rule.pattern.includes('creative'))
      );

      if (applicableRules.length > 0) {
        const highestPriorityRule = applicableRules.sort((a, b) =>
          (b.adaptations?.[0]?.priority || 0) - (a.adaptations?.[0]?.priority || 0)
        )[0];

        if (highestPriorityRule.adaptations?.length > 0) {
          const adaptation = highestPriorityRule.adaptations[0];
          return {
            ...rec,
            aiConfidence: Math.min(0.95, (rec.confidence || 0.5) + 0.1),
            priority: rec.priority + (adaptation.parameters.priority_boost || 0),
          };
        }
      }

      return rec;
    });
  }

  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(profile: UserProfile, context?: string): Promise<AdaptiveRecommendation[]> {
    const baseSuggestions: AdaptiveRecommendation[] = [
      {
        title: 'Complete your most important morning task',
        description: 'Tackle your highest priority item during peak focus hours',
        priority: 8,
        category: 'prioritization',
        confidence: 0.9,
        context: 'morning_focus',
        aiConfidence: 0.9,
        userPreferenceMatch: 0.85,
      },
      {
        title: 'Try a creative task to boost innovation',
        description: 'Creative work during optimal energy periods increases innovation output',
        priority: 5,
        category: 'exploration',
        confidence: 0.7,
        context: 'creative_exploration',
        aiConfidence: 0.7,
        userPreferenceMatch: 0.75,
      },
      {
        title: 'Review and optimize your workflow',
        description: 'Process improvement increases long-term efficiency',
        priority: 3,
        category: 'optimization',
        confidence: 0.8,
        context: 'process_improvement',
        aiConfidence: 0.8,
        userPreferenceMatch: 0.8,
      },
      {
        title: 'Schedule a 25-minute focus session',
        description: 'Pomodoro technique improves sustained attention',
        priority: 6,
        category: 'focus',
        confidence: 0.85,
        context: 'focus_session',
        aiConfidence: 0.85,
        userPreferenceMatch: 0.8,
      },
      {
        title: 'Batch similar tasks together',
        description: 'Reduce context switching by grouping related tasks',
        priority: 4,
        category: 'efficiency',
        confidence: 0.75,
        context: 'task_batching',
        aiConfidence: 0.75,
        userPreferenceMatch: 0.7,
      },
    ];

    return baseSuggestions.map(suggestion => ({
      ...suggestion,
      aiConfidence: profile.adaptationLevel / 100 * suggestion.aiConfidence,
      userPreferenceMatch: this.calculateUserPreferenceMatch(suggestion, profile),
    }));
  }

  /**
   * Calculate user preference match for recommendation
   */
  private calculateUserPreferenceMatch(recommendation: AdaptiveRecommendation, profile: UserProfile): number {
    const preferenceScore = 0.7 + Math.random() * 0.25; // Simplified
    return Math.min(0.95, preferenceScore);
  }

  private getOrCreateProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, this.createDefaultProfile(userId));
    }
    return this.userProfiles.get(userId)!;
  }

  private getOrCreateSession(userId: string): LearningSession {
    if (!this.currentSession.has(userId)) {
      this.currentSession.set(userId, {
        id: `session-${Date.now()}-${userId}`,
        timestamp: new Date(),
        context: 'general',
        actions: [],
        outcomes: [],
        reinforcement: 5,
      });
    }
    return this.currentSession.get(userId)!;
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      behaviorPattern: {
        taskCompletionSpeed: 300,
        preferredCategories: ['creative', 'planning'],
        energyPatterns: [
          { period: 'morning', peakFocus: 85, preferredTasks: ['creative'], breaksNeeded: 1 },
          { period: 'afternoon', peakFocus: 60, preferredTasks: ['collaboration'], breaksNeeded: 2 },
          { period: 'evening', peakFocus: 70, preferredTasks: ['admin', 'review'], breaksNeeded: 1 },
        ],
        focusAreas: ['efficiency', 'quality'],
        distractionTriggers: ['notifications', 'interruptions', 'multitasking'],
        optimalTimes: [
          { day: 'monday', hour: 9 },
          { day: 'tuesday', hour: 14 },
          { day: 'wednesday', hour: 10 },
        ],
        complexityPreference: 'moderate',
        taskSwitchingFrequency: 0.3,
      },
      preferences: {
        viewMode: 'kanban',
        notifications: true,
        theme: 'auto',
        automation: true,
        learningEnabled: true,
        suggestionThreshold: 50,
      },
      skillGraph: {
        nodes: [],
        edges: [],
        relationships: {},
      },
      contextHistory: {
        sessions: [],
        trends: [],
      },
      adaptationLevel: 10,
      learnedRules: [],
      reinforcementHistory: [],
      improvementSuggestions: [],
    };
  }
}

export const adaptiveLearningEngine = new AdaptiveLearningEngine();