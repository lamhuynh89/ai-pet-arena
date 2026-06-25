import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: (() => {
      // Only enable proxy when VITE_API_BASE is explicitly empty string (local dev mode).
      // Production always uses VITE_API_BASE=https://api.huynhduclam.xyz (full absolute URL).
      const apiBase = process.env.VITE_API_BASE
      const useProxy = apiBase === '' || apiBase === undefined  // treat unset or '' as local proxy
      if (!useProxy) {
        console.log('[vite] VITE_API_BASE set, proxy disabled (prod mode)')
        return undefined
      }
      console.log('[vite] VITE_API_BASE empty -> enabling local proxy to http://localhost:3002')
      return {
        '/auth': { target: 'http://localhost:3002', changeOrigin: true },
        '/pets':  { target: 'http://localhost:3002', changeOrigin: true },
        '/chat':  { target: 'http://localhost:3002', changeOrigin: true },
        '/actions': { target: 'http://localhost:3002', changeOrigin: true },
        '/health': { target: 'http://localhost:3002', changeOrigin: true }
      }
    })()
  }
})
