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
  // Reuses `npm run dev` (the same script a person runs day-to-day) to
  // start the Vite dev server, rather than a separate e2e-only command.
  // This only starts the FRONTEND — the backend lives in the separate
  // moviedb-server repo and is NOT started by this config. Have that repo
  // running (`npm run dev` there, with a real MONGO_URI + TMDB_ACCESS_TOKEN
  // in its .env) before running these specs — see e2e/README.md.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
