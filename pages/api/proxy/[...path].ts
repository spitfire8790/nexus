import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = (req.query.path as string[]).join('/');
  const url = `https://portal.spatial.nsw.gov.au/${path}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Accept': req.headers.accept || '*/*',
        'User-Agent': req.headers['user-agent'] || ''
      }
    });

    // Handle HEAD requests differently
    if (req.method === 'HEAD') {
      res.status(response.status).end();
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
} 