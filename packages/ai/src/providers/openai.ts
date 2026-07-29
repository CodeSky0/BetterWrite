import { createOpenAI } from '@ai-sdk/openai';
import { BaseAIProvider } from './base.js';

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o';

  private client;

  constructor(apiKey: string, baseURL?: string) {
    super();
    this.client = createOpenAI({ apiKey, baseURL });
  }

  protected getClient() {
    return this.client;
  }
}
