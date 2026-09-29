import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { CHROME_VERSIONS, chromeExecutablePath } from './scripts/chrome-for-testing.mjs'

// Tests for behavior that differs between Chrome versions (`*.chrome.test.ts`).
// Run with `pnpm test:chrome`, which downloads the Chrome for Testing builds first.
export default defineConfig({
  test: {
    include: ['src/**/*.chrome.test.ts'],
    setupFiles: ['./src/drawText/test-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: Object.entries(CHROME_VERSIONS).map(([name, buildId]) => ({
        browser: 'chromium' as const,
        name,
        provider: playwright({ launchOptions: { executablePath: chromeExecutablePath(buildId) } }),
      })),
      headless: true,
    },
  },
})
