import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.PW_BASE_URL ?? 'https://local.dev.smetchik.pro:4000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:test',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PW_TEST: '1',
      BASE_API_URL: process.env.BASE_API_URL ?? baseURL,
    },
  },
});
