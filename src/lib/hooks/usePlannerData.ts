"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Task, List, Label, ActivityLog, SavedFilter, ShortcutConfig, FocusSession } from "@/types";

/**
 * Data-fetching owner: tasks, lists, labels, activity logs, saved filters,
 * shortcut configs. Centralized here so the consumers don't have to know
 * which endpoint each collection lives on.
 */
export function usePlannerData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [shortcutConfigs, setShortcutConfigs] = useState<ShortcutConfig[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [tRes, lRes, tagRes, logRes, filterRes, shortcutRes, fsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/lists"),
        fetch("/api/labels"),
        fetch("/api/activity-logs"),
        fetch("/api/filters"),
        fetch("/api/shortcuts"),
        fetch("/api/focus-sessions"),
      ]);
      const [tData, lData, tagData, logData, filterData, shortcutData, fsData] = await Promise.all([
        tRes.ok ? (tRes.json() as Promise<Task[]>) : Promise.resolve([]),
        lRes.ok ? (lRes.json() as Promise<List[]>) : Promise.resolve([]),
        tagRes.ok ? (tagRes.json() as Promise<Label[]>) : Promise.resolve([]),
        logRes.ok ? (logRes.json() as Promise<ActivityLog[]>) : Promise.resolve([]),
        filterRes.ok ? (filterRes.json() as Promise<SavedFilter[]>) : Promise.resolve([]),
        shortcutRes.ok ? (shortRes2Json(shortcutRes) as Promise<ShortcutConfig[]>) : Promise.resolve([]),
        fsRes.ok ? (fsRes.json() as Promise<FocusSession[]>) : Promise.resolve([]),
      ]);

      setTasks(tData);
      setLists(lData);
      setLabels(tagData);
      setActivityLogs(logData);
      setSavedFilters(filterData);
      setShortcutConfigs(shortcutData);
      setFocusSessions(fsData);
    } catch (err) {
      console.error("Data refresh error:", err);
      toast.error("Failed to refresh planner data");
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      const logRes = await fetch("/api/activity-logs");
      if (logRes.ok) {
        const logData = (await logRes.json()) as ActivityLog[];
        setActivityLogs(logData);
      }
    } catch (err) {
      console.error("Log refresh error:", err);
    }
  }, []);

  // Fetch initial data in parallel
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        await refreshData();
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, [refreshData]);

  const clearLogs = useCallback(async () => {
    if (!window.confirm("Are you sure you want to clear the activity trail?")) return;
    try {
      const res = await fetch("/api/activity-logs", { method: "DELETE" });
      if (res.ok) {
        const data = (await res.json()) as { activityLogs: ActivityLog[] };
        setActivityLogs(data.activityLogs || []);
        toast.success("Activity trail cleared!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear activity trail");
    }
  }, []);

  // Folders
  const createList = useCallback(
    async (name: string, color: string) => {
      try {
        const res = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color }),
        });
        if (res.ok) {
          const newList = (await res.json()) as List;
          setLists((prev) => [...prev, newList]);
          toast.success(`Created Folder "${newList.name}"`);
          refreshLogs();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to create folder category");
      }
    },
    [refreshLogs],
  );

  // Labels
  const createLabel = useCallback(
    async (name: string, color: string) => {
      try {
        const res = await fetch("/api/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color }),
        });
        if (res.ok) {
          const newLabel = (await res.json()) as Label;
          setLabels((prev) => [...prev, newLabel]);
          toast.success(`Added Label "${newLabel.name}"`);
          refreshLogs();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to create label");
      }
    },
    [refreshLogs],
  );

  const saveFilter = useCallback(
    async (name: string, filterConfig: Omit<SavedFilter, "id">) => {
      try {
        const res = await fetch("/api/filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filterConfig),
        });
        if (res.ok) {
          const newFilter = (await res.json()) as SavedFilter;
          setSavedFilters((prev) => [...prev, newFilter]);
          toast.success(`Filter "${newFilter.name}" saved!`);
          refreshLogs();
          return newFilter;
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to save filter");
      }
    },
    [refreshLogs],
  );

  const deleteFilter = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/filters/${id}`, { method: "DELETE" });
        if (res.ok) {
          setSavedFilters((prev) => prev.filter((f) => f.id !== id));
          toast.success("Filter deleted");
          refreshLogs();
          return id;
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete filter");
      }
    },
    [refreshLogs],
  );

  return {
    tasks,
    setTasks,
    lists,
    labels,
    activityLogs,
    setActivityLogs,
    savedFilters,
    shortcutConfigs,
    focusSessions,
    loading,
    refreshData,
    refreshLogs,
    clearLogs,
    createList,
    createLabel,
    saveFilter,
    deleteFilter,
  };
}

async function shortRes2Json(res: Response) {
  return (await res.json()) as ShortcutConfig[];
}
