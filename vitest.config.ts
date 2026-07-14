import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'app/**/*.test.ts',
      'app/**/*.test.tsx',
    ],
    exclude: ['node_modules/**', '**/dist', '**/coverage'],
    timeout: 10000,
    coverage: {
      provider: 'v8',
      all: true,
      clean: true,
      cleanOnRerun: true,
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: ['node_modules/**', '**/dist', '**/coverage', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      },
      include: [
        'src/lib/**/*.ts',
        'app/lib/**/*.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});