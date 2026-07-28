import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import type { ZodSchema } from 'zod';
import { BaseAIProvider, type CompletionOptions, DEFAULT_AI_TIMEOUT_MS } from './base.js';

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o';

  private client;

  constructor(apiKey: string, baseURL?: string) {
    super();
    this.client = createOpenAI({ apiKey, baseURL });
  }

  // Bug #142: 默认 30s 超时（之前硬编码 60s），调用方可按需 override。
  private buildAbortSignal(options?: CompletionOptions): AbortSignal {
    return AbortSignal.timeout(options?.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS);
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const { text } = await generateText({
      model: this.client(options?.model ?? this.defaultModel),
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
      model: this.client(options?.model ?? this.defaultModel),
      prompt,
      schema,
      temperature: this.resolveTemperature(options),
      maxOutputTokens: this.resolveMaxOutputTokens(options),
      abortSignal: this.buildAbortSignal(options),
    });
    return object;
  }
}
