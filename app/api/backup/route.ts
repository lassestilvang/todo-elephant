import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, logActivity } from "@/app/lib/db";
import {
  Task,
  List,
  Label,
  SavedFilter,
  ShortcutConfig,
  ActivityLog,
  FocusSession,
  User,
} from "@/types";

const BACKUP_VERSION = "1.1.0";

const isArr = <T,>(x: unknown): x is T[] => Array.isArray(x);
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({
      version: BACKUP_VERSION,
      tasks: db.tasks,
      lists: db.lists,
      labels: db.labels,
      savedFilters: db.savedFilters,
      shortcutConfigs: db.shortcutConfigs,
      activityLogs: db.activityLogs,
      users: db.users,
      focusSessions: db.focusSessions,
      currentUser: db.currentUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/backup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (
      !isObj(data) ||
      !isArr<Task>(data.tasks) ||
      !isArr<List>(data.lists) ||
      !isArr<Label>(data.labels)
    ) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    type BackupBody = {
      tasks: Task[];
      lists: List[];
      labels: Label[];
      savedFilters?: SavedFilter[];
      shortcutConfigs?: ShortcutConfig[];
      activityLogs?: ActivityLog[];
      users?: User[];
      focusSessions?: FocusSession[];
      currentUser?: User | null;
    };

    const result = await mutateDB<BackupBody>((db) => {
      const restored = data as BackupBody;
      db.tasks = restored.tasks as Task[];
      db.lists = restored.lists as List[];
      db.labels = restored.labels as Label[];
      if (isArr<SavedFilter>(restored.savedFilters)) db.savedFilters = restored.savedFilters;
      if (isArr<ShortcutConfig>(restored.shortcutConfigs)) db.shortcutConfigs = restored.shortcutConfigs;
      if (isArr<ActivityLog>(restored.activityLogs)) db.activityLogs = restored.activityLogs;
      if (isArr<User>(restored.users)) db.users = restored.users;
      if (isArr<FocusSession>(restored.focusSessions)) db.focusSessions = restored.focusSessions;
      if (restored.currentUser !== undefined) db.currentUser = restored.currentUser ?? null;
      return restored;
    });

    await logActivity(
      "Restored database from backup",
      "system",
      0,
      `Tasks: ${result.tasks.length}, Folders: ${result.lists.length}, Labels: ${result.labels.length}`,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /api/backup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
