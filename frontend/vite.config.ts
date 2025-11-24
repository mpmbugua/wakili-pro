/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-spa-files',
      closeBundle() {
        try {
          copyFileSync('public/_redirects', 'dist/_redirects')
          console.log('✓ Copied _redirects to dist/')
        } catch (err) {
          console.warn('Could not copy _redirects:', err)
        }
        try {
          copyFileSync('public/_headers', 'dist/_headers')
          console.log('✓ Copied _headers to dist/')
        } catch (err) {
          console.warn('Could not copy _headers:', err)
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src')
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