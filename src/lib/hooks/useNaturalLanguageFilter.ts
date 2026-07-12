"use client";

import { useCallback } from "react";

interface NLPFilterResult {
  query: string;
  statusFilter: "all" | "active" | "completed" | "archived";
  priorityFilter: "all" | "high" | "medium" | "low";
  dueDateFilter: "all" | "today" | "week" | "overdue";
}

/**
 * Natural Language Filter Parser for searching and filtering tasks.
 * Parses human queries like "high priority this week" or "completed last month".
 */
export function useNaturalLanguageFilter() {
  const parseQuery = useCallback((input: string): NLPFilterResult => {
    const text = input.toLowerCase().trim();

    let query = "";
    let statusFilter: NLPFilterResult["statusFilter"] = "all";
    let priorityFilter: NLPFilterResult["priorityFilter"] = "all";
    let dueDateFilter: NLPFilterResult["dueDateFilter"] = "all";

    // Extract search query (strip out filter keywords)
    let cleanedQuery = text;

    // Priority keywords
    if (text.includes("high priority") || text.includes("urgent")) {
      priorityFilter = "high";
      cleanedQuery = cleanedQuery.replace(/(high priority|urgent)/g, "").trim();
    } else if (text.includes("medium priority")) {
      priorityFilter = "medium";
      cleanedQuery = cleanedQuery.replace(/medium priority/g, "").trim();
    } else if (text.includes("low priority")) {
      priorityFilter = "low";
      cleanedQuery = cleanedQuery.replace(/low priority/g, "").trim();
    }

    // Status keywords
    if (text.includes("completed") || text.includes("done")) {
      statusFilter = "completed";
      cleanedQuery = cleanedQuery.replace(/(completed|done)/g, "").trim();
    } else if (text.includes("active") || text.includes("in progress") || text.includes("todo")) {
      statusFilter = "active";
      cleanedQuery = cleanedQuery.replace(/(active|in progress|todo)/g, "").trim();
    } else if (text.includes("archived")) {
      statusFilter = "archived";
      cleanedQuery = cleanedQuery.replace(/archived/g, "").trim();
    }

    // Due date keywords
    if (text.includes("today")) {
      dueDateFilter = "today";
      cleanedQuery = cleanedQuery.replace(/today/g, "").trim();
    } else if (text.includes("this week") || text.includes("week")) {
      dueDateFilter = "week";
      cleanedQuery = cleanedQuery.replace(/(this week|week)/g, "").trim();
    } else if (text.includes("overdue") || text.includes("past due")) {
      dueDateFilter = "overdue";
      cleanedQuery = cleanedQuery.replace(/(overdue|past due)/g, "").trim();
    } else if (text.includes("tomorrow")) {
      // Tomorrow falls under today filter logic but we can be specific
      cleanedQuery = cleanedQuery.replace(/tomorrow/g, "").trim();
    }

    // Date patterns like "from June" or "in July"
    const monthMatch = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/);
    if (monthMatch) {
      cleanedQuery = cleanedQuery.replace(monthMatch[0], "").trim();
    }

    query = cleanedQuery;

    return { query, statusFilter, priorityFilter, dueDateFilter };
  }, []);

  return { parseQuery };
}