import { generateObject, generateText } from 'ai';
import type { ZodSchema } from 'zod';

export interface CompletionOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  // Bug #142: 调用方可按需覆盖默认 30s 超时（例如流式/批改多模态可放宽）。
  // AI SDK 的 AbortSignal.timeout 不支持运行时覆盖，默认硬编码 60s 偏长，会让 worker
  // 在一个失败 provider 上耗光 BullMQ 重试窗口。
  timeoutMs?: number;
  skipCache?: boolean; // Skip caching for this request
}

export const DEFAULT_AI_TIMEOUT_MS = 30_000;

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

// AI SDK client type - varies by provider (createOpenAI, createDeepSeek, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AIClientFactory = (...args: any[]) => (model: string) => any;

export abstract class BaseAIProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  protected cacheStats: CacheStats = { hits: 0, misses: 0, hitRate: 0 };

  // 由管理后台 api_configs 下发的默认生成参数：temperature 作为未显式指定时的默认值，
  // maxTokens 作为输出 token 上限（调用方传入更大值时会被压到该上限）。
  protected defaultTemperature = 0.3;
  protected maxTokensCap = 4096;

  setGenerationDefaults(defaults: {
    temperature?: number | null;
    maxTokens?: number | null;
  }): void {
    if (defaults.temperature != null) this.defaultTemperature = defaults.temperature;
    if (defaults.maxTokens != null && defaults.maxTokens > 0) {
      this.maxTokensCap = defaults.maxTokens;
    }
  }

  protected resolveTemperature(options?: CompletionOptions): number {
    return options?.temperature ?? this.defaultTemperature;
  }

  protected resolveMaxOutputTokens(options?: CompletionOptions): number {
    return Math.min(options?.maxOutputTokens ?? this.maxTokensCap, this.maxTokensCap);
  }

  protected buildAbortSignal(options?: CompletionOptions): AbortSignal {
    return AbortSignal.timeout(options?.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS);
  }

  // Subclasses must implement this to return their SDK client
  protected abstract getClient(): (model: string) => any;

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const { text } = await generateText({
      model: this.getClient()(options?.model ?? this.defaultModel),
      prompt,
      temperature: this.resolveTemperature(options),
      maxOutputTokens: this.resolveMaxOutputTokens(options),
      abortSignal: this.buildAbortSignal(options),
    });
    return text;
  }

  async generateObject<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    const { object } = await generateObject({
      model: this.getClient()(options?.model ?? this.defaultModel),
      prompt,
      schema,
      temperature: this.resolveTemperature(options),
      maxOutputTokens: this.resolveMaxOutputTokens(options),
      abortSignal: this.buildAbortSignal(options),
    });
    return object;
  }

  async completeStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    return this.generateObject(prompt, schema, options);
  }

  /**
   * Get cache statistics for this provider
   */
  getCacheStats(): CacheStats {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
    return { ...this.cacheStats };
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats(): void {
    this.cacheStats = { hits: 0, misses: 0, hitRate: 0 };
  }
}
