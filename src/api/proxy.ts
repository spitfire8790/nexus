import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

// Proxy for historical imagery tile requests
router.use('/tileservices/*', createProxyMiddleware({
  target: 'https://portal.spatial.nsw.gov.au',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy/tileservices': '/tileservices' // Remove the /api/proxy prefix
  },
  onProxyReq: (proxyReq) => {
    // Add any required headers for the NSW Spatial Portal
    proxyReq.setHeader('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8');
    proxyReq.setHeader('Referer', 'https://portal.spatial.nsw.gov.au/');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error occurred');
  }
}));

// Default handler for other proxy requests
router.use('/', (req, res) => {
  res.status(404).send('Invalid proxy endpoint');
});

export default router;
