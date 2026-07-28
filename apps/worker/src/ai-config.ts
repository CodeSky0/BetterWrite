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
import { API_CONFIG_UPDATED_CHANNEL } from '@betterwrite/shared/queue';
import { desc, eq } from 'drizzle-orm';
import { Redis } from 'ioredis';

const configLogger = logger.child({ component: 'worker-ai-config' });

// 轮询兜底间隔：Redis pub/sub 消息可能丢失（订阅连接闪断期间无补发），
// 每 60s 强制对账一次 DB，保证配置最终一致。
const POLL_INTERVAL_MS = 60_000;

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

// 从 DB 加载启用的 API 配置与模型路由，解密 Key 后构建动态路由器。
// AI Key 不再来自环境变量，统一由超级管理员在后台配置（api_configs 表，AES-256-GCM 加密存储）。
export async function loadRouterFromDb(): Promise<AIProviderRouter> {
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
      // 解密失败通常是 ENCRYPTION_KEY 与写入时不一致；跳过该条并告警，不拖垮整体加载。
      configLogger.error(
        { err, configId: row.id, provider: row.provider },
        'Failed to decrypt API key, skipping config (check ENCRYPTION_KEY consistency)',
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

  const router = createRouterFromConfigs(endpoints, routeMap);
  configLogger.info(
    { endpointCount: endpoints.length, providers: router.availableNames(), routes: routeMap },
    'AI router (re)loaded from database',
  );
  return router;
}

// AI 路由器管理器：持有当前路由器实例，支持热更新。
// 更新途径：1) Redis 订阅 API_CONFIG_UPDATED_CHANNEL（web 端写配置后 publish）；
//          2) 定时轮询兜底。刷新失败时保留旧路由器继续服务。
export class AiRouterManager {
  private router: AIProviderRouter | null = null;
  private subscriber: Redis | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private refreshing: Promise<void> | null = null;

  getRouter(): AIProviderRouter {
    if (!this.router) {
      throw new Error('AiRouterManager not started, call start() first');
    }
    return this.router;
  }

  // 懒加载入口：未 start() 时（如单测直接调用 processCorrection）首次使用时加载一次。
  async ensureRouter(): Promise<AIProviderRouter> {
    if (!this.router) {
      await this.refresh();
    }
    return this.router ?? createRouterFromConfigs([]);
  }

  async refresh(): Promise<void> {
    // 并发去重：订阅消息与轮询同时触发时只执行一次加载。
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      try {
        this.router = await loadRouterFromDb();
      } catch (err) {
        configLogger.error({ err }, 'Failed to refresh AI router, keeping previous config');
        // 首次加载失败时兜底为空路由器，worker 走 mock 批改而不是崩溃。
        if (!this.router) {
          this.router = createRouterFromConfigs([]);
        }
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  async start(redisUrl?: string): Promise<void> {
    await this.refresh();

    if (redisUrl) {
      this.subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
      this.subscriber.on('error', (err) => {
        configLogger.warn({ err }, 'AI config subscriber redis error');
      });
      try {
        await this.subscriber.subscribe(API_CONFIG_UPDATED_CHANNEL);
        this.subscriber.on('message', (channel) => {
          if (channel !== API_CONFIG_UPDATED_CHANNEL) return;
          configLogger.info('API config update notification received, reloading');
          void this.refresh();
        });
      } catch (err) {
        configLogger.warn({ err }, 'Failed to subscribe config channel, relying on polling');
      }
    }

    this.pollTimer = setInterval(() => void this.refresh(), POLL_INTERVAL_MS);
    // 不阻止进程退出
    this.pollTimer.unref?.();
  }

  async stop(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.subscriber) {
      try {
        await this.subscriber.quit();
      } catch {
        this.subscriber.disconnect();
      }
      this.subscriber = null;
    }
  }
}

export const aiRouterManager = new AiRouterManager();
