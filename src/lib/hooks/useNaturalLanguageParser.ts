import { useState, useEffect, useCallback } from 'react';
import { callApi } from '@/lib/api/client';
import { Task, Subtask } from '@/types';
import { aiAssistant, NLPResult } from '@/lib/ai/assistant';

export const useNaturalLanguageParser = (taskDescription: string) => {
  const [microTasks, setMicroTasks] = useState<Partial<Task>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseTask = useCallback(async () => {
    if (!taskDescription?.trim()) {
      setMicroTasks([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);

      // Try API first
      const response = await callApi('/api/elephant/nlp-parse', 'POST', { task: taskDescription });

      // Transform API response to micro-tasks
      const formattedTasks: Partial<Task>[] = response.microTasks?.map((mt: any) => ({
        id: mt.id || crypto.randomUUID(),
        title: mt.title || taskDescription.slice(0, 100),
        description: mt.description || taskDescription,
        priority: mt.priority || 'medium',
        status: 'todo',
        tags: mt.tags || [],
        createdAt: new Date().toISOString(),
      })) || [];

      setMicroTasks(formattedTasks);
      return formattedTasks;
    } catch (err) {
      // Fallback to local AI assistant
      try {
        const result = await aiAssistant.processNaturalLanguage(taskDescription);

        const formattedTasks: Partial<Task>[] = [{
          id: crypto.randomUUID(),
          title: result.title,
          description: result.description,
          priority: result.priority,
          status: 'todo',
          tags: result.tags || [],
          estimatedTime: result.estimatedTime,
          createdAt: new Date().toISOString(),
        }];

        setMicroTasks(formattedTasks);
        return formattedTasks;
      } catch (fallbackErr) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Parsing failed');
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, [taskDescription]);

  // Auto-run parsing when taskDescription changes
  useEffect(() => {
    parseTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDescription]);

  return { microTasks, loading, error, refetch: parseTask };
};

export default useNaturalLanguageParser;

/**
 * Hook for parsing natural language commands
 */
export function useCommandParser() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsed, setParsed] = useState<NLPResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (input: string): Promise<NLPResult> => {
    if (!input.trim()) {
      return {
        title: input.trim(),
        description: input.trim(),
        priority: 'medium',
      };
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await aiAssistant.processNaturalLanguage(input);
      setParsed(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to parse input';
      setError(errorMsg);
      const fallback = {
        title: input.trim(),
        description: input.trim(),
        priority: 'medium' as const,
      };
      setParsed(fallback);
      return fallback;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clear = useCallback(() => {
    setParsed(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    parsed,
    error,
    parse,
    clear,
  };
}

/**
 * Hook for task breakdown suggestions
 */
export function useTaskBreakdown(taskTitle: string) {
  const [breakdown, setBreakdown] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskTitle) return;

    const getBreakdown = async () => {
      setLoading(true);
      try {
        const subtasks = await aiAssistant.breakDownTask(taskTitle);
        setBreakdown(subtasks);
      } catch (error) {
        console.error('Breakdown failed:', error);
        setBreakdown([
          'Define clear objectives',
          'Break into manageable steps',
          'Gather necessary resources',
          'Execute according to plan',
          'Review results'
        ]);
      } finally {
        setLoading(false);
      }
    };

    getBreakdown();
  }, [taskTitle]);

  return { breakdown, loading };
}