import { describe, expect, it } from 'vitest';
import type { ZodSchema } from 'zod';
import {
  type AiEndpointConfig,
  DynamicAIProviderRouter,
  createRouterFromConfigs,
} from '../dynamic-router.js';
import { BaseAIProvider, type LanguageModelResolver } from '../providers/base.js';

class MockProvider extends BaseAIProvider {
  readonly name: string;
  readonly defaultModel: string;
  callCount = 0;
  shouldFail = false;

  constructor(name: string, model = 'mock-model') {
    super();
    this.name = name;
    this.defaultModel = model;
  }

  // Mock client factory - not actually used since we override complete/generateObject
  protected getClient(): LanguageModelResolver {
    return (() => ({})) as unknown as LanguageModelResolver;
  }

  override async complete(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) throw new Error(`${this.name} failed`);
    return 'mock response';
  }

  override async generateObject<T>(_prompt: string, _schema: ZodSchema<T>): Promise<T> {
    this.callCount++;
    if (this.shouldFail) throw new Error(`${this.name} failed`);
    return { mock: true } as unknown as T;
  }
}

function config(partial: Partial<AiEndpointConfig> & { id: string }): AiEndpointConfig {
  return {
    provider: 'openai',
    apiKey: 'test-key',
    priority: 0,
    ...partial,
  };
}

describe('DynamicAIProviderRouter', () => {
  it('reports empty when no endpoint configured', () => {
    const router = new DynamicAIProviderRouter();
    expect(router.availableNames()).toHaveLength(0);
    expect(() => router.route('content')).toThrow('No AI endpoint configured');
  });

  it('routes to highest priority endpoint by default', () => {
    const router = new DynamicAIProviderRouter();
    const low = new MockProvider('deepseek');
    const high = new MockProvider('openai');
    router.addEndpoint(config({ id: 'a', provider: 'deepseek', priority: 1 }), low);
    router.addEndpoint(config({ id: 'b', provider: 'openai', priority: 10 }), high);
    expect(router.route('content')).toBe(high);
    expect(router.route('language')).toBe(high);
  });

  it('honors model route mapping per correction stage', () => {
    const router = new DynamicAIProviderRouter();
    const openai = new MockProvider('openai');
    const qwen = new MockProvider('qwen');
    router.addEndpoint(config({ id: 'a', provider: 'openai', priority: 10 }), openai);
    router.addEndpoint(config({ id: 'b', provider: 'qwen', priority: 1 }), qwen);
    router.setModelRoutes({ language: 'b' });
    expect(router.route('language')).toBe(qwen);
    expect(router.route('content')).toBe(openai);
  });

  it('falls back to remaining endpoints when routed endpoint fails', async () => {
    const router = new DynamicAIProviderRouter();
    const primary = new MockProvider('openai');
    const backup = new MockProvider('deepseek');
    primary.shouldFail = true;
    router.addEndpoint(config({ id: 'a', provider: 'openai', priority: 10 }), primary);
    router.addEndpoint(config({ id: 'b', provider: 'deepseek', priority: 1 }), backup);
    const result = await router.executeWithFallback('content', (p) => p.complete('x'));
    expect(result).toBe('mock response');
    expect(primary.callCount).toBe(1);
    expect(backup.callCount).toBe(1);
  });

  it('throws last error when all endpoints fail', async () => {
    const router = new DynamicAIProviderRouter();
    const a = new MockProvider('openai');
    const b = new MockProvider('deepseek');
    a.shouldFail = true;
    b.shouldFail = true;
    router.addEndpoint(config({ id: 'a', provider: 'openai', priority: 10 }), a);
    router.addEndpoint(config({ id: 'b', provider: 'deepseek', priority: 1 }), b);
    await expect(router.executeWithFallback('content', (p) => p.complete('x'))).rejects.toThrow(
      'deepseek failed',
    );
  });

  it('skips rate-limited endpoints', async () => {
    const router = new DynamicAIProviderRouter();
    const limited = new MockProvider('openai');
    const backup = new MockProvider('deepseek');
    router.addEndpoint(
      config({ id: 'a', provider: 'openai', priority: 10, rateLimitPerMin: 1 }),
      limited,
    );
    router.addEndpoint(config({ id: 'b', provider: 'deepseek', priority: 1 }), backup);
    await router.executeWithFallback('content', (p) => p.complete('x'));
    await router.executeWithFallback('content', (p) => p.complete('x'));
    expect(limited.callCount).toBe(1);
    expect(backup.callCount).toBe(1);
  });

  it('ignores stale model route pointing to removed config', () => {
    const router = new DynamicAIProviderRouter();
    const openai = new MockProvider('openai');
    router.addEndpoint(config({ id: 'a', provider: 'openai', priority: 10 }), openai);
    router.setModelRoutes({ scorer: 'deleted-config-id' });
    expect(router.route('scorer')).toBe(openai);
  });
});

describe('createRouterFromConfigs', () => {
  it('builds endpoints from configs and skips invalid ones', () => {
    const router = createRouterFromConfigs([
      config({ id: 'a', provider: 'openai' }),
      config({ id: 'b', provider: 'deepseek' }),
      // custom provider 缺 baseUrl，应被跳过而不是抛错
      config({ id: 'c', provider: 'other' }),
    ]);
    expect(router.availableNames()).toEqual(['openai', 'deepseek']);
  });

  it('creates openai-compatible provider for qwen with default base url', () => {
    const router = createRouterFromConfigs([
      config({ id: 'a', provider: 'qwen', model: 'qwen-max' }),
    ]);
    expect(router.availableNames()).toEqual(['qwen']);
    expect(router.route('content').defaultModel).toBe('qwen-max');
  });
});
