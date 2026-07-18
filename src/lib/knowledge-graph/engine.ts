/**
 * Knowledge Graph & Wisdom Extraction System
 * Extracts organizational wisdom from completed tasks and generates insights
 */

export interface KnowledgeNode {
  id: string;
  type: 'task' | 'lesson' | 'pattern' | 'skill' | 'resource' | 'insight';
  title: string;
  description: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sourceTaskId?: string;
  authorId?: string;
  confidence: number; // 0-1
  usageCount: number;
  relatedNodes: string[];
}

export interface LessonExtracted {
  id: string;
  title: string;
  description: string;
  context: string;
  actionableAdvice: string;
  applicableScenarios: string[];
  sourceTaskId: string;
  confidence: number;
}

export interface ExpertiseMapping {
  skill: string;
  users: Array<{
    userId: string;
    proficiency: number; // 0-1
    evidence: string[];
    lastUpdated: Date;
  }>;
  trending: boolean;
  demandLevel: 'low' | 'medium' | 'high';
}

export interface KnowledgeGraphInsight {
  type: 'pattern' | 'gap' | 'opportunity' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  relatedNodes: string[];
}

export class KnowledgeGraphEngine {
  private knowledgeGraph: Map<string, KnowledgeNode> = new Map();
  private lessons: Map<string, LessonExtracted> = new Map();
  private expertiseMap: Map<string, ExpertiseMapping> = new Map();

  /**
   * Extract lessons from completed tasks
   */
  async extractLessonsFromTask(taskId: string): Promise<LessonExtracted[]> {
    try {
      // Get task details
      const taskResponse = await fetch(`/api/tasks/${taskId}`);
      if (!taskResponse.ok) {
        throw new Error('Task not found');
      }
      const task = await taskResponse.json();

      // Use AI to extract lessons
      const response = await fetch('/api/knowledge/extract-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, task })
      });

      if (!response.ok) {
        throw new Error('Lesson extraction failed');
      }

      const lessonsData = await response.json();
      const lessons: LessonExtracted[] = [];

      for (const lessonData of lessonsData.lessons || []) {
        const lesson: LessonExtracted = {
          id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: lessonData.title,
          description: lessonData.description,
          context: lessonData.context || '',
          actionableAdvice: lessonData.actionableAdvice,
          applicableScenarios: lessonData.applicableScenarios || [],
          sourceTaskId: taskId,
          confidence: lessonData.confidence || 0.7,
        };

        this.lessons.set(lesson.id, lesson);
        lessons.push(lesson);
      }

      return lessons;
    } catch (error) {
      console.error('Lesson extraction error:', error);
      return [];
    }
  }

  /**
   * Extract knowledge from completed task
   */
  async extractKnowledgeFromTask(taskId: string): Promise<KnowledgeNode[]> {
    try {
      // Get task details
      const taskResponse = await fetch(`/api/tasks/${taskId}`);
      if (!taskResponse.ok) {
        throw new Error('Task not found');
      }
      const task = await taskResponse.json();

      // Only process completed or high-value tasks
      if (task.status !== 'completed' &&
          !(task.priority === 'high' && task.estimatedMinutes > 60)) {
        return [];
      }

      // Extract multiple knowledge types
      const knowledgeNodes: KnowledgeNode[] = [];

      // 1. Task pattern knowledge
      const patternKnowledge = await this.extractTaskPattern(task);
      if (patternKnowledge) knowledgeNodes.push(patternKnowledge);

      // 2. Skill/knowledge identification
      const skillKnowledge = await this.extractSkillKnowledge(task);
      knowledgeNodes.push(...skillKnowledge);

      // 3. Resource references
      const resourceKnowledge = await this.extractResourceKnowledge(task);
      if (resourceKnowledge) knowledgeNodes.push(resourceKnowledge);

      // 4. Insight generation
      const insightKnowledge = await this.extractInsightKnowledge(task);
      if (insightKnowledge) knowledgeNodes.push(insightKnowledge);

      // Save all knowledge
      for (const knowledge of knowledgeNodes) {
        this.knowledgeGraph.set(knowledge.id, knowledge);
      }

      return knowledgeNodes;
    } catch (error) {
      console.error('Knowledge extraction error:', error);
      return [];
    }
  }

  /**
   * Build organizational knowledge graph
   */
  async buildKnowledgeGraph(tasks: any[]): Promise<void> {
    // Process completed tasks in batches
    const completedTasks = tasks.filter(t => t.status === 'completed');

    for (const task of completedTasks) {
      try {
        await this.extractKnowledgeFromTask(task.id);
        await this.extractLessonsFromTask(task.id);
      } catch (error) {
        console.error(`Failed to extract knowledge from task ${task.id}:`, error);
      }
    }

    // Build relationships between knowledge nodes
    await this.buildRelationships();
  }

  /**
   * Find related knowledge
   */
  findRelatedKnowledge(query: string, limit: number = 10): KnowledgeNode[] {
    const queryLower = query.toLowerCase();
    const matches: Array<{ node: KnowledgeNode; score: number }> = [];

    for (const [, node] of this.knowledgeGraph) {
      let score = 0;

      // Title match
      if (node.title.toLowerCase().includes(queryLower)) score += 10;
      // Description match
      if (node.description.toLowerCase().includes(queryLower)) score += 5;
      // Content match
      if (node.content.toLowerCase().includes(queryLower)) score += 3;
      // Tags match
      if (node.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 7;

      if (score > 0) {
        matches.push({ node, score });
      }
    }

    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.node);
  }

  /**
   * Get expertise mapping for a skill
   */
  getExpertise(skill: string): ExpertiseMapping | undefined {
    return this.expertiseMap.get(skill.toLowerCase());
  }

  /**
   * Update expertise based on task completion
   */
  async updateExpertise(taskId: string, userId: string): Promise<void> {
    try {
      // Get task details
      const taskResponse = await fetch(`/api/tasks/${taskId}`);
      if (!taskResponse.ok) return;
      const task = await taskResponse.json();

      // Extract skills from task
      const skills = await this.extractSkillsFromTask(task);

      for (const skill of skills) {
        let expertise = this.expertiseMap.get(skill.toLowerCase());
        if (!expertise) {
          expertise = {
            skill,
            users: [],
            trending: false,
            demandLevel: 'medium',
          };
          this.expertiseMap.set(skill.toLowerCase(), expertise);
        }

        // Update or add user proficiency
        const userIndex = expertise.users.findIndex(u => u.userId === userId);
        const proficiency = this.calculateProficiency(task);

        if (userIndex >= 0) {
          // Update existing
          expertise.users[userIndex] = {
            ...expertise.users[userIndex],
            proficiency: Math.max(expertise.users[userIndex].proficiency, proficiency),
            evidence: [...expertise.users[userIndex].evidence, taskId],
            lastUpdated: new Date(),
          };
        } else {
          // Add new user
          expertise.users.push({
            userId,
            proficiency,
            evidence: [taskId],
            lastUpdated: new Date(),
          });
        }

        // Update trending status
        expertise.trending = this.calculateTrending(expertise);

        this.expertiseMap.set(skill.toLowerCase(), expertise);
      }
    } catch (error) {
      console.error('Expertise update error:', error);
    }
  }

  /**
   * Generate knowledge graph insights
   */
  async generateInsights(): Promise<KnowledgeGraphInsight[]> {
    const insights: KnowledgeGraphInsight[] = [];

    // Pattern detection: frequent task combinations
    const patternInsights = await this.detectTaskPatterns();
    insights.push(...patternInsights);

    // Knowledge gaps: missing documentation for frequent tasks
    const gapInsights = await this.detectKnowledgeGaps();
    insights.push(...gapInsights);

    // Trending topics
    const trendInsights = await this.detectTrendingTopics();
    insights.push(...trendInsights);

    return insights;
  }

  private async extractTaskPattern(task: any): Promise<KnowledgeNode | null> {
    // Look for recurring task patterns
    if (!task.title) return null;

    const title = task.title.toLowerCase();
    const patternKeywords = ['review', 'plan', 'update', 'check', 'prepare', 'schedule'];

    for (const keyword of patternKeywords) {
      if (title.includes(keyword)) {
        return {
          id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'pattern',
          title: `Pattern: ${task.title}`,
          description: `Recurring pattern detected: ${keyword}-based tasks`,
          content: `Tasks involving ${keyword} occur frequently and may benefit from standardization.`,
          tags: ['pattern', keyword, 'recurring'],
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceTaskId: task.id,
          confidence: 0.6,
          usageCount: 0,
          relatedNodes: [],
        };
      }
    }

    return null;
  }

  private async extractSkillKnowledge(task: any): Promise<KnowledgeNode[]> {
    const skills: string[] = [];
    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    const skillKeywords = {
      programming: ['code', 'develop', 'implement', 'debug', 'test'],
      design: ['design', 'ui', 'ux', 'wireframe', 'mockup'],
      writing: ['write', 'draft', 'edit', 'proofread', 'content'],
      research: ['research', 'analyze', 'investigate', 'survey', 'study'],
      meeting: ['meeting', 'call', 'discuss', 'present', 'brief'],
      admin: ['organize', 'file', 'update', 'maintain', 'process'],
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        skills.push(skill);
      }
    }

    return skills.map(skill => ({
      id: `skill-${skill}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'skill',
      title: `Skill: ${skill}`,
      description: `Evidence of ${skill} skill usage`,
      content: `Task demonstrates application of ${skill} skill: ${task.title}`,
      tags: [skill, 'skill', 'evidence'],
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceTaskId: task.id,
      confidence: 0.7,
      usageCount: 0,
      relatedNodes: [],
    }));
  }

  private async extractResourceKnowledge(task: any): Promise<KnowledgeNode | null> {
    // Look for resource references (URLs, documents, tools)
    const text = `${task.description || ''}`;
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern) || [];

    if (urls.length > 0) {
      return {
        id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'resource',
        title: `Resource: ${urls[0]}`,
        description: 'External resource referenced in task',
        content: `Task references external resource: ${urls.join(', ')}`,
        tags: ['resource', 'url', 'reference'],
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceTaskId: task.id,
        confidence: 0.8,
        usageCount: 0,
        relatedNodes: [],
      };
    }

    return null;
  }

  private async extractInsightKnowledge(task: any): Promise<KnowledgeNode | null> {
    // Look for insights, learnings, or best practices in task
    const text = `${task.description || ''}`.toLowerCase();
    const insightIndicators = [
      'learned', 'discovered', 'realized', 'found', 'determined',
      'conclusion', 'insight', 'lesson', 'best practice', 'recommendation'
    ];

    const hasInsight = insightIndicators.some(indicator => text.includes(indicator));

    if (hasInsight && task.completedAt) {
      return {
        id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'insight',
        title: `Insight from: ${task.title || 'Task'}`,
        description: 'Valuable insight extracted from completed task',
        content: `Insight: ${task.description.substring(0, 200)}...`,
        tags: ['insight', 'learning', 'wisdom'],
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceTaskId: task.id,
        confidence: 0.7,
        usageCount: 0,
        relatedNodes: [],
      };
    }

    return null;
  }

  private async buildRelationships(): Promise<void> {
    // Build relationships between related knowledge nodes
    const nodes = Array.from(this.knowledgeGraph.values());

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Check for related tags
        const commonTags = nodeA.tags.filter(tag => nodeB.tags.includes(tag));
        if (commonTags.length > 0) {
          // Bidirectional relationship
          nodeA.relatedNodes = [...new Set([...nodeA.relatedNodes, nodeB.id])];
          nodeB.relatedNodes = [...new Set([...nodeB.relatedNodes, nodeA.id])];
          this.knowledgeGraph.set(nodeA.id, nodeA);
          this.knowledgeGraph.set(nodeB.id, nodeB);
        }
      }
    }
  }

  private async detectTaskPatterns(): Promise<KnowledgeGraphInsight[]> {
    const insights: KnowledgeGraphInsight[] = [];

    // Group tasks by similar titles/patterns
    const taskGroups: Record<string, any[]> = {};
    const tasks = Array.from(this.knowledgeGraph.values())
      .filter(n => n.sourceTaskId)
      .map(n => n.sourceTaskId);

    // Simple grouping by first word
    for (const taskId of tasks) {
      // In real implementation, would fetch actual task data
      const firstWord = taskId.split('-')[0] || 'unknown';
      if (!taskGroups[firstWord]) taskGroups[firstWord] = [];
      taskGroups[firstWord].push(taskId);
    }

    for (const [pattern, taskIds] of Object.entries(taskGroups)) {
      if (taskIds.length >= 3) {
        insights.push({
          type: 'pattern',
          title: `Frequent Task Pattern: ${pattern}`,
          description: `Found ${taskIds.length} similar tasks with pattern '${pattern}'`,
          impact: taskIds.length >= 5 ? 'high' : 'medium',
          recommendations: [
            `Consider creating a template for ${pattern}-based tasks`,
            `Standardize the process for recurring ${pattern} tasks`,
            `Create a checklist for ${pattern} task completion`
          ],
          relatedNodes: [],
        });
      }
    }

    return insights;
  }

  private async detectKnowledgeGaps(): Promise<KnowledgeGraphInsight[]> {
    const insights: KnowledgeGraphInsight[] = [];

    // Find frequent tasks without corresponding knowledge
    const taskFrequency: Record<string, number> = {};
    const knowledgeCoverage: Record<string, boolean> = {};

    // Count tasks by type/category
    for (const [, knowledge] of this.knowledgeGraph) {
      if (knowledge.sourceTaskId) {
        // Extract task type from knowledge
        const taskType = knowledge.title.toLowerCase().includes('review') ? 'review' :
                         knowledge.title.toLowerCase().includes('plan') ? 'plan' :
                         knowledge.title.toLowerCase().includes('meeting') ? 'meeting' :
                         'other';
        taskFrequency[taskType] = (taskFrequency[taskType] || 0) + 1;
        knowledgeCoverage[taskType] = true;
      }
    }

    for (const [type, count] of Object.entries(taskFrequency)) {
      if (!knowledgeCoverage[type] && count >= 3) {
        insights.push({
          type: 'gap',
          title: `Knowledge Gap: ${type} tasks`,
          description: `Found ${count} ${type} tasks without associated knowledge/documentation`,
          impact: 'medium',
          recommendations: [
            `Create documentation template for ${type} tasks`,
            `Extract best practices from completed ${type} tasks`,
            `Schedule knowledge extraction`
          ],
          relatedNodes: [],
        });
      }
    }

    return insights;
  }

  private async detectTrendingTopics(): Promise<KnowledgeGraphInsight[]> {
    const insights: KnowledgeGraphInsight[] = [];

    // Check for trending topics in knowledge tags
    const tagFrequency: Record<string, number> = {};

    const recentKnowledge = Array.from(this.knowledgeGraph.values())
      .filter(k => k.createdAt > new Date(Date.now() - 30 * 86400000)); // Last 30 days

    for (const knowledge of recentKnowledge) {
      for (const tag of knowledge.tags) {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      }
    }

    const sortedTags = Object.entries(tagFrequency)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);

    for (const [tag, count] of sortedTags.slice(0, 5)) {
      insights.push({
        type: 'trend',
        title: `Trending Topic: ${tag}`,
        description: `Topic '${tag}' appeared in ${count} recent knowledge items`,
        impact: count >= 5 ? 'high' : 'medium',
        recommendations: [
          `Create focused training on ${tag}`,
          `Develop best practices guide for ${tag}`,
          `Consider ${tag} as specialization area`
        ],
        relatedNodes: [],
      });
    }

    return insights;
  }

  private async extractSkillsFromTask(task: any): Promise<string[]> {
    const skills: string[] = [];
    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    const skillMap: Record<string, string[]> = {
      'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
      'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
      'design': ['design', 'ui', 'ux', 'figma', 'sketch', 'photoshop'],
      'writing': ['write', 'draft', 'edit', 'proofread', 'content', 'copy'],
      'research': ['research', 'analyze', 'investigate', 'survey', 'data', 'statistics'],
      'project-management': ['manage', 'plan', 'schedule', 'agile', 'scrum', 'kanban'],
      'communication': ['present', 'meeting', 'call', 'discuss', 'present', 'email'],
      'data-analysis': ['sql', 'query', 'database', 'excel', 'tableau', 'powerbi'],
      'devops': ['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'deployment'],
    };

    for (const [skill, keywords] of Object.entries(skillMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private calculateProficiency(task: any): number {
    let proficiency = 0.5; // Base

    // Increase based on task completion quality
    if (task.status === 'completed') proficiency += 0.2;
    if (task.priority === 'high') proficiency += 0.1;
    if (task.estimatedMinutes > 120) proficiency += 0.1; // Complex task

    // Decrease if issues
    if (task.description && task.description.length < 20) proficiency -= 0.1;
    if (!task.description || task.description.trim() === '') proficiency -= 0.2;

    return Math.max(0, Math.min(1, proficiency));
  }

  private calculateTrending(expertise: ExpertiseMapping): boolean {
    // Simple trending based on recent activity
    const now = new Date();
    const recentActivity = expertise.users.filter(user =>
      new Date(user.lastUpdated).getTime() > now.getTime() - 7 * 86400000
    ).length;

    return recentActivity >= Math.ceil(expertise.users.length * 0.6);
  }
}

// Singleton instance
export const knowledgeGraph = new KnowledgeGraphEngine();