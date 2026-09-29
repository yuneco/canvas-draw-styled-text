import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(import.meta.dirname),
  base: ".",
  build: {
    outDir: "../docs"
  }
})
