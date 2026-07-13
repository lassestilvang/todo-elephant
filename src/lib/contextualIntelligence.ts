/**
 * Contextual Intelligence Layer for Todo Elephant.
 * Integrates location, weather, calendar, and energy-based scheduling.
 */

import type { Task, FocusSession } from "@/types";

interface LocationContext {
  lat: number;
  lng: number;
  label?: string;
}

interface WeatherData {
  condition: "sunny" | "rainy" | "cloudy" | "snowy" | "stormy";
  temperature: number;
  isOutdoorFriendly: boolean;
}

interface EnergyProfile {
  morning: number; // 0-1
  afternoon: number;
  evening: number;
}

/**
 * Get location-aware task suggestions.
 */
export async function getLocationBasedSuggestions(
  tasks: Task[],
  currentLocation: LocationContext
): Promise<{ task: Task; reason: string }[]> {
  // In production, this would use a location API to check task locations
  const suggestions: { task: Task; reason: string }[] = [];

  for (const task of tasks) {
    // Check if task has location context (would be stored in custom fields)
    const taskLocation = (task as any).location as LocationContext | undefined;

    if (taskLocation) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        taskLocation.lat,
        taskLocation.lng
      );

      if (distance < 1) {
        suggestions.push({ task, reason: `Very close to ${taskLocation.label || "location"}` });
      } else if (distance < 5) {
        suggestions.push({ task, reason: `Nearby (${distance.toFixed(1)}km) - good time to complete` });
      }
    }
  }

  return suggestions;
}

/**
 * Weather-based task rescheduling suggestions.
 */
export function getWeatherAdjustedTasks(
  tasks: Task[],
  weather: WeatherData
): { task: Task; suggestedChange: string }[] {
  const suggestions: { task: Task; suggestedChange: string }[] = [];

  for (const task of tasks) {
    // Check if task might be weather-dependent
    const desc = task.description?.toLowerCase() ?? "";
    const title = task.title?.toLowerCase() ?? "";

    const hasWeatherKeywords = ["outdoor", "outside", "garden", "park", "run", "walk"].some(
      k => desc.includes(k) || title.includes(k)
    );

    if (hasWeatherKeywords && !weather.isOutdoorFriendly) {
      const newDue = new Date(task.dueDate);
      newDue.setDate(newDue.getDate() + 1); // Push to tomorrow
      suggestions.push({
        task,
        suggestedChange: `Postpone to ${newDue.toLocaleDateString()} due to ${weather.condition} weather`,
      });
    }
  }

  return suggestions;
}

/**
 * Calendar sync - find gaps for new tasks.
 */
export function findCalendarGaps(
  existingTasks: Task[],
  durationMinutes: number,
  dateRange: { start: Date; end: Date }
): { start: Date; end: Date }[] {
  const gaps: { start: Date; end: Date }[] = [];

  // Simple gap detection - in production would integrate with actual calendar API
  const slots: { start: Date; end: Date }[] = [];
  const current = new Date(dateRange.start);

  while (current < dateRange.end) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

    // Check if this slot conflicts with existing tasks
    const conflicts = existingTasks.some(task => {
      if (!task.dueDate) return false;
      const taskStart = new Date(task.dueDate);
      const taskEnd = new Date(taskStart);
      taskEnd.setHours(taskEnd.getHours() + 1); // Assume 1hr

      return current < taskEnd && slotEnd > taskStart;
    });

    if (!conflicts) {
      slots.push({ start: new Date(current), end: slotEnd });
    }

    current.setMinutes(current.getMinutes() + 30);
  }

  return slots.slice(0, 5); // Return top 5 available slots
}

/**
 * Energy-based scheduling - match tasks to user energy patterns.
 */
export function getEnergyMatchedTasks(
  tasks: Task[],
  energyProfile: EnergyProfile,
  currentHour: number
): Task[] {
  // Match tasks to energy levels
  // High energy tasks (new, creative) in peak hours
  // Low energy tasks (routine, admin) in low energy hours

  let energyScore = 0.5;
  if (currentHour >= 6 && currentHour < 12) energyScore = energyProfile.morning;
  else if (currentHour >= 12 && currentHour < 18) energyScore = energyProfile.afternoon;
  else energyScore = energyProfile.evening;

  return tasks.filter(task => {
    if (energyScore > 0.7) {
      // High energy: creative, important tasks
      return task.isImportant || task.priority === "high";
    }
    if (energyScore > 0.4) {
      // Medium energy: medium priority
      return task.priority !== "low";
    }
    // Low energy: simple tasks
    return task.priority === "low" || (task.subtasks?.length ?? 0) === 0;
  });
}

// Helper to calculate distance between coordinates (in km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}