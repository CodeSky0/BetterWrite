import { createDeepSeek } from '@ai-sdk/deepseek';
import { BaseAIProvider } from './base.js';

export class DeepSeekProvider extends BaseAIProvider {
  readonly name = 'deepseek';
  readonly defaultModel = 'deepseek-chat';

  private client;

  constructor(apiKey: string, baseURL?: string) {
    super();
    this.client = createDeepSeek({ apiKey, baseURL });
  }

  protected getClient() {
    return this.client;
  }
}
