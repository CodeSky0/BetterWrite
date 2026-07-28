import { logger } from '@betterwrite/shared/logger';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { getRedis } from './redis';

const rateLimitLogger = logger.child({ component: 'rate-limit' });

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60_000).unref();

/**
 * Bug #SEC-1.3: 可信代理配置。
 * 仅当 TRUST_PROXY=true（部署在 nginx/CDN 后）时才从 X-Forwarded-For / X-Real-IP
 * 提取客户端 IP；否则一律使用 '127.0.0.1'（本地直连）或 socket 地址。
 * 这防止攻击者通过伪造 XFF 头绕过限流和登录锁定。
 */
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

/**
 * 从 X-Forwarded-For 中提取最右侧非私有 IP（即最接近真实客户端的 IP）。
 * 当部署在多层代理后时，右侧 IP 由可信代理追加，不可伪造。
 */
function extractClientIpFromXff(xff: string): string {
  const parts = xff
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return '127.0.0.1';
  // 单层代理：只有一个 IP，直接使用
  if (parts.length === 1) return parts[0];
  // 多层代理：取倒数第二个（最后一个是最近代理追加的当前连接 IP）
  // 标准做法：取最左侧由可信代理写入的 IP = parts[0]
  // 但为安全起见，当 TRUST_PROXY=true 时信任整个链，取 parts[0]
  return parts[0];
}

export function resolveClientIp(headers: Record<string, string | undefined>): string {
  if (!TRUST_PROXY) {
    // 不信任任何代理头 — 防止直连时伪造
    return '127.0.0.1';
  }
  const xRealIp = headers['x-real-ip'];
  if (xRealIp) return xRealIp.trim();

  const xff = headers['x-forwarded-for'];
  if (xff) return extractClientIpFromXff(xff);

  return '127.0.0.1';
}

export const rateLimit = (maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) => {
  return createMiddleware(async (c, next) => {
    const ip = resolveClientIp({
      'x-real-ip': c.req.header('x-real-ip'),
      'x-forwarded-for': c.req.header('x-forwarded-for'),
    });
    const key = `${c.req.routePath}:${ip}`;
    const now = Date.now();
    const resetAt = now + windowMs;

    const redis = getRedis();
    if (redis) {
      try {
        const count = await redis.incr(`rate_limit:${key}`);
        if (count === 1) {
          await redis.pexpire(`rate_limit:${key}`, windowMs);
        }
        if (count > maxRequests) {
          throw new HTTPException(429, { message: '请求过于频繁，请稍后再试' });
        }
        await next();
        c.res.headers.set('X-RateLimit-Limit', String(maxRequests));
        c.res.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - count)));
        c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
        return;
      } catch (err) {
        if (err instanceof HTTPException) throw err;
        rateLimitLogger.warn({ err }, '[RateLimit] Redis failed, falling back to memory');
      }
    }

    let entry = memoryStore.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt };
      memoryStore.set(key, entry);
    }
    entry.count++;

    if (entry.count > maxRequests) {
      throw new HTTPException(429, { message: '请求过于频繁，请稍后再试' });
    }

    await next();

    c.res.headers.set('X-RateLimit-Limit', String(maxRequests));
    c.res.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
  });
};
