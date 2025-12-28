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
    // TODO: УДАЛИТЬ ПЕРЕД ПУБЛИКАЦИЕЙ НА СЕРВЕР - прокси нужен только для локальной разработки
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    },
    fs: {
      // Разрешаем доступ к node_modules
      strict: false
    }
  }
})

