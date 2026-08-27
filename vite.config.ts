/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// BASE_PATH is injected by the GitHub Pages workflow so built asset URLs resolve
// under https://<user>.github.io/<repo>/ rather than the domain root.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Vite 8 / Rollup only accept the function form here. Splitting the
        // heavy 3D libraries out keeps the app chunk small and cacheable.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('postprocessing')) return 'postfx';
          if (id.includes('@react-three')) return 'r3f';
          if (id.includes('three')) return 'three';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
