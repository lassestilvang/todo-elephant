/*
 * Notion Integration for Todo Elephant
 * Allows users to sync tasks with Notion databases
 */

import { Task } from "@/types";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

interface NotionConfig {
  apiKey: string;
  databaseId?: string;
  syncEnabled: boolean;
}

interface NotionPage {
  id: string;
  properties: {
    title: { title: Array<{ plain_text: string }> };
    description?: { rich_text: Array<{ plain_text: string }> };
    due_date?: { date: { start: string } | null };
    priority?: { select: { name: string } | null };
    status?: { select: { name: string } | null };
    priority_color?: { formula: { string: string } };
  };
}

/**
 * Create a Notion page from a Todo Elephant task
 */
export async function taskToNotionPage(
  task: Task,
  config: NotionConfig
): Promise<NotionPage | null> {
  try {
    if (!config.databaseId) {
      throw new Error("Database ID not configured");
    }

    const response = await fetch(`${NOTION_API_BASE}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: config.databaseId },
        properties: {
          title: {
            title: [{ text: { content: task.title } }],
          },
          description: task.description
            ? { rich_text: [{ text: { content: task.description } }] }
            : undefined,
          due_date: task.dueDate ? { date: { start: task.dueDate } } : undefined,
          priority: task.priority
            ? { select: { name: task.priority.charAt(0).toUpperCase() + task.priority.slice(1) } }
            : undefined,
          status: { select: { name: task.status } },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create Notion page");
    }

    const data = await response.json();
    return data as NotionPage;
  } catch (error) {
    console.error("Error creating Notion page:", error);
    return null;
  }
}

/**
 * Get all pages from a Notion database
 */
export async function getNotionDatabasePages(
  databaseId: string,
  config: NotionConfig,
  pageSize = 100
): Promise<NotionPage[]> {
  try {
    const response = await fetch(
      `${NOTION_API_BASE}/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: pageSize }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Notion database pages");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching Notion pages:", error);
    return [];
  }
}

/**
 * Update an existing Notion page
 */
export async function updateNotionPage(
  pageId: string,
  updates: Partial<{
    title: string;
    description: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    status: string;
  }>,
  config: NotionConfig
): Promise<boolean> {
  try {
    const properties: Record<string, any> = {};

    if (updates.title) {
      properties.title = { title: [{ text: { content: updates.title } }] };
    }

    if (updates.description) {
      properties.description = { rich_text: [{ text: { content: updates.description } }] };
    }

    if (updates.dueDate) {
      properties.due_date = { date: { start: updates.dueDate } };
    }

    if (updates.priority) {
      properties.priority = { select: { name: updates.priority.toUpperCase() } };
    }

    if (updates.status) {
      properties.status = { select: { name: updates.status } };
    }

    const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error updating Notion page:", error);
    return false;
  }
}

/**
 * Notion OAuth flow URL
 */
export function getNotionOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID || "",
    response_type: "code",
    owner: "user",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`,
    scope: "pages:write pages:read databases:read databases:write",
  });

  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

/**
 * Handle Notion OAuth callback
 */
export async function handleNotionOAuthCallback(
  code: string
): Promise<{ success: boolean; auth?: { access_token: string; bot_id: string }; error?: string }> {
  try {
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "OAuth failed" };
    }

    return {
      success: true,
      auth: {
        access_token: data.access_token,
        bot_id: data.bot_id,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Query Notion database with filters
 */
export async function queryNotionDatabase(
  databaseId: string,
  config: NotionConfig,
  filter?: {
    property: string;
    filter: any;
  }
): Promise<NotionPage[]> {
  try {
    const queryBody: any = { page_size: 100 };

    if (filter) {
      queryBody.filter = filter;
    }

    const response = await fetch(
      `${NOTION_API_BASE}/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryBody),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to query Notion database");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error querying Notion database:", error);
    return [];
  }
}