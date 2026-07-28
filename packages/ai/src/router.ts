import { logger } from '@betterwrite/shared/logger';
import type { BaseAIProvider } from './providers/base.js';

const aiLogger = logger.child({ component: 'ai-router' });

export type CorrectionType = 'content' | 'topicAdherence' | 'language' | 'structure' | 'scorer';

export class AIProviderRouter {
  private providers = new Map<string, BaseAIProvider>();

  register(provider: BaseAIProvider): void {
    this.providers.set(provider.name, provider);
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  get(name: string): BaseAIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider "${name}" not registered`);
    }
    return provider;
  }

  availableNames(): string[] {
    return Array.from(this.providers.keys());
  }

  route(type: CorrectionType): BaseAIProvider {
    switch (type) {
      case 'content':
      case 'topicAdherence':
      case 'scorer':
        return this.has('openai') ? this.get('openai') : this.get('deepseek');
      default:
        return this.has('deepseek') ? this.get('deepseek') : this.get('openai');
    }
  }

  async executeWithFallback<T>(
    type: CorrectionType,
    fn: (provider: BaseAIProvider) => Promise<T>,
  ): Promise<T> {
    const primary = this.route(type);
    try {
      return await fn(primary);
    } catch (error) {
      aiLogger.warn({ err: error, provider: primary.name }, 'AI provider failed, trying fallback');
      const fallback = this.availableNames().find((n) => n !== primary.name);
      if (!fallback) throw error;
      return await fn(this.get(fallback));
    }
  }
}
