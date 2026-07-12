import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reorderTasksApi, ReorderApiError, ReorderItem } from "./tasksApi";

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
    text: async () => JSON.stringify(body),
  } as Response);
}

describe("reorderTasksApi", () => {
  it("POSTs to /api/tasks/reorder with the items payload", async () => {
    mockJsonResponse({ updated: 2, ids: [1, 2] });
    const items: ReorderItem[] = [
      { id: 1, order: 100 },
      { id: 2, order: 200 },
    ];
    await reorderTasksApi(items);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tasks/reorder");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toEqual({ items });
  });

  it("returns the parsed {updated, ids} response on success", async () => {
    mockJsonResponse({ updated: 3, ids: [10, 11, 12] });
    const out = await reorderTasksApi([
      { id: 10, order: 1 },
      { id: 11, order: 2 },
      { id: 12, order: 3 },
    ]);
    expect(out).toEqual({ updated: 3, ids: [10, 11, 12] });
  });

  it("throws ReorderApiError with the server error message on 4xx", async () => {
    mockJsonResponse({ error: "items[] is required" }, 400);
    mockJsonResponse({ error: "items[] is required" }, 400);
    await expect(reorderTasksApi([])).rejects.toBeInstanceOf(ReorderApiError);
    await expect(reorderTasksApi([])).rejects.toThrow("items[] is required");
  });

  it("throws ReorderApiError on 413 (payload too large)", async () => {
    mockJsonResponse({ error: "items[] cannot exceed 500 entries per request" }, 413);
    await expect(reorderTasksApi([{ id: 1, order: 1 }])).rejects.toBeInstanceOf(ReorderApiError);
  });

  it("throws ReorderApiError on 413 (payload too large)", async () => {
    mockJsonResponse({ error: "items[] cannot exceed 500 entries per request" }, 413);
    await expect(reorderTasksApi([{ id: 1, order: 1 }])).rejects.toBeInstanceOf(ReorderApiError);
  });

  it("falls back to a generic error message when the body has no error field", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
      text: async () => "",
    } as unknown as Response);
    await expect(reorderTasksApi([{ id: 1, order: 1 }])).rejects.toThrow("Failed to reorder tasks");
  });
});
