describe("usePredictiveSnooze", () => {
  it("exports usePredictiveSnooze function", async () => {
    const module = await import("./usePredictiveSnooze");
    expect(typeof module.usePredictiveSnooze).toBe("function");
  });
});
