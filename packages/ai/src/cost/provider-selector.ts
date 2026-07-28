/**
 * Smart AI Provider Selection
 * Automatically selects the best AI provider based on cost, performance, and availability
 */

import { CostTracker } from './tracker';

export interface ProviderConfig {
  name: string;
  models: string[];
  priority: number;
  maxRetries: number;
  timeout: number;
  enabled: boolean;
}

export interface SelectionCriteria {
  prioritizeCost: boolean;
  prioritizeSpeed: boolean;
  prioritizeQuality: boolean;
  maxCostPerRequest: number;
  requiredQuality: number;
}

export class ProviderSelector {
  private providers: Map<string, ProviderConfig>;
  private costTracker: CostTracker;
  private performanceMetrics: Map<string, { avgResponseTime: number; successRate: number }>;

  constructor(costTracker: CostTracker) {
    this.costTracker = costTracker;
    this.providers = new Map();
    this.performanceMetrics = new Map();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('openai', {
      name: 'openai',
      models: ['gpt-4', 'gpt-3.5-turbo'],
      priority: 1,
      maxRetries: 3,
      timeout: 30000,
      enabled: true,
    });

    this.providers.set('anthropic', {
      name: 'anthropic',
      models: ['claude-3-opus', 'claude-3-sonnet'],
      priority: 2,
      maxRetries: 3,
      timeout: 30000,
      enabled: true,
    });
  }

  selectProvider(criteria: SelectionCriteria, requiredModel?: string): ProviderConfig | null {
    const enabledProviders = Array.from(this.providers.values()).filter((p) => p.enabled);

    if (enabledProviders.length === 0) {
      return null;
    }

    // If a specific model is required, find the provider that supports it
    if (requiredModel) {
      const provider = enabledProviders.find((p) => p.models.includes(requiredModel));
      if (provider) {
        return provider;
      }
    }

    // Score each provider based on criteria
    const scoredProviders = enabledProviders.map((provider) => ({
      provider,
      score: this.calculateScore(provider, criteria),
    }));

    // Sort by score (higher is better)
    scoredProviders.sort((a, b) => b.score - a.score);

    return scoredProviders[0]?.provider || null;
  }

  private calculateScore(provider: ProviderConfig, criteria: SelectionCriteria): number {
    let score = 0;

    // Priority (higher priority gets higher score)
    score += (10 - provider.priority) * 10;

    // Performance metrics
    const metrics = this.performanceMetrics.get(provider.name);
    if (metrics) {
      if (criteria.prioritizeSpeed) {
        score += (1000 / metrics.avgResponseTime) * 5;
      }
      if (criteria.prioritizeQuality) {
        score += metrics.successRate * 5;
      }
    }

    // Cost consideration
    if (criteria.prioritizeCost) {
      const avgCost = this.costTracker.getAverageCostPerOperation('completion');
      if (avgCost > 0 && avgCost < criteria.maxCostPerRequest) {
        score += 10;
      }
    }

    return score;
  }

  updatePerformanceMetrics(provider: string, responseTime: number, success: boolean): void {
    const current = this.performanceMetrics.get(provider) || {
      avgResponseTime: 1000,
      successRate: 1.0,
    };

    // Update with exponential moving average
    const alpha = 0.1;
    current.avgResponseTime = alpha * responseTime + (1 - alpha) * current.avgResponseTime;
    current.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * current.successRate;

    this.performanceMetrics.set(provider, current);
  }

  enableProvider(provider: string): void {
    const config = this.providers.get(provider);
    if (config) {
      config.enabled = true;
      this.providers.set(provider, config);
    }
  }

  disableProvider(provider: string): void {
    const config = this.providers.get(provider);
    if (config) {
      config.enabled = false;
      this.providers.set(provider, config);
    }
  }

  getProviderStatus(): Array<{
    name: string;
    enabled: boolean;
    avgResponseTime: number;
    successRate: number;
  }> {
    return Array.from(this.providers.values()).map((provider) => {
      const metrics = this.performanceMetrics.get(provider.name) || {
        avgResponseTime: 0,
        successRate: 0,
      };
      return {
        name: provider.name,
        enabled: provider.enabled,
        avgResponseTime: metrics.avgResponseTime,
        successRate: metrics.successRate,
      };
    });
  }
}

// Global provider selector instance
export const providerSelector = new ProviderSelector(
  // This would be the global cost tracker
  new CostTracker(),
);
