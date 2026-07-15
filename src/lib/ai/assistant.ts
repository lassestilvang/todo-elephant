// AI Assistant for natural language task processing
import { execFile } from 'child_process';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { Task } from '@/types';

const execFileAsync = promisify(execFile);

export interface NLPResult {
  title: string;
  description: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number; // in minutes
  tags?: string[];
}

export interface AISchedulingSuggestion {
  taskId: number;
  suggestedSlots: Array<{
    startTime: string;
    endTime: string;
    label: string;
  }>;
  reasoning: string;
}

export class AIAssistant {
  /**
   * Process natural language input into structured task data
   */
  async processNaturalLanguage(input: string): Promise<NLPResult> {
    try {
      // Try to use a local NLP model first (simplified)
      const localResult = await this.processWithLocalModel(input);
      if (localResult) return localResult;

      // Fallback to rule-based parsing
      return this.parseWithRules(input);
    } catch (error) {
      console.error('AI Assistant processing failed:', error);
      // Return basic parsed input as fallback
      return this.parseWithRules(input);
    }
  }

  /**
   * Process with local lightweight model (placeholder for actual implementation)
   */
  private async processWithLocalModel(input: string): Promise<NLPResult | null> {
    // In a real implementation, this would use a local model like:
    // - TensorFlow.js model
    // - Hugging Face Transformers.js
    // - spaCy.js
    // For now, we'll simulate with a simple timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    return null; // Indicates we should fall back to rule-based
  }

  /**
   * Rule-based natural language parsing
   */
  private parseWithRules(input: string): NLPResult {
    const result: NLPResult = {
      title: input.trim(),
      description: input.trim(),
      priority: 'medium',
      estimatedTime: 30, // default 30 minutes
      tags: []
    };

    // Extract due date patterns
    const dateMatch = input.match(
      /(?:due|by|before|on)\s+(today|tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    );
    if (dateMatch) {
      result.dueDate = this.parseDateString(dateMatch[1]);
    }

    // Extract priority indicators
    if (/important|urgent|asap|critical|high\s*priority/i.test(input)) {
      result.priority = 'high';
    } else if (/low\s*priority|not\s*urgent|can\s*wait/i.test(input)) {
      result.priority = 'low';
    }

    // Extract time estimates
    const timeMatch = input.match(/(\d+)\s*(?:min|minute|minutes|hr|hour|hours)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      result.estimatedTime = unit.startsWith('h') ? value * 60 : value;
    }

    // Extract tags (hashtags)
    const tags = [...input.matchAll(/#(\w+)/g)];
    if (tags.length > 0) {
      result.tags = tags.map(match => match[1]);
    }

    // Clean up title by removing detected patterns
    result.title = input
      .replace(/(?:due|by|before|on)\s+(today|tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, '')
      .replace(/(?:important|urgent|asap|critical|high\s*priority|low\s*priority|not\s*urgent|can\s*wait)/gi, '')
      .replace(/(\d+)\s*(?:min|minute|minutes|hr|hour|hours)/gi, '')
      .replace(/#\w+/g, '')
      .trim();

    // Ensure title is not empty
    if (!result.title || result.title.length < 3) {
      result.title = input.substring(0, Math.min(50, input.length));
    }

    return result;
  }

  /**
   * Parse date string into ISO format
   */
  private parseDateString(dateStr: string): string | undefined {
    const now = new Date();
    let date: Date | null = null;

    const lower = dateStr.toLowerCase().trim();

    if (lower === 'today') {
      date = new Date(now.toDateString());
    } else if (lower === 'tomorrow') {
      date = new Date(now);
      date.setDate(date.getDate() + 1);
    } else if (lower.includes('next week')) {
      date = new Date(now);
      date.setDate(date.getDate() + 7);
    } else {
      // Try parsing as MM/DD/YYYY or DD/MM/YYYY
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const [part1, part2, part3] = parts.map(p => parseInt(p, 10));
        if (!isNaN(part3) && part3 >= 2000 && part3 <= 2030) {
          // Assume YYYY-MM-DD or MM-DD-YYYY
          if (part3 > 1000) { // Likely YYYY first
            date = new Date(part3, part1 - 1, part2);
          } else { // Likely MM-DD-YYYY
            date = new Date(part3, part1 - 1, part2);
          }
        }
      }
    }

    return date ? date.toISOString().split('T')[0] : undefined;
  }

  /**
   * Suggest task improvements based on best practices
   */
  async suggestImprovements(task: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
  }): Promise<string[]> {
    const suggestions: string[] = [];

    if (!task.title || task.title.length < 5) {
      suggestions.push("Consider making the task title more descriptive (at least 5 characters)");
    }

    if (!task.description || task.description.length < 10) {
      suggestions.push("Add more details to the description for clarity");
    }

    if (!task.dueDate) {
      suggestions.push("Consider adding a due date to help with prioritization");
    }

    if (!task.priority) {
      suggestions.push("Setting a priority level (low/medium/high) will help with task management");
    }

    // Check for vague language
    const vagueTerms = ['stuff', 'things', 'something', 'maybe', 'possibly'];
    const textToCheck = `${task.title} ${task.description || ''}`.toLowerCase();
    if (vagueTerms.some(term => textToCheck.includes(term))) {
      suggestions.push("Try to be more specific - avoid vague terms like 'stuff' or 'things'");
    }

    return suggestions;
  }

  /**
   * Break down a large task into smaller sub-tasks
   */
  async breakDownTask(taskTitle: string): Promise<string[]> {
    // Simple heuristic-based breakdown
    const commonPatterns = [
      { keyword: 'plan', subtasks: ['Research requirements', 'Create outline', 'Draft plan', 'Review and finalize'] },
      { keyword: 'write', subtasks: ['Outline content', 'Write draft', 'Edit and revise', 'Proofread final version'] },
      { keyword: 'design', subtasks: ['Gather requirements', 'Create wireframes', 'Design mockups', 'Get feedback and iterate'] },
      { keyword: 'build', subtasks: ['Set up environment', 'Implement core features', 'Test functionality', 'Deploy and monitor'] },
      { keyword: 'organize', subtasks: ['Sort items', 'Categorize items', 'Store items properly', 'Label for easy access'] },
      { keyword: 'clean', subtasks: ['Declutter surface', 'Deep clean areas', 'Organize remaining items', 'Maintain cleanliness'] }
    ];

    const lowerTitle = taskTitle.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lowerTitle.includes(pattern.keyword)) {
        return pattern.subtasks;
      }
    }

    // Generic breakdown for unknown tasks
    return [
      'Define clear objectives',
      'Break into manageable steps',
      'Gather necessary resources',
      'Execute according to plan',
      'Review results and adjust'
    ];
  }

  /**
   * Predict optimal time to work on a task based on user's productivity patterns
   */
  async suggestOptimalTime(): Promise<string> {
    // This would ideally use historical data from the analytics system
    // For now, return a reasonable default
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) {
      return "Morning (9-11 AM) - typically high focus period";
    } else if (hour >= 14 && hour <= 16) {
      return "Afternoon (2-4 PM) - good for collaborative work";
    } else {
      return "Consider your personal peak productivity times";
    }
  }

  /**
   * Generate scheduling suggestions based on task characteristics
   */
  async generateSchedulingSuggestions(tasks: Task[], focusSessions: any[] = []): Promise<AISchedulingSuggestion[]> {
    const suggestions: AISchedulingSuggestion[] = [];
    const incompleteTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');

    // Sort tasks by priority and due date
    const sortedTasks = [...incompleteTasks].sort((a, b) => {
      // High priority first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return 0;
    });

    // Generate time slots for top 3 tasks
    const now = new Date();
    const workHours = [9, 10, 11, 14, 15, 16]; // Typical work hours

    for (let i = 0; i < Math.min(3, sortedTasks.length); i++) {
      const task = sortedTasks[i];
      const hour = workHours[i % workHours.length];

      suggestions.push({
        taskId: task.id,
        suggestedSlots: [{
          startTime: `${hour}:00`,
          endTime: `${hour + 1}:00`,
          label: `${hour}:00 - ${hour + 1}:00`
        }],
        reasoning: task.priority === 'high'
          ? 'High priority task - best scheduled during peak focus hours'
          : 'Medium priority task - good fit for afternoon productivity window'
      });
    }

    return suggestions;
  }
}

// Singleton instance
export const aiAssistant = new AIAssistant();