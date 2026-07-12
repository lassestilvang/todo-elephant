/**
 * Pure fetch helper for the atomic /api/tasks/reorder endpoint.
 * Extracted so the contract can be unit-tested without React rendering.
 */

export interface ReorderItem {
  id: number;
  order: number;
}

export interface ReorderResult {
  updated: number;
  ids: number[];
}

export class ReorderApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ReorderApiError";
  }
}

/**
 * POST { items: [{id, order}] } to /api/tasks/reorder atomically.
 * Throws ReorderApiError on non-2xx.
 */
export async function reorderTasksApi(items: ReorderItem[]): Promise<ReorderResult> {
  const res = await fetch("/api/tasks/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    let msg = "Failed to reorder tasks";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) msg = data.error;
    } catch {
      /* ignore parse errors */
    }
    throw new ReorderApiError(res.status, msg);
  }
  return (await res.json()) as ReorderResult;
}
