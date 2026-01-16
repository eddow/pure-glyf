import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ insertTypesEntry: true })
  ],
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        plugin: './src/plugin.ts'
      },
      formats: ['es', 'cjs'],
      // fileName will be index.js, plugin.js etc
    },
    rollupOptions: {
      external: ['vite', 'node:fs', 'node:path']
    }
  }
});
