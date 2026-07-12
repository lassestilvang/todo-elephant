describe("usePlannerData", () => {
  it("exports usePlannerData function", async () => {
    const module = await import("./usePlannerData");
    expect(typeof module.usePlannerData).toBe("function");
  });
});
