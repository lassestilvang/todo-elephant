describe("useBulkSelection", () => {
  it("exports useBulkSelection function", async () => {
    const module = await import("./useBulkSelection");
    expect(typeof module.useBulkSelection).toBe("function");
  });
});
