import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // DATABASE_URL / NEXTAUTH_SECRET 在构建阶段可能不存在（Vercel / Docker / CI），
    // 因此设为 optional；运行时由 refine 在生产模式下强制校验。
    DATABASE_URL: z.string().min(1).optional(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    REDIS_URL: z.string().optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    CORS_ORIGIN: z.string().optional(),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    WORKER_HEALTH_PORT: z.coerce.number().default(8080),
    WORKER_CONCURRENCY: z.coerce.number().default(3),
    // AI 供应商密钥不再从环境变量读取，由超管后台配置并加密存入数据库
    EXPO_ACCESS_TOKEN: z.string().optional(),
    ENCRYPTION_KEY: z.string().optional(),
  })
  .refine(
    (data) => {
      // Next.js 构建阶段环境变量不可用（Vercel/CI/Docker），跳过生产校验
      if (process.env.NEXT_PHASE === 'phase-production-build') return true;
      if (data.NODE_ENV === 'production') {
        if (!data.DATABASE_URL) return false;
        if (!data.NEXTAUTH_SECRET) return false;
        if (data.NEXTAUTH_SECRET.length < 32) return false;
        if (!data.REDIS_URL) return false;
        if (!data.ENCRYPTION_KEY || data.ENCRYPTION_KEY.length !== 64) return false;
      }
      return true;
    },
    {
      message:
        '生产环境必须设置 DATABASE_URL、NEXTAUTH_SECRET(>=32字符)、REDIS_URL，且 ENCRYPTION_KEY 长度 = 64',
    },
  );

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
