// Chrome for Testing builds used by `pnpm test:chrome` to check behavior that differs between Chrome versions.
// Run this file to download them: `node scripts/chrome-for-testing.mjs`
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Browser, computeExecutablePath, install } from '@puppeteer/browsers'

/** instance name → exact build. Chrome 154 stopped applying canvas CSS writing-mode to text */
export const CHROME_VERSIONS = {
  'chrome-153': '153.0.8010.52',
  'chrome-154': '154.0.8037.57',
}

const cacheDir = resolve(import.meta.dirname, '../.cache/chrome-for-testing')

export const chromeExecutablePath = (buildId) => computeExecutablePath({ browser: Browser.CHROME, buildId, cacheDir })

const installAll = async () => {
  for (const buildId of Object.values(CHROME_VERSIONS)) {
    const installed = await install({ browser: Browser.CHROME, buildId, cacheDir })
    console.log(`chrome@${buildId}: ${installed.executablePath}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await installAll()
}
