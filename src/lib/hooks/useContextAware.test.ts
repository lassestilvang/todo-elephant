describe("useContextAware", () => {
  it("exports useContextAware function", async () => {
    const module = await import("./useContextAware");
    expect(typeof module.useContextAware).toBe("function");
  });
});
