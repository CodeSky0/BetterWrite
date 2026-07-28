import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import type { ZodSchema } from 'zod';
import { BaseAIProvider, type CompletionOptions, DEFAULT_AI_TIMEOUT_MS } from './base.js';

// 通用 OpenAI 兼容 Provider：用于 anthropic / qwen / 自定义等提供 OpenAI 兼容
// Chat Completions 端点的服务。name 与 defaultModel 由管理后台的 api_configs 决定，
// 因此同一个类可以承载任意数量的自定义端点。
export class OpenAICompatibleProvider extends BaseAIProvider {
  readonly name: string;
  readonly defaultModel: string;

  private client;

  constructor(name: string, apiKey: string, baseURL: string, defaultModel: string) {
    super();
    this.name = name;
    this.defaultModel = defaultModel;
    this.client = createOpenAI({ apiKey, baseURL });
  }

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
