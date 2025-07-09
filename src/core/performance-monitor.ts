import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';

/**
 * Performance metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

/**
 * Performance metric interface
 */
interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  unit?: string;
  description?: string;
}

/**
 * System health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  DOWN = 'down',
}

/**
 * Component health check
 */
interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message?: string;
  lastCheck: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

/**
 * System performance snapshot
 */
interface PerformanceSnapshot {
  timestamp: Date;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  systemLoad: number;
  componentHealth: ComponentHealth[];
  customMetrics: PerformanceMetric[];
  warnings: string[];
  errors: string[];
}

/**
 * Performance thresholds
 */
interface PerformanceThresholds {
  memoryUsagePercent: { warning: number; critical: number };
  cpuUsagePercent: { warning: number; critical: number };
  responseTimeMs: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  queueSize: { warning: number; critical: number };
}

/**
 * Performance recommendation
 */
interface PerformanceRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImpact: number; // 0-1 scale
  metadata: Record<string, any>;
}

/**
 * Performance Monitor - Advanced system performance monitoring and optimization
 * Provides real-time metrics, health checks, and automatic optimization recommendations
 */
export class PerformanceMonitor extends EventEmitter {
  private logger: Logger;
  private metrics = new Map<string, PerformanceMetric[]>();
  private componentHealthChecks = new Map<
    string,
    () => Promise<ComponentHealth>
  >();
  private performanceHistory: PerformanceSnapshot[] = [];
  private isMonitoring = false;

  // Performance thresholds
  private thresholds: PerformanceThresholds = {
    memoryUsagePercent: { warning: 70, critical: 85 },
    cpuUsagePercent: { warning: 80, critical: 95 },
    responseTimeMs: { warning: 1000, critical: 3000 },
    errorRate: { warning: 0.05, critical: 0.1 },
    queueSize: { warning: 100, critical: 500 },
  };

  // Monitoring parameters
  private readonly MONITORING_INTERVAL = 5000; // 5 seconds
  private readonly METRIC_HISTORY_LIMIT = 1000;
  private readonly PERFORMANCE_HISTORY_LIMIT = 200;
  private readonly RECOMMENDATION_CACHE_TIME = 300000; // 5 minutes

  private lastRecommendationUpdate = 0;
  private cachedRecommendations: PerformanceRecommendation[] = [];

  constructor() {
    super();
    this.logger = new Logger('PerformanceMonitor');
    this.initializeDefaultHealthChecks();
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Performance monitoring started');
    this.monitoringLoop();
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.logger.info('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricHistory = this.metrics.get(metric.name)!;
    metricHistory.push(fullMetric);

    // Trim history
    if (metricHistory.length > this.METRIC_HISTORY_LIMIT) {
      metricHistory.splice(0, metricHistory.length - this.METRIC_HISTORY_LIMIT);
    }

    this.emit('metricRecorded', fullMetric);
  }

  /**
   * Register a component health check
   */
  public registerHealthCheck(
    componentName: string,
    healthCheck: () => Promise<ComponentHealth>
  ): void {
    this.componentHealthChecks.set(componentName, healthCheck);
    this.logger.debug(`Health check registered: ${componentName}`);
  }

  /**
   * Get current performance snapshot
   */
  public async getCurrentPerformance(): Promise<PerformanceSnapshot> {
    const startTime = Date.now();

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Run health checks
    const componentHealth: ComponentHealth[] = [];
    for (const [name, healthCheck] of this.componentHealthChecks) {
      try {
        const health = await healthCheck();
        componentHealth.push(health);
      } catch (error) {
        componentHealth.push({
          name,
          status: HealthStatus.CRITICAL,
          message:
            error instanceof Error ? error.message : 'Health check failed',
          lastCheck: new Date(),
        });
      }
    }

    // Get recent custom metrics
    const customMetrics: PerformanceMetric[] = [];
    for (const metricHistory of this.metrics.values()) {
      if (metricHistory.length > 0) {
        customMetrics.push(metricHistory[metricHistory.length - 1]);
      }
    }

    // Calculate system load
    const systemLoad = this.calculateSystemLoad(memoryUsage, componentHealth);

    // Generate warnings and errors
    const warnings: string[] = [];
    const errors: string[] = [];

    this.analyzePerformanceIssues(
      { memoryUsage, cpuUsage, componentHealth, systemLoad },
      warnings,
      errors
    );

    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memoryUsage,
      cpuUsage,
      systemLoad,
      componentHealth,
      customMetrics,
      warnings,
      errors,
    };

    this.performanceHistory.push(snapshot);

    // Trim history
    if (this.performanceHistory.length > this.PERFORMANCE_HISTORY_LIMIT) {
      this.performanceHistory.splice(
        0,
        this.performanceHistory.length - this.PERFORMANCE_HISTORY_LIMIT
      );
    }

    const responseTime = Date.now() - startTime;
    this.recordMetric({
      name: 'performance_snapshot_time',
      type: MetricType.TIMER,
      value: responseTime,
      labels: { operation: 'getCurrentPerformance' },
      unit: 'ms',
    });

    return snapshot;
  }

  /**
   * Get performance recommendations
   */
  public async getPerformanceRecommendations(): Promise<
    PerformanceRecommendation[]
  > {
    const now = Date.now();

    // Use cached recommendations if still valid
    if (now - this.lastRecommendationUpdate < this.RECOMMENDATION_CACHE_TIME) {
      return this.cachedRecommendations;
    }

    const recommendations: PerformanceRecommendation[] = [];
    const recentSnapshots = this.performanceHistory.slice(-10);

    if (recentSnapshots.length === 0) {
      return recommendations;
    }

    // Memory usage recommendations
    const avgMemoryUsage = this.calculateAverageMemoryUsage(recentSnapshots);
    if (avgMemoryUsage > this.thresholds.memoryUsagePercent.warning) {
      recommendations.push({
        id: 'memory_optimization',
        priority:
          avgMemoryUsage > this.thresholds.memoryUsagePercent.critical
            ? 'critical'
            : 'high',
        category: 'memory',
        title: 'High Memory Usage Detected',
        description: `Memory usage is ${avgMemoryUsage.toFixed(1)}%, above recommended threshold`,
        impact: 'May cause performance degradation or system instability',
        implementation:
          'Implement memory cleanup, optimize data structures, increase garbage collection frequency',
        estimatedImpact: 0.7,
        metadata: {
          currentUsage: avgMemoryUsage,
          threshold: this.thresholds.memoryUsagePercent.warning,
        },
      });
    }

    // Component health recommendations
    const unhealthyComponents = this.getUnhealthyComponents(recentSnapshots);
    if (unhealthyComponents.length > 0) {
      recommendations.push({
        id: 'component_health',
        priority: 'high',
        category: 'reliability',
        title: 'Unhealthy Components Detected',
        description: `${unhealthyComponents.length} components are not healthy`,
        impact: 'May affect system functionality and user experience',
        implementation:
          'Investigate component issues, restart failed services, check dependencies',
        estimatedImpact: 0.8,
        metadata: { unhealthyComponents },
      });
    }

    // Performance trend recommendations
    const performanceTrend = this.analyzePerformanceTrend(recentSnapshots);
    if (performanceTrend.declining) {
      recommendations.push({
        id: 'performance_trend',
        priority: 'medium',
        category: 'optimization',
        title: 'Declining Performance Trend',
        description: 'System performance has been declining over time',
        impact: 'Gradual degradation of system responsiveness',
        implementation:
          'Profile application, optimize critical paths, consider scaling',
        estimatedImpact: 0.6,
        metadata: { trend: performanceTrend },
      });
    }

    // Queue size recommendations
    const avgQueueSizes = this.calculateAverageQueueSizes();
    for (const [queueName, avgSize] of Object.entries(avgQueueSizes)) {
      if (avgSize > this.thresholds.queueSize.warning) {
        recommendations.push({
          id: `queue_${queueName}`,
          priority:
            avgSize > this.thresholds.queueSize.critical
              ? 'critical'
              : 'medium',
          category: 'throughput',
          title: `High Queue Size: ${queueName}`,
          description: `Average queue size is ${avgSize.toFixed(0)}, above threshold`,
          impact: 'May indicate processing bottleneck or insufficient capacity',
          implementation:
            'Increase processing capacity, optimize queue processing, implement backpressure',
          estimatedImpact: 0.5,
          metadata: {
            queueName,
            avgSize,
            threshold: this.thresholds.queueSize.warning,
          },
        });
      }
    }

    // Sort by priority and estimated impact
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImpact - a.estimatedImpact;
    });

    this.cachedRecommendations = recommendations;
    this.lastRecommendationUpdate = now;

    return recommendations;
  }

  /**
   * Get performance metrics by name
   */
  public getMetrics(metricName: string, limit = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(metricName);
    if (!metrics) return [];
    return metrics.slice(-limit);
  }

  /**
   * Get all metric names
   */
  public getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get performance history
   */
  public getPerformanceHistory(limit = 50): PerformanceSnapshot[] {
    return this.performanceHistory.slice(-limit);
  }

  /**
   * Update performance thresholds
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.logger.info('Performance thresholds updated');
  }

  /**
   * Initialize default health checks
   */
  private initializeDefaultHealthChecks(): void {
    // System health check
    this.registerHealthCheck('system', async () => {
      const memoryUsage = process.memoryUsage();
      const memoryPercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      let status = HealthStatus.HEALTHY;
      let message = 'System operating normally';

      if (memoryPercent > this.thresholds.memoryUsagePercent.critical) {
        status = HealthStatus.CRITICAL;
        message = `Critical memory usage: ${memoryPercent.toFixed(1)}%`;
      } else if (memoryPercent > this.thresholds.memoryUsagePercent.warning) {
        status = HealthStatus.WARNING;
        message = `High memory usage: ${memoryPercent.toFixed(1)}%`;
      }

      return {
        name: 'system',
        status,
        message,
        lastCheck: new Date(),
        responseTime: 1,
        details: { memoryPercent, uptime: process.uptime() },
      };
    });

    // Event loop health check
    this.registerHealthCheck('event_loop', async () => {
      const startTime = process.hrtime.bigint();

      return new Promise<ComponentHealth>((resolve) => {
        setImmediate(() => {
          const endTime = process.hrtime.bigint();
          const delay = Number(endTime - startTime) / 1000000; // Convert to milliseconds

          let status = HealthStatus.HEALTHY;
          let message = 'Event loop responsive';

          if (delay > 100) {
            status = HealthStatus.CRITICAL;
            message = `Event loop delay: ${delay.toFixed(1)}ms`;
          } else if (delay > 50) {
            status = HealthStatus.WARNING;
            message = `Event loop delay: ${delay.toFixed(1)}ms`;
          }

          resolve({
            name: 'event_loop',
            status,
            message,
            lastCheck: new Date(),
            responseTime: delay,
            details: { delay },
          });
        });
      });
    });
  }

  /**
   * Main monitoring loop
   */
  private async monitoringLoop(): Promise<void> {
    while (this.isMonitoring) {
      try {
        await this.getCurrentPerformance();
        await this.sleep(this.MONITORING_INTERVAL);
      } catch (error) {
        this.logger.error('Error in monitoring loop:', error);
        await this.sleep(this.MONITORING_INTERVAL * 2);
      }
    }
  }

  /**
   * Calculate system load score
   */
  private calculateSystemLoad(
    memoryUsage: NodeJS.MemoryUsage,
    componentHealth: ComponentHealth[]
  ): number {
    // Memory load (0-1)
    const memoryLoad = memoryUsage.heapUsed / memoryUsage.heapTotal;

    // Component health load (0-1)
    const healthyComponents = componentHealth.filter(
      (h) => h.status === HealthStatus.HEALTHY
    ).length;
    const healthLoad =
      componentHealth.length > 0
        ? 1 - healthyComponents / componentHealth.length
        : 0;

    // Combined load (weighted average)
    return memoryLoad * 0.6 + healthLoad * 0.4;
  }

  /**
   * Analyze performance issues
   */
  private analyzePerformanceIssues(
    metrics: {
      memoryUsage: NodeJS.MemoryUsage;
      cpuUsage: NodeJS.CpuUsage;
      componentHealth: ComponentHealth[];
      systemLoad: number;
    },
    warnings: string[],
    errors: string[]
  ): void {
    const { memoryUsage, componentHealth, systemLoad } = metrics;

    // Memory warnings
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryPercent > this.thresholds.memoryUsagePercent.critical) {
      errors.push(`Critical memory usage: ${memoryPercent.toFixed(1)}%`);
    } else if (memoryPercent > this.thresholds.memoryUsagePercent.warning) {
      warnings.push(`High memory usage: ${memoryPercent.toFixed(1)}%`);
    }

    // System load warnings
    if (systemLoad > 0.9) {
      errors.push(`Critical system load: ${(systemLoad * 100).toFixed(1)}%`);
    } else if (systemLoad > 0.7) {
      warnings.push(`High system load: ${(systemLoad * 100).toFixed(1)}%`);
    }

    // Component health warnings
    const criticalComponents = componentHealth.filter(
      (h) => h.status === HealthStatus.CRITICAL
    );
    const warningComponents = componentHealth.filter(
      (h) => h.status === HealthStatus.WARNING
    );

    if (criticalComponents.length > 0) {
      errors.push(
        `Critical components: ${criticalComponents.map((c) => c.name).join(', ')}`
      );
    }

    if (warningComponents.length > 0) {
      warnings.push(
        `Warning components: ${warningComponents.map((c) => c.name).join(', ')}`
      );
    }
  }

  /**
   * Helper methods for recommendations
   */
  private calculateAverageMemoryUsage(
    snapshots: PerformanceSnapshot[]
  ): number {
    const totalUsage = snapshots.reduce((sum, snapshot) => {
      const percent =
        (snapshot.memoryUsage.heapUsed / snapshot.memoryUsage.heapTotal) * 100;
      return sum + percent;
    }, 0);
    return totalUsage / snapshots.length;
  }

  private getUnhealthyComponents(snapshots: PerformanceSnapshot[]): string[] {
    const unhealthyComponents = new Set<string>();
    snapshots.forEach((snapshot) => {
      snapshot.componentHealth.forEach((health) => {
        if (health.status !== HealthStatus.HEALTHY) {
          unhealthyComponents.add(health.name);
        }
      });
    });
    return Array.from(unhealthyComponents);
  }

  private analyzePerformanceTrend(snapshots: PerformanceSnapshot[]): {
    declining: boolean;
    slope: number;
  } {
    if (snapshots.length < 3) return { declining: false, slope: 0 };

    // Simple linear regression on system load
    const loads = snapshots.map((s) => s.systemLoad);
    const n = loads.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = loads.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * loads[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    return {
      declining: slope > 0.01, // Positive slope means increasing load (declining performance)
      slope,
    };
  }

  private calculateAverageQueueSizes(): Record<string, number> {
    const queueSizes: Record<string, number[]> = {};

    // Collect queue size metrics
    for (const [metricName, metricHistory] of this.metrics) {
      if (metricName.includes('queue_size')) {
        const recentMetrics = metricHistory.slice(-10);
        if (recentMetrics.length > 0) {
          const avgSize =
            recentMetrics.reduce((sum, metric) => sum + metric.value, 0) /
            recentMetrics.length;
          queueSizes[metricName] = [avgSize];
        }
      }
    }

    // Calculate averages
    const averages: Record<string, number> = {};
    for (const [queueName, sizes] of Object.entries(queueSizes)) {
      averages[queueName] =
        sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    }

    return averages;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
