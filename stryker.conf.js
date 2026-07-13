module.exports = {
  mutator: '@stryker-mutator/core',
  modelFactory: {
    mutate: 'javascript',
    test: 'jest',
  },
  jest: {
    jestConfig: jestConfig => ({
      resetMocks: true,
      clearMocks: true,
    }),
  },
  reporters: {
    progress: {
      threshold: 80,
    },
  },
  coveredMESTestRunnerOptions: {
    files: ['src/**/*.js', 'src/**/*.ts'],
  },
};