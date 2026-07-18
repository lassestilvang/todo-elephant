/**
 * Smart Template System - Machine Learning powered template generation
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tasks: TemplateTask[];
  estimatedTotalMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  usageCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
  authorId?: string;
  isPublic: boolean;
  version: number;
}

export interface TemplateTask {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  category: string;
  dependsOn?: string; // Title of task this depends on
  order: number;
  isOptional: boolean;
  labels?: string[];
  subtasks?: TemplateSubtask[];
}

export interface TemplateSubtask {
  title: string;
  completed: boolean;
}

export interface TemplateGenerationRequest {
  taskDescription: string;
  userContext?: {
    workStyle?: string;
    preferredCategories?: string[];
    averageTaskTime?: number;
  };
}

export interface TemplateAnalytics {
  templateId: string;
  totalUses: number;
  completions: number;
  averageCompletionTime: number;
  successRate: number;
  userRatings: number[];
  commonDropOffPoints: Array<{ taskTitle: string; dropOffRate: number }>;
}

export class SmartTemplateGenerator {
  /**
   * Generate a smart template from a task description
   */
  async generateTemplate(request: TemplateGenerationRequest): Promise<TaskTemplate> {
    const prompt = this.buildGenerationPrompt(request);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert productivity template designer. Create optimal task templates from descriptions.

            Consider:
            1. Task decomposition best practices
            2. Logical dependencies between subtasks
            3. Realistic time estimates
            4. Priority ordering (critical path first)
            5. Categorization for filtering
            6. Optional vs required steps

            Return ONLY valid JSON with this exact structure:
            {"name": "...", "description": "...", "category": "...", "tasks": [{"title": "...", "description": "...", "priority": "high|medium|low", "estimatedMinutes": N, "category": "...", "dependsOn": "...", "order": N, "isOptional": boolean, "labels": [...], "subtasks": [{"title": "...", "completed": false}]}], "estimatedTotalMinutes": N, "difficulty": "beginner|intermediate|advanced", "tags": [...]}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return this.buildTemplate(data, request);
    } catch (error) {
      console.error('Template generation error:', error);
      return this.getFallbackTemplate(request);
    }
  }

  /**
   * Generate template from existing successful project
   */
  async generateFromProject(projectTasks: any[], projectName: string): Promise<TaskTemplate> {
    const completedTasks = projectTasks.filter(t => t.status === 'completed');
    const prompt = this.buildProjectAnalysisPrompt(completedTasks, projectName);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a template extraction expert. Analyze a completed project and create a reusable template.

            Return ONLY valid JSON with the exact template structure.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return this.buildTemplate(data, { taskDescription: projectName });
    } catch (error) {
      console.error('Project template generation error:', error);
      return this.getFallbackTemplate({ taskDescription: projectName });
    }
  }

  /**
   * Suggest template improvements based on usage data
   */
  async suggestImprovements(template: TaskTemplate, analytics: TemplateAnalytics): Promise<string[]> {
    const prompt = `
    Template: ${template.name}
    Category: ${template.category}
    Total Uses: ${analytics.totalUses}
    Success Rate: ${analytics.successRate}%
    Average Completion Time: ${analytics.averageCompletionTime} minutes
    Drop-off Points: ${JSON.stringify(analytics.commonDropOffPoints)}

    Suggest 3-5 specific improvements to increase success rate and reduce completion time.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a template optimization expert. Provide actionable improvements.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });

      return response.choices[0].message.content?.split('\n').filter(Boolean) || [];
    } catch (error) {
      console.error('Template improvement error:', error);
      return ['Add more granular subtasks', 'Reduce estimated times based on actuals', 'Add optional parallel tracks'];
    }
  }

  private buildGenerationPrompt(request: TemplateGenerationRequest): string {
    return `
    Task Description: "${request.taskDescription}"

    User Context:
    ${request.userContext ? `
    - Work Style: ${request.userContext.workStyle || 'Not specified'}
    - Preferred Categories: ${request.userContext.preferredCategories?.join(', ') || 'None'}
    - Average Task Time: ${request.userContext.averageTaskTime || 'Unknown'} minutes
    ` : 'No additional context provided'}

    Generate a comprehensive, reusable task template.`;
  }

  private buildProjectAnalysisPrompt(completedTasks: any[], projectName: string): string {
    const taskList = completedTasks.map((t, i) => `
      ${i + 1}. ${t.title}
         Priority: ${t.priority}
         Time: ${t.completedAt && t.createdAt ? Math.round((new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / 60000) : 'Unknown'} minutes
         Category: ${t.category || 'General'}
    `).join('\n');

    return `
    Project: "${projectName}"
    Completed Tasks:
    ${taskList}

    Create a reusable template from this successful project pattern.`;
  }

  private buildTemplate(data: any, request: TemplateGenerationRequest): TaskTemplate {
    return {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || `Template for: ${request.taskDescription}`,
      description: data.description || `Auto-generated template from: ${request.taskDescription}`,
      category: data.category || 'general',
      tasks: (data.tasks || []).map((t: any, i: number) => ({
        title: t.title || `Task ${i + 1}`,
        description: t.description,
        priority: t.priority || 'medium',
        estimatedMinutes: t.estimatedMinutes || 30,
        category: t.category || data.category || 'general',
        dependsOn: t.dependsOn,
        order: t.order || i,
        isOptional: t.isOptional || false,
        labels: t.labels || [],
        subtasks: t.subtasks || [],
      })),
      estimatedTotalMinutes: data.estimatedTotalMinutes || data.tasks?.reduce((sum: number, t: any) => sum + (t.estimatedMinutes || 30), 0) || 100,
      difficulty: data.difficulty || 'intermediate',
      tags: data.tags || [],
      usageCount: 0,
      successRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      version: 1,
    };
  }

  private getFallbackTemplate(request: TemplateGenerationRequest): TaskTemplate {
    return {
      id: `template-fallback-${Date.now()}`,
      name: `Template: ${request.taskDescription}`,
      description: `Auto-generated template for "${request.taskDescription}"`,
      category: 'general',
      tasks: [
        { title: 'Define requirements and scope', priority: 'high', estimatedMinutes: 30, category: 'planning', order: 0, isOptional: false, labels: ['planning'], subtasks: [] },
        { title: 'Break down into actionable steps', priority: 'high', estimatedMinutes: 20, category: 'planning', order: 1, isOptional: false, labels: ['planning'], subtasks: [] },
        { title: 'Execute core work', priority: 'high', estimatedMinutes: 60, category: 'execution', order: 2, isOptional: false, labels: ['work'], subtasks: [] },
        { title: 'Review and validate results', priority: 'medium', estimatedMinutes: 20, category: 'review', order: 3, isOptional: false, labels: ['review'], subtasks: [] },
        { title: 'Document and close out', priority: 'low', estimatedMinutes: 15, category: 'wrapup', order: 4, isOptional: true, labels: ['documentation'], subtasks: [] },
      ],
      estimatedTotalMinutes: 145,
      difficulty: 'intermediate',
      tags: ['auto-generated'],
      usageCount: 0,
      successRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      version: 1,
    };
  }
}

/**
 * Template Library Manager
 */
export class TemplateLibrary {
  private templates: Map<string, TaskTemplate> = new Map();
  private analytics: Map<string, TemplateAnalytics> = new Map();

  addTemplate(template: TaskTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): TaskTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): TaskTemplate[] {
    return Array.from(this.templates.values());
  }

  getPublicTemplates(): TaskTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.isPublic);
  }

  searchTemplates(query: string): TaskTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getTemplatesByCategory(category: string): TaskTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  recordUsage(templateId: string, completed: boolean, timeMinutes: number): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount++;
      this.templates.set(templateId, template);
    }

    let analytic = this.analytics.get(templateId);
    if (!analytic) {
      analytic = {
        templateId,
        totalUses: 0,
        completions: 0,
        averageCompletionTime: 0,
        successRate: 0,
        userRatings: [],
        commonDropOffPoints: [],
      };
    }

    analytic.totalUses++;
    if (completed) analytic.completions++;
    analytic.successRate = (analytic.completions / analytic.totalUses) * 100;
    analytic.averageCompletionTime = ((analytic.averageCompletionTime * (analytic.totalUses - 1)) + timeMinutes) / analytic.totalUses;

    this.analytics.set(templateId, analytic);
  }

  getAnalytics(templateId: string): TemplateAnalytics | undefined {
    return this.analytics.get(templateId);
  }
}

// Singleton instance
export const templateLibrary = new TemplateLibrary();