import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  getSimpleVehicles,
  getSimpleVehicleById,
  getSimpleFilterOptions,
  getCombinedVehicleData,
  getDealers,
  getVehicleTypes,
  simpleHealthCheck,
  testWooCommerceApi
} from '../server/routes/simpleVehicles.js';

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
    
    if (urlPath === '/api/simple-vehicles' && method === 'GET') {
      return await getSimpleVehicles(req as any, res as any);
    }
    
    if (urlPath === '/api/simple-vehicles/filters' && method === 'GET') {
      return await getSimpleFilterOptions(req as any, res as any);
    }
    
    if (urlPath === '/api/simple-vehicles/combined' && method === 'GET') {
      return await getCombinedVehicleData(req as any, res as any);
    }
    
    if (urlPath.startsWith('/api/simple-vehicles/') && method === 'GET') {
      const id = urlPath.split('/').pop();
      if (id && id !== 'filters' && id !== 'combined') {
        req.params = { id };
        return await getSimpleVehicleById(req as any, res as any);
      }
    }
    
    if (urlPath === '/api/dealers' && method === 'GET') {
      return await getDealers(req as any, res as any);
    }
    
    if (urlPath === '/api/vehicle-types' && method === 'GET') {
      return await getVehicleTypes(req as any, res as any);
    }
    
    if (urlPath === '/api/simple-health' && method === 'GET') {
      return await simpleHealthCheck(req as any, res as any);
    }
    
    if (urlPath === '/api/test-woocommerce' && method === 'GET') {
      return await testWooCommerceApi(req as any, res as any);
    }
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
