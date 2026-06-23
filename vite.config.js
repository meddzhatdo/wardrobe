import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  server: {
    // Proxy /api to vercel dev (port 3000) when running `npm run dev` alongside `vercel dev`
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
