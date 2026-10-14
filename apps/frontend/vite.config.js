import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En local el frontend pide rutas relativas (/api, /uploads) a su propio puerto
    // y Vite las reenvía por detrás a la API. Imita lo que hará el servidor web en producción.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Imágenes subidas desde el admin, que sirve la API con express.static
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
