import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleDemo } from '../server/routes/demo.js';
import { testWordPressConnection } from '../server/routes/testConnection.js';
import { testWordPressApiCall } from '../server/routes/testWordPressApi.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const urlPath = url?.split('?')[0] || '';
    
    if (urlPath === '/api/ping' && method === 'GET') {
      const ping = process.env.PING_MESSAGE ?? "ping";
      return res.json({ message: ping });
    }
    
    if (urlPath === '/api/demo' && method === 'GET') {
      return await handleDemo(req as any, res as any);
    }
    
    if (urlPath === '/api/test-connection' && method === 'GET') {
      return await testWordPressConnection(req as any, res as any);
    }
    
    if (urlPath === '/api/test-wordpress-api' && method === 'GET') {
      return await testWordPressApiCall(req as any, res as any);
    }
    
    if (urlPath === '/api/wordpress/sync-status' && method === 'GET') {
      return res.json({
        status: "serverless",
        message: "WordPress sync is not available in serverless mode",
        note: "Use manual sync or consider traditional deployment for automated sync"
      });
    }
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
