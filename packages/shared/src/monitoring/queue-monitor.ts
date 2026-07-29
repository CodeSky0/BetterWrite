/**
 * Queue monitoring utilities for Redis/BullMQ
 */

import { logger } from '../logger.js';

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  timestamp: number;
}

export class QueueMonitor {
  private metrics: Map<string, QueueMetrics[]> = new Map();
  private maxHistorySize = 100;

  recordMetrics(metrics: QueueMetrics): void {
    const history = this.metrics.get(metrics.queueName) || [];
    history.push(metrics);

    // Keep only recent history
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.metrics.set(metrics.queueName, history);
  }

  getMetrics(queueName: string): QueueMetrics[] {
    return this.metrics.get(queueName) || [];
  }

  getLatestMetrics(queueName: string): QueueMetrics | null {
    const history = this.metrics.get(queueName);
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }

  private getRecentMetrics(queueName: string, windowMs: number): QueueMetrics[] {
    const history = this.metrics.get(queueName);
    if (!history || history.length === 0) return [];
    const now = Date.now();
    return history.filter((m) => now - m.timestamp <= windowMs);
  }

  getAverageWaitTime(queueName: string, windowMs = 60000): number {
    const recent = this.getRecentMetrics(queueName, windowMs);
    if (recent.length === 0) return 0;
    const totalWaiting = recent.reduce((sum, m) => sum + m.waiting, 0);
    return totalWaiting / recent.length;
  }

  getThroughput(queueName: string, windowMs = 60000): number {
    const recent = this.getRecentMetrics(queueName, windowMs);
    if (recent.length === 0) return 0;
    const totalCompleted = recent.reduce((sum, m) => sum + m.completed, 0);
    return totalCompleted / (windowMs / 1000); // jobs per second
  }

  detectBacklog(queueName: string, threshold = 100): boolean {
    const latest = this.getLatestMetrics(queueName);
    if (!latest) return false;
    return latest.waiting > threshold;
  }

  logQueueStatus(queueName: string): void {
    const latest = this.getLatestMetrics(queueName);
    if (!latest) {
      logger.warn({ queueName }, 'No queue metrics available');
      return;
    }

    logger.info(
      {
        queue: queueName,
        waiting: latest.waiting,
        active: latest.active,
        completed: latest.completed,
        failed: latest.failed,
        throughput: this.getThroughput(queueName),
      },
      'Queue status',
    );
  }
}

// Singleton instance
let queueMonitor: QueueMonitor | null = null;

export function getQueueMonitor(): QueueMonitor {
  if (!queueMonitor) {
    queueMonitor = new QueueMonitor();
  }
  return queueMonitor;
}
