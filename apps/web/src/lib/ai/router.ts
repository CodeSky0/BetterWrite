import {
  type AIProviderRouter,
  type AiEndpointConfig,
  type CorrectionType,
  type ModelRouteMap,
  createRouterFromConfigs,
} from '@betterwrite/ai';
import { apiConfigs, db, modelRoutes } from '@betterwrite/db';
import { decrypt } from '@betterwrite/shared/crypto';
import { logger } from '@betterwrite/shared/logger';
import { desc, eq } from 'drizzle-orm';

const routerLogger = logger.child({ component: 'web-ai-router' });

// AI Key 不再从环境变量读取，统一由超管在管理后台配置（api_configs 表，加密存储）。
// web 进程内按 TTL 缓存路由器；管理端写配置后调用 invalidateAiRouterCache() 立即生效，
// 其他实例最迟 TTL 过期后拿到新配置。
const ROUTER_CACHE_TTL_MS = 60_000;

const CORRECTION_TYPES: ReadonlyArray<CorrectionType> = [
  'content',
  'topicAdherence',
  'language',
  'structure',
  'scorer',
];

function isCorrectionType(value: string): value is CorrectionType {
  return (CORRECTION_TYPES as readonly string[]).includes(value);
}

let cached: { router: AIProviderRouter; loadedAt: number } | null = null;
let loading: Promise<AIProviderRouter> | null = null;

async function buildRouterFromDb(): Promise<AIProviderRouter> {
  const rows = await db.query.apiConfigs.findMany({
    where: eq(apiConfigs.isActive, true),
    orderBy: desc(apiConfigs.priority),
  });

  const endpoints: AiEndpointConfig[] = [];
  for (const row of rows) {
    try {
      endpoints.push({
        id: row.id,
        provider: row.provider,
        apiKey: decrypt(row.apiKeyEncrypted),
        baseUrl: row.baseUrl,
        model: row.model,
        priority: row.priority,
        maxTokens: row.maxTokens,
        temperature: row.temperature,
        rateLimitPerMin: row.rateLimitPerMin,
      });
    } catch (err) {
      routerLogger.error(
        { err, configId: row.id, provider: row.provider },
        '[AiRouter] decrypt API key failed, skipping config',
      );
    }
  }

  const routeRows = await db.query.modelRoutes.findMany();
  const routeMap: ModelRouteMap = {};
  for (const route of routeRows) {
    if (isCorrectionType(route.stage)) {
      routeMap[route.stage] = route.apiConfigId;
    }
  }

  return createRouterFromConfigs(endpoints, routeMap);
}

export async function getAiRouter(): Promise<AIProviderRouter> {
  const now = Date.now();
  if (cached && now - cached.loadedAt < ROUTER_CACHE_TTL_MS) {
    return cached.router;
  }
  // 并发去重：多个请求同时触发重建时只查一次 DB。
  if (!loading) {
    loading = buildRouterFromDb()
      .then((router) => {
        cached = { router, loadedAt: Date.now() };
        return router;
      })
      .catch((err) => {
        routerLogger.error({ err }, '[AiRouter] build from DB failed');
        // 加载失败时沿用旧缓存（若有），否则返回空路由器（调用方按"未配置"处理）。
        if (cached) return cached.router;
        return createRouterFromConfigs([]);
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

// 管理端增删改 API 配置 / 模型路由后调用，使本进程缓存立即失效。
export function invalidateAiRouterCache(): void {
  cached = null;
}
