import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), visualizer({ open: true, filename: 'stats.html' })],
  server: {
    port: 5173,
    // Allow Vite to pick the next available port if 5173 is busy
    strictPort: false,
  },
})
