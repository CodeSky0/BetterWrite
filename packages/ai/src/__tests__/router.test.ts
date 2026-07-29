import { describe, expect, it } from 'vitest';
import type { ZodSchema } from 'zod';
import { BaseAIProvider } from '../providers/base.js';
import { AIProviderRouter } from '../router.js';

class MockProvider extends BaseAIProvider {
  readonly name: string;
  readonly defaultModel = 'mock-model';
  lastPrompt = '';
  callCount = 0;
  shouldFail = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  // Mock client factory - not actually used since we override complete/generateObject
  protected getClient(): (model: string) => unknown {
    return () => ({});
  }

  override async complete(prompt: string): Promise<string> {
    this.lastPrompt = prompt;
    this.callCount++;
    if (this.shouldFail) throw new Error(`${this.name} failed`);
    return 'mock response';
  }

  override async generateObject<T>(prompt: string, _schema: ZodSchema<T>): Promise<T> {
    this.lastPrompt = prompt;
    this.callCount++;
    if (this.shouldFail) throw new Error(`${this.name} failed`);
    return { mock: true } as unknown as T;
  }
}

describe('AIProviderRouter', () => {
  it('registers and retrieves providers', () => {
    const router = new AIProviderRouter();
    const provider = new MockProvider('openai');
    router.register(provider);
    expect(router.has('openai')).toBe(true);
    expect(router.has('deepseek')).toBe(false);
    expect(router.get('openai')).toBe(provider);
  });

  it('throws when getting unregistered provider', () => {
    const router = new AIProviderRouter();
    expect(() => router.get('nonexistent')).toThrow('not registered');
  });

  it('lists available provider names', () => {
    const router = new AIProviderRouter();
    router.register(new MockProvider('openai'));
    router.register(new MockProvider('deepseek'));
    expect(router.availableNames()).toEqual(['openai', 'deepseek']);
  });

  it('routes content/topicAdherence/scorer to openai first', () => {
    const router = new AIProviderRouter();
    const openai = new MockProvider('openai');
    const deepseek = new MockProvider('deepseek');
    router.register(openai);
    router.register(deepseek);

    expect(router.route('content')).toBe(openai);
    expect(router.route('topicAdherence')).toBe(openai);
    expect(router.route('scorer')).toBe(openai);
  });

  it('routes language/structure to deepseek first', () => {
    const router = new AIProviderRouter();
    const openai = new MockProvider('openai');
    const deepseek = new MockProvider('deepseek');
    router.register(openai);
    router.register(deepseek);

    expect(router.route('language')).toBe(deepseek);
    expect(router.route('structure')).toBe(deepseek);
  });

  it('falls back when only one provider is registered', () => {
    const router = new AIProviderRouter();
    const deepseek = new MockProvider('deepseek');
    router.register(deepseek);

    expect(router.route('content')).toBe(deepseek);
    expect(router.route('language')).toBe(deepseek);
  });
});

describe('AIProviderRouter.executeWithFallback', () => {
  it('returns result from primary provider on success', async () => {
    const router = new AIProviderRouter();
    const primary = new MockProvider('openai');
    router.register(primary);

    const result = await router.executeWithFallback('content', async (p) => {
      return p.complete('test prompt');
    });

    expect(result).toBe('mock response');
    expect(primary.callCount).toBe(1);
  });

  it('falls back to secondary when primary fails', async () => {
    const router = new AIProviderRouter();
    const primary = new MockProvider('openai');
    primary.shouldFail = true;
    const fallback = new MockProvider('deepseek');
    router.register(primary);
    router.register(fallback);

    const result = await router.executeWithFallback('content', async (p) => {
      return p.complete('test');
    });

    expect(result).toBe('mock response');
    expect(primary.callCount).toBe(1);
    expect(fallback.callCount).toBe(1);
  });

  it('throws when all providers fail', async () => {
    const router = new AIProviderRouter();
    const primary = new MockProvider('openai');
    primary.shouldFail = true;
    const fallback = new MockProvider('deepseek');
    fallback.shouldFail = true;
    router.register(primary);
    router.register(fallback);

    await expect(
      router.executeWithFallback('content', async (p) => p.complete('test')),
    ).rejects.toThrow('deepseek failed');
  });

  it('throws when no fallback available', async () => {
    const router = new AIProviderRouter();
    const primary = new MockProvider('openai');
    primary.shouldFail = true;
    router.register(primary);

    await expect(
      router.executeWithFallback('content', async (p) => p.complete('test')),
    ).rejects.toThrow('openai failed');
  });
});
