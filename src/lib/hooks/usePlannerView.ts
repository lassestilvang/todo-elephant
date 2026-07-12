"use client";

import { useState, useCallback } from "react";
import { SavedFilter } from "@/types";

export type ViewName = "dashboard" | "kanban" | "list" | "eisenhower" | "calendar" | "stats";

/**
 * View + sidebar-selection state. Includes the transitionView wrapper that
 * uses the View Transitions API where available.
 */
export function usePlannerView() {
  const [currentView, setView] = useState<ViewName>("dashboard");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<SavedFilter | null>(null);
  const [dueDateScope, setDueDateScope] = useState<null | "today" | "week" | "overdue">(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const transitionView = useCallback((v: ViewName) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setView(v);
      });
    } else {
      setView(v);
    }
  }, []);

  return {
    currentView,
    setView,
    transitionView,
    selectedListId,
    setSelectedListId,
    selectedLabelId,
    setSelectedLabelId,
    selectedFilter,
    setSelectedFilter,
    dueDateScope,
    setDueDateScope,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
  };
}
