import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "app/**/*.test.ts"],
    exclude: ["node_modules/**"],
    coverage: {
      provider: "v8",
      // Only cover business logic modules (not React hooks which need integration tests)
      include: [
        "src/lib/dateUtils.ts",
        "src/lib/nlp.ts",
        "src/lib/recurrence.ts",
        "src/lib/statsHelpers.ts",
        "src/lib/streaks.ts",
        "src/lib/tasksApi.ts",
        "src/lib/templatesApi.ts",
        "src/lib/timeEstimate.ts",
        "src/lib/todaySummary.ts",
      ],
      all: true,
      clean: true,
      cleanOnRerun: true,
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
