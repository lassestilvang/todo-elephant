"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export type UndoAction = {
  id: string;
  timestamp: number;
  label: string;
  undo: () => Promise<void> | void;
  type: "create" | "update" | "delete" | "reorder" | "bulk-delete" | "bulk-update";
  expiresAt?: number;
};

const UNDO_EXPIRY_MS = 10_000; // 10 seconds for toast-based undo
const UNDO_STORAGE_KEY = "todo-elephant-undo-stack";

/**
 * Global undo stack manager that:
 * 1. Maintains a history of reversible actions
 * 2. Shows toast notifications with undo buttons
 * 3. Persists undo state to localStorage (survives refresh for ongoing actions)
 * 4. Auto-clears expired actions
 */
export function useUndoStack() {
  const [stack, setStack] = useState<UndoAction[]>(() => {
    // Restore from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(UNDO_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Persist to localStorage whenever stack changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(stack));
    }
  }, [stack]);

  // Clean up expired actions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setStack(prev => prev.filter(action =>
        action.expiresAt ? action.expiresAt > now : true
      ));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const push = useCallback((action: UndoAction) => {
    setStack(prev => {
      const newStack = [...prev, { ...action, expiresAt: Date.now() + UNDO_EXPIRY_MS }];
      return newStack;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setStack(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    setStack(prev => prev.filter(a => !a.expiresAt || a.expiresAt > now));
  }, []);

  const undoLast = useCallback(async () => {
    const lastAction = stack[stack.length - 1];
    if (!lastAction) return;

    try {
      await lastAction.undo();
      setStack(prev => prev.filter(a => a.id !== lastAction.id));
      toast.success(`Undid: ${lastAction.label}`);
    } catch (err) {
      console.error("Undo failed:", err);
      toast.error("Undo failed. Please try again.");
    }
  }, [stack]);

  const undo = useCallback(async (id: string) => {
    const action = stack.find(a => a.id === id);
    if (!action) return;

    try {
      await action.undo();
      remove(id);
      toast.success(`Undid: ${action.label}`);
    } catch (err) {
      console.error("Undo failed:", err);
      toast.error("Undo failed. Please try again.");
    }
  }, [stack, remove]);

  return {
    stack,
    push,
    remove,
    undo,
    undoLast,
    clearExpired,
    /** For displaying undo toast */
    showUndoToast: (label: string, undoFn: () => Promise<void> | void) => {
      const actionId = `undo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const action: UndoAction = {
        id: actionId,
        timestamp: Date.now(),
        label,
        undo: undoFn,
        type: "update",
      };

      push(action);

      toast.success(label, {
        action: {
          label: "Undo",
          onClick: async () => {
            await undoFn();
            remove(actionId);
            toast.success("Action undone");
          },
        },
      });
    },
  };
}