import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'utils': ['date-fns'],
          'icons': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    hmr: replitDomain ? {
      host: replitDomain,
      clientPort: 443,
      protocol: 'wss'
    } : true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
