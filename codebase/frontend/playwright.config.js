import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests', fullyParallel: true, workers: 3,
  use: { baseURL: 'http://localhost:5173', headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
})
