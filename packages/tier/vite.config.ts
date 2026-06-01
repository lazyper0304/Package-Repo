import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/tier/',
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    outDir: '../../dist/tier',
    emptyOutDir: true,
  },
  server: {
    port: 3005,
  },
})
