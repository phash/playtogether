import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const versionJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../version.json'), 'utf-8')
);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(versionJson.version),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
