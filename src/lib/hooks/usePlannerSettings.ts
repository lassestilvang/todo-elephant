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

  // Adaptive theme based on time of day
  const getTimeBasedTheme = useCallback(() => {
    const hour = new Date().getHours();
    // Morning: light, Evening: dark
    if (hour >= 6 && hour < 18) return "light";
    return "dark";
  }, []);

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

  // Apply adaptive theme when in "adaptive" mode (stored as "system" with flag)
  const applyAdaptiveTheme = useCallback(() => {
    if (typeof window === "undefined") return;
    const adaptive = localStorage.getItem("adaptive-theme") === "true";
    if (adaptive) {
      document.documentElement.setAttribute("data-theme", getTimeBasedTheme());
    }
  }, [getTimeBasedTheme]);

  // Set theme mode and optionally enable adaptive
  const setThemeModeWith = useCallback((mode: "light" | "dark" | "system" | "adaptive") => {
    if (mode === "adaptive") {
      localStorage.setItem("adaptive-theme", "true");
      localStorage.setItem("color-scheme", "adaptive");
      setThemeMode("system"); // Use system as base
      applyAdaptiveTheme();
    } else {
      localStorage.setItem("adaptive-theme", "false");
      setThemeMode(mode);
      updateTheme(mode);
    }
  }, [applyAdaptiveTheme, updateTheme, getTimeBasedTheme]);

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

  // Adaptive theme: update every hour based on time of day
  useEffect(() => {
    if (typeof window === "undefined") return;
    const adaptive = localStorage.getItem("adaptive-theme") === "true";
    if (!adaptive) return;

    const interval = setInterval(() => {
      applyAdaptiveTheme();
    }, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, [applyAdaptiveTheme]);

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
    setThemeModeWith,
    getTimeBasedTheme,
    openFocusMode,
    closeFocusMode,
  };
}
