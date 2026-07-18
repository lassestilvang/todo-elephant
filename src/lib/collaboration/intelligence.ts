/**
 * Collaboration Intelligence System
 * Analyzes team dynamics, skills, and collaboration patterns
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  productivityPatterns: {
    peakHours: number[];
    preferredWorkStyle: string;
    averageTaskTime: number;
    completionRate: number;
  };
  collaborationHistory: CollaborationEvent[];
}

export interface CollaborationEvent {
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'mention' | 'review' | 'meeting';
  timestamp: Date;
  taskId: string;
  participants: string[];
  metadata?: Record<string, any>;
}

export interface SkillMatch {
  taskId: string;
  recommendedAssignee: string;
  matchScore: number; // 0-100
  reasoning: string;
  requiredSkills: string[];
  candidateSkills: string[];
}

export interface MentorshipOpportunity {
  mentorId: string;
  menteeId: string;
  skillGap: string;
  mentorshipType: 'technical' | 'process' | 'domain' | 'soft-skills';
  estimatedImpact: number;
  suggestedFrequency: 'weekly' | 'biweekly' | 'monthly';
}

export interface TeamHealthMetrics {
  collaborationScore: number; // 0-100
  communicationFrequency: number;
  knowledgeSharing: number;
  workloadBalance: number;
  conflictIndicators: string[];
  recommendations: string[];
}

export interface ProjectInsight {
  projectId: string;
  riskLevel: 'low' | 'medium' | 'high';
  bottlenecks: Array<{ type: string; description: string; severity: number }>;
  recommendations: string[];
  predictedCompletion: Date;
  confidence: number;
}

export class CollaborationIntelligence {
  private teamMembers: Map<string, TeamMember> = new Map();
  private collaborationEvents: CollaborationEvent[] = [];

  /**
   * Register or update team member
   */
  registerMember(member: TeamMember): void {
    this.teamMembers.set(member.id, member);
  }

  /**
   * Get team member
   */
  getMember(id: string): TeamMember | undefined {
    return this.teamMembers.get(id);
  }

  /**
   * Get all team members
   */
  getAllMembers(): TeamMember[] {
    return Array.from(this.teamMembers.values());
  }

  /**
   * Record collaboration event
   */
  recordEvent(event: CollaborationEvent): void {
    this.collaborationEvents.push(event);
    this.updateMemberHistory(event);
  }

  /**
   * Find optimal task assignee
   */
  async findOptimalAssignee(
    taskId: string,
    requiredSkills: string[],
    priority: string,
    estimatedMinutes: number,
    context: string = ''
  ): Promise<SkillMatch[]> {
    const candidates = this.getAllMembers();
    const matches: SkillMatch[] = [];

    for (const member of candidates) {
      // Calculate skill match
      const matchedSkills = member.skills.filter(s =>
        requiredSkills.some(r => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
      );

      // Calculate skill overlap
      const skillOverlap = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0.5;

      // Calculate availability (inverse of current workload)
      const currentLoad = member.collaborationHistory.filter(e =>
        e.type === 'task_assigned' &&
        new Date(e.timestamp).getTime() > Date.now() - 7 * 86400000
      ).length;
      const availability = Math.max(0.2, 1 - currentLoad * 0.15);

      // Calculate productivity match
      const productivityMatch = this.calculateProductivityMatch(member, priority, estimatedMinutes);

      // Overall score
      const matchScore = Math.round(
        skillOverlap * 40 +
        availability * 30 +
        productivityMatch * 30
      );

      // Generate reasoning
      const reasoning = this.generateMatchingReasoning(member, skillOverlap, availability, productivityMatch);

      matches.push({
        taskId,
        recommendedAssignee: member.id,
        matchScore,
        reasoning,
        requiredSkills,
        candidateSkills: member.skills,
      });
    }

    // Sort by match score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Identify mentorship opportunities
   */
  async identifyMentorshipOpportunities(): Promise<MentorshipOpportunity[]> {
    const opportunities: MentorshipOpportunity[] = [];
    const members = this.getAllMembers();

    // Group by role/skill areas
    const skillGroups: Record<string, TeamMember[]> = {};

    for (const member of members) {
      for (const skill of member.skills) {
        if (!skillGroups[skill]) skillGroups[skill] = [];
        skillGroups[skill].push(member);
      }
    }

    // Find gaps where one person has high skill, another has low
    for (const [skill, skilledMembers] of Object.entries(skillGroups)) {
      if (skilledMembers.length >= 2) {
        // Sort by proficiency
        skilledMembers.sort((a, b) => {
          const aProf = a.productivityPatterns.completionRate;
          const bProf = b.productivityPatterns.completionRate;
          return bProf - aProf;
        });

        // Top performer mentors others
        const mentor = skilledMembers[0];
        const mentees = skilledMembers.slice(1);

        for (const mentee of mentees) {
          // Check if mentee has expressed interest in this skill
          const hasInterest = mentee.collaborationHistory.some(e =>
            e.type === 'comment_added' && e.metadata?.topic === skill
          );

          if (hasInterest || mentee.productivityPatterns.completionRate < 0.7) {
            opportunities.push({
              mentorId: mentor.id,
              menteeId: mentee.id,
              skillGap: skill,
              mentorshipType: this.categorizeSkill(skill),
              estimatedImpact: Math.round((mentor.productivityPatterns.completionRate - mentee.productivityPatterns.completionRate) * 100),
              suggestedFrequency: this.suggestFrequency(mentor, mentee),
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }

  /**
   * Analyze team health
   */
  async analyzeTeamHealth(): Promise<TeamHealthMetrics> {
    const members = this.getAllMembers();
    const recentEvents = this.collaborationEvents.filter(e =>
      e.timestamp > new Date(Date.now() - 30 * 86400000)
    );

    // Collaboration score based on cross-functional interactions
    const crossFunctional = recentEvents.filter(e =>
      e.participants.length > 1 &&
      new Set(e.participants.map(p => members.get(p)?.role)).size > 1
    ).length;

    const totalInteractions = recentEvents.filter(e => e.participants.length > 1).length;
    const collaborationScore = totalInteractions > 0 ? Math.round((crossFunctional / totalInteractions) * 100) : 50;

    // Communication frequency
    const communicationFrequency = recentEvents.length / members.length;

    // Knowledge sharing (comments, reviews, mentorship)
    const knowledgeEvents = recentEvents.filter(e =>
      ['comment_added', 'review', 'mention'].includes(e.type)
    ).length;
    const knowledgeSharing = members.length > 0 ? Math.min(100, (knowledgeEvents / members.length) * 10) : 0;

    // Workload balance
    const taskCounts = members.map(m =>
      recentEvents.filter(e => e.type === 'task_assigned' && e.participants.includes(m.id)).length
    );
    const avgLoad = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
    const loadVariance = taskCounts.reduce((sum, count) => sum + Math.pow(count - avgLoad, 2), 0) / taskCounts.length;
    const workloadBalance = Math.max(0, 100 - loadVariance * 10);

    // Conflict indicators
    const conflictIndicators: string[] = [];
    if (workloadBalance < 50) conflictIndicators.push('Significant workload imbalance detected');
    if (collaborationScore < 40) conflictIndicators.push('Low cross-functional collaboration');
    if (knowledgeSharing < 20) conflictIndicators.push('Limited knowledge sharing activity');

    // Recommendations
    const recommendations: string[] = [];
    if (collaborationScore < 60) recommendations.push('Schedule cross-team sync meetings');
    if (workloadBalance < 70) recommendations.push('Redistribute tasks to balance workload');
    if (knowledgeSharing < 50) recommendations.push('Implement regular knowledge sharing sessions');
    if (conflictIndicators.length > 0) recommendations.push('Address identified conflict indicators proactively');

    return {
      collaborationScore,
      communicationFrequency,
      knowledgeSharing,
      workloadBalance,
      conflictIndicators,
      recommendations,
    };
  }

  /**
   * Generate project insights
   */
  async generateProjectInsights(projectTasks: any[]): Promise<ProjectInsight> {
    const incomplete = projectTasks.filter(t => t.status !== 'completed');
    const overdue = incomplete.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const assignedMembers = new Set(incomplete.map(t => t.assignedTo).filter(Boolean));

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const bottlenecks: ProjectInsight['bottlenecks'] = [];

    if (overdue.length > incomplete.length * 0.3) {
      riskLevel = 'high';
      bottlenecks.push({ type: 'overdue', description: `${overdue.length} overdue tasks`, severity: 8 });
    } else if (overdue.length > 0) {
      riskLevel = 'medium';
      bottlenecks.push({ type: 'overdue', description: `${overdue.length} overdue tasks`, severity: 5 });
    }

    // Check for single point of failure
    const memberTaskCounts: Record<string, number> = {};
    incomplete.forEach(t => {
      if (t.assignedTo) {
        memberTaskCounts[t.assignedTo] = (memberTaskCounts[t.assignedTo] || 0) + 1;
      }
    });

    const maxTasks = Math.max(...Object.values(memberTaskCounts));
    const avgTasks = Object.values(memberTaskCounts).reduce((a, b) => a + b, 0) / Object.keys(memberTaskCounts).length;

    if (maxTasks > avgTasks * 3 && maxTasks > 5) {
      bottlenecks.push({ type: 'bottleneck', description: 'Single team member overloaded', severity: 7 });
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Dependency chains
    const longChains = incomplete.filter(t => t.dependsOnTaskId).length;
    if (longChains > incomplete.length * 0.4) {
      bottlenecks.push({ type: 'dependencies', description: 'High dependency chain complexity', severity: 6 });
    }

    // Predicted completion
    const avgCompletionTime = projectTasks
      .filter(t => t.status === 'completed' && t.completedAt && t.createdAt)
      .reduce((sum, t) => sum + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()), 0) /
      Math.max(1, projectTasks.filter(t => t.status === 'completed').length);

    const remainingHours = incomplete.reduce((sum, t) => sum + (t.estimatedMinutes || 60), 0) / 60;
    const predictedCompletion = new Date(Date.now() + remainingHours * 3600000 * 1.5); // 1.5x buffer

    // Recommendations
    const recommendations: string[] = [];
    if (overdue.length > 0) recommendations.push('Prioritize overdue tasks immediately');
    if (bottlenecks.some(b => b.type === 'bottleneck')) recommendations.push('Redistribute workload from overloaded member');
    if (bottlenecks.some(b => b.type === 'dependencies')) recommendations.push('Review and simplify dependency chains');
    if (incomplete.length > 20) recommendations.push('Consider breaking project into smaller phases');

    return {
      projectId: projectTasks[0]?.projectId || 'unknown',
      riskLevel,
      bottlenecks,
      recommendations,
      predictedCompletion,
      confidence: Math.max(0.3, 1 - bottlenecks.length * 0.15),
    };
  }

  private updateMemberHistory(event: CollaborationEvent): void {
    for (const participantId of event.participants) {
      const member = this.teamMembers.get(participantId);
      if (member) {
        member.collaborationHistory.push(event);
      }
    }
  }

  private calculateProductivityMatch(member: TeamMember, priority: string, estimatedMinutes: number): number {
    let match = 0.5;

    // Preference for work type
    if (priority === 'high' && member.productivityPatterns.preferredWorkStyle === 'deep-focus') match += 0.2;
    if (priority === 'low' && member.productivityPatterns.preferredWorkStyle === 'multitasking') match += 0.2;

    // Time estimation accuracy
    const timeDiff = Math.abs(member.productivityPatterns.averageTaskTime - estimatedMinutes) / Math.max(1, estimatedMinutes);
    match += Math.max(0, 0.3 - timeDiff);

    return Math.min(1, match);
  }

  private generateMatchingReasoning(member: TeamMember, skillOverlap: number, availability: number, productivityMatch: number): string {
    const reasons: string[] = [];

    if (skillOverlap > 0.7) reasons.push(`Excellent skill match (${Math.round(skillOverlap * 100)}%)`);
    else if (skillOverlap > 0.4) reasons.push(`Good skill overlap (${Math.round(skillOverlap * 100)}%)`);
    else reasons.push('Limited direct skill match');

    if (availability > 0.8) reasons.push('High availability');
    else if (availability > 0.5) reasons.push('Moderate availability');
    else reasons.push('Currently busy');

    if (productivityMatch > 0.7) reasons.push('Strong productivity fit');
    else if (productivityMatch > 0.5) reasons.push('Good productivity alignment');

    return reasons.join('; ');
  }

  private categorizeSkill(skill: string): 'technical' | 'process' | 'domain' | 'soft-skills' {
    const technical = ['javascript', 'python', 'react', 'sql', 'aws', 'docker', 'kubernetes'];
    const process = ['agile', 'scrum', 'kanban', 'project-management', 'planning'];
    const domain = ['finance', 'healthcare', 'ecommerce', 'marketing', 'sales'];
    const soft = ['communication', 'leadership', 'mentoring', 'negotiation', 'presentation'];

    const lower = skill.toLowerCase();
    if (technical.some(t => lower.includes(t))) return 'technical';
    if (process.some(p => lower.includes(p))) return 'process';
    if (domain.some(d => lower.includes(d))) return 'domain';
    return 'soft-skills';
  }

  private suggestFrequency(mentor: TeamMember, mentee: TeamMember): 'weekly' | 'biweekly' | 'monthly' {
    const gap = mentor.productivityPatterns.completionRate - mentee.productivityPatterns.completionRate;
    if (gap > 0.3) return 'weekly';
    if (gap > 0.15) return 'biweekly';
    return 'monthly';
  }
}

// Singleton instance
export const collaborationIntelligence = new CollaborationIntelligence();