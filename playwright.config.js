import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    serviceWorkers: "allow",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000
  },
  projects: [
    {
      name: "webkit-iphone",
      use: {
        ...devices["iPhone 13"]
      }
    }
  ]
});
