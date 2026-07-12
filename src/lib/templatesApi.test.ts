/**
 * Unit tests for the pure templatesApi module.
 *
 * These tests don't render React — they exercise the API contract directly
 * via fetch mocks, plus the deterministic-subtask-id guarantee.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTemplates,
  postTemplate,
  createTaskFromTemplate,
  deleteTemplateById,
  buildTemplatePayload,
  TemplateApiError,
} from "./templatesApi";
import type { Task } from "@/types";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
});
afterEach(() => {
  vi.restoreAllMocks();
});

function mockJsonResponse(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

const fixture: Task = {
  id: 5,
  title: "Buy groceries",
  description: "Weekly haul",
  dueDate: "2026-12-01T10:00:00.000Z",
  priority: "medium",
  status: "pending",
  listId: 2,
  labels: [10, 11],
  subtasks: [
    { id: 99, title: "Milk", completed: false },
    { id: 100, title: "Eggs", completed: true },
  ],
  isImportant: false,
  isUrgent: true,
  recurrence: "weekly",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

describe("templatesApi — fetchTemplates", () => {
  it("GETs /api/tasks/from-template and returns the parsed array", async () => {
    mockJsonResponse([{ id: 1, title: "T" }]);
    const out = await fetchTemplates();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/tasks/from-template");
    expect(out).toEqual([{ id: 1, title: "T" }]);
  });

  it("returns [] on non-2xx (does not throw)", async () => {
    mockJsonResponse({ error: "boom" }, 500);
    const out = await fetchTemplates();
    expect(out).toEqual([]);
  });

  it("returns [] on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const out = await fetchTemplates();
    expect(out).toEqual([]);
  });
});

describe("templatesApi — buildTemplatePayload", () => {
  it("clones subtasks with deterministic unique ids and resets completion", () => {
    const body = buildTemplatePayload(fixture);
    expect(body.isTemplate).toBe(true);
    expect(body.status).toBe("pending");
    expect(body.labels).toEqual([10, 11]);
    expect(body.subtasks).toHaveLength(2);
    body.subtasks!.forEach((s, idx) => {
      expect(s.completed).toBe(false);
      // Deterministic: ids are unique within the payload (no Math.random).
      const ids = body.subtasks!.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      // Title preserved from source.
      expect(s.title).toBe(fixture.subtasks![idx].title);
    });
  });

  it("produces different ids across calls (uses Date.now base)", async () => {
    const a = buildTemplatePayload(fixture);
    // Yield to ensure Date.now() advances at least 1ms between builds.
    await new Promise((r) => setTimeout(r, 2));
    const b = buildTemplatePayload(fixture);
    const aIds = a.subtasks!.map((s) => s.id);
    const bIds = b.subtasks!.map((s) => s.id);
    expect(aIds[0]).not.toBe(bIds[0]);
  });

  it("uses an explicit templateName when supplied", () => {
    const body = buildTemplatePayload(fixture, "My Template");
    expect(body.title).toBe("My Template");
  });

  it("defaults the title to '<name> (Template)'", () => {
    const body = buildTemplatePayload(fixture);
    expect(body.title).toBe("Buy groceries (Template)");
  });
});

describe("templatesApi — postTemplate", () => {
  it("POSTs to /api/tasks with the built payload", async () => {
    mockJsonResponse({ id: 500, title: "Buy groceries (Template)", isTemplate: true });
    await postTemplate(fixture);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tasks");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.isTemplate).toBe(true);
    expect(body.title).toBe("Buy groceries (Template)");
  });

  it("returns the new template on success", async () => {
    mockJsonResponse({ id: 500, title: "X", isTemplate: true });
    const out = await postTemplate(fixture);
    expect(out.id).toBe(500);
  });

  it("throws TemplateApiError on non-2xx", async () => {
    mockJsonResponse({ error: "nope" }, 400);
    await expect(postTemplate(fixture)).rejects.toBeInstanceOf(TemplateApiError);
  });
});

describe("templatesApi — createTaskFromTemplate", () => {
  it("POSTs templateId + overrides + count", async () => {
    mockJsonResponse({ id: 1000, title: "Spawned" });
    await createTaskFromTemplate(7, { title: "Override" }, 1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toEqual({ templateId: 7, overrides: { title: "Override" }, count: 1 });
  });

  it("returns the spawned task on success", async () => {
    mockJsonResponse({ id: 1001, title: "OK" });
    const out = await createTaskFromTemplate(7);
    expect(out?.id).toBe(1001);
  });

  it("throws with server error message on non-2xx", async () => {
    mockJsonResponse({ error: "Template not found" }, 404);
    await expect(createTaskFromTemplate(7)).rejects.toThrow("Template not found");
  });

  it("throws TemplateApiError on network failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    await expect(createTaskFromTemplate(7)).rejects.toBeInstanceOf(TemplateApiError);
  });
});

describe("templatesApi — deleteTemplateById", () => {
  it("issues DELETE /api/tasks/:id", async () => {
    mockJsonResponse({});
    await deleteTemplateById(42);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tasks/42");
    expect(init?.method).toBe("DELETE");
  });

  it("throws TemplateApiError on non-2xx", async () => {
    mockJsonResponse({ error: "locked" }, 409);
    await expect(deleteTemplateById(42)).rejects.toBeInstanceOf(TemplateApiError);
  });
});
