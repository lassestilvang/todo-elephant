describe("useTemplates", () => {
  it("exports useTaskTemplates function", async () => {
    const module = await import("./useTemplates");
    expect(typeof module.useTaskTemplates).toBe("function");
  });
});
