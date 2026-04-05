import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      FHIR_BASE_URL: process.env.FHIR_BASE_URL ?? "http://localhost:8080/fhir",
      CURRENT_PRACTITIONER_ID: process.env.CURRENT_PRACTITIONER_ID ?? "kine-1",
    },
  },
});
