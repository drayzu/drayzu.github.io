import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700, // three.js is most of it, and it is one piece anyway
  },
});
