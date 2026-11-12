import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests run the production build (in `e2e` mode) against the
 * Firebase Auth emulator, a simulated Gemini Nano (Chrome Prompt API) and a
 * simulated cloud Gemini endpoint. See docs/TESTING.md.
 */
// Locally only the Auth emulator is required; CI also runs Firestore and Storage.
const emulators = process.env.E2E_EMULATORS ?? 'auth';
const readyUrl = emulators.includes('firestore') ? 'http://127.0.0.1:8080' : 'http://127.0.0.1:9099';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // Phone-sized viewport: the farmer app is used in the field.
    viewport: { width: 412, height: 915 },
    locale: 'en-US',
    permissions: ['geolocation'],
    geolocation: { latitude: 10.0341, longitude: 105.7877 },
    // Service workers would hide network calls from the mocks; one test enables them.
    serviceWorkers: 'block',
    ...(process.env.CHROME_PATH
      ? { launchOptions: { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } }
      : { channel: 'chrome' }),
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `npx firebase emulators:start --only ${emulators} --project demo-field-doctor`,
      url: readyUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run build:e2e && npx vite preview --outDir dist-e2e --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
