import fs from 'fs';
import path from 'path';
import { Task, List, Label, ActivityLog, User } from '@/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Interface for database structure
export interface DBStructure {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  activityLogs: ActivityLog[];
  users: User[];
  currentUser: User | null;
}

// Default initial data
const defaultDBData: DBStructure = {
  tasks: [
    {
      id: 1,
      title: "🐘 Welcome to Todo Elephant",
      description: "This is your premium task planner. Explore different layouts (Kanban, List, Dashboard), add tags, and track your history!",
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T18:00:00.000Z', // tomorrow
      priority: "high",
      status: "in-progress",
      subtasks: [
        { id: 101, title: "Try toggling a subtask", completed: true },
        { id: 102, title: "Switch to Kanban board view", completed: false },
        { id: 103, title: "Open the Command Palette with Ctrl+K / Cmd+K", completed: false }
      ],
      listId: 1, // Inbox
      labels: [1, 3], // Feature, Urgent
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      title: "💅 Design custom dark mode theme",
      description: "Make the application aesthetics pop! Leverage Backdrop filters, frosted glass backgrounds, and smooth HSL scales.",
      dueDate: new Date().toISOString().split('T')[0] + 'T23:59:59.000Z', // today
      priority: "medium",
      status: "pending",
      subtasks: [
        { id: 201, title: "Define custom HSL color scheme", completed: true },
        { id: 202, title: "Implement backdrop-blur borders", completed: false }
      ],
      listId: 2, // Work
      labels: [4], // Design
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 3,
      title: "🏃‍♂️ Morning 5km run",
      description: "Keep the body healthy. Target pace: 5:15 min/km.",
      dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0] + 'T07:00:00.000Z', // yesterday
      priority: "low",
      status: "completed",
      subtasks: [],
      listId: 3, // Personal
      labels: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  lists: [
    { id: 1, name: "📥 Inbox", description: "Quick capture tasks and items", color: "#3b82f6", createdAt: new Date().toISOString() },
    { id: 2, name: "💼 Work", description: "Professional projects and duties", color: "#ec4899", createdAt: new Date().toISOString() },
    { id: 3, name: "🧘‍♂️ Personal", description: "Health, fitness, and lifestyle", color: "#10b981", createdAt: new Date().toISOString() }
  ],
  labels: [
    { id: 1, name: "Feature", color: "#3b82f6" },
    { id: 2, name: "Refactor", color: "#8b5cf6" },
    { id: 3, name: "Urgent", color: "#ef4444" },
    { id: 4, name: "Design", color: "#ec4899" },
    { id: 5, name: "Documentation", color: "#10b981" }
  ],
  activityLogs: [
    {
      id: 1,
      action: "Initialize Database",
      entityType: "system",
      entityId: 0,
      details: "Todo Elephant database setup complete with premium mock records.",
      createdAt: new Date().toISOString()
    }
  ],
  users: [
    { id: 1, name: "Lasse Stilvang", email: "lasse.stilvang@gmail.com", createdAt: new Date().toISOString() }
  ],
  currentUser: { id: 1, name: "Lasse Stilvang", email: "lasse.stilvang@gmail.com", createdAt: new Date().toISOString() }
};

// Database read helper
export function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(defaultDBData);
      return defaultDBData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read JSON DB, falling back to defaults", error);
    return defaultDBData;
  }
}

// Database write helper
export function writeDB(data: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to JSON DB", error);
  }
}

// Helper to log actions
export function logActivity(action: string, entityType: 'task' | 'list' | 'label' | 'system' | 'user', entityId: number, details?: string) {
  const db = readDB();
  const newLog: ActivityLog = {
    id: db.activityLogs.length > 0 ? Math.max(...db.activityLogs.map(l => l.id)) + 1 : 1,
    action,
    entityType,
    entityId,
    details,
    createdAt: new Date().toISOString()
  };
  db.activityLogs.unshift(newLog); // Prepend to show newest logs first
  // Cap at 100 logs for performance
  if (db.activityLogs.length > 100) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }
  writeDB(db);
}

// Mock export for DB object compatibility
export const db = {
  getTasks: () => readDB().tasks,
  getLists: () => readDB().lists,
  getLabels: () => readDB().labels,
  getActivityLogs: () => readDB().activityLogs,
  getUsers: () => readDB().users,
  getCurrentUser: () => readDB().currentUser,
};