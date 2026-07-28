/**
 * Query result caching layer for database queries
 * Reduces database load for frequently accessed data
 */

import { getCacheManager } from './index.js';

export interface QueryCacheOptions {
  ttl?: number; // Time to live in seconds
}

/**
 * Cache database query results
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryCacheOptions = {},
): Promise<T> {
  const cache = getCacheManager();
  const cacheKey = `query:${key}`;

  return cache.getOrSet(cacheKey, queryFn, { ttl: options.ttl });
}

/**
 * Invalidate cache for a specific pattern
 */
export async function invalidateQueryCache(_pattern: string): Promise<void> {
  const cache = getCacheManager();
  // For Redis, we would use pattern matching to delete keys
  // For now, we'll clear the entire cache for simplicity
  await cache.clear();
}

/**
 * Generate cache key for common query patterns
 */
export function generateQueryKey(
  table: string,
  filters: Record<string, unknown>,
  orderBy?: string,
): string {
  const filterStr = JSON.stringify(filters, Object.keys(filters).sort());
  const orderStr = orderBy ? `::${orderBy}` : '';
  return `${table}:${filterStr}${orderStr}`;
}
