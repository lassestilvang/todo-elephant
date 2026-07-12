describe("usePlannerView", () => {
  it("exports usePlannerView function", async () => {
    const module = await import("./usePlannerView");
    expect(typeof module.usePlannerView).toBe("function");
  });
});