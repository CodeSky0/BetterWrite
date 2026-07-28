import { Redis } from 'ioredis';
import { logger } from '../logger.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

const DEFAULT_TTL = 3600; // 1 hour
const DEFAULT_PREFIX = 'bw:cache:';

export class CacheManager {
  private redis: Redis | null = null;
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private prefix: string;

  constructor(redisUrl?: string, options: CacheOptions = {}) {
    this.prefix = options.prefix ?? DEFAULT_PREFIX;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });
        this.redis.on('error', (err) => {
          logger.error({ err }, 'Redis cache error');
        });
      } catch (err) {
        logger.warn({ err }, 'Failed to initialize Redis cache, using local cache only');
      }
    }
  }

  /**
   * Get value from cache (Redis first, then local)
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;

    // Try Redis first
    if (this.redis) {
      try {
        const cached = await this.redis.get(fullKey);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          // Check if expired
          if (Date.now() - entry.timestamp < entry.ttl * 1000) {
            // Also store in local cache for faster access
            this.localCache.set(key, entry);
            return entry.data;
          }
          await this.redis.del(fullKey);
        }
      } catch (err) {
        logger.warn({ err, key }, 'Redis cache get failed, falling back to local');
      }
    }

    // Try local cache
    const localEntry = this.localCache.get(key);
    if (localEntry) {
      if (Date.now() - localEntry.timestamp < localEntry.ttl * 1000) {
        return localEntry.data;
      }
      this.localCache.delete(key);
    }

    return null;
  }

  /**
   * Set value in cache (both Redis and local)
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const fullKey = this.prefix + key;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Set in Redis
    if (this.redis) {
      try {
        await this.redis.setex(fullKey, ttl, JSON.stringify(entry));
      } catch (err) {
        logger.warn({ err, key }, 'Redis cache set failed, using local only');
      }
    }

    // Set in local cache
    this.localCache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;

    if (this.redis) {
      try {
        await this.redis.del(fullKey);
      } catch (err) {
        logger.warn({ err, key }, 'Redis cache delete failed');
      }
    }

    this.localCache.delete(key);
  }

  /**
   * Refresh the TTL of an existing key without changing its stored value.
   */
  async expire(key: string, ttl: number): Promise<void> {
    const fullKey = this.prefix + key;

    if (this.redis) {
      try {
        await this.redis.expire(fullKey, ttl);
      } catch (err) {
        logger.warn({ err, key }, 'Redis cache expire failed');
      }
    }

    const localEntry = this.localCache.get(key);
    if (localEntry) {
      localEntry.ttl = ttl;
      localEntry.timestamp = Date.now();
    }
  }

  /**
   * Clear all cache entries with the prefix
   */
  async clear(): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${this.prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err) {
        logger.warn({ err }, 'Redis cache clear failed');
      }
    }

    this.localCache.clear();
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fn();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Clean up expired local cache entries
   */
  cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.localCache.entries()) {
      if (now - entry.timestamp >= entry.ttl * 1000) {
        this.localCache.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    const { env } = require('../env.js');
    cacheManager = new CacheManager(env.REDIS_URL);
  }
  return cacheManager;
}

export function initCacheManager(redisUrl?: string, options?: CacheOptions): CacheManager {
  cacheManager = new CacheManager(redisUrl, options);
  return cacheManager;
}
