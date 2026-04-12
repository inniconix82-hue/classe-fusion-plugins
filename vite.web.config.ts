import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config for browser-only testing (no Electron)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
