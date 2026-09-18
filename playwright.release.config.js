import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-release",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run serve:release",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 30_000
  },
  projects: [{
    name: "chromium-release",
    use: {
      ...devices["Desktop Chrome"],
      serviceWorkers: "allow"
    }
  }]
});
