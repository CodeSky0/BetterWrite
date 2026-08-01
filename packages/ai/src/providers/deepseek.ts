import { createDeepSeek } from '@ai-sdk/deepseek';
import { BaseAIProvider, type LanguageModelResolver } from './base.js';

export class DeepSeekProvider extends BaseAIProvider {
  readonly name = 'deepseek';
  readonly defaultModel = 'deepseek-chat';

  private client;

  constructor(apiKey: string, baseURL?: string) {
    super();
    this.client = createDeepSeek({ apiKey, baseURL });
  }

  protected getClient(): LanguageModelResolver {
    return this.client as LanguageModelResolver;
  }
}
