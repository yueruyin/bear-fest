import { defineConfig, devices } from '@playwright/test'

const backendPort = Number(process.env.E2E_BACKEND_PORT || 18001)
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 15173)
const pythonBin = process.env.PYTHON_BIN || 'python3'
const localNoProxy = ['127.0.0.1', 'localhost', process.env.NO_PROXY, process.env.no_proxy]
  .filter(Boolean)
  .join(',')

// Local E2E servers must never be probed through a developer machine's proxy.
process.env.NO_PROXY = localNoProxy
process.env.no_proxy = localNoProxy

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `"${pythonBin}" tests/e2e_server.py`,
      cwd: '..',
      env: {
        E2E_BACKEND_HOST: '127.0.0.1',
        E2E_BACKEND_PORT: String(backendPort),
        NO_PROXY: localNoProxy,
        no_proxy: localNoProxy,
      },
      url: `http://127.0.0.1:${backendPort}/ready`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
      cwd: '.',
      env: {
        VITE_API_BASE_URL: `http://127.0.0.1:${backendPort}`,
        NO_PROXY: localNoProxy,
        no_proxy: localNoProxy,
      },
      url: `http://127.0.0.1:${frontendPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
