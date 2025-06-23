import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  base: '/',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    }
  },
  
  server: {
    port: 8001,
    host: true,
    open: false,
    cors: true,
    
    // Proxy the existing Python WebSocket server
    proxy: {
      '/ws': {
        target: 'ws://localhost:8002',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['lit']
  },
  
  // Public directory for static assets
  publicDir: '../public'
});