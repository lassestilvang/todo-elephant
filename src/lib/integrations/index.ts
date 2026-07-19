/*
 * Integrations Index - Export all external integration modules
 */

export {
  taskToSlack,
  getSlackOAuthUrl,
  handleSlackOAuthCallback,
  handleSlackSlashCommand,
  type SlackConfig,
  type SlackMessage,
} from "./slack";

export {
  taskToTrelloCard,
  trelloCardToTask,
  getUserBoards,
  getBoardLists,
  syncTasksToTrello,
  getTrelloOAuthUrl,
  type TrelloConfig,
  type TrelloCard,
} from "./trello";

export {
  taskToNotionPage,
  getNotionDatabasePages,
  updateNotionPage,
  getNotionOAuthUrl,
  handleNotionOAuthCallback,
  queryNotionDatabase,
  type NotionConfig,
  type NotionPage,
} from "./notion";

// Re-export calendar integrations
export { CalendarSyncConfig } from "./integrations";

// Export type definitions
export type { Task } from "@/types";