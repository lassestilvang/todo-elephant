/*
 * Slack Integration for Todo Elephant
 * Allows users to connect Slack for task notifications and creation
 */

import { Task } from "@/types";

const SLACK_API_BASE = "https://slack.com/api";

interface SlackConfig {
  botToken: string;
  channelId: string;
  webhookUrl?: string;
}

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
  }>;
}

/**
 * Send a task notification to a Slack channel
 */
export async function sendTaskToSlack(
  task: Task,
  config: SlackConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const message: SlackMessage = {
      channel: config.channelId,
      text: `📋 New Task: ${task.title}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `📋 New Task Created` },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*${task.title}*\n${task.description || "No description"}` },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Priority:*\n${task.priority || "medium"}`,
            },
            {
              type: "mrkdwn",
              text: `*Due Date:*\n${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}`,
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Task" },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${task.id}`,
            },
          ],
        },
      ],
    };

    // Use webhook if available, otherwise use chat.postMessage
    if (config.webhookUrl) {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook error: ${response.status}`);
      }
    } else {
      const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.botToken}`,
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to send to Slack");
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Slack integration error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a Slack app OAuth URL for connecting
 */
export function getSlackOAuthUrl(): string {
  const scopes = [
    "chat:write",
    "channels:read",
    "groups:write",
  ].join(",");

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID || "",
    scope: scopes,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    state: crypto.randomUUID(),
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Handle Slack OAuth callback
 */
export async function handleSlackOAuthCallback(
  code: string
): Promise<{ success: boolean; config?: SlackConfig; error?: string }> {
  try {
    const response = await fetch(`${SLACK_API_BASE}/oauth.v2.access`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.error };
    }

    // Fetch the user's default channel
    const channelsResponse = await fetch(
      `${SLACK_API_BASE}/conversations.list?types=public_channel,private_channel`,
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    const channelsData = await channelsResponse.json();
    const defaultChannel = channelsData.channels?.[0]?.id;

    return {
      success: true,
      config: {
        botToken: data.access_token,
        channelId: defaultChannel || "",
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Listen for Slack slash commands to create tasks
 */
export async function handleSlackSlashCommand(
  command: string,
  text: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Parse slash command format: /todo "Task title" --priority high --due "2026-08-15"
    const titleMatch = text.match(/^["']?(.+?)["']?\s*$/);
    const priorityMatch = text.match(/--priority\s+(\w+)/);
    const dueMatch = text.match(/--due\s+(\S+)/);

    const taskData: Partial<Task> = {
      title: titleMatch?.[1] || text,
      priority: (priorityMatch?.[1] as "low" | "medium" | "high") || "medium",
      dueDate: dueMatch?.[1] ? new Date(dueMatch[1]).toISOString() : undefined,
    };

    return {
      success: true,
      message: `Task "${taskData.title}" would be created with priority "${taskData.priority}"${taskData.dueDate ? ` due on ${new Date(taskData.dueDate).toLocaleDateString()}` : ""}`,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}