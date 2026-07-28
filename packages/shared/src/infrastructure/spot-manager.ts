/**
 * Spot Instance Manager
 * Manages cost optimization using spot/preemptible instances
 */

export interface SpotInstance {
  id: string;
  type: 'spot' | 'on-demand';
  region: string;
  zone: string;
  price: number;
  status: 'running' | 'terminated' | 'pending';
  createdAt: Date;
  terminatedAt?: Date;
  savings: number;
}

export interface SpotPricing {
  instanceType: string;
  region: string;
  zone: string;
  spotPrice: number;
  onDemandPrice: number;
  savingsPercentage: number;
}

export class SpotInstanceManager {
  private instances: Map<string, SpotInstance>;
  private pricingHistory: SpotPricing[];
  private targetSavings: number;

  constructor(targetSavings = 60) {
    this.instances = new Map();
    this.pricingHistory = [];
    this.targetSavings = targetSavings;
  }

  addInstance(instance: SpotInstance): void {
    this.instances.set(instance.id, instance);
  }

  removeInstance(id: string): void {
    this.instances.delete(id);
  }

  updateInstanceStatus(id: string, status: SpotInstance['status']): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.status = status;
      if (status === 'terminated') {
        instance.terminatedAt = new Date();
      }
      this.instances.set(id, instance);
    }
  }

  calculateSavings(): {
    totalSavings: number;
    spotSavings: number;
    onDemandCost: number;
    spotCost: number;
  } {
    let spotSavings = 0;
    let onDemandCost = 0;
    let spotCost = 0;

    for (const instance of this.instances.values()) {
      if (instance.type === 'spot') {
        spotSavings += instance.savings;
        spotCost += instance.price;
      } else {
        onDemandCost += instance.price;
      }
    }

    return {
      totalSavings: spotSavings,
      spotSavings,
      onDemandCost,
      spotCost,
    };
  }

  getSpotRecommendation(): {
    shouldUseSpot: boolean;
    recommendedInstances: number;
    expectedSavings: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const savings = this.calculateSavings();
    const spotSavingsPercentage =
      savings.onDemandCost > 0 ? (savings.spotSavings / savings.onDemandCost) * 100 : 0;

    return {
      shouldUseSpot: spotSavingsPercentage >= this.targetSavings,
      recommendedInstances: Math.floor(this.instances.size * 0.7), // 70% spot
      expectedSavings: savings.spotSavings,
      riskLevel:
        spotSavingsPercentage > 70 ? 'low' : spotSavingsPercentage > 50 ? 'medium' : 'high',
    };
  }

  updatePricing(pricing: SpotPricing[]): void {
    this.pricingHistory = pricing;
  }

  getBestSpotPricing(instanceType: string): SpotPricing | null {
    const relevantPricing = this.pricingHistory.filter((p) => p.instanceType === instanceType);

    if (relevantPricing.length === 0) {
      return null;
    }

    // Sort by savings percentage (highest first)
    relevantPricing.sort((a, b) => b.savingsPercentage - a.savingsPercentage);

    return relevantPricing[0];
  }

  getInstanceCount(): {
    total: number;
    spot: number;
    onDemand: number;
  } {
    const spot = Array.from(this.instances.values()).filter((i) => i.type === 'spot').length;
    const onDemand = Array.from(this.instances.values()).filter(
      (i) => i.type === 'on-demand',
    ).length;

    return {
      total: this.instances.size,
      spot,
      onDemand,
    };
  }

  getInstances(): SpotInstance[] {
    return Array.from(this.instances.values());
  }
}

export const defaultSpotManager = new SpotInstanceManager();
