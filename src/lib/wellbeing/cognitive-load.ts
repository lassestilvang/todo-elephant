/**
 * Wellbeing & Sustainable Productivity System
 * Cognitive load management, burnout prevention, sustainable work patterns
 */

export interface CognitiveLoadMetrics {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface BurnoutRisk {
  riskLevel: number; // 0-100
  factors: BurnoutFactor[];
  preventionPlan: PreventionPlan;
  weeklyCheckins: WeeklyCheckin[];
}

export interface BurnoutFactor {
  name: string;
  score: number; // 0-100
  weight: number; // importance weight
  mitigation: string;
}

export interface PreventionPlan {
  dailyBreaks: BreakSchedule[];
  weeklyAdjustments: string[];
  monthlyReflections: string[];
  emergencyProtocols: string[];
}

export interface BreakSchedule {
  time: string; // HH:MM format
  duration: number; // minutes
  type: 'micro' | 'short' | 'long';
  activity: string;
  rationale: string;
}

export interface WeeklyCheckin {
  day: string;
  questions: string[];
  targetScore: number;
  reflectionPrompt: string;
}

export interface EnergyPattern {
  peakHours: number[];
  lowEnergyHours: number[];
  optimalTaskTypes: Record<string, string[]>;
  recoveryTimeRequired: number; // minutes
}

export interface SustainabilityMetrics {
  digitalCarbonFootprint: number; // kg CO2 equivalent
  screenTime: {
    productive: number;
    neutral: number;
    distracting: number;
  };
  recommendations: string[];
  greenScore: number; // 0-100
  monthlyTrend: Array<{ date: string; score: number }>;
}

export class WellbeingEngine {
  /**
   * Calculate cognitive load from task data
   */
  calculateCognitiveLoad(tasks: any[], focusSessions: any[]): CognitiveLoadMetrics {
    const factors: BurnoutFactor[] = [];

    // Task count factor
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    const taskCountScore = Math.min(100, incompleteTasks.length * 5);
    factors.push({
      name: 'task_count',
      score: taskCountScore,
      weight: 0.25,
      mitigation: incompleteTasks.length > 10
        ? 'Break down large tasks and prioritize completing high-impact items'
        : 'Maintain current task management approach',
    });

    // Overdue tasks factor
    const overdueTasks = incompleteTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const overdueScore = Math.min(100, overdueTasks.length * 15);
    factors.push({
      name: 'overdue_tasks',
      score: overdueScore,
      weight: 0.3,
      mitigation: overdueTasks.length > 3
        ? 'Immediately address overdue tasks to reduce mental load'
        : 'Keep current deadline management',
    });

    // Priority distribution factor
    const highPriorityCount = incompleteTasks.filter(t => t.priority === 'high').length;
    const priorityScore = Math.min(100, highPriorityCount * 10);
    factors.push({
      name: 'high_priority_load',
      score: priorityScore,
      weight: 0.2,
      mitigation: highPriorityCount > 5
        ? 'Reassess priorities and delegate if possible'
        : 'Current priority distribution is manageable',
    });

    // Focus session quality factor
    const completedFocusSessions = focusSessions.filter(s => s.completed === true);
    const focusEfficiency = focusSessions.length > 0
      ? (completedFocusSessions.length / focusSessions.length) * 100
      : 50;
    const focusScore = 100 - focusEfficiency;
    factors.push({
      name: 'focus_efficiency',
      score: focusScore,
      weight: 0.15,
      mitigation: focusEfficiency < 50
        ? 'Try Pomodoro technique or reduce session length'
        : 'Maintain current focus session pattern',
    });

    // Calculate weighted score
    const totalScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
    const level = totalScore > 70 ? 'high' : totalScore > 40 ? 'medium' : 'low';

    // Generate recommendations
    const recommendations = factors
      .filter(f => f.score > 60)
      .map(f => f.mitigation);

    return {
      score: Math.round(totalScore),
      level,
      factors: factors.map(f => `${f.name}: ${f.score}%`),
      recommendations,
      trend: 'stable', // Would be calculated from historical data
      lastUpdated: new Date(),
    };
  }

  /**
   * Assess burnout risk
   */
  async assessBurnoutRisk(userId: string): Promise<BurnoutRisk> {
    // In a real implementation, this would query user data
    const mockRisk: BurnoutRisk = {
      riskLevel: 35,
      factors: [
        { name: 'workload', score: 40, weight: 0.3, mitigation: 'Take regular breaks and delegate tasks' },
        { name: 'control', score: 30, weight: 0.2, mitigation: 'Increase autonomy in task selection' },
        { name: 'reward', score: 25, weight: 0.2, mitigation: 'Seek recognition for completed work' },
        { name: 'community', score: 20, weight: 0.15, mitigation: 'Engage in team collaboration' },
        { name: 'fairness', score: 15, weight: 0.1, mitigation: 'Ensure equitable task distribution' },
        { name: 'values', score: 10, weight: 0.05, mitigation: 'Align tasks with personal values' },
      ],
      preventionPlan: {
        dailyBreaks: [
          { time: '09:00', duration: 5, type: 'micro', activity: 'Deep breathing', rationale: 'Start of focused work period' },
          { time: '10:30', duration: 10, type: 'short', activity: 'Walk or stretch', rationale: 'Mid-morning energy dip' },
          { time: '12:00', duration: 15, type: 'long', activity: 'Lunch break', rationale: 'Midday recovery' },
          { time: '14:00', duration: 5, type: 'micro', activity: 'Eye exercises', rationale: 'Afternoon screen fatigue' },
          { time: '15:30', duration: 10, type: 'short', activity: 'Mindfulness', rationale: 'Late afternoon focus boost' },
        ],
        weeklyAdjustments: [
          'Review task priorities every Monday morning',
          'Schedule collaborative work mid-week',
          'Plan creative work during peak energy hours',
          'Block time for deep work on Tuesdays and Thursdays',
          'Schedule learning time on Fridays',
        ],
        monthlyReflections: [
          'Review completed tasks and celebrate wins',
          'Assess workload balance across projects',
          'Identify patterns in task completion',
          'Plan skill development for next month',
          'Schedule team retrospectives',
        ],
        emergencyProtocols: [
          'If stress > 80%, take mandatory 30-minute break',
          'If sleep quality < 6 hours for 3 consecutive nights, reduce task load by 50%',
          'If mood tracking shows consistent low ratings, schedule wellness check-in',
          'If productivity drops > 50% for 2 days, activate recovery protocol',
        ],
      },
      weeklyCheckins: [
        {
          day: 'Monday',
          questions: ['What are my top 3 priorities for the week?', 'What energy levels do I expect?'],
          targetScore: 80,
          reflectionPrompt: 'Set intentions for a balanced, productive week',
        },
        {
          day: 'Wednesday',
          questions: ['Am I on track with my priorities?', 'Do I need to adjust my approach?'],
          targetScore: 70,
          reflectionPrompt: 'Mid-week course correction',
        },
        {
          day: 'Friday',
          questions: ['What went well this week?', 'What can I improve next week?', 'How was my energy balance?'],
          targetScore: 75,
          reflectionPrompt: 'Weekly reflection and planning',
        },
      ],
    };

    return mockRisk;
  }

  /**
   * Get energy and optimal task recommendations
   */
  async getEnergyPattern(userId: string): Promise<EnergyPattern> {
    // In a real implementation, this would use wearable data and task completion patterns
    return {
      peakHours: [9, 10, 14, 15, 16],
      lowEnergyHours: [13, 14, 15],
      optimalTaskTypes: {
        high: ['creative', 'problem_solving', 'writing', 'coding'],
        medium: ['meetings', 'collaboration', 'research', 'planning'],
        low: ['admin', 'email', 'data_entry', 'routine'],
      },
      recoveryTimeRequired: 15,
    };
  }

  /**
   * Calculate sustainability metrics
   */
  calculateSustainabilityMetrics(tasks: any[], screenTime?: any): SustainabilityMetrics {
    // Calculate digital carbon footprint (simplified)
    const totalTaskTime = tasks.reduce((sum, t) => {
      if (t.completedAt && t.createdAt) {
        return sum + (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / 60000;
      }
      return sum;
    }, 0);

    // Rough estimate: 1 hour of computer work = ~0.1 kg CO2
    const digitalCarbonFootprint = totalTaskTime * 0.1;

    // Screen time analysis
    const screenTimeData = screenTime || {
      productive: totalTaskTime,
      neutral: totalTaskTime * 0.3,
      distracting: totalTaskTime * 0.2,
    };

    // Calculate green score
    const greenScore = Math.max(0, 100 - (digitalCarbonFootprint / 10));

    // Recommendations for sustainability
    const recommendations = [
      'Use dark mode to reduce screen energy consumption',
      'Take more breaks to reduce continuous screen time',
      'Prefer keyboard shortcuts over mouse navigation',
      'Use offline mode when possible',
      'Close unused tabs and applications',
      'Consider batch processing similar tasks',
    ];

    // Monthly trend (simulated)
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, i, 1).toISOString().split('T')[0],
      score: Math.max(30, greenScore + Math.sin(i) * 20),
    }));

    return {
      digitalCarbonFootprint: Math.round(digitalCarbonFootprint * 10) / 10,
      screenTime: screenTimeData,
      recommendations,
      greenScore: Math.round(greenScore),
      monthlyTrend,
    };
  }

  /**
   * Generate personalized wellbeing recommendations
   */
  async generateWellbeingRecommendations(
    cognitiveLoad: CognitiveLoadMetrics,
    burnoutRisk: BurnoutRisk,
    energyPattern: EnergyPattern
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Cognitive load recommendations
    if (cognitiveLoad.level === 'high') {
      recommendations.push('Take an immediate 15-minute break to reset your mental load');
      recommendations.push('Delegate or postpone 2-3 low-priority tasks');
      recommendations.push('Use the Eisenhower matrix to clarify what is truly urgent');
    }

    if (cognitiveLoad.level === 'medium') {
      recommendations.push('Schedule a 5-minute breathing exercise before your next task');
      recommendations.push('Batch similar tasks together to reduce switching costs');
    }

    // Burnout risk recommendations
    if (burnoutRisk.riskLevel > 50) {
      recommendations.push('Consider taking a half-day off this week');
      recommendations.push('Speak with your manager about workload distribution');
      recommendations.push('Schedule a wellbeing check-in with a colleague or mentor');
    }

    // Energy pattern recommendations
    recommendations.push(`Schedule creative work between ${energyPattern.peakHours.join(' and ')} hours`);
    recommendations.push(`Avoid complex tasks during ${energyPattern.lowEnergyHours.join(', ')} hours`);

    // General wellbeing
    recommendations.push('Maintain 7-9 hours of sleep nightly');
    recommendations.push('Stay hydrated - aim for 2-3 liters of water daily');
    recommendations.push('Get 10-15 minutes of natural light exposure each day');

    return [...new Set(recommendations)];
  }
}

export const wellbeingEngine = new WellbeingEngine();