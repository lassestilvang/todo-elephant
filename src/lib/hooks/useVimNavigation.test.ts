describe("useVimNavigation", () => {
  it("exports useVimNavigation function", async () => {
    const module = await import("./useVimNavigation");
    expect(typeof module.useVimNavigation).toBe("function");
  });
});
