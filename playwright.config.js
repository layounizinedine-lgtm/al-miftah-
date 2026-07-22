// Playwright-Konfiguration für den Smoke-Test von Al-Miftāḥ.
// Die App ist statisch (file://) — kein Dev-Server nötig.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    // externe Requests (Fonts, Supabase-CDN) sind für den Smoke-Test irrelevant;
    // die App fällt sauber zurück. baseURL wird nicht gebraucht (file://).
    trace: 'off',
    // Optional: eigenen Chromium nutzen (z. B. vorinstalliert). In CI leer lassen —
    // dort installiert `npx playwright install` den passenden Browser.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
