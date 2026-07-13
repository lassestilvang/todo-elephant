describe("useTaskActions", () => {
  it("exports useTaskActions function", async () => {
    const module = await import("./useTaskActions");
    expect(typeof module.useTaskActions).toBe("function");
  });
});
