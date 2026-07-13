"use client";

import { useCallback, useRef, useEffect } from "react";

interface VimNavigationOptions {
  taskIds: number[];
  onTaskSelect: (taskId: number) => void;
  onTaskComplete: (taskId: number) => void;
  onTaskDelete: (taskId: number) => void;
  onTaskNextStatus: (taskId: number) => void;
}

/**
 * Vim-style keyboard navigation for task lists.
 * h/j/k/l - navigate, x - complete, d - delete, o - open, n - next status
 */
export function useVimNavigation({
  taskIds,
  onTaskSelect,
  onTaskComplete,
  onTaskDelete,
  onTaskNextStatus,
}: VimNavigationOptions) {
  const currentIndexRef = useRef(0);

  const handleKey = useCallback((e: KeyboardEvent) => {
    // Only handle when not in input
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const currentIndex = currentIndexRef.current;
    const taskIdsList = taskIds;

    if (e.key === "j" || e.key === "J") {
      // Move down
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, taskIdsList.length - 1);
      currentIndexRef.current = nextIndex;
      onTaskSelect(taskIdsList[nextIndex]);
    } else if (e.key === "k" || e.key === "K") {
      // Move up
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      currentIndexRef.current = prevIndex;
      onTaskSelect(taskIdsList[prevIndex]);
    } else if (e.key === "x" || e.key === "X") {
      // Complete current task
      e.preventDefault();
      if (taskIdsList[currentIndex] !== undefined) {
        onTaskComplete(taskIdsList[currentIndex]);
      }
    } else if (e.key === "d" || e.key === "D") {
      // Delete current task
      e.preventDefault();
      if (confirm("Delete this task?")) {
        if (taskIdsList[currentIndex] !== undefined) {
          onTaskDelete(taskIdsList[currentIndex]);
        }
      }
    } else if (e.key === "n" || e.key === "N") {
      // Next status
      e.preventDefault();
      if (taskIdsList[currentIndex] !== undefined) {
        onTaskNextStatus(taskIdsList[currentIndex]);
      }
    } else if (e.key === "gg") {
      // Go to top
      e.preventDefault();
      currentIndexRef.current = 0;
      onTaskSelect(taskIdsList[0]);
    } else if (e.key === "G") {
      // Go to bottom
      e.preventDefault();
      const lastIndex = taskIdsList.length - 1;
      currentIndexRef.current = lastIndex;
      onTaskSelect(taskIdsList[lastIndex]);
    }
  }, [taskIds, onTaskSelect, onTaskComplete, onTaskDelete, onTaskNextStatus]);

  // Register keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Reset index when task list changes
  useEffect(() => {
    currentIndexRef.current = 0;
  }, [taskIds]);

  return {
    currentIndex: currentIndexRef.current,
    focusIndex: (index: number) => {
      currentIndexRef.current = Math.max(0, Math.min(index, taskIds.length - 1));
    },
  };
}