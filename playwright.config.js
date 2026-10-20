import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour la plateforme CampusEnroll
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests-functional',
  /* Timeout par test (30s) */
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  /* Exécution séquentielle pour éviter les conflits d'état sur la base MySQL */
  fullyParallel: false,
  workers: 1,
  /* Reporter standard console + HTML */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    /* URL de base du frontend React Vite */
    baseURL: 'http://localhost:5173',
    /* Enregistrement de trace en cas d'échec pour audit post-mortem */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Sélecteurs stables */
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
