import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import { callApi } from '@/lib/api/client';

export const useAIPlanner = (tasks: Task[]) => {
  const [prioritizedTasks, setPrioritizedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planTasks = useCallback(async () => {
    if (!tasks || tasks.length === 0) {
      setPrioritizedTasks([]);
      return;
    }

    try {
      setLoading(true);

      // Call the AI prioritization API
      const response = await callApi('/api/elephant/prioritize', 'POST', { tasks });

      // Transform response to tasks with priority scores
      const prioritized: Task[] = response.prioritizedTasks?.map((pt: any, index: number) => ({
        ...pt,
        // Add AI-generated priority score for UI use
        _aiPriority: pt.priorityScore || (tasks.length - index), // Higher score = higher priority
      })) || [];

      // Fallback: client-side prioritization if API fails
      if (!response.prioritizedTasks) {
        // Simple client-side prioritization: by priority (high>medium>low) then due date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        setPrioritizedTasks([...tasks].sort((a, b) => {
          const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          if (priorityDiff !== 0) return priorityDiff;

          // If same priority, sort by due date (soonest first)
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return dateA - dateB;
        }));
      } else {
        setPrioritizedTasks(prioritized);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planning failed');
      // Fallback to client-side on error
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      setPrioritizedTasks([...tasks].sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;

        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      }));
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  // Re-run planning when tasks change significantly
  useEffect(() => {
    planTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]); // Simple dependency - could be improved with task IDs hash

  return { prioritizedTasks, loading, error, refetch: planTasks };
};

export default useAIPlanner;