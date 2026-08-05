import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;
let isRedisReady = false;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: redisUrl,
      // Attempt reconnection
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.warn('[Redis] Max reconnection attempts reached. Continuing in fallback mode.');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000); // Wait longer on subsequent attempts
        }
      }
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Client error:', err.message);
      isRedisReady = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Connected to Redis successfully');
      isRedisReady = true;
    });

    redisClient.on('end', () => {
      console.log('[Redis] Connection closed');
      isRedisReady = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('[Redis] Failed to initialize connection:', error.message);
    isRedisReady = false;
  }
};

/**
 * Get cached value for a key
 * @param {string} key 
 * @returns {Promise<any | null>}
 */
export const getCache = async (key) => {
  if (!isRedisReady || !redisClient) {
    return null;
  }
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn(`[Redis] getCache error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Set cached value for a key with an optional TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds (default 7 days: 86400 * 7)
 */
export const setCache = async (key, value, ttlSeconds = 86400 * 7) => {
  if (!isRedisReady || !redisClient) {
    return false;
  }
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
    return true;
  } catch (error) {
    console.warn(`[Redis] setCache error for key ${key}:`, error.message);
    return false;
  }
};

export const getRedisClient = () => redisClient;
