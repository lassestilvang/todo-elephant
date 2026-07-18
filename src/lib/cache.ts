/**
 * Advanced Caching Layer for Todo Elephant
 * Supports Redis with fallback to in-memory cache
 */

import { createClient } from 'redis';

// In-memory cache fallback (for when Redis is unavailable)
class MemoryCache {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private maxSize: number = 1000;

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number = 300): void {
    // Simple LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

// Redis client with connection handling
let redisClient: ReturnType<typeof createClient> | null = null;
let memoryCache = new MemoryCache();
let redisAvailable = false;

async function getRedisClient() {
  if (redisClient) return redisClient;

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0')
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
      redisAvailable = false;
    });

    await redisClient.connect();
    redisAvailable = true;
    console.log('Redis cache connected');
  } catch (error) {
    console.warn('Redis not available, using memory cache:', error);
    redisAvailable = false;
  }

  return redisClient;
}

// Cache key generator
export function cacheKey(prefix: string, userId: string, params?: Record<string, any>): string {
  const baseKey = `${prefix}:${userId}`;
  if (!params) return baseKey;

  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}:${params[k]}`)
    .join('|');

  return `${baseKey}:${sortedParams}`;
}

// Get from cache (Redis or memory)
export async function getFromCache(key: string): Promise<any | null> {
  // Try Redis first
  if (redisAvailable && redisClient) {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis get error, falling back to memory:', error);
    }
  }

  // Fallback to memory cache
  return memoryCache.get(key);
}

// Set in cache (Redis or memory)
export async function setInCache(
  key: string,
  data: any,
  ttlSeconds: number = 300
): Promise<void> {
  // Try Redis first
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      return;
    } catch (error) {
      console.warn('Redis set error, falling back to memory:', error);
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, data, ttlSeconds);
}

// Delete from cache
export async function deleteFromCache(key: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn('Redis delete error:', error);
    }
  }

  memoryCache.del(key);
}

// Clear user cache (useful when user data changes)
export async function clearUserCache(userId: string, pattern?: string): Promise<void> {
  const searchPattern = pattern ? `${userId}:${pattern}*` : `${userId}:*`;

  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(searchPattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.warn('Redis clear user cache error:', error);
    }
  }

  // Clear memory cache - simple approach
  for (const key of Array.from(memoryCache['cache'].keys())) {
    if (key.includes(userId) && (pattern ? key.includes(pattern) : true)) {
      memoryCache.del(key);
    }
  }
}

// Cache decorator for API handlers
export function withCache<P extends Record<string, any>>(
  keyGenerator: (params: P) => string,
  ttlSeconds: number = 300
) {
  return function<T>(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const params = args[0]; // Assuming first arg is params
      const key = keyGenerator(params);

      const cached = await getFromCache(key);
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      await setInCache(key, result, ttlSeconds);

      return result;
    };
  };
}

// Cache invalidation hooks
export const CACHE_INVALIDATION = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_COMPLETED: 'task:completed',
  USER_SETTINGS_CHANGED: 'user:settings',
  LIST_CREATED: 'list:created',
  LABEL_CREATED: 'label:created'
};

// Invalidate related caches
export async function invalidateRelatedCaches(
  userId: string,
  type: string,
  ids?: string[]
): Promise<void> {
  const patterns: string[] = [];

  switch (type) {
    case 'task':
      patterns.push('tasks', 'dashboard', 'stats', 'kanban', 'dependencies');
      if (ids) {
        for (const id of ids) {
          await deleteFromCache(`tasks:${userId}:${id}`);
        }
      }
      break;
    case 'list':
      patterns.push('tasks', 'dashboard', 'stats');
      break;
    case 'label':
      patterns.push('tasks', 'dashboard');
      break;
  }

  // Clear all matching cache keys
  for (const pattern of patterns) {
    await clearUserCache(userId, pattern);
  }
}

export default {
  get: getFromCache,
  set: setInCache,
  del: deleteFromCache,
  clearUser: clearUserCache,
  key: cacheKey
};