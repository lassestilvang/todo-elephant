describe("useNaturalLanguageFilter", () => {
  it("exports useNaturalLanguageFilter function", async () => {
    const module = await import("./useNaturalLanguageFilter");
    expect(typeof module.useNaturalLanguageFilter).toBe("function");
  });
});
