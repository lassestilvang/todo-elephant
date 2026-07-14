import { describe, it, expect } from "vitest";

describe("useTemplates hook", () => {
  it("exports useTaskTemplates hook", async () => {
    const module = await import("./useTemplates");
    expect(typeof module.useTaskTemplates).toBe("function");
  });
});