import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/lib/__tests__/setup.ts'],
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'app/**/*.test.ts',
      'app/**/*.test.tsx',
      'src/__tests__/**/*.test.ts',
      'src/__tests__/**/*.test.tsx',
    ],
    exclude: ['node_modules/**', '**/dist', '**/coverage', '**/e2e/**'],
    timeout: 10000,
    // Watch plugins: hot reload
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    // Test retries for flaky tests
    retry: 2,
    // Threads for parallel test execution
    threads: true,
    // Teardown global setup
    globalSetup: ['./src/lib/__tests__/global-setup.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      all: true,
      clean: true,
      cleanOnRerun: true,
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        '**/dist',
        '**/coverage',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/setup.ts',
        '**/__tests__/global-setup.ts',
        '**/mocks/**',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
      include: [
        'src/**/*.ts',
        'src/**/*.tsx',
        'app/**/*.ts',
        'app/**/*.tsx',
      ].filter(f => !f.includes('test')),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@tests': path.resolve(__dirname, './src/__tests__'),
    },
  },
});