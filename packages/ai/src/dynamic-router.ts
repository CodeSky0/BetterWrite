import { logger } from '@betterwrite/shared/logger';
import type { BaseAIProvider } from './providers/base.js';
import { DeepSeekProvider } from './providers/deepseek.js';
import { OpenAICompatibleProvider } from './providers/openai-compatible.js';
import { OpenAIProvider } from './providers/openai.js';
import { AIProviderRouter, type CorrectionType } from './router.js';

const aiLogger = logger.child({ component: 'ai-dynamic-router' });

// 由管理后台 api_configs 表驱动的端点配置（apiKey 已解密）。
export interface AiEndpointConfig {
  id: string;
  provider: string;
  apiKey: string;
  baseUrl?: string | null;
  model?: string | null;
  priority?: number;
  maxTokens?: number | null;
  temperature?: number | null;
  rateLimitPerMin?: number | null;
}

// 批改环节 -> 首选 api_configs.id 的映射（model_routes 表）。
export type ModelRouteMap = Partial<Record<CorrectionType, string>>;

// 已知 provider 的 OpenAI 兼容端点默认值；custom/other 必须显式填写 baseUrl。
const DEFAULT_BASE_URLS: Record<string, string> = {
  anthropic: 'https://api.anthropic.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
  anthropic: 'claude-sonnet-4-20250514',
  qwen: 'qwen-plus',
};

// 每分钟滑动窗口限流器：对应 api_configs.rate_limit_per_min。
// 单进程内存实现——worker 是唯一批改进程，足以防止把单一 Key 打爆。
class MinuteRateLimiter {
  private windowStart = 0;
  private count = 0;

  constructor(private readonly limit: number | null | undefined) {}

  tryAcquire(now = Date.now()): boolean {
    if (this.limit == null || this.limit <= 0) return true;
    if (now - this.windowStart >= 60_000) {
      this.windowStart = now;
      this.count = 0;
    }
    if (this.count >= this.limit) return false;
    this.count++;
    return true;
  }
}

interface Endpoint {
  config: AiEndpointConfig;
  provider: BaseAIProvider;
  limiter: MinuteRateLimiter;
}

// 根据单条配置构造 provider 实例。openai/deepseek 走官方 SDK 适配器，
// 其余（anthropic/qwen/custom 等）统一走 OpenAI 兼容端点。
export function createEndpointProvider(config: AiEndpointConfig): BaseAIProvider {
  const model = config.model ?? DEFAULT_MODELS[config.provider];
  switch (config.provider) {
    case 'openai': {
      const provider = new OpenAIProvider(config.apiKey, config.baseUrl ?? undefined);
      (provider as { defaultModel: string }).defaultModel = model ?? 'gpt-4o';
      return provider;
    }
    case 'deepseek': {
      const provider = new DeepSeekProvider(config.apiKey, config.baseUrl ?? undefined);
      (provider as { defaultModel: string }).defaultModel = model ?? 'deepseek-chat';
      return provider;
    }
    default: {
      const baseUrl = config.baseUrl ?? DEFAULT_BASE_URLS[config.provider];
      if (!baseUrl) {
        throw new Error(`AI provider "${config.provider}" 需要配置 Base URL（OpenAI 兼容端点）`);
      }
      if (!model) {
        throw new Error(`AI provider "${config.provider}" 需要配置 Model 名称`);
      }
      return new OpenAICompatibleProvider(config.provider, config.apiKey, baseUrl, model);
    }
  }
}

// 动态路由器：端点列表按 priority 从高到低排序；
// - route(type)：若 model_routes 为该环节固定了配置则优先返回它，否则取最高优先级端点；
// - executeWithFallback：按候选顺序依次尝试，跳过被限流的端点，全部失败才抛错。
// 继承 AIProviderRouter 以保持 correctEssay / assistant 等既有调用方的类型兼容。
export class DynamicAIProviderRouter extends AIProviderRouter {
  private endpoints: Endpoint[] = [];
  private modelRoutes: ModelRouteMap = {};

  addEndpoint(config: AiEndpointConfig, provider?: BaseAIProvider): void {
    const instance = provider ?? createEndpointProvider(config);
    instance.setGenerationDefaults({
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
    this.endpoints.push({
      config,
      provider: instance,
      limiter: new MinuteRateLimiter(config.rateLimitPerMin),
    });
    this.endpoints.sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0));
    // 兼容基类按名称查询（has/get）；同名多端点时保留最高优先级实例。
    if (!this.has(instance.name)) {
      this.register(instance);
    }
  }

  setModelRoutes(routes: ModelRouteMap): void {
    this.modelRoutes = routes;
  }

  availableNames(): string[] {
    return Array.from(new Set(this.endpoints.map((e) => e.provider.name)));
  }

  private candidatesFor(type: CorrectionType): Endpoint[] {
    const targetId = this.modelRoutes[type];
    if (!targetId) return this.endpoints;
    const target = this.endpoints.find((e) => e.config.id === targetId);
    // 路由指向的配置被停用/删除时退回全局优先级链，保证批改不中断。
    if (!target) return this.endpoints;
    return [target, ...this.endpoints.filter((e) => e !== target)];
  }

  route(type: CorrectionType): BaseAIProvider {
    const [first] = this.candidatesFor(type);
    if (!first) {
      throw new Error('No AI endpoint configured');
    }
    return first.provider;
  }

  async executeWithFallback<T>(
    type: CorrectionType,
    fn: (provider: BaseAIProvider) => Promise<T>,
  ): Promise<T> {
    const candidates = this.candidatesFor(type);
    if (candidates.length === 0) {
      throw new Error('No AI endpoint configured');
    }
    let lastError: unknown;
    let attempted = false;
    for (const endpoint of candidates) {
      if (!endpoint.limiter.tryAcquire()) {
        aiLogger.warn(
          { provider: endpoint.provider.name, configId: endpoint.config.id, type },
          'AI endpoint rate-limited, trying next',
        );
        continue;
      }
      attempted = true;
      try {
        return await fn(endpoint.provider);
      } catch (error) {
        lastError = error;
        aiLogger.warn(
          { err: error, provider: endpoint.provider.name, configId: endpoint.config.id, type },
          'AI endpoint failed, trying next',
        );
      }
    }
    if (!attempted) {
      throw new Error('All AI endpoints are rate-limited, please retry later');
    }
    throw lastError;
  }
}

// 由 DB 配置行构建路由器。单条配置非法（缺 baseUrl/model 等）时跳过并告警，
// 不影响其余端点。
export function createRouterFromConfigs(
  configs: AiEndpointConfig[],
  routes?: ModelRouteMap,
): DynamicAIProviderRouter {
  const router = new DynamicAIProviderRouter();
  for (const config of configs) {
    try {
      router.addEndpoint(config);
    } catch (error) {
      aiLogger.warn(
        { err: error, provider: config.provider, configId: config.id },
        'Skip invalid AI endpoint config',
      );
    }
  }
  if (routes) {
    router.setModelRoutes(routes);
  }
  return router;
}
