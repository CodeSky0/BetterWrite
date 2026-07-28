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

export abstract class BaseAIProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  protected cacheStats: CacheStats = { hits: 0, misses: 0, hitRate: 0 };

  abstract complete(prompt: string, options?: CompletionOptions): Promise<string>;

  abstract generateObject<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: CompletionOptions,
  ): Promise<T>;

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
