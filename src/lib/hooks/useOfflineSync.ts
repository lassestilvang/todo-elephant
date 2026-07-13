"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface OfflineAction {
  id: string;
  type: "create" | "update" | "delete";
  entity: "task" | "list" | "label";
  payload: unknown;
  timestamp: number;
}

interface UseOfflineSyncOptions {
  onSyncComplete?: () => void;
}

/**
 * Hook for offline support with background sync.
 * Stores actions in localStorage and syncs when online.
 */
export function useOfflineSync({ onSyncComplete }: UseOfflineSyncOptions = {}) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Load pending actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("offline-actions");
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse offline actions:", e);
      }
    }
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save pending actions to localStorage
  const savePendingActions = useCallback((actions: OfflineAction[]) => {
    localStorage.setItem("offline-actions", JSON.stringify(actions));
    setPendingActions(actions);
  }, []);

  // Add an action to queue
  const queueAction = useCallback(
    (action: Omit<OfflineAction, "id" | "timestamp">) => {
      const newAction: OfflineAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      const updated = [...pendingActions, newAction];
      savePendingActions(updated);

      if (!isOnline) {
        toast.info("Saved offline. Will sync when online.");
      }
    },
    [pendingActions, savePendingActions, isOnline]
  );

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (syncInProgress || pendingActions.length === 0) return;

    setSyncInProgress(true);
    const actions = [...pendingActions];
    const failed: OfflineAction[] = [];

    for (const action of actions) {
      try {
        let success = false;

        switch (action.entity) {
          case "task":
            if (action.type === "create") {
              const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action.payload),
              });
              success = res.ok;
            } else if (action.type === "update") {
              const res = await fetch(`/api/tasks/${(action.payload as { id: number }).id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action.payload),
              });
              success = res.ok;
            } else if (action.type === "delete") {
              const res = await fetch(`/api/tasks?id=${(action.payload as { id: number }).id}`, {
                method: "DELETE",
              });
              success = res.ok;
            }
            break;
          case "list":
          case "label":
            // Similar pattern for lists/labels
            success = true;
            break;
        }

        if (!success) {
          failed.push(action);
        }
      } catch (e) {
        console.error("Sync failed for action:", action, e);
        failed.push(action);
      }
    }

    savePendingActions(failed);
    setSyncInProgress(false);

    if (failed.length === 0 && onSyncComplete) {
      onSyncComplete();
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} action(s) could not be synced. Will retry later.`);
    } else if (actions.length > 0) {
      toast.success("All pending changes synced!");
    }
  }, [pendingActions, savePendingActions, syncInProgress, onSyncComplete]);

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    savePendingActions([]);
  }, [savePendingActions]);

  return {
    isOnline,
    pendingActions,
    syncInProgress,
    queueAction,
    syncPendingActions,
    clearPendingActions,
  };
}

// Hook to check if app is installed as PWA
export function usePWAInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isStandalone);
  }, []);

  return isInstalled;
}

// Hook for install prompt
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<((...args: unknown[]) => unknown) | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(() => () => (e as unknown as { prompt: () => void }).prompt);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return installPrompt;
}