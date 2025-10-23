import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Mockly e2e tests
 * Run with: npm run test or npx playwright test
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: false, // Sequential to avoid sessionStorage conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent sessionStorage race conditions
  reporter: 'html',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
