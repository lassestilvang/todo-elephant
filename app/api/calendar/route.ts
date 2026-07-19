import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar
 * Returns calendar events for the authenticated user
 * Query params: ?range=week|month|agenda&start=iso&end=iso
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";
    const start = searchParams.get("start") || new Date().toISOString();
    const end = searchParams.get("end") || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { start: startDate, end: endDate } = calculateDateRange(range, start, end);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
        ],
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        completed: false,
      },
      include: {
        project: { select: { name: true, color: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const events = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      start: task.dueDate,
      end: task.dueDate,
      allDay: false,
      completed: task.completed,
      priority: task.priority,
      project: task.project,
      assignee: task.assignee,
      source: "internal",
    }));

    // Fetch from external calendars if connected
    const externalEvents = await fetchExternalCalendarEvents(session.user.id, startDate, endDate);
    events.push(...externalEvents);

    events.sort((a, b) => new Date(a.start || 0).getTime() - new Date(b.start || 0).getTime());

    return NextResponse.json({
      events,
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/event
 * Sync a task to the calendar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, taskId, ...calendarData } = body;

    if (action === "sync_task_to_calendar" && taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      await syncTaskToCalendar(task, session.user.id, calendarData);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar event" },
      { status: 500 }
    );
  }
}

function calculateDateRange(range: string, startStr: string, endStr: string) {
  let startDate: Date;
  let endDate: Date;

  if (range === "week") {
    startDate = new Date(startStr);
    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (range === "month") {
    startDate = new Date(startStr);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
  } else {
    startDate = new Date(startStr);
    endDate = new Date(endStr);
  }

  return { start: startDate, end: endDate };
}

async function fetchExternalCalendarEvents(userId: string, startDate: Date, endDate: Date) {
  // This would integrate with Google Calendar, Outlook, etc.
  // For now, return an empty array
  return [];
}

async function syncTaskToCalendar(task: any, userId: string, calendarData: any) {
  // Implementation for syncing task to external calendars
  // This would use the integration service layer
  console.log(`Syncing task ${task.id} to calendar for user ${userId}`, calendarData);
}
