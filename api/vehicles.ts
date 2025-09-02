import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  getVehicles, 
  getVehicleById, 
  getFilterOptions,
  healthCheck 
} from '../server/routes/vehicles.js';

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
    
    if (urlPath === '/api/vehicles' && method === 'GET') {
      return await getVehicles(req as any, res as any);
    }
    
    if (urlPath === '/api/vehicles/filters' && method === 'GET') {
      return await getFilterOptions(req as any, res as any);
    }
    
    if (urlPath.startsWith('/api/vehicles/') && method === 'GET') {
      const id = urlPath.split('/').pop();
      if (id) {
        req.params = { id };
        return await getVehicleById(req as any, res as any);
      }
    }
    
    if (urlPath === '/api/health' && method === 'GET') {
      return await healthCheck(req as any, res as any);
    }
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
