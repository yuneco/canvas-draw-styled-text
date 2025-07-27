import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname),
  base: ".",
  build: {
    outDir: "../docs",
    emptyOutDir: true
  }
})
