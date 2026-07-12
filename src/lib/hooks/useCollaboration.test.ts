describe("useCollaboration", () => {
  it("exports useCollaboration function", async () => {
    const module = await import("./useCollaboration");
    expect(typeof module.useCollaboration).toBe("function");
  });
});
