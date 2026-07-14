import { useState, useEffect, useCallback } from 'react';
import { callApi } from '@/lib/api/client';
import { Task } from '@/types';

export const useNaturalLanguageParser = (taskDescription: string) => {
  const [microTasks, setMicroTasks] = useState<Partial<Task>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseTask = useCallback(async () => {
    try {
      setLoading(true);
      const response = await callApi('/api/elephant/nlp-parse', 'POST', { task: taskDescription });

      // Transform API response to micro-tasks
      const formattedTasks: Partial<Task>[] = response.microTasks?.map((mt: any) => ({
        id: mt.id || crypto.randomUUID(),
        title: mt.title || taskDescription.slice(0, 100),
        description: mt.description || taskDescription,
        priority: mt.priority || 'medium',
        status: 'pending',
        tags: mt.tags || [],
        createdAt: new Date().toISOString(),
      })) || [];

      setMicroTasks(formattedTasks);
      return formattedTasks;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parsing failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, [taskDescription]);

  // Auto-run parsing when taskDescription changes
  useEffect(() => {
    parseTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { microTasks, loading, error, refetch: parseTask };
};

export default useNaturalLanguageParser;