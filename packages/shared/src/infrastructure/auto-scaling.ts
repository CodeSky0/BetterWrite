/**
 * Auto-scaling Configuration
 * Manages automatic scaling based on load and resource utilization
 */

export interface ScalingPolicy {
  minInstances: number;
  maxInstances: number;
  targetCPUUtilization: number;
  targetMemoryUtilization: number;
  scaleUpCooldown: number; // seconds
  scaleDownCooldown: number; // seconds
}

export interface ScalingEvent {
  timestamp: Date;
  action: 'scale-up' | 'scale-down' | 'no-action';
  fromInstances: number;
  toInstances: number;
  reason: string;
  metrics: {
    cpuUtilization: number;
    memoryUtilization: number;
    requestRate: number;
  };
}

export class AutoScaler {
  private policy: ScalingPolicy;
  private currentInstances: number;
  private events: ScalingEvent[];
  private lastScaleUp: Date;
  private lastScaleDown: Date;

  constructor(policy: ScalingPolicy, initialInstances: number) {
    this.policy = policy;
    this.currentInstances = initialInstances;
    this.events = [];
    this.lastScaleUp = new Date(0);
    this.lastScaleDown = new Date(0);
  }

  evaluateScaling(metrics: {
    cpuUtilization: number;
    memoryUtilization: number;
    requestRate: number;
  }): ScalingEvent {
    const now = new Date();
    const timeSinceScaleUp = (now.getTime() - this.lastScaleUp.getTime()) / 1000;
    const timeSinceScaleDown = (now.getTime() - this.lastScaleDown.getTime()) / 1000;

    // Check if we should scale up
    if (
      metrics.cpuUtilization > this.policy.targetCPUUtilization ||
      metrics.memoryUtilization > this.policy.targetMemoryUtilization
    ) {
      if (timeSinceScaleUp >= this.policy.scaleUpCooldown) {
        if (this.currentInstances < this.policy.maxInstances) {
          const event: ScalingEvent = {
            timestamp: now,
            action: 'scale-up',
            fromInstances: this.currentInstances,
            toInstances: this.currentInstances + 1,
            reason: `High utilization: CPU ${metrics.cpuUtilization}%, Memory ${metrics.memoryUtilization}%`,
            metrics,
          };
          this.currentInstances++;
          this.lastScaleUp = now;
          this.events.push(event);
          return event;
        }
      }
    }

    // Check if we should scale down
    if (
      metrics.cpuUtilization < this.policy.targetCPUUtilization * 0.5 &&
      metrics.memoryUtilization < this.policy.targetMemoryUtilization * 0.5
    ) {
      if (timeSinceScaleDown >= this.policy.scaleDownCooldown) {
        if (this.currentInstances > this.policy.minInstances) {
          const event: ScalingEvent = {
            timestamp: now,
            action: 'scale-down',
            fromInstances: this.currentInstances,
            toInstances: this.currentInstances - 1,
            reason: `Low utilization: CPU ${metrics.cpuUtilization}%, Memory ${metrics.memoryUtilization}%`,
            metrics,
          };
          this.currentInstances--;
          this.lastScaleDown = now;
          this.events.push(event);
          return event;
        }
      }
    }

    // No scaling needed
    const event: ScalingEvent = {
      timestamp: now,
      action: 'no-action',
      fromInstances: this.currentInstances,
      toInstances: this.currentInstances,
      reason: 'Utilization within target range',
      metrics,
    };
    this.events.push(event);
    return event;
  }

  getCurrentInstances(): number {
    return this.currentInstances;
  }

  getEvents(limit = 100): ScalingEvent[] {
    return this.events.slice(-limit);
  }

  updatePolicy(policy: Partial<ScalingPolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }
}

export const defaultScalingPolicy: ScalingPolicy = {
  minInstances: 2,
  maxInstances: 10,
  targetCPUUtilization: 70,
  targetMemoryUtilization: 80,
  scaleUpCooldown: 300, // 5 minutes
  scaleDownCooldown: 600, // 10 minutes
};
