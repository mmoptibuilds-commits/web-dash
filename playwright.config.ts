import { defineConfig } from '@playwright/test'

/**
 * Hearth E2E. Runs against the production build (`vite preview`) so the same
 * suite exercises the real bundle + PWA service worker — a fresh IndexedDB
 * per test (new browser context each test) seeds first-run state.
 *
 * Browser: Playwright Chromium by default for portable local/CI execution.
 */
const PORT = 5198
const baseURL = `http://localhost:${PORT}`
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    headless: true,
    launchOptions: executablePath
      ? { executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] }
      : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
