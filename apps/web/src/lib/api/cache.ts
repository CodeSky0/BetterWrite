import { logger } from '@betterwrite/shared/logger';
import type { Redis } from 'ioredis';
import { getRedis } from './redis';

const cacheLogger = logger.child({ component: 'cache' });

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

// Bug #PERF-4.1: 缩短清理间隔为 30 秒，更快释放过期缓存内存
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 30_000).unref();

export async function memoizeAsync<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(`cache:${key}`);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      cacheLogger.warn({ err }, '[Cache] Redis read failed');
    }
  }

  const existing = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }

  const value = await fn();

  if (redis) {
    try {
      await redis.setex(
        `cache:${key}`,
        Math.max(1, Math.ceil(ttlMs / 1000)),
        JSON.stringify(value),
      );
    } catch (err) {
      cacheLogger.warn({ err }, '[Cache] Redis write failed');
    }
  }

  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

// Bug #PERF-4.2: 添加带标签的缓存，支持按标签批量失效
const keyTagsMap = new Map<string, Set<string>>(); // tag -> set of keys

async function deleteRedisKeysByPrefix(redis: Redis, prefix: string): Promise<void> {
  const pattern = `${prefix}*`;
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');
}

export function invalidateCache(prefix: string): void {
  const redis = getRedis();
  if (redis) {
    deleteRedisKeysByPrefix(redis, `cache:${prefix}`).catch((err) =>
      cacheLogger.warn({ err }, '[Cache] Redis invalidation failed'),
    );
  }

  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
}

export function memoizeWithTags<T>(
  key: string,
  tags: string[],
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const result = memoizeAsync(key, ttlMs, fn);

  // 记录 key 与 tag 的关联
  result
    .then(() => {
      for (const tag of tags) {
        if (!keyTagsMap.has(tag)) {
          keyTagsMap.set(tag, new Set());
        }
        keyTagsMap.get(tag)?.add(key);
      }
    })
    .catch(() => {}); // ignore errors

  return result;
}

export function invalidateCacheByTag(tag: string): void {
  const keys = keyTagsMap.get(tag);
  if (!keys || keys.size === 0) return;

  // 失效所有关联的 key
  for (const key of keys) {
    invalidateCache(key);
  }
  keyTagsMap.delete(tag);
}
