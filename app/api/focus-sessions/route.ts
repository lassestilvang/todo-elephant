import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, logActivity, nextFocusSessionId } from "@/app/lib/db";
import { FocusSession } from "@/types";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.focusSessions);
  } catch (err) {
    console.error("GET /api/focus-sessions error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }
    const session = await mutateDB<FocusSession>((db) => {
      const newSession: FocusSession = {
        id: nextFocusSessionId(db),
        taskId: Number(body.taskId),
        startedAt: body.startedAt ?? new Date().toISOString(),
        endedAt: body.endedAt ?? null,
        durationSeconds: Number(body.durationSeconds) || 0,
        completedEarly: !!body.completedEarly,
      };
      db.focusSessions.push(newSession);
      // Cap at 200 sessions — protects the JSON file from unbounded growth.
      if (db.focusSessions.length > 200) db.focusSessions.splice(0, db.focusSessions.length - 200);
      // Bump completedPomodoros counter on the matched task.
      const t = db.tasks.find((tk) => tk.id === newSession.taskId);
      if (t) {
        t.completedPomodoros = (t.completedPomodoros ?? 0) + 1;
        t.updatedAt = new Date().toISOString();
      }
      return newSession;
    });
    await logActivity(`Completed focus session (${session.durationSeconds}s)`, "task", session.taskId);
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("POST /api/focus-sessions error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
