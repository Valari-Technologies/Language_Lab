// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * NOTE: this project's Vite dev server runs on port 5173 (Vite's default —
 * see `npm run dev` / vite.config.js), not 3000. BASE_URL is overridable via
 * env var so this still points wherever the CMS web server is actually served.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // CMS UI tests share one seeded backend dataset — keep them sequential.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatically boot the Vite dev server for the test run if it isn't
  // already running (the Django backend is NOT started here — it must
  // already be running on :8000, since these are full-stack CMS tests).
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
