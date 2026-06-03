import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/game2048/',
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: '../../dist/game2048',
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    port: 3008,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
