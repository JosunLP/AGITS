import { Logger } from '../utils/logger.js';
import { EventEmitter } from '../utils/node-polyfill.js';
import { ServiceRegistry } from './service-registry.js';

/**
 * Health monitoring system for services and infrastructure
 */
export class HealthMonitor extends EventEmitter {
  private logger: Logger;
  private isRunning = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private serviceRegistry?: ServiceRegistry;

  constructor() {
    super();
    this.logger = new Logger('HealthMonitor');
  }

  /**
   * Start health monitoring
   */
  public async start(serviceRegistry?: ServiceRegistry): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Health monitor is already running');
      return;
    }

    if (serviceRegistry) {
      this.serviceRegistry = serviceRegistry;
    }
    this.isRunning = true;

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    this.logger.info('Health monitor started');
  }

  /**
   * Stop health monitoring
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.logger.info('Health monitor stopped');
  }

  /**
   * Perform health checks on all components
   */
  private async performHealthChecks(): Promise<void> {
    const healthResults: HealthCheckResult = {
      timestamp: new Date(),
      overall: 'healthy',
      components: {},
    };

    try {
      // Check system resources
      healthResults.components.system = await this.checkSystemHealth();

      // Check service registry
      if (this.serviceRegistry) {
        healthResults.components.services = this.checkServicesHealth();
      }

      // Check databases (if configured)
      healthResults.components.databases = await this.checkDatabaseHealth();

      // Determine overall health
      const componentStatuses = Object.values(healthResults.components);
      if (componentStatuses.some((status) => status.status === 'unhealthy')) {
        healthResults.overall = 'unhealthy';
      } else if (
        componentStatuses.some((status) => status.status === 'degraded')
      ) {
        healthResults.overall = 'degraded';
      }

      // Emit health update
      this.emit('healthUpdate', healthResults);
    } catch (error) {
      this.logger.error('Error performing health checks:', error);
      healthResults.overall = 'unhealthy';
      healthResults.error =
        error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Check system health (CPU, memory, etc.)
   */
  private async checkSystemHealth(): Promise<ComponentHealth> {
    try {
      // Get basic system info (fallback if process methods not available)
      let memoryUsage: any;
      let uptime: number;

      try {
        memoryUsage = (process as any).memoryUsage?.() || {
          rss: 0,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
        };
        uptime = (process as any).uptime?.() || 0;
      } catch (error) {
        memoryUsage = { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
        uptime = 0;
      }

      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercent = (memoryUsedMB / memoryTotalMB) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const issues: string[] = [];

      if (memoryPercent > 90) {
        status = 'unhealthy';
        issues.push(`High memory usage: ${memoryPercent.toFixed(1)}%`);
      } else if (memoryPercent > 75) {
        status = 'degraded';
        issues.push(`Elevated memory usage: ${memoryPercent.toFixed(1)}%`);
      }

      return {
        status,
        details: {
          memoryUsedMB,
          memoryTotalMB,
          memoryPercent: Math.round(memoryPercent),
          uptimeSeconds: Math.round(uptime),
          pid: (process as any).pid || 0,
        },
        issues,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        issues: [
          `System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Check services health via service registry
   */
  private checkServicesHealth(): ComponentHealth {
    if (!this.serviceRegistry) {
      return {
        status: 'unhealthy',
        issues: ['Service registry not available'],
      };
    }

    const stats = this.serviceRegistry.getStats();
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (stats.unhealthyServices > 0) {
      status = 'unhealthy';
      issues.push(`${stats.unhealthyServices} unhealthy services`);
    } else if (stats.degradedServices > 0) {
      status = 'degraded';
      issues.push(`${stats.degradedServices} degraded services`);
    }

    if (stats.averageResponseTime > 5000) {
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
      issues.push(`High average response time: ${stats.averageResponseTime}ms`);
    }

    return {
      status,
      details: {
        totalServices: stats.totalServices,
        healthyServices: stats.healthyServices,
        degradedServices: stats.degradedServices,
        unhealthyServices: stats.unhealthyServices,
        averageResponseTime: stats.averageResponseTime,
      },
      issues,
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // This is a placeholder - in a real implementation, you would
    // check actual database connections
    const databases = {
      mongodb: { connected: true, responseTime: 50 },
      neo4j: { connected: true, responseTime: 75 },
      redis: { connected: true, responseTime: 25 },
      pinecone: { connected: true, responseTime: 150 },
    };

    for (const [dbName, dbStatus] of Object.entries(databases)) {
      if (!dbStatus.connected) {
        status = 'unhealthy';
        issues.push(`${dbName} disconnected`);
      } else if (dbStatus.responseTime > 1000) {
        status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
        issues.push(`${dbName} slow response: ${dbStatus.responseTime}ms`);
      }
    }

    return {
      status,
      details: databases,
      issues,
    };
  }

  /**
   * Get current system health
   */
  public async getSystemHealth(): Promise<HealthCheckResult> {
    const healthResults: HealthCheckResult = {
      timestamp: new Date(),
      overall: 'healthy',
      components: {
        system: await this.checkSystemHealth(),
        services: this.serviceRegistry
          ? this.checkServicesHealth()
          : {
              status: 'unhealthy',
              issues: ['Service registry not available'],
            },
        databases: await this.checkDatabaseHealth(),
      },
    };

    // Determine overall health
    const componentStatuses = Object.values(healthResults.components);
    if (componentStatuses.some((status) => status.status === 'unhealthy')) {
      healthResults.overall = 'unhealthy';
    } else if (
      componentStatuses.some((status) => status.status === 'degraded')
    ) {
      healthResults.overall = 'degraded';
    }

    return healthResults;
  }

  /**
   * Check if monitor is running
   */
  public isMonitorRunning(): boolean {
    return this.isRunning;
  }
}

export interface HealthCheckResult {
  timestamp: Date;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, ComponentHealth>;
  error?: string;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: Record<string, any>;
  issues: string[];
}
