import { describe, it, expect } from "vitest";
import { parseEmailToTask, taskToCalendarEvent, calendarEventToTask, EMAIL_IMPORT_ENDPOINT, TASK_EMAIL_TEMPLATE } from "./integrations";

describe("integrations module", () => {
  it("exports EMAIL_IMPORT_ENDPOINT", () => {
    expect(EMAIL_IMPORT_ENDPOINT).toBe("/api/integrations/email");
  });

  it("exports TASK_EMAIL_TEMPLATE", () => {
    expect(TASK_EMAIL_TEMPLATE).toContain("[Task]");
    expect(TASK_EMAIL_TEMPLATE).toContain("{task_title}");
  });
});

describe("parseEmailToTask", () => {
  it("extracts subject as title", () => {
    const result = parseEmailToTask("Buy groceries", "Need milk and eggs");
    expect(result.title).toBe("Buy groceries");
  });

  it("extracts body as description (truncated)", () => {
    const longBody = "a".repeat(600);
    const result = parseEmailToTask("Task", longBody);
    expect(result.description).toHaveLength(500);
  });

  it("extracts ISO date from email body", () => {
    const result = parseEmailToTask("Meeting", "Discuss project on 2024-12-25");
    expect(result.dueDate).toContain("2024-12-25");
  });

  it("extracts MM/DD/YYYY date from email body", () => {
    const result = parseEmailToTask("Event", "Date is 12/25/2024");
    expect(result.dueDate).toBeDefined();
  });

  it("marks urgent emails as high priority", () => {
    const result = parseEmailToTask("Urgent: Fix bug", "This is critical and important");
    expect(result.priority).toBe("high");
  });

  it("marks non-urgent emails as medium priority", () => {
    const result = parseEmailToTask("Read book", "Relaxing weekend activity");
    expect(result.priority).toBe("medium");
  });

  it("sets default status to todo", () => {
    const result = parseEmailToTask("Task", "Body");
    expect(result.status).toBe("todo");
  });
});

describe("taskToCalendarEvent", () => {
  it("converts task to calendar event format", () => {
    const task = {
      id: 1,
      title: "Meeting",
      description: "Team sync",
      dueDate: "2024-01-15T10:00:00.000Z",
      priority: "high",
      status: "todo",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    } as any;

    const event = taskToCalendarEvent(task);
    expect(event.summary).toBe("Meeting");
    expect(event.description).toBe("Team sync");
    expect(event.start.dateTime).toBe("2024-01-15T10:00:00.000Z");
    expect(event.end.dateTime).toBeDefined();
  });

  it("uses current date when task has no dueDate", () => {
    const task = {
      id: 1,
      title: "Task",
      description: "",
      dueDate: undefined,
      priority: "medium",
      status: "todo",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    } as any;

    const event = taskToCalendarEvent(task);
    expect(event.start.dateTime).toBeDefined();
    expect(event.end.dateTime).toBeDefined();
  });
});

describe("calendarEventToTask", () => {
  it("converts calendar event to task format", () => {
    const event = {
      summary: "Doctor appointment",
      description: "Annual checkup",
      start: { dateTime: "2024-06-15T09:00:00.000Z" },
    };

    const task = calendarEventToTask(event as any);
    expect(task.title).toBe("Doctor appointment");
    expect(task.description).toBe("Annual checkup");
    expect(task.dueDate).toBe("2024-06-15T09:00:00.000Z");
    expect(task.priority).toBe("medium");
    expect(task.status).toBe("todo");
  });

  it("handles date-only calendar event", () => {
    const event = {
      summary: "All-day event",
      start: { date: "2024-06-15" },
    };

    const task = calendarEventToTask(event as any);
    expect(task.dueDate).toBe("2024-06-15");
  });
});