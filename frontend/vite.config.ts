/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'copy-spa-files',
      writeBundle() {
        try {
          copyFileSync(path.resolve(__dirname, 'public/_redirects'), path.resolve(__dirname, 'dist/_redirects'))
          console.log('✓ Copied _redirects to dist/')
        } catch (err) {
          console.warn('Could not copy _redirects:', err)
        }
        try {
          copyFileSync(path.resolve(__dirname, 'public/_headers'), path.resolve(__dirname, 'dist/_headers'))
          console.log('✓ Copied _headers to dist/')
        } catch (err) {
          console.warn('Could not copy _headers:', err)
        }
        try {
          copyFileSync(path.resolve(__dirname, 'public/404.html'), path.resolve(__dirname, 'dist/404.html'))
          console.log('✓ Copied 404.html to dist/')
        } catch (err) {
          console.warn('Could not copy 404.html:', err)
        }
      }
    }
  ],
  define: {
    'global': 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
      buffer: 'buffer/',
      process: 'process/browser',
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Enable access from mobile devices on same network
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: [
      'src/test/**/*.ts',
      'src/test/**/*.tsx'
    ],
    exclude: ['../backend/test/**', 'node_modules', 'dist']
  }
})