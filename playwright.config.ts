import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Reuses `npm run dev` (the same script a person runs day-to-day) rather
  // than a separate e2e-only server command — one fewer thing to keep in
  // sync with scripts/dev.js. Requires `npm run setup` to have been run
  // first (real MONGO_URI + TMDB_ACCESS_TOKEN in server/.env), same as any
  // other local dev session — see e2e/README.md.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
