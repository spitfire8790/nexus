import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx']
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5174,
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        secure: false
      },
      '/api/tiles': {
        target: 'https://tiles.opencitymodel.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('Rewriting path:', path);
          return `/data/v1${path.replace(/^\/api\/tiles/, '')}`;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
            console.log('Original URL:', req.url);
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/nsw-spatial': {
        target: 'https://portal.spatial.nsw.gov.au',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nsw-spatial/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('NSW Spatial proxy error:', err);
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying NSW Spatial:', req.method, req.url, '→', proxyReq.path);
          });
        }
      }
    }
  }
});
