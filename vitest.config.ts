import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/components/TaskManager.tsx',
      'src/lib/recurrence.ts',
      'src/lib/tasksApi.ts',
      'src/hooks/useTimeEstimate.ts',
      'src/security/**/*.ts' // security utilities
    ],
    exclude: ['node_modules/**', '**/dist', '**/coverage'],
    timeout: 5000,
    coverage: {
      provider: 'v8',
      all: true,
      clean: true,
      cleanOnRerun: true,
      reporter: ['text', 'json', 'lcov', 'html'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95
      },
      retries: {
        maxAttempts: 3,
        on: ['test']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});