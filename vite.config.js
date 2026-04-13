// Production build optimization for Vite
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Enable brotli compression
    brotliSize: true,
    // Generate manifest for better caching
    manifest: true,
    // Polyfill for older browsers
    polyfillModulePreload: true
  },
  // Production server settings
  server: {
    host: true,
    port: 3000
  }
})