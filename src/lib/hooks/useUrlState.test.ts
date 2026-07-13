describe("useUrlState", () => {
  it("exports useInitialUrlState function", async () => {
    const module = await import("./useUrlState");
    expect(typeof module.useInitialUrlState).toBe("function");
  });

  it("exports readUrlParam function", async () => {
    const module = await import("./useUrlState");
    expect(typeof module.readUrlParam).toBe("function");
  });

  it("exports writeUrlState function", async () => {
    const module = await import("./useUrlState");
    expect(typeof module.writeUrlState).toBe("function");
  });

  it("exports useUrlParam function", async () => {
    const module = await import("./useUrlState");
    expect(typeof module.useUrlParam).toBe("function");
  });
});
