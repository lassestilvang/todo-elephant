/**
 * Time estimation engine that learns from completed Pomodoro sessions.
 *
 * Strategy:
 * 1. Group tasks by keywords in title/description
 * 2. Calculate average time per task type
 * 3. Use exponential smoothing to weight recent sessions more heavily
 * 4. Provide confidence intervals (variance)
 *
 * Returns estimated time in minutes for a given task, or null if no data.
 */

import type { Task } from "@/types";

interface TimeEstimate {
  minutes: number;
  confidence: number; // 0-1 scale
  basedOnCount: number; // number of similar tasks used
}

// In-memory cache for learned estimates
const estimateCache = new Map<string, { estimate: TimeEstimate; timestamp: number }>();
const CACHE_TTL = 5 * 60_000; // 5 minutes

interface SimpleSession {
  taskId: number;
  durationSeconds: number;
  completedEarly: boolean;
  startedAt: string;
}

/**
 * Extract keywords from a task for similarity matching.
 * Uses simple word stems and removes stop words.
 */
function extractKeywords(title: string, description?: string): string[] {
  const stopWords = new Set(["the", "a", "an", "to", "of", "in", "on", "for", "and", "or", "but", "with", "is", "it", "this", "that"]);
  const normalize = (word: string) => word.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12);

  const words = `${title} ${description || ""}`.split(/\s+/).map(normalize).filter(w => w.length > 2 && !stopWords.has(w));
  return [...new Set(words)]; // Unique
}

/**
 * Calculate cosine similarity between two sets of keywords.
 */
function keywordSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = a.filter(k => setB.has(k)).length;
  if (intersection === 0) return 0;

  // Simple Jaccard similarity
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

/**
 * Calculate time estimate for a task based on historical Pomodoro data.
 */
export function calculateTimeEstimate(
  task: Task,
  sessions: SimpleSession[],
  allTasks: Task[],
  cacheKey?: string
): TimeEstimate | null {
  const now = Date.now();

  // Check cache
  if (cacheKey) {
    const cached = estimateCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.estimate;
    }
  }

  // Find completed sessions for this task
  const taskSessions = sessions.filter(s => s.taskId === task.id && !s.completedEarly);
  const taskTotal = taskSessions.reduce((sum, s) => sum + s.durationSeconds, 0);

  // Get keywords for similarity matching
  const taskKeywords = extractKeywords(task.title, task.description);

  // Find similar tasks (by keyword similarity)
  const similarTasks = allTasks.filter(t => {
    if (t.status !== "completed" && t.status !== "done") return false;
    if (t.id === task.id) return false;
    const otherKeywords = extractKeywords(t.title, t.description);
    return keywordSimilarity(taskKeywords, otherKeywords) > 0.2;
  });

  // Combine sessions from similar tasks
  const similarSessions = similarTasks.flatMap(t =>
    sessions.filter(s => s.taskId === t.id && !s.completedEarly)
  );

  const allRelevantSessions = [...taskSessions, ...similarSessions];

  if (allRelevantSessions.length === 0) {
    return null;
  }

  // Calculate weighted average (recency weighted)
  const totalWeight = allRelevantSessions.reduce((sum, s) => sum + 1, 0);
  const weightedSum = allRelevantSessions.reduce((sum, s, idx) => {
    // Exponential decay - later sessions (higher index) get slightly more weight
    const recencyFactor = 1 + (idx / allRelevantSessions.length) * 0.3;
    return sum + (s.durationSeconds * recencyFactor);
  }, 0);

  const avgSeconds = weightedSum / totalWeight;
  const minutes = Math.round(avgSeconds / 60);

  // Calculate variance for confidence
  const variance = allRelevantSessions.reduce((sum, s) => {
    const diff = s.durationSeconds - avgSeconds;
    return sum + diff * diff;
  }, 0) / allRelevantSessions.length;

  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgSeconds;

  // Confidence decreases with high variance
  const confidence = Math.max(0.1, 1 - coefficientOfVariation);

  const estimate: TimeEstimate = {
    minutes,
    confidence,
    basedOnCount: allRelevantSessions.length
  };

  // Cache the result
  if (cacheKey) {
    estimateCache.set(cacheKey, { estimate, timestamp: now });
  }

  return estimate;
}

/**
 * Format time estimate for display.
 */
export function formatTimeEstimate(estimate: TimeEstimate | null): string {
  if (!estimate) return "—";

  const confidence = estimate.confidence;
  if (confidence < 0.3) {
    return "⏱️ ?? min";
  }

  const variance = estimate.confidence < 0.7 ? "±20%" : "";
  return `⏱️ ~${estimate.minutes}${variance} min`;
}