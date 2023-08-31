import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tiptap: resolve(__dirname, 'tiptap.html'),
      },
    },
  },
  plugins: [dts({})],
})
