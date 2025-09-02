import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  calculatePayment,
  calculateBulkPayments,
  calculateAffordablePrice,
  getCacheStats,
  clearCache
} from '../server/routes/payments.js';

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
    
    if (urlPath === '/api/payments/calculate' && method === 'POST') {
      return await calculatePayment(req as any, res as any);
    }
    
    if (urlPath === '/api/payments/bulk' && method === 'POST') {
      return await calculateBulkPayments(req as any, res as any);
    }
    
    if (urlPath === '/api/payments/affordable-price' && method === 'POST') {
      return await calculateAffordablePrice(req as any, res as any);
    }
    
    if (urlPath === '/api/payments/cache-stats' && method === 'GET') {
      return await getCacheStats(req as any, res as any);
    }
    
    if (urlPath === '/api/payments/cache' && method === 'DELETE') {
      return await clearCache(req as any, res as any);
    }
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
