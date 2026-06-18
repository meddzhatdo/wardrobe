import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy /api to vercel dev (port 3000) when running `npm run dev` alongside `vercel dev`
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
