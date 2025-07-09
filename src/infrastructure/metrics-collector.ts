import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';

/**
 * Metrics collection system for monitoring system performance
 */
export class MetricsCollector extends EventEmitter {
  private logger: Logger;
  private isRunning = false;
  private metricsInterval: any = null;
  private metrics: SystemMetrics;

  constructor() {
    super();
    this.logger = new Logger('MetricsCollector');
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start metrics collection
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Metrics collector is already running');
      return;
    }

    this.isRunning = true;

    // Start periodic metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds

    this.logger.info('Metrics collector started');
  }

  /**
   * Stop metrics collection
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.logger.info('Metrics collector stopped');
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      system: {
        cpu: 0,
        memory: 0,
        uptime: 0,
        loadAverage: [0, 0, 0],
      },
      application: {
        requestCount: 0,
        responseTime: 0,
        errorRate: 0,
        activeConnections: 0,
      },
      cognitive: {
        memoryOperations: 0,
        reasoningTasks: 0,
        learningOperations: 0,
        decisionsMade: 0,
      },
      custom: {},
    };
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    try {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectCognitiveMetrics();

      // Update timestamp
      this.metrics.timestamp = new Date();

      // Emit metrics update
      this.emit('metricsUpdate', { ...this.metrics });
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics(): void {
    try {
      // Memory usage (with fallback)
      let memoryUsage: any;
      try {
        memoryUsage = (process as any).memoryUsage?.() || {
          rss: 0,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
        };
      } catch (error) {
        memoryUsage = { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
      }
      this.metrics.system.memory = Math.round(
        memoryUsage.heapUsed / 1024 / 1024
      ); // MB

      // Uptime (with fallback)
      this.metrics.system.uptime = Math.round((process as any).uptime?.() || 0);

      // CPU usage (simplified - in real implementation, use proper CPU monitoring)
      this.metrics.system.cpu = Math.random() * 100; // Placeholder

      // Load average (simplified)
      this.metrics.system.loadAverage = [
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2,
      ];
    } catch (error) {
      this.logger.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Collect application-level metrics
   */
  private collectApplicationMetrics(): void {
    // These would be updated by the application as it handles requests
    // For now, we'll maintain the existing values or increment counters
    // In a real implementation, these would be updated by:
    // - HTTP request handlers
    // - WebSocket connections
    // - Database operations
    // etc.
  }

  /**
   * Collect cognitive system metrics
   */
  private collectCognitiveMetrics(): void {
    // These would be updated by the cognitive services
    // For now, we'll simulate some activity
    // In a real implementation, these would be updated by:
    // - Memory management system
    // - Reasoning engine
    // - Learning orchestrator
    // - Decision engine
    // etc.
  }

  /**
   * Update application metric
   */
  public updateApplicationMetric(metric: string, value: number): void {
    if (metric in this.metrics.application) {
      (this.metrics.application as any)[metric] = value;
    }
  }

  /**
   * Increment application counter
   */
  public incrementApplicationCounter(metric: string, amount: number = 1): void {
    if (metric in this.metrics.application) {
      (this.metrics.application as any)[metric] += amount;
    }
  }

  /**
   * Update cognitive metric
   */
  public updateCognitiveMetric(metric: string, value: number): void {
    if (metric in this.metrics.cognitive) {
      (this.metrics.cognitive as any)[metric] = value;
    }
  }

  /**
   * Increment cognitive counter
   */
  public incrementCognitiveCounter(metric: string, amount: number = 1): void {
    if (metric in this.metrics.cognitive) {
      (this.metrics.cognitive as any)[metric] += amount;
    }
  }

  /**
   * Set custom metric
   */
  public setCustomMetric(name: string, value: number): void {
    this.metrics.custom[name] = value;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Get specific metric category
   */
  public getSystemMetrics() {
    return { ...this.metrics.system };
  }

  public getApplicationMetrics() {
    return { ...this.metrics.application };
  }

  public getCognitiveMetrics() {
    return { ...this.metrics.cognitive };
  }

  public getCustomMetrics() {
    return { ...this.metrics.custom };
  }

  /**
   * Reset metrics counters
   */
  public resetCounters(): void {
    this.metrics.application.requestCount = 0;
    this.metrics.application.errorRate = 0;
    this.metrics.cognitive.memoryOperations = 0;
    this.metrics.cognitive.reasoningTasks = 0;
    this.metrics.cognitive.learningOperations = 0;
    this.metrics.cognitive.decisionsMade = 0;
  }

  /**
   * Check if collector is running
   */
  public isCollectorRunning(): boolean {
    return this.isRunning;
  }
}

export interface SystemMetrics {
  timestamp: Date;
  system: {
    cpu: number;
    memory: number;
    uptime: number;
    loadAverage: number[];
  };
  application: {
    requestCount: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  cognitive: {
    memoryOperations: number;
    reasoningTasks: number;
    learningOperations: number;
    decisionsMade: number;
  };
  custom: Record<string, number>;
}
