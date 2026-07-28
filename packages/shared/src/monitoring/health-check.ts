/**
 * Health Check System
 * Provides health status monitoring for application components
 */

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  component: string;
  message: string;
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface HealthCheckConfig {
  component: string;
  check: () => Promise<boolean>;
  timeout: number;
}

export class HealthChecker {
  private checks: Map<string, HealthCheckConfig>;
  private results: Map<string, HealthCheckResult>;

  constructor() {
    this.checks = new Map();
    this.results = new Map();
  }

  register(config: HealthCheckConfig): void {
    this.checks.set(config.component, config);
  }

  async check(component: string): Promise<HealthCheckResult> {
    const config = this.checks.get(component);
    if (!config) {
      return {
        status: 'unhealthy',
        component,
        message: 'Health check not registered',
        timestamp: new Date(),
      };
    }

    const start = Date.now();
    try {
      const isHealthy = await Promise.race([
        config.check(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), config.timeout),
        ),
      ]);

      const responseTime = Date.now() - start;
      const result: HealthCheckResult = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        component,
        message: isHealthy ? 'Component is healthy' : 'Component is unhealthy',
        timestamp: new Date(),
        responseTime,
      };

      this.results.set(component, result);
      return result;
    } catch (error) {
      const responseTime = Date.now() - start;
      const result: HealthCheckResult = {
        status: 'unhealthy',
        component,
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
        responseTime,
      };

      this.results.set(component, result);
      return result;
    }
  }

  async checkAll(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    for (const component of this.checks.keys()) {
      const result = await this.check(component);
      results.set(component, result);
    }

    return results;
  }

  getOverallStatus(): 'healthy' | 'unhealthy' | 'degraded' {
    const results = Array.from(this.results.values());

    if (results.length === 0) {
      return 'healthy';
    }

    const hasUnhealthy = results.some((r) => r.status === 'unhealthy');
    const hasDegraded = results.some((r) => r.status === 'degraded');

    if (hasUnhealthy) {
      return 'unhealthy';
    }

    if (hasDegraded) {
      return 'degraded';
    }

    return 'healthy';
  }

  getLastResult(component: string): HealthCheckResult | null {
    return this.results.get(component) || null;
  }

  getAllResults(): Map<string, HealthCheckResult> {
    return new Map(this.results);
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// Predefined health checks
export const databaseHealthCheck: HealthCheckConfig = {
  component: 'database',
  timeout: 5000,
  check: async () => {
    // In real implementation, this would check database connectivity
    return true;
  },
};

export const redisHealthCheck: HealthCheckConfig = {
  component: 'redis',
  timeout: 3000,
  check: async () => {
    // In real implementation, this would check Redis connectivity
    return true;
  },
};

export const aiServiceHealthCheck: HealthCheckConfig = {
  component: 'ai-service',
  timeout: 10000,
  check: async () => {
    // In real implementation, this would check AI service availability
    return true;
  },
};
