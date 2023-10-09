import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname),
  base: ".",
  build: {
    outDir: "../docs",
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tiptap: resolve(__dirname, 'tiptap.html')
      }
    }
  }
})
