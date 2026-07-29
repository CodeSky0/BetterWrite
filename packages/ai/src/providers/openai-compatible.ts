import { createOpenAI } from '@ai-sdk/openai';
import { BaseAIProvider } from './base.js';

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

  protected getClient() {
    return this.client;
  }
}
