/**
 * A/B Testing Framework for Todo Elephant
 * Enables feature experimentation and optimization
 */

export interface ABTest {
  id: string;
  name: string;
  variants: ABVariant[];
  trafficAllocation: number; // 0-1
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  metrics: ABTestMetric[];
}

export interface ABVariant {
  id: string;
  name: string;
  weight: number; // 0-1, percentage of traffic
  config: Record<string, any>;
}

export interface ABTestMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'retention' | 'custom';
  targetValue?: number;
  description: string;
}

export interface ABTestResult {
  variantId: string;
  metrics: Record<string, number>;
  sampleSize: number;
  confidence: number;
}

export class ABTestingEngine {
  private tests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, string> = new Map(); // userId -> variantId

  /**
   * Register a new A/B test
   */
  registerTest(test: ABTest): void {
    this.tests.set(test.id, test);
  }

  /**
   * Get variant assignment for a user
   */
  getVariant(userId: string, testId: string): ABVariant | null {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) return null;

    // Check if user already assigned
    const existingAssignment = this.userAssignments.get(`${userId}:${testId}`);
    if (existingAssignment) {
      return test.variants.find(v => v.id === existingAssignment) || null;
    }

    // Assign user to variant based on weight
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        this.userAssignments.set(`${userId}:${testId}`, variant.id);
        return variant;
      }
    }

    // Fallback to first variant
    const firstVariant = test.variants[0];
    this.userAssignments.set(`${userId}:${testId}`, firstVariant.id);
    return firstVariant;
  }

  /**
   * Get all active tests for a user
   */
  getActiveTests(userId: string): ABTest[] {
    return Array.from(this.tests.values()).filter(test => {
      if (!test.isActive) return false;
      if (test.endDate && new Date() > test.endDate) return false;
      return true;
    });
  }

  /**
   * Record a conversion event
   */
  recordConversion(userId: string, testId: string, metricId: string, value: number = 1): void {
    // In a real implementation, this would store to a database
    console.log(`Conversion recorded: user=${userId}, test=${testId}, metric=${metricId}, value=${value}`);
  }

  /**
   * Get test results
   */
  getResults(testId: string): ABTestResult[] | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    // Calculate results for each variant
    return test.variants.map(variant => ({
      variantId: variant.id,
      metrics: {}, // Would be populated from actual data
      sampleSize: 0, // Would be calculated from actual data
      confidence: 0 // Would be calculated using statistical tests
    }));
  }

  /**
   * Determine if test should end (based on statistical significance)
   */
  shouldEndTest(testId: string, confidenceThreshold: number = 0.95): boolean {
    const results = this.getResults(testId);
    if (!results) return false;

    return results.every(result => result.confidence >= confidenceThreshold);
  }

  /**
   * Get winning variant
   */
  getWinner(testId: string): ABVariant | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const results = this.getResults(testId);
    if (!results || results.length === 0) return null;

    // Find variant with highest conversion rate
    const winningResult = results.reduce((best, current) =>
      (current.metrics.conversionRate || 0) > (best.metrics.conversionRate || 0) ? current : best
    );

    return test.variants.find(v => v.id === winningResult.variantId) || null;
  }

  /**
   * Clear user assignments (for testing)
   */
  clearAssignments(): void {
    this.userAssignments.clear();
  }
}

// Predefined tests for Todo Elephant
export const abTesting = new ABTestingEngine();

// Feature flag system
export class FeatureFlags {
  private flags: Map<string, boolean> = new Map();

  isEnabled(flag: string, userId?: string): boolean {
    // Check if flag exists
    if (!this.flags.has(flag)) {
      return false;
    }

    // For user-specific flags, check A/B test assignment
    if (userId) {
      const test = Array.from(abTesting['tests'].values()).find(t => t.isActive);
      if (test) {
        const variant = abTesting.getVariant(userId, test.id);
        return variant?.config[`${flag}_enabled`] ?? this.flags.get(flag) ?? false;
      }
    }

    return this.flags.get(flag) ?? false;
  }

  setFlag(flag: string, enabled: boolean): void {
    this.flags.set(flag, enabled);
  }

  enableFlag(flag: string): void {
    this.flags.set(flag, true);
  }

  disableFlag(flag: string): void {
    this.flags.set(flag, false);
  }
}

export const featureFlags = new FeatureFlags();

// Common A/B tests for Todo Elephant
export const DEFAULT_TESTS: ABTest[] = [
  {
    id: 'new-dashboard-layout',
    name: 'New Dashboard Layout',
    variants: [
      {
        id: 'control',
        name: 'Current Layout',
        weight: 0.5,
        config: { enhanced_dashboard: false }
      },
      {
        id: 'treatment',
        name: 'New Enhanced Layout',
        weight: 0.5,
        config: { enhanced_dashboard: true }
      }
    ],
    trafficAllocation: 1.0,
    isActive: true,
    startDate: new Date(),
    metrics: [
      { id: 'dashboard_engagement', name: 'Dashboard Engagement', type: 'engagement', description: 'Time spent on dashboard' },
      { id: 'task_completion', name: 'Task Completion Rate', type: 'conversion', description: 'Tasks completed after viewing dashboard' }
    ]
  },
  {
    id: 'ai-assistant-v2',
    name: 'AI Assistant v2',
    variants: [
      {
        id: 'current',
        name: 'Current AI Assistant',
        weight: 0.5,
        config: { ai_version: '1.0' }
      },
      {
        id: 'enhanced',
        name: 'Enhanced AI Assistant',
        weight: 0.5,
        config: { ai_version: '2.0', enhanced_suggestions: true }
      }
    ],
    trafficAllocation: 1.0,
    isActive: true,
    startDate: new Date(),
    metrics: [
      { id: 'suggestion_acceptance', name: 'Suggestion Acceptance Rate', type: 'conversion', description: 'Percentage of AI suggestions accepted' },
      { id: 'task_creation', name: 'Tasks Created via AI', type: 'conversion', description: 'Number of tasks created through AI assistant' }
    ]
  },
  {
    id: 'elephant-social',
    name: 'Elephant Social Network',
    variants: [
      {
        id: 'disabled',
        name: 'Social Features Disabled',
        weight: 0.7,
        config: { social_features: false }
      },
      {
        id: 'enabled',
        name: 'Social Features Enabled',
        weight: 0.3,
        config: { social_features: true }
      }
    ],
    trafficAllocation: 0.5,
    isActive: true,
    startDate: new Date(),
    metrics: [
      { id: 'social_engagement', name: 'Social Engagement', type: 'engagement', description: 'Posts, likes, comments' },
      { id: 'daily_active', name: 'Daily Active Users', type: 'retention', description: 'Users returning daily' }
    ]
  }
];

// Initialize default tests
DEFAULT_TESTS.forEach(test => abTesting.registerTest(test));