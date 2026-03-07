import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Musaic.AI optimisée pour Vercel
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
  }
})
