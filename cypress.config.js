# Cypress configuration (if using e2e testing)
baseUrl: 'http://localhost:3000'
video: false
screenshotOnRunFailure: true

# Test configuration
testFiles: '**/*.{cy,spec}.{js,ts}'
supportFile: 'cypress/support/e2e.ts'

# Fixtures
fixturesFolder: 'cypress/fixtures'

# Configuration
env:
  API_URL: http://localhost:3000/api
  DEBUG: false