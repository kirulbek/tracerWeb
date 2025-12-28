import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['sql.js'],
    include: []
  },
  resolve: {
    alias: {
      // Убеждаемся, что sql.js правильно резолвится
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // Разрешаем доступ к node_modules
      strict: false
    }
  }
})

