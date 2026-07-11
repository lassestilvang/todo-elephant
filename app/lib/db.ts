import fs from "fs";
import path from "path";
import {
  Task,
  List,
  Label,
  ActivityLog,
  User,
  SavedFilter,
  ShortcutConfig,
  FocusSession,
} from "@/types";
import { normalizeStatus } from "@/src/lib/status";

export interface DBStructure {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  activityLogs: ActivityLog[];
  users: User[];
  savedFilters: SavedFilter[];
  shortcutConfigs: ShortcutConfig[];
  focusSessions: FocusSession[];
  currentUser: User | null;
}

const DB_FILE = path.join(process.cwd(), "db.json");

// In-process serialization queue (mutex) — protects concurrent reads/writes inside one Node process.
let queueTail: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = queueTail.then(fn, fn);
  queueTail = next.catch(() => undefined);
  return next;
}

interface CacheEntry {
  data: DBStructure;
  mtimeMs: number;
}
let cache: CacheEntry | null = null;

// Seed used when db.json doesn't exist on first read.
const seedDBData: DBStructure = {
  tasks: [
    {
      id: 1,
      title: "🐘 Welcome to Todo Elephant",
      description: "This is your premium task planner. Try keyboard `n` to add a task, `⌘K` for the command palette, `1/2/3/4` to switch views.",
      dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      priority: "high",
      status: "in_progress",
      subtasks: [
        { id: 101, title: "Try toggling a subtask", completed: true },
        { id: 102, title: "Switch to Kanban board view", completed: false },
        { id: 103, title: "Open the Command Palette with Ctrl+K / Cmd+K", completed: false },
      ],
      listId: 1,
      labels: [1, 3],
      completedPomodoros: 0,
      parentRecurrenceId: null,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "💅 Customise your accent color",
      description: "Open settings and pick your favourite accent. Glass panels update instantly.",
      dueDate: new Date().toISOString(),
      priority: "medium",
      status: "todo",
      subtasks: [],
      listId: 2,
      labels: [4],
      completedPomodoros: 0,
      parentRecurrenceId: null,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "🏃‍♂️ Morning 5km run",
      description: "Keep the body healthy. Target pace: 5:15 min/km.",
      dueDate: new Date(Date.now() - 86_400_000).toISOString(),
      priority: "low",
      status: "completed",
      subtasks: [],
      listId: 3,
      labels: [],
      completedPomodoros: 1,
      parentRecurrenceId: null,
      archivedAt: null,
      createdAt: new Date(Date.now() - 172_800_000).toISOString(),
      updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
      completedAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ],
  lists: [
    { id: 1, name: "📥 Inbox", description: "Quick capture tasks and items", color: "#3b82f6", createdAt: new Date().toISOString() },
    { id: 2, name: "💼 Work", description: "Professional projects and duties", color: "#ec4899", createdAt: new Date().toISOString() },
    { id: 3, name: "🧘‍♂️ Personal", description: "Health, fitness, and lifestyle", color: "#10b981", createdAt: new Date().toISOString() },
  ],
  labels: [
    { id: 1, name: "Feature", color: "#3b82f6" },
    { id: 2, name: "Refactor", color: "#8b5cf6" },
    { id: 3, name: "Urgent", color: "#ef4444" },
    { id: 4, name: "Design", color: "#ec4899" },
    { id: 5, name: "Documentation", color: "#10b981" },
  ],
  activityLogs: [
    {
      id: 1,
      action: "Initialize Database",
      entityType: "system",
      entityId: 0,
      details: "Todo Elephant database setup complete with premium seed records.",
      createdAt: new Date().toISOString(),
    },
  ],
  users: [{ id: 1, name: "Lasse Stilvang", email: "lasse.stilvang@gmail.com", createdAt: new Date().toISOString() }],
  savedFilters: [],
  shortcutConfigs: [],
  focusSessions: [],
  currentUser: { id: 1, name: "Lasse Stilvang", email: "lasse.stilvang@gmail.com", createdAt: new Date().toISOString() },
};

/** Read DB from disk; uses mtime to validate the in-memory cache. */
function readFromDisk(): DBStructure {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedDBData, null, 2), "utf-8");
    cache = { data: seedDBData, mtimeMs: fs.statSync(DB_FILE).mtimeMs };
    return seedDBData;
  }
  try {
    const stat = fs.statSync(DB_FILE);
    if (cache && cache.mtimeMs === stat.mtimeMs) return cache.data;
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DBStructure>;
    const migrated = migrateLegacy(parsed);
    cache = { data: migrated, mtimeMs: stat.mtimeMs };
    return migrated;
  } catch (err) {
    console.error("readFromDisk failed; returning seed defaults:", err);
    return seedDBData;
  }
}

/**
 * One-time migration to normalize status across tasks and fill any missing collections.
 * Idempotent — safe to run on every cache miss.
 */
function migrateLegacy(input: Partial<DBStructure>): DBStructure {
  const tasks = (input.tasks ?? []).map((t) => ({
    ...t,
    status: normalizeStatus(t.status as string),
  }));
  return {
    tasks,
    lists: input.lists ?? [],
    labels: input.labels ?? [],
    activityLogs: input.activityLogs ?? [],
    users: input.users ?? [],
    savedFilters: input.savedFilters ?? [],
    shortcutConfigs: input.shortcutConfigs ?? [],
    focusSessions: input.focusSessions ?? [],
    currentUser: input.currentUser ?? null,
  };
}

/** Atomic write: write to a temp file then rename. */
function atomicWriteToDisk(data: DBStructure): void {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, DB_FILE);
  cache = { data, mtimeMs: fs.statSync(DB_FILE).mtimeMs };
}

export async function readDB(): Promise<DBStructure> {
  return withLock(() => readFromDisk());
}

export async function writeDB(data: DBStructure): Promise<void> {
  await withLock(() => {
    atomicWriteToDisk(data);
  });
}

export async function mutateDB<T>(fn: (db: DBStructure) => T | Promise<T>): Promise<T> {
  let result: T | undefined;
  await withLock(async () => {
    const db = readFromDisk();
    result = await fn(db);
    atomicWriteToDisk(db);
  });
  return result as T;
}

// ---- ID generation helpers (server-side, monotonically per collection) ----

function nextId(collection: { id: number }[]): number {
  return collection.length === 0 ? 1 : Math.max(...collection.map((x) => x.id)) + 1;
}

export function nextTaskId(db: DBStructure): number { return nextId(db.tasks); }
export function nextListId(db: DBStructure): number { return nextId(db.lists); }
export function nextLabelId(db: DBStructure): number { return nextId(db.labels); }
export function nextActivityId(db: DBStructure): number { return nextId(db.activityLogs); }
export function nextUserId(db: DBStructure): number { return nextId(db.users); }
export function nextFilterId(db: DBStructure): number { return nextId(db.savedFilters); }
export function nextFocusSessionId(db: DBStructure): number { return nextId(db.focusSessions); }

export async function logActivity(
  action: string,
  entityType: "task" | "list" | "label" | "system" | "user",
  entityId: number,
  details?: string,
): Promise<void> {
  await mutateDB((db) => {
    const log: ActivityLog = {
      id: nextActivityId(db),
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    db.activityLogs.unshift(log);
    if (db.activityLogs.length > 100) db.activityLogs.length = 100;
  });
}

// Async-compatibility shim for callers.
export const db = {
  getTasks: async () => (await readDB()).tasks,
  getLists: async () => (await readDB()).lists,
  getLabels: async () => (await readDB()).labels,
  getActivityLogs: async () => (await readDB()).activityLogs,
  getUsers: async () => (await readDB()).users,
  getCurrentUser: async () => (await readDB()).currentUser,
};
