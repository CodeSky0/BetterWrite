import { createOpenAI } from '@ai-sdk/openai';
import { BaseAIProvider, type LanguageModelResolver } from './base.js';

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o';

  private client;

  constructor(apiKey: string, baseURL?: string) {
    super();
    this.client = createOpenAI({ apiKey, baseURL });
  }

  protected getClient(): LanguageModelResolver {
    return this.client as LanguageModelResolver;
  }
}
