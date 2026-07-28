/**
 * Load Balancer Configuration and Utilities
 * Supports horizontal scaling with multiple worker instances
 */

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'ip-hash';
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
}

export interface WorkerInstance {
  id: string;
  url: string;
  healthy: boolean;
  connections: number;
  lastHealthCheck: Date;
  responseTime: number;
}

export class LoadBalancer {
  private instances: Map<string, WorkerInstance>;
  private config: LoadBalancerConfig;
  private currentIndex = 0;

  constructor(config: LoadBalancerConfig) {
    this.config = config;
    this.instances = new Map();
  }

  addInstance(instance: WorkerInstance): void {
    this.instances.set(instance.id, instance);
  }

  removeInstance(id: string): void {
    this.instances.delete(id);
  }

  getInstance(): WorkerInstance | null {
    const healthyInstances = Array.from(this.instances.values()).filter((inst) => inst.healthy);

    if (healthyInstances.length === 0) {
      return null;
    }

    switch (this.config.strategy) {
      case 'round-robin':
        return this.roundRobin(healthyInstances);
      case 'least-connections':
        return this.leastConnections(healthyInstances);
      case 'ip-hash':
        return this.ipHash(healthyInstances);
      default:
        return healthyInstances[0];
    }
  }

  private roundRobin(instances: WorkerInstance[]): WorkerInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex++;
    return instance;
  }

  private leastConnections(instances: WorkerInstance[]): WorkerInstance {
    return instances.reduce((min, current) =>
      current.connections < min.connections ? current : min,
    );
  }

  private ipHash(instances: WorkerInstance[]): WorkerInstance {
    // Simple hash based on client IP (would be passed in real implementation)
    const hash = Math.random();
    return instances[Math.floor(hash * instances.length)];
  }

  async healthCheck(): Promise<void> {
    for (const [id, instance] of this.instances) {
      try {
        const start = Date.now();
        // In real implementation, this would be an actual health check request
        await this.pingInstance(instance.url);
        const responseTime = Date.now() - start;

        this.instances.set(id, {
          ...instance,
          healthy: true,
          lastHealthCheck: new Date(),
          responseTime,
        });
      } catch (_error) {
        this.instances.set(id, {
          ...instance,
          healthy: false,
          lastHealthCheck: new Date(),
        });
      }
    }
  }

  private async pingInstance(_url: string): Promise<void> {
    // Mock health check - in real implementation, this would be an actual HTTP request
    return Promise.resolve();
  }

  getStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    avgResponseTime: number;
  } {
    const instances = Array.from(this.instances.values());
    const healthy = instances.filter((i) => i.healthy).length;
    const unhealthy = instances.length - healthy;
    const avgResponseTime =
      instances.reduce((sum, i) => sum + i.responseTime, 0) / instances.length;

    return {
      total: instances.length,
      healthy,
      unhealthy,
      avgResponseTime,
    };
  }
}

export const defaultLoadBalancerConfig: LoadBalancerConfig = {
  strategy: 'round-robin',
  healthCheckInterval: 30000, // 30 seconds
  healthCheckTimeout: 5000, // 5 seconds
  maxRetries: 3,
  circuitBreakerThreshold: 5,
};
