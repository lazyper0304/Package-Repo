import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/zombie-shooter/',
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: '../../dist/zombie-shooter',
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    port: 3010,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
