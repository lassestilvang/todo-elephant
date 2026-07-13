export default class TestContext {
  private originalEnv: NodeJS.ProcessEnv;

  constructor() {
    this.originalEnv = { ...process.env };
  }

  setTZ(tz: string) {
    process.env.TZ = tz;
    // Reset Date object cache if needed
  }

  setPrecision(minutes: number) {
    // Simulate precision setting for time estimation
    this.precision = minutes;
  }

  reset() {
    process.env = { ...this.originalEnv };
  }
}