import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import cacheClient from '@/lib/cache';

/**
 * Cache middleware for API routes
 * @param handler - The API route handler
 * @param getCacheKey - Function to generate cache key from request
 * @param ttl - Time to live in seconds
 */
export function withCache(
  handler: NextApiHandler,
  getCacheKey: (req: NextApiRequest) => string,
  ttl: number = 60 // default 60 seconds
): NextApiHandler {
  return async (req, res) => {
    const cacheKey = getCacheKey(req);
    let cachedData = null;

    try {
      const cached = await cacheClient.get(cacheKey);
      if (cached) {
        cachedData = JSON.parse(cached);
        return res.status(200).json(cachedData);
      }
    } catch (error) {
      console.error('Cache read error:', error);
      // Continue to handler on cache error
    }

    // Override res.send to cache the response before sending
    const originalSend = res.send;
    res.send = function (body: any) {
      try {
        // Cache successful responses (2xx status codes)
        if (typeof body === 'object' && body !== null && res.statusCode >= 200 && res.statusCode < 300) {
          cacheClient.setex(cacheKey, ttl, JSON.stringify(body));
        }
      } catch (error) {
        console.error('Cache write error:', error);
      }
      return originalSend.call(this, body);
    };

    return handler(req, res);
  };
}

export default withCache;