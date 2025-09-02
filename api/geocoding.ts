import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  geocodeZip,
  geocodeBatch,
  geocodingHealthCheck,
  getCacheStats,
  clearGeocodingCache
} from '../server/routes/geocoding.js';

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
    
    if (urlPath === '/api/geocode/health' && method === 'GET') {
      return await geocodingHealthCheck(req as any, res as any);
    }
    
    if (urlPath === '/api/geocode/cache/stats' && method === 'GET') {
      return await getCacheStats(req as any, res as any);
    }
    
    if (urlPath === '/api/geocode/cache' && method === 'DELETE') {
      return await clearGeocodingCache(req as any, res as any);
    }
    
    if (urlPath.startsWith('/api/geocode/') && method === 'GET') {
      const zip = urlPath.split('/').pop();
      if (zip && zip !== 'health' && zip !== 'cache') {
        req.params = { zip };
        return await geocodeZip(req as any, res as any);
      }
    }
    
    if (urlPath === '/api/geocode/batch' && method === 'POST') {
      return await geocodeBatch(req as any, res as any);
    }
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
