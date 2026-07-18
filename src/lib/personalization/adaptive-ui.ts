/**
 * Adaptive Interface & Personalization System
 * Context-aware UI adjustments based on user patterns
 */

export interface UIContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  recentActivity: ActivityRecord[];
  currentTask?: string;
  energyLevel: 'low' | 'medium' | 'high';
  focusMode: boolean;
  userPreferences: UserPreferences;
}

export interface ActivityRecord {
  type: 'task_completed' | 'view_change' | 'create_task' | 'search' | 'filter' | 'sort';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  viewMode: 'kanban' | 'list' | 'calendar' | 'dashboard';
  notificationsEnabled: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  language: string;
}

export interface AdaptiveConfig {
  viewMode: string;
  density: 'compact' | 'comfortable' | 'spacious';
  colorScheme: string;
  animations: boolean;
  showAdvanced: boolean;
  autoRefresh: boolean;
  sidebarCollapsed: boolean;
  taskDensity: 'minimal' | 'standard' | 'detailed';
}

export interface DistractionPattern {
  detected: boolean;
  source: string;
  timeOfDay: number;
  taskType: string;
  mitigation: string;
}

export interface FocusRecommendation {
  type: 'focus_session' | 'break' | 'task_switch' | 'review';
  duration: number;
  reasoning: string;
  confidence: number;
}

export class AdaptiveInterfaceEngine {
  private userActivity: ActivityRecord[] = [];
  private contextWindow: UIContext = this.getDefaultContext();

  /**
   * Adapt interface based on current context
   */
  async adaptInterface(context: Partial<UIContext>): Promise<AdaptiveConfig> {
    // Update context with new information
    this.updateContext(context);

    // Analyze patterns
    const patterns = this.analyzePatterns();

    // Generate adaptive configuration
    const config = await this.generateAdaptiveConfig(patterns);

    return config;
  }

  /**
   * Detect distraction patterns
   */
  async detectDistractionPatterns(): Promise<DistractionPattern[]> {
    const patterns: DistractionPattern[] = [];

    // Check for rapid task switching (indicator of distraction)
    const recentActivity = this.userActivity.filter(a =>
      a.timestamp > new Date(Date.now() - 30 * 60 * 1000)
    );

    const viewChanges = recentActivity.filter(a => a.type === 'view_change');
    if (viewChanges.length > 5) {
      patterns.push({
        detected: true,
        source: 'rapid navigation',
        timeOfDay: new Date().getHours(),
        taskType: 'general',
        mitigation: 'Enable focus mode and block notifications for 25 minutes',
      });
    }

    // Check for excessive search (indicator of difficulty finding tasks)
    const searches = recentActivity.filter(a => a.type === 'search');
    if (searches.length > 10) {
      patterns.push({
        detected: true,
        source: 'excessive searching',
        timeOfDay: new Date().getHours(),
        taskType: 'navigation',
        mitigation: 'Try using filters and labels to organize your view',
      });
    }

    // Check for long inactivity periods
    if (recentActivity.length < 3) {
      const lastActive = this.userActivity[0];
      if (lastActive && (Date.now() - lastActive.timestamp.getTime()) > 30 * 60 * 1000) {
        patterns.push({
          detected: true,
          source: 'prolonged inactivity',
          timeOfDay: new Date().getHours(),
          taskType: 'engagement',
          mitigation: 'Take a short break or start a quick task to regain momentum',
        });
      }
    }

    return patterns;
  }

  /**
   * Get focus recommendations
   */
  async getFocusRecommendations(): Promise<FocusRecommendation[]> {
    const recommendations: FocusRecommendation[] = [];

    const patterns = this.analyzePatterns();
    const distractionPatterns = await this.detectDistractionPatterns();

    // If distraction detected, suggest focus mode
    if (distractionPatterns.some(p => p.detected)) {
      recommendations.push({
        type: 'focus_session',
        duration: 25,
        reasoning: 'Focus mode recommended to reduce context switching',
        confidence: 0.8,
      });
    }

    // If high cognitive load detected, suggest break
    if (patterns.cognitiveLoadScore > 70) {
      recommendations.push({
        type: 'break',
        duration: 15,
        reasoning: 'Cognitive load is high - a break will improve focus',
        confidence: 0.9,
      });
    }

    // If low productivity, suggest task switch
    if (patterns.productivityScore < 0.3) {
      recommendations.push({
        type: 'task_switch',
        duration: 0,
        reasoning: 'Current task productivity is low - try switching to a different type',
        confidence: 0.6,
      });
    }

    // Always recommend a review
    recommendations.push({
      type: 'review',
      duration: 0,
      reasoning: 'Periodic review maintains productivity alignment',
      confidence: 0.5,
    });

    return recommendations;
  }

  /**
   * Adapt task view based on user preference
   */
  async getOptimalViewMode(): Promise<string> {
    const preferences = this.contextWindow.userPreferences;
    const patterns = this.analyzePatterns();

    // Adjust based on time of day
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) {
      // Morning - deep focus mode
      return 'kanban';
    } else if (hour >= 14 && hour <= 16) {
      // Afternoon - collaborative work
      return 'list';
    } else if (hour >= 18) {
      // Evening - planning mode
      return 'calendar';
    }

    // Default to user preference
    return preferences.viewMode;
  }

  /**
   * Get adaptive density setting
   */
  async getOptimalDensity(): Promise<'compact' | 'comfortable' | 'spacious'> {
    const patterns = this.analyzePatterns();

    if (patterns.cognitiveLoadScore > 70) {
      return 'compact';
    } else if (patterns.cognitiveLoadScore > 40) {
      return 'comfortable';
    } else {
      return 'spacious';
    }
  }

  /**
   * Determine if advanced features should be shown
   */
  async shouldShowAdvancedFeatures(): Promise<boolean> {
    // Show advanced features for power users (top 20% by activity)
    const activityCount = this.userActivity.length;
    return activityCount > 50; // Simple heuristic
  }

  private getDefaultContext(): UIContext {
    const now = new Date();
    return {
      timeOfDay: now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening',
      dayOfWeek: now.toLocaleString('en-US', { weekday: 'long' }),
      recentActivity: [],
      energyLevel: 'medium',
      focusMode: false,
      userPreferences: {
        theme: 'auto',
        viewMode: 'kanban',
        notificationsEnabled: true,
        compactMode: false,
        animationsEnabled: true,
        language: 'en',
      },
    };
  }

  private updateContext(context: Partial<UIContext>): void {
    this.contextWindow = { ...this.contextWindow, ...context };
  }

  private analyzePatterns(): {
    cognitiveLoadScore: number;
    productivityScore: number;
    taskSwitchingFrequency: number;
    focusTimeAverage: number;
  } {
    const recentActivity = this.userActivity.filter(a =>
      a.timestamp > new Date(Date.now() - 60 * 60 * 1000)
    );

    // Cognitive load based on rapid task switching
    const viewChanges = recentActivity.filter(a => a.type === 'view_change').length;
    const searches = recentActivity.filter(a => a.type === 'search').length;
    const cognitiveLoadScore = Math.min(100, (viewChanges + searches) * 10);

    // Productivity based on task completion rate
    const completions = recentActivity.filter(a => a.type === 'task_completed');
    const productivityScore = recentActivity.length > 0
      ? completions.length / recentActivity.length
      : 0.5;

    // Task switching frequency
    const taskSwitchingFrequency = viewChanges / Math.max(1, recentActivity.length);

    // Average focus time (estimated)
    const focusTimeAverage = 25; // Default pomodoro length

    return {
      cognitiveLoadScore,
      productivityScore,
      taskSwitchingFrequency,
      focusTimeAverage,
    };
  }

  private async generateAdaptiveConfig(patterns: {
    cognitiveLoadScore: number;
    productivityScore: number;
    taskSwitchingFrequency: number;
    focusTimeAverage: number;
  }): Promise<AdaptiveConfig> {
    const hour = new Date().getHours();
    const viewMode = await this.getOptimalViewMode();
    const density = await this.getOptimalDensity();
    const showAdvanced = await this.shouldShowAdvancedFeatures();

    return {
      viewMode,
      density,
      colorScheme: hour >= 18 || hour < 6 ? 'dark' : 'light',
      animations: patterns.cognitiveLoadScore < 70,
      showAdvanced,
      autoRefresh: patterns.cognitiveLoadScore < 50,
      sidebarCollapsed: density === 'compact',
      taskDensity: density,
    };
  }
}

// Singleton instance
export const adaptiveInterface = new AdaptiveInterfaceEngine();