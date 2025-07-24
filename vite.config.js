// vite.config.js

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // Remove the optimizeDeps section, it's not needed for this fix.
  // Add the build section below
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})