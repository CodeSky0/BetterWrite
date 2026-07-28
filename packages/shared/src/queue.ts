export const CORRECTION_QUEUE = 'essay-corrections';
export const CORRECTION_JOB = 'correct';

// AI 配置热更新通知频道：web 端增删改 api_configs / model_routes 后 publish 一条消息，
// worker 订阅该频道并重新从 DB 加载 provider 配置，无需重启进程即可生效。
export const API_CONFIG_UPDATED_CHANNEL = 'betterwrite:api-config-updated';

// Priority queues for different correction types
export const HIGH_PRIORITY_QUEUE = 'essay-corrections:high';
export const NORMAL_PRIORITY_QUEUE = 'essay-corrections:normal';
export const LOW_PRIORITY_QUEUE = 'essay-corrections:low';

export interface CorrectionJobData {
  essayId: string;
  priority?: 'high' | 'normal' | 'low';
  studentId?: string; // For deduplication
  submittedAt?: string; // For time-based prioritization
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  };
  private threshold: number;
  private timeout: number;

  constructor(threshold = 5, timeoutMs = 60000) {
    this.threshold = threshold;
    this.timeout = timeoutMs;
  }

  recordSuccess(): void {
    this.state.failureCount = 0;
    this.state.isOpen = false;
  }

  recordFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failureCount >= this.threshold) {
      this.state.isOpen = true;
      this.state.nextAttemptTime = Date.now() + this.timeout;
    }
  }

  canAttempt(): boolean {
    if (!this.state.isOpen) return true;

    if (Date.now() >= this.state.nextAttemptTime) {
      // Attempt to reset after timeout
      this.state.isOpen = false;
      this.state.failureCount = 0;
      return true;
    }

    return false;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
  }
}

// Global circuit breaker for AI providers
export const aiProviderCircuitBreaker = new CircuitBreaker(5, 60000);
