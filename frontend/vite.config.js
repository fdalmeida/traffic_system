import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    strictPort: true,
    watch: {
      usePolling: true, // Corrige problemas de atualização em tempo real
    },
    hmr: {
      overlay: false, // Remove o overlay de erro do HMR
    },
  },
  build: {
    outDir: 'dist',
  },
  base: '/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    'process.env': {},
  },
});
