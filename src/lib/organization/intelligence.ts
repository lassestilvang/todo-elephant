/**
 * Organization-Level Intelligence System
 * Cross-team insights, process optimization, and organizational intelligence
 */

export interface OrganizationInsight {
  id: string;
  type: 'process_optimization' | 'resource_allocation' | 'team_health' | 'knowledge_gap';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  affectedTeams: string[];
  recommendations: string[];
  dataPoints: Record<string, any>;
  confidence: number;
  createdAt: Date;
}

export interface ProcessOptimization {
  processName: string;
  currentEfficiency: number; // percentage
  bottlenecks: Array<{
    step: string;
    delayMinutes: number;
    impact: string;
  }>;
  recommendations: string[];
  estimatedImprovement: number; // percentage points
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface CrossTeamInsight {
  teams: string[];
  sharedPatterns: Array<{
    pattern: string;
    teamsInvolved: string[];
    frequency: number;
    recommendation: string;
  }>;
  siloTendencies: Array<{
    team: string;
    indicator: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  collaborationOpportunities: Array<{
    teamA: string;
    teamB: string;
    sharedGoal: string;
    recommendation: string;
  }>;
}

export class OrganizationIntelligence {
  async detectProcessInefficiencies(tasks: any[], teamId?: string): Promise<ProcessOptimization[]> {
    const optimizations: ProcessOptimization[] = [];

    // Analyze task completion patterns
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const start = new Date(t.createdAt).getTime();
          const end = t.completedAt ? new Date(t.completedAt).getTime() : Date.now();
          return sum + (end - start);
        }, 0) / completedTasks.length / 60000
      : 0;

    // Detect bottlenecks in task chains
    const bottlenecks = this.detectBottlenecks(tasks);

    // Analyze dependency patterns
    const dependencyChains = this.analyzeDependencies(tasks);

    // Create optimization recommendations
    if (bottlenecks.length > 0) {
      optimizations.push({
        processName: 'Task Workflow',
        currentEfficiency: Math.round(100 - bottlenecks.length * 15),
        bottlenecks,
        recommendations: bottlenecks.map(b => `Address bottleneck at "${b.step}" - ${b.impact}`),
        estimatedImprovement: bottlenecks.length * 10,
        implementationEffort: 'medium',
      });
    }

    if (dependencyChains.length > 3) {
      optimizations.push({
        processName: 'Task Dependencies',
        currentEfficiency: Math.max(30, 100 - dependencyChains.length * 8),
        bottlenecks: dependencyChains.map(chain => ({
          step: `Depends on ${chain.parentId}`,
          delayMinutes: chain.chainDelay,
          impact: chain.impact,
        })),
        recommendations: [
          'Review dependency chains for unnecessary links',
          'Consider parallelizing independent tasks',
          'Implement early handoff protocols',
        ],
        estimatedImprovement: dependencyChains.length * 8,
        implementationEffort: 'low',
      });
    }

    return optimizations;
  }

  async generateCrossTeamInsights(tasks: any[]): Promise<CrossTeamInsight> {
    const teams = [...new Set(tasks.map(t => t.team || 'default'))];
    const sharedPatterns: CrossTeamInsight['sharedPatterns'] = [];
    const siloTendencies: CrossTeamInsight['siloTendencies'] = [];
    const collaborationOpportunities: CrossTeamInsight['collaborationOpportunities'] = [];

    // Detect shared patterns across teams
    const taskTypes = new Map<string, string[]>();
    tasks.forEach(task => {
      const team = task.team || 'default';
      const category = task.category || 'general';
      if (!taskTypes.has(category)) taskTypes.set(category, []);
      if (!taskTypes.get(category)!.includes(team)) {
        taskTypes.get(category)!.push(team);
      }
    });

    for (const [category, teamsInvolved] of taskTypes) {
      if (teamsInvolved.length >= 2) {
        sharedPatterns.push({
          pattern: `Tasks in category "${category}"`,
          teamsInvolved: teamsInvolved,
          frequency: teamsInvolved.length,
          recommendation: `Consider standardizing ${category} workflows across teams`,
        });
      }
    }

    // Detect silo tendencies
    for (const team of teams) {
      const teamTasks = tasks.filter(t => (t.team || 'default') === team);
      const crossTeamTasks = teamTasks.filter(t => t.assignedTo && !t.assignedTo.startsWith(team));
      const siloTendency = teamTasks.length > 0 ? crossTeamTasks.length / teamTasks.length : 0;

      if (siloTendency < 0.2 && teamTasks.length > 5) {
        siloTendencies.push({
          team,
          indicator: 'Low cross-team collaboration rate',
          severity: siloTendency === 0 ? 'high' : 'medium',
          suggestion: `Increase cross-team pairing for team "${team}"`,
        });
      }
    }

    // Identify collaboration opportunities
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const teamATasks = tasks.filter(t => (t.team || 'default') === teams[i]);
        const teamBTasks = tasks.filter(t => (t.team || 'default') === teams[j]);
        const sharedCategories = [
          ...new Set(teamATasks.map(t => t.category).filter(Boolean)),
        ].filter(cat => teamBTasks.some(t => t.category === cat));

        if (sharedCategories.length > 0) {
          collaborationOpportunities.push({
            teamA: teams[i],
            teamB: teams[j],
            sharedGoal: `Shared ${sharedCategories.join(', ')} objectives`,
            recommendation: `Coordinate ${sharedCategories.slice(0, 2).join(' and ')} efforts between ${teams[i]} and ${teams[j]}`,
          });
        }
      }
    }

    return {
      teams,
      sharedPatterns,
      siloTendencies,
      collaborationOpportunities,
    };
  }

  async generateOrganizationInsights(organizationId: string): Promise<OrganizationInsight[]> {
    // In a real implementation, this would query organization-wide data
    const insights: OrganizationInsight[] = [];

    // Process optimization insight
    insights.push({
      id: `org-insight-${Date.now()}-1`,
      type: 'process_optimization',
      title: 'Workflow Optimization Opportunity',
      description: 'Analysis of recent task patterns suggests process improvements',
      impact: 'medium',
      affectedTeams: ['All Teams'],
      recommendations: [
        'Review task dependency chains for unnecessary complexity',
        'Implement standardized task templates for recurring work',
        'Establish cross-team handoff protocols',
      ],
      dataPoints: {
        analyzedPeriod: 'last 30 days',
        taskCount: 100,
        averageCompletionTime: '3.5 days',
      },
      confidence: 0.85,
      createdAt: new Date(),
    });

    return insights;
  }

  private detectBottlenecks(tasks: any[]): ProcessOptimization['bottlenecks'] {
    const bottlenecks: ProcessOptimization['bottlenecks'] = [];

    // Analyze status transitions (waiting -> in_progress -> review -> completed)
    const waitingTasks = tasks.filter(t => t.status === 'todo');
    const reviewTasks = tasks.filter(t => t.status === 'review');
    const longPendingInReview = reviewTasks.filter(t => {
      const updatedAt = new Date(t.updatedAt || t.createdAt);
      return (Date.now() - updatedAt.getTime()) > 7 * 86400000; // Overdue in review
    });

    if (longPendingInReview.length > 0) {
      bottlenecks.push({
        step: 'Review stage',
        delayMinutes: Math.round(longPendingInReview.reduce((sum, t) => {
          return sum + (Date.now() - new Date(t.updatedAt || t.createdAt).getTime()) / 60000;
        }, 0) / longPendingInReview.length),
        impact: `${longPendingInReview.length} tasks stuck in review for over a week`,
      });
    }

    // Check for tasks with no dependencies but long wait times
    const noDepTasks = waitingTasks.filter(t => !t.dependsOnTaskId);
    const oldTasks = noDepTasks.filter(t => {
      const createdAt = new Date(t.createdAt);
      return (Date.now() - createdAt.getTime()) > 14 * 86400000; // Older than 2 weeks
    });

    if (oldTasks.length > 0) {
      bottlenecks.push({
        step: 'Task Creation',
        delayMinutes: Math.round(oldTasks.length * 8 * 60), // 8 hours each
        impact: `${oldTasks.length} tasks created >2 weeks ago still pending`,
      });
    }

    return bottlenecks;
  }

  private analyzeDependencies(tasks: any[]): Array<{
    parentId: string;
    chainDelay: number;
    impact: string;
  }> {
    const chains: Array<{
      parentId: string;
      chainDelay: number;
      impact: string;
    }> = [];

    const dependentTasks = tasks.filter(t => t.dependsOnTaskId);

    for (const dependentTask of dependentTasks) {
      const parentTask = tasks.find(t => t.id === dependentTask.dependsOnTaskId);
      if (parentTask) {
        const delay = parentTask.priority === 'high' ? 5 : 1; // days impact
        chains.push({
          parentId: parentTask.id,
          chainDelay: delay,
          impact: `Blocks dependent task '${dependentTask.title}'`,
        });
      }
    }

    return chains;
  }
}

export const organizationIntelligence = new OrganizationIntelligence();