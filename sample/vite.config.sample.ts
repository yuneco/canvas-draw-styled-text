import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(import.meta.dirname),
  base: "./",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        tiptap: resolve(import.meta.dirname, 'tiptap.html'),
      },
    },
  }
})
