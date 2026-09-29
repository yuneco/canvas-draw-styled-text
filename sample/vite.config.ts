import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      // use library source directly (no need to build the library first)
      '@yuneco/canvas-text-styled': resolve(import.meta.dirname, '../src/index.ts'),
    },
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        tiptap: resolve(import.meta.dirname, 'tiptap.html'),
      },
    },
  },
})
