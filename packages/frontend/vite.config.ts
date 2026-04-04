import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

// https://vite.dev/config/
export default defineConfig({
  plugins: [wasm(), topLevelAwait(), react()],
  build: {
    target: 'esnext',
    emptyOutDir: true,
    outDir: '../../dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        repo: path.resolve(__dirname, 'repo.html'),
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      scopeBehaviour: 'local',
      generateScopedName: '[local]___[hash:base64:5]',
      globalModulePaths: [/global\.less$/],
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['app.ybxylazycats.dpdns.org', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
