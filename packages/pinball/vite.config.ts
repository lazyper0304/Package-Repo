import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/pinball/',
  plugins: [react()],
  build: {
    outDir: '../../dist/pinball',
  },
  css: {
    modules: {
      localsConvention: 'camelCase' as const,
    },
  },
  server: {
    port: 3010,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
      },
    },
  },
});
