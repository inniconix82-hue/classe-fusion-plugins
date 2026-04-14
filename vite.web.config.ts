import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config for browser-only build (no Electron)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
})
