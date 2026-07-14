import redis from='ioredis';

// Redis client setup
const cacheClient = new redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  database: process.env.REDIS_DB || 0,
});

export default cacheClient;