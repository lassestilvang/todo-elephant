describe("useGamification", () => {
  it("exports useGamification function", async () => {
    const module = await import("./useGamification");
    expect(typeof module.useGamification).toBe("function");
  });
});
