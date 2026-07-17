import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // GitHub Pages root deployment
  base: '/figma-html/',

  server: {
    port: 5173,
  },

  build: {
    outDir: 'dist',
  },
})
