describe("usePlannerSettings", () => {
  it("exports usePlannerSettings function", async () => {
    const module = await import("./usePlannerSettings");
    expect(typeof module.usePlannerSettings).toBe("function");
  });
});
