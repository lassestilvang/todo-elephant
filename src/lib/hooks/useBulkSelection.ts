"use client";

import { useState, useCallback } from "react";

/**
 * Bulk selection state + actions for tasks.
 * Tracks selected IDs, provides batch operations interface.
 */
export function useBulkSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsBulkMode(false);
  }, []);

  const isSelected = useCallback((id: number) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    selectedCount,
    isBulkMode,
    setIsBulkMode,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
  };
}