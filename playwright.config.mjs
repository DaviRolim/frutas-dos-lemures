import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4175/",
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:4175/",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "Mobile Safari landscape",
      use: {
        ...devices["iPhone 14 landscape"]
      }
    },
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
