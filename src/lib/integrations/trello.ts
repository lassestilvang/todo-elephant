/*
 * Trello Integration for Todo Elephant
 * Allows users to sync tasks between Trello boards and Todo Elephant
 */

import { Task } from "@/types";

const TRELLO_API_BASE = "https://api.trello.com/1";

interface TrelloConfig {
  apiKey: string;
  token: string;
  defaultBoardId?: string;
  defaultListId?: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  labels: Array<{ id: string; name: string; color: string }>;
  idList: string;
  idLabels: string;
  pos: number;
}

/**
 * Convert a Todo Elephant task to a Trello card
 */
export async function taskToTrelloCard(
  task: Task,
  config: TrelloConfig
): Promise<TrelloCard | null> {
  try {
    const params = new URLSearchParams({
      key: config.apiKey,
      token: config.token,
      idList: config.defaultListId || "",
      name: task.title,
      desc: task.description || "",
      due: task.dueDate || "",
      idLabels: task.labels ? task.labels.join(",") : "",
      pos: "top",
    });

    const response = await fetch(
      `${TRELLO_API_BASE}/cards?${params.toString()}`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }

    const data = await response.json();
    return data as TrelloCard;
  } catch (error) {
    console.error("Error creating Trello card:", error);
    return null;
  }
}

/**
 * Convert a Trello card to a Todo Elephant task
 */
export function trelloCardToTask(card: TrelloCard): Partial<Task> {
  return {
    title: card.name || "",
    description: card.desc || "",
    dueDate: card.due ? new Date(card.due).toISOString() : undefined,
    priority: card.labels?.some((l) => l.color === "red") ? "high" :
              card.labels?.some((l) => l.color === "yellow") ? "medium" : "low",
    // In a full implementation, labels/list mapping would be handled via configuration
  };
}

/**
 * Get Trello boards for the authenticated user
 */
export async function getUserBoards(config: TrelloConfig): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      key: config.apiKey,
      token: config.token,
    });

    const response = await fetch(
      `${TRELLO_API_BASE}/members/me/boards?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Trello boards");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Trello boards:", error);
    return [];
  }
}

/**
 * Get lists in a specific Trello board
 */
export async function getBoardLists(boardId: string, config: TrelloConfig): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      key: config.apiKey,
      token: config.token,
      fields: "name,id",
    });

    const response = await fetch(
      `${TRELLO_API_BASE}/boards/${boardId}/lists?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Trello board lists");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Trello lists:", error);
    return [];
  }
}

/**
 * Sync all tasks to Trello
 */
export async function syncTasksToTrello(
  tasks: Task[],
  config: TrelloConfig
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    let count = 0;

    for (const task of tasks) {
      // Only sync tasks that aren't templates
      if (task.isTemplate) continue;

      const card = await taskToTrelloCard(task, config);
      if (card) count++;
    }

    return { success: true, count };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Trello OAuth flow URL
 */
export function getTrelloOAuthUrl(): string {
  const params = new URLSearchParams({
    key: process.env.TRELLO_API_KEY || "",
    response_type: "token,write",
    scope: "read,write",
  });

  return `https://trello.com/1/authorize?${params.toString()}`;
}