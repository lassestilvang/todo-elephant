"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Cross-cutting planner settings: theme, accent color, sound, sidebar drawer,
 * settings modal, focus mode open/close, zen mode. Pulled out of
 * useTaskPlanner so each concern has a single owner.
 */
export function usePlannerSettings() {
  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accent-color") || "#3b82f6";
    }
    return "#3b82f6";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<number | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sound-enabled");
      return saved !== "false";
    }
    return true;
  });
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");

  const updateTheme = useCallback((mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    if (mode === "system") {
      localStorage.removeItem("color-scheme");
      if (typeof window !== "undefined") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      }
    } else {
      localStorage.setItem("color-scheme", mode);
      document.documentElement.setAttribute("data-theme", mode);
    }
  }, []);

  // Sync state and attribute on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("color-scheme") as "light" | "dark" | "system" | null;
    const mode = saved || "system";
    setThemeMode(mode);
    if (mode === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", mode);
    }
  }, []);

  // Listen for system theme changes if in system mode
  useEffect(() => {
    if (themeMode !== "system") return;
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      document.documentElement.setAttribute("data-theme", mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // Persist soundEnabled
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sound-enabled", String(soundEnabled));
  }, [soundEnabled]);

  // Persist accentColor
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accent-color", accentColor);
  }, [accentColor]);

  const openFocusMode = useCallback((id: number) => {
    setFocusTaskId(id);
    setIsFocusModeOpen(true);
  }, []);

  const closeFocusMode = useCallback(() => {
    setIsFocusModeOpen(false);
    setFocusTaskId(null);
  }, []);

  return {
    accentColor,
    setAccentColor,
    isSettingsOpen,
    setIsSettingsOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    isFocusModeOpen,
    setIsFocusModeOpen,
    focusTaskId,
    setFocusTaskId,
    isZenMode,
    setIsZenMode,
    soundEnabled,
    setSoundEnabled,
    themeMode,
    setThemeMode,
    updateTheme,
    openFocusMode,
    closeFocusMode,
  };
}
