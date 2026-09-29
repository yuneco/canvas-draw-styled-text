import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import dts from 'vite-plugin-dts'

export default defineConfig({

  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
    },
  },
  plugins: [dts({
    exclude: ['node_modules/**', 'src/**/*.test.ts', 'src/**/test-*.ts'],
  })],
  test: {
    setupFiles: ['./src/drawText/test-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
        { browser: 'webkit' },
        // installed Google Chrome (e.g. to check changes not yet in Playwright's Chromium). `pnpm test:chrome`
        ...(process.env.TEST_CHROME
          ? [
              {
                browser: 'chromium' as const,
                name: 'chrome',
                provider: playwright({ launchOptions: { channel: 'chrome' } }),
              },
            ]
          : []),
      ],
      headless: true,
    },
  },
})