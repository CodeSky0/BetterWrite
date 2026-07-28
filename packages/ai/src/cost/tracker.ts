/**
 * AI Cost Tracking System
 * Tracks API usage and costs across different AI providers
 */

export interface CostRecord {
  id: string;
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

export interface ProviderPricing {
  provider: string;
  model: string;
  inputPricePer1k: number; // in USD
  outputPricePer1k: number; // in USD
}

export class CostTracker {
  private records: CostRecord[] = [];
  private pricing: Map<string, ProviderPricing> = new Map();
  private dailyLimit: number;
  private monthlyLimit: number;

  constructor(dailyLimit = 100, monthlyLimit = 3000) {
    this.dailyLimit = dailyLimit;
    this.monthlyLimit = monthlyLimit;
    this.initializePricing();
  }

  private initializePricing(): void {
    // OpenAI pricing (example)
    this.pricing.set('openai:gpt-4', {
      provider: 'openai',
      model: 'gpt-4',
      inputPricePer1k: 0.03,
      outputPricePer1k: 0.06,
    });

    this.pricing.set('openai:gpt-3.5-turbo', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      inputPricePer1k: 0.0015,
      outputPricePer1k: 0.002,
    });

    // Claude pricing (example)
    this.pricing.set('anthropic:claude-3-opus', {
      provider: 'anthropic',
      model: 'claude-3-opus',
      inputPricePer1k: 0.015,
      outputPricePer1k: 0.075,
    });

    this.pricing.set('anthropic:claude-3-sonnet', {
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      inputPricePer1k: 0.003,
      outputPricePer1k: 0.015,
    });
  }

  trackUsage(
    provider: string,
    model: string,
    operation: string,
    inputTokens: number,
    outputTokens: number,
    userId?: string,
    requestId?: string,
  ): CostRecord {
    const pricingKey = `${provider}:${model}`;
    const pricing = this.pricing.get(pricingKey);

    if (!pricing) {
      console.warn(`No pricing found for ${pricingKey}`);
    }

    const inputCost = pricing ? (inputTokens / 1000) * pricing.inputPricePer1k : 0;
    const outputCost = pricing ? (outputTokens / 1000) * pricing.outputPricePer1k : 0;
    const totalCost = inputCost + outputCost;

    const record: CostRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider,
      model,
      operation,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: totalCost,
      timestamp: new Date(),
      userId,
      requestId,
    };

    this.records.push(record);

    // Keep only last 10000 records
    if (this.records.length > 10000) {
      this.records.shift();
    }

    return record;
  }

  getTotalCost(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): number {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    return this.records.filter((r) => r.timestamp >= startDate).reduce((sum, r) => sum + r.cost, 0);
  }

  getCostByProvider(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): Map<string, number> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const costs = new Map<string, number>();
    for (const r of this.records) {
      if (r.timestamp < startDate) continue;
      const current = costs.get(r.provider) || 0;
      costs.set(r.provider, current + r.cost);
    }

    return costs;
  }

  getCostByModel(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): Map<string, number> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const costs = new Map<string, number>();
    for (const r of this.records) {
      if (r.timestamp < startDate) continue;
      const key = `${r.provider}:${r.model}`;
      const current = costs.get(key) || 0;
      costs.set(key, current + r.cost);
    }

    return costs;
  }

  getAverageCostPerOperation(operation: string): number {
    const operationRecords = this.records.filter((r) => r.operation === operation);
    if (operationRecords.length === 0) {
      return 0;
    }
    return operationRecords.reduce((sum, r) => sum + r.cost, 0) / operationRecords.length;
  }

  checkLimits(): {
    dailyUsed: number;
    dailyRemaining: number;
    dailyExceeded: boolean;
    monthlyUsed: number;
    monthlyRemaining: number;
    monthlyExceeded: boolean;
  } {
    const dailyUsed = this.getTotalCost('day');
    const monthlyUsed = this.getTotalCost('month');

    return {
      dailyUsed,
      dailyRemaining: Math.max(0, this.dailyLimit - dailyUsed),
      dailyExceeded: dailyUsed > this.dailyLimit,
      monthlyUsed,
      monthlyRemaining: Math.max(0, this.monthlyLimit - monthlyUsed),
      monthlyExceeded: monthlyUsed > this.monthlyLimit,
    };
  }

  getRecords(limit = 100): CostRecord[] {
    return this.records.slice(-limit);
  }

  clearRecords(): void {
    this.records = [];
  }

  addPricing(pricing: ProviderPricing): void {
    const key = `${pricing.provider}:${pricing.model}`;
    this.pricing.set(key, pricing);
  }
}

// Global cost tracker instance
export const costTracker = new CostTracker();
