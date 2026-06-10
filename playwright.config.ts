import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,               // 4-core box; bounded memory
  timeout: 45_000,
  retries: 0,
  reporter: [['list']],     // no auto-opening HTML report; lean
  use: {
    baseURL: 'http://localhost:4273',
    serviceWorkers: 'block', // neutralize vite-plugin-pwa SW: no precache churn,
                             // no stale-cache shots, no lazyRetry reload path
    trace: 'off',
    video: 'off',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile',  use: { viewport: { width: 375,  height: 667 }, hasTouch: true } },
  ],
  webServer: {
    command: 'npx vite preview --port 4273 --strictPort',
    url: 'http://localhost:4273',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
