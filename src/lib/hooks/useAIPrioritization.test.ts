describe("useAIPrioritization", () => {
  it("exports useAIPrioritization function", async () => {
    const module = await import("./useAIPrioritization");
    expect(typeof module.useAIPrioritization).toBe("function");
  });
});
