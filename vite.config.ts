import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/eplanning': {
        target: 'https://api.apps1.nsw.gov.au/eplanning',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/eplanning/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.pagesize) {
              proxyReq.setHeader('PageSize', req.headers.pagesize);
            }
            if (req.headers.pagenumber) {
              proxyReq.setHeader('PageNumber', req.headers.pagenumber);
            }
            if (req.headers.filters) {
              proxyReq.setHeader('filters', req.headers.filters);
            }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
});
