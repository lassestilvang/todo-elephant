describe("useVoiceCapture", () => {
  it("exports useVoiceCapture function", async () => {
    const module = await import("./useVoiceCapture");
    expect(typeof module.useVoiceCapture).toBe("function");
  });
});
