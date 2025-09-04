import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, module = 'account', action = 'txlist' } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address parameter required' });
  }

  // Use server-side environment variable for API key
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  
  if (!etherscanApiKey) {
    return res.status(500).json({ 
      error: 'Etherscan API not configured',
      message: 'Please configure ETHERSCAN_API_KEY in backend environment'
    });
  }

  try {
    // Proxy request to Etherscan API using server-side API key
    const etherscanUrl = `https://api-sepolia.basescan.org/api?module=${module}&action=${action}&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`;
    
    const response = await fetch(etherscanUrl);
    const data = await response.json();
    
    if (response.ok) {
      // Filter and sanitize data before sending to frontend
      const sanitizedData = {
        ...data,
        // Remove any sensitive information if present
        apikey: undefined,
        key: undefined
      };
      
      res.status(200).json(sanitizedData);
    } else {
      res.status(response.status).json({ 
        error: 'Etherscan API error',
        status: response.status 
      });
    }
    
  } catch (error) {
    console.error('Etherscan API proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction data',
      message: 'Etherscan API unavailable'
    });
  }
}
