"use client";

import { useState, useEffect, useCallback } from "react";

interface ContextState {
  location: { lat: number; lon: number } | null;
  weather: "sunny" | "cloudy" | "rainy" | "snowy" | null;
  isAtGym: boolean;
  isAtWork: boolean;
  isAtHome: boolean;
}

/**
 * Context-aware features that detect:
 * - Location (via browser Geolocation API)
 * - Weather (via a lightweight weather service or simulated)
 * - Time-based context (morning, work hours, evening)
 *
 * These can trigger:
 * - Relevant task suggestions
 * - Weather-based task filtering
 * - Location-based task recommendations
 */
export function useContextAware() {
  const [context, setContext] = useState<ContextState>({
    location: null,
    weather: null,
    isAtGym: false,
    isAtWork: false,
    isAtHome: false,
  });

  // Get location on mount (with permission)
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setContext(prev => ({
          ...prev,
          location: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        }));
      },
      (err) => {
        console.log("Location access denied:", err.message);
        // Fall back to IP-based estimation if needed
      },
      { enableHighAccuracy: false, maximumAge: 30 * 60_000 } // 30 min cache
    );
  }, []);

  // Detect context based on time and location
  useEffect(() => {
    const hour = new Date().getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isEvening = hour >= 18 && hour < 23;

    // Fake weather detection (in real app, would call weather API)
    const weatherByLocation = (lat: number, lon: number): "sunny" | "cloudy" | "rainy" | "snowy" => {
      // Simplified: use longitude to pseudo-determine climate zone
      // In production, this would be a real weather API call
      const random = Math.sin(lat * lon) > 0 ? 1 : -1;
      if (random > 0.5) return "sunny";
      if (random > 0) return "cloudy";
      if (random > -0.5) return "rainy";
      return "snowy";
    };

    setContext(prev => ({
      ...prev,
      weather: prev.location ? weatherByLocation(prev.location.lat, prev.location.lon) : null,
      // Simulated location context - in real app, would use geofencing
      isAtGym: hour >= 6 && hour < 20 && Math.random() > 0.7,
      isAtWork: hour >= 9 && hour < 17 && Math.random() > 0.6,
      isAtHome: (hour < 9 || hour >= 17) && Math.random() > 0.5,
    }));

    // Update every hour
  }, [context.location]);

  const getSuggestedTasks = useCallback((allTasks: { id: number; title: string; listId?: number }[], lists: { id: number; name: string }[]) => {
    const suggestions: number[] = [];

    if (context.isAtGym) {
      // Suggest workout/health tasks
      const healthKeywords = ["workout", "exercise", "gym", "run", "fitness", "health"];
      allTasks.forEach(t => {
        if (healthKeywords.some(k => t.title.toLowerCase().includes(k))) {
          suggestions.push(t.id);
        }
      });
    }

    if (context.weather === "rainy") {
      // Suggest indoor tasks
      const indoorKeywords = ["organize", "clean", "read", "write", "admin", "indoor", "home"];
      allTasks.forEach(t => {
        if (indoorKeywords.some(k => t.title.toLowerCase().includes(k))) {
          suggestions.push(t.id);
        }
      });
    }

    return suggestions;
  }, [context]);

  const getTimeBasedTheme = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }, []);

  return {
    context,
    getSuggestedTasks,
    getTimeBasedTheme,
  };
}