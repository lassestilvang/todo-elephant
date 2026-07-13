describe("useTaskPlanner", () => {
  it("exports useTaskPlanner function", async () => {
    const module = await import("./useTaskPlanner");
    expect(typeof module.useTaskPlanner).toBe("function");
  });
});
