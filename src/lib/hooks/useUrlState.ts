"use client";

import { useEffect } from "react";

/**
 * Sync a single state field to URL search params.
 * Reads on mount and writes whenever the value changes (debounced-free; lightweight values).
 */
export function useUrlParam<T extends string | number | null>(
  paramName: string,
  value: T,
  options?: { serialize?: (v: T) => string | null; deserialize?: (raw: string) => T | null },
): [T, (next: T) => void] {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get(paramName);
    if (current != null) {
      const deserialized = options?.deserialize ? options.deserialize(current) : (current as unknown as T);
      if (deserialized !== null && deserialized !== value) {
        // Caller should pass via initial state; this branch handles hot reload back-forward.
      }
    }
    // no-op write if value is null/missing
    if (value == null || value === "") {
      params.delete(paramName);
    } else {
      const serialized = options?.serialize ? options.serialize(value) : (value as unknown as string);
      if (serialized != null) params.set(paramName, serialized);
      else params.delete(paramName);
    }
    const next = params.toString();
    const target = `${window.location.pathname}${next ? `?${next}` : ""}`;
    if (window.location.search !== (next ? `?${next}` : "")) {
      window.history.replaceState(null, "", target);
    }
  }, [paramName, value, options]);

  // Return tuple shim; identity stability is good enough because this is used
  // at the page level (one consumer, one field).
  return [value, () => undefined];
}

/**
 * Read a single URL param on mount, then return its decoded value.
 */
export function readUrlParam<T extends string | number | null>(
  paramName: string,
  deserialize: (raw: string) => T | null,
): T | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(paramName);
  if (raw == null) return null;
  return deserialize(raw);
}

/**
 * Build a stable reader for several URL params at once.
 */
export function useInitialUrlState(): {
  selectedListId: number | null;
  selectedLabelId: number | null;
  selectedFilterId: number | null;
  view: "dashboard" | "kanban" | "list" | "eisenhower" | "calendar" | null;
} {
  if (typeof window === "undefined") {
    return { selectedListId: null, selectedLabelId: null, selectedFilterId: null, view: null };
  }
  const p = new URLSearchParams(window.location.search);
  const num = (k: string) => {
    const v = p.get(k);
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const viewRaw = p.get("view");
  const view: "dashboard" | "kanban" | "list" | "eisenhower" | "calendar" | null =
    viewRaw === "dashboard" || viewRaw === "kanban" || viewRaw === "list" || viewRaw === "eisenhower" || viewRaw === "calendar"
      ? viewRaw
      : null;
  return {
    selectedListId: num("list"),
    selectedLabelId: num("label"),
    selectedFilterId: num("filter"),
    view,
  };
}

/**
 * Push current state into URL (call from page or list/label selection handlers).
 */
export function writeUrlState(state: {
  list?: number | null;
  label?: number | null;
  filter?: number | null;
  view?: string | null;
  scope?: string | null;
}) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  const setOrDelete = (k: string, v: number | string | null | undefined) => {
    if (v == null || v === "") p.delete(k);
    else p.set(k, String(v));
  };
  setOrDelete("list", state.list);
  setOrDelete("label", state.label);
  setOrDelete("filter", state.filter);
  setOrDelete("view", state.view);
  setOrDelete("scope", state.scope);
  const next = p.toString();
  const target = `${window.location.pathname}${next ? `?${next}` : ""}`;
  window.history.replaceState(null, "", target);
}
