/**
 * Metrics Collection and Reporting
 * Tracks application performance metrics for monitoring
 */

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface HistogramMetric {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]>;
  private histograms: Map<string, number[]>;

  constructor() {
    this.metrics = new Map();
    this.histograms = new Map();
  }

  increment(name: string, value = 1, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  timing(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, tags);
    this.recordHistogram(name, value);
  }

  private record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last 1000 data points per metric
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  private recordHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }

    const histogram = this.histograms.get(name)!;
    histogram.push(value);

    // Keep only last 1000 data points
    if (histogram.length > 1000) {
      histogram.shift();
    }
  }

  getMetric(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  getHistogram(name: string): HistogramMetric | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sum / count;

    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return {
      name,
      count,
      sum,
      min,
      max,
      avg,
      p50,
      p95,
      p99,
    };
  }

  getAllMetrics(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }

  getAllHistograms(): Map<string, HistogramMetric> {
    const result = new Map<string, HistogramMetric>();
    for (const [name] of this.histograms) {
      const histogram = this.getHistogram(name);
      if (histogram) {
        result.set(name, histogram);
      }
    }
    return result;
  }

  clear(): void {
    this.metrics.clear();
    this.histograms.clear();
  }
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

// Convenience functions
export const increment = (name: string, value?: number, tags?: Record<string, string>) => {
  metrics.increment(name, value, tags);
};

export const gauge = (name: string, value: number, tags?: Record<string, string>) => {
  metrics.gauge(name, value, tags);
};

export const timing = (name: string, value: number, tags?: Record<string, string>) => {
  metrics.timing(name, value, tags);
};

export const measure = async <T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>,
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    timing(name, duration, { ...tags, success: 'true' });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    timing(name, duration, { ...tags, success: 'false' });
    throw error;
  }
};
