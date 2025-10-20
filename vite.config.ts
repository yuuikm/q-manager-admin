import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'api': fileURLToPath(new URL('./src/api', import.meta.url)),
      'components': fileURLToPath(new URL('./src/components', import.meta.url)),
      'constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      'pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      'store': fileURLToPath(new URL('./src/store', import.meta.url)),
      'types': fileURLToPath(new URL('./src/types', import.meta.url)),
      'utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
})
