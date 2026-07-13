// Elephant Marketplace API
// Handles marketplace scanning for Amazon/Etsy

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { platform, query } = req.body;

    // Get API key from environment (stored securely)
    const apiKey = process.env.ELEPHANT_MARKETPLACE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Marketplace API key not configured' });
    }

    let endpoint = '';
    switch (platform) {
      case 'amazon':
        endpoint = `https://api.amazon.com/search`;
        break;
      case 'etsy':
        endpoint = `https://openapi.etsy.com/v2/listings/active`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid platform' });
    }

    const response = await axios.get(endpoint, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      params: { q: query }
    });

    // Process and format results
    const results = response.data.map((item: any) => ({
      title: item.title || item.name,
      price: item.price || item.listing_price,
      url: item.url || item.listing_url,
      image: item.image_url || item.images?.[0]?.url,
      platform
    }));

    res.status(200).json({ results });
  } catch (error) {
    console.error('Marketplace API error:', error);
    res.status(500).json({ error: 'Marketplace scan failed' });
  }
};

export default handler;