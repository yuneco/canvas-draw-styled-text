import { resolve } from 'path'
import { configDefaults, defineConfig } from 'vitest/config'
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
    // Chrome version specific tests run separately with vitest.chrome.config.ts
    exclude: [...configDefaults.exclude, 'src/**/*.chrome.test.ts'],
    setupFiles: ['./src/drawText/test-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
        { browser: 'webkit' },
      ],
      headless: true,
    },
  },
})