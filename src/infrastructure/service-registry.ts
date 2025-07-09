import { EventEmitter } from 'events';
import {
  ServiceHealth,
  ServiceMetrics,
  ServiceStatus,
} from '../types/index.js';
import { Logger } from '../utils/logger.js';

/**
 * Service registry for managing and discovering services
 */
export class ServiceRegistry extends EventEmitter {
  private services: Map<string, RegisteredService> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('ServiceRegistry');
    this.startHealthChecking();
  }

  /**
   * Register a service
   */
  public registerService(
    name: string,
    instance: any,
    metadata?: ServiceMetadata
  ): void {
    const service: RegisteredService = {
      name,
      instance,
      metadata: metadata || {},
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    this.services.set(name, service);

    // Initialize health status
    this.serviceHealth.set(name, {
      serviceId: name,
      status: ServiceStatus.HEALTHY,
      lastHeartbeat: new Date(),
      metrics: this.getDefaultMetrics(),
      errors: [],
    });

    this.logger.info(`Service registered: ${name}`);
    this.emit('serviceRegistered', service);
  }

  /**
   * Unregister a service
   */
  public unregisterService(name: string): boolean {
    const service = this.services.get(name);
    if (!service) {
      return false;
    }

    this.services.delete(name);
    this.serviceHealth.delete(name);

    this.logger.info(`Service unregistered: ${name}`);
    this.emit('serviceUnregistered', service);
    return true;
  }

  /**
   * Get a service by name
   */
  public getService<T = any>(name: string): T | null {
    const service = this.services.get(name);
    return service ? service.instance : null;
  }

  /**
   * Get all registered services
   */
  public getAllServices(): RegisteredService[] {
    return Array.from(this.services.values());
  }

  /**
   * Check if a service is registered
   */
  public hasService(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Update service heartbeat
   */
  public updateHeartbeat(
    name: string,
    metrics?: Partial<ServiceMetrics>
  ): void {
    const service = this.services.get(name);
    const health = this.serviceHealth.get(name);

    if (service && health) {
      service.lastHeartbeat = new Date();
      health.lastHeartbeat = new Date();

      if (metrics) {
        health.metrics = { ...health.metrics, ...metrics };
      }

      // Update status based on metrics
      this.updateServiceStatus(name, health);
    }
  }

  /**
   * Get service health
   */
  public getServiceHealth(name: string): ServiceHealth | null {
    return this.serviceHealth.get(name) || null;
  }

  /**
   * Get all service health statuses
   */
  public getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get services by status
   */
  public getServicesByStatus(status: ServiceStatus): RegisteredService[] {
    const services: RegisteredService[] = [];

    for (const service of this.services.values()) {
      const health = this.serviceHealth.get(service.name);
      if (health && health.status === status) {
        services.push(service);
      }
    }

    return services;
  }

  /**
   * Start health checking for all services
   */
  private startHealthChecking(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health checks on all services
   */
  private performHealthChecks(): void {
    const now = new Date();
    const healthCheckTimeout = 60000; // 1 minute

    for (const [name, service] of this.services.entries()) {
      const health = this.serviceHealth.get(name);
      if (!health) continue;

      const timeSinceHeartbeat =
        now.getTime() - service.lastHeartbeat.getTime();

      if (timeSinceHeartbeat > healthCheckTimeout) {
        health.status = ServiceStatus.UNHEALTHY;
        this.logger.warn(
          `Service ${name} health check failed - no heartbeat for ${timeSinceHeartbeat}ms`
        );
        this.emit('serviceUnhealthy', service);
      }

      // Check if service has a health check method
      if (
        service.instance &&
        typeof service.instance.healthCheck === 'function'
      ) {
        try {
          const healthResult = service.instance.healthCheck();
          if (healthResult && typeof healthResult.then === 'function') {
            // Handle async health check
            healthResult
              .then((result: any) => this.handleHealthCheckResult(name, result))
              .catch((error: Error) =>
                this.handleHealthCheckError(name, error)
              );
          } else {
            this.handleHealthCheckResult(name, healthResult);
          }
        } catch (error) {
          this.handleHealthCheckError(name, error as Error);
        }
      }
    }
  }

  /**
   * Handle health check result
   */
  private handleHealthCheckResult(name: string, result: any): void {
    const health = this.serviceHealth.get(name);
    if (!health) return;

    if (result && result.status) {
      health.status = result.status;
      if (result.metrics) {
        health.metrics = { ...health.metrics, ...result.metrics };
      }
    }
  }

  /**
   * Handle health check error
   */
  private handleHealthCheckError(name: string, error: Error): void {
    const health = this.serviceHealth.get(name);
    if (!health) return;

    health.status = ServiceStatus.UNHEALTHY;
    health.errors.push({
      id: `error_${Date.now()}`,
      message: error.message,
      stack: error.stack || '',
      timestamp: new Date(),
      severity: 'error' as any,
      resolved: false,
    });

    this.logger.error(`Health check error for service ${name}:`, error);
  }

  /**
   * Update service status based on metrics
   */
  private updateServiceStatus(name: string, health: ServiceHealth): void {
    const metrics = health.metrics;

    // Determine status based on metrics
    if (metrics.errorRate > 0.1) {
      // 10% error rate
      health.status = ServiceStatus.DEGRADED;
    } else if (metrics.responseTime > 5000) {
      // 5 second response time
      health.status = ServiceStatus.DEGRADED;
    } else if (metrics.cpu > 90 || metrics.memory > 90) {
      // 90% resource usage
      health.status = ServiceStatus.DEGRADED;
    } else {
      health.status = ServiceStatus.HEALTHY;
    }
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): ServiceMetrics {
    return {
      cpu: 0,
      memory: 0,
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      custom: {},
    };
  }

  /**
   * Get registry statistics
   */
  public getStats(): ServiceRegistryStats {
    const services = Array.from(this.services.values());
    const healthStatuses = Array.from(this.serviceHealth.values());

    return {
      totalServices: services.length,
      healthyServices: healthStatuses.filter(
        (h) => h.status === ServiceStatus.HEALTHY
      ).length,
      unhealthyServices: healthStatuses.filter(
        (h) => h.status === ServiceStatus.UNHEALTHY
      ).length,
      degradedServices: healthStatuses.filter(
        (h) => h.status === ServiceStatus.DEGRADED
      ).length,
      averageResponseTime: this.calculateAverageResponseTime(healthStatuses),
      totalErrors: healthStatuses.reduce(
        (total, h) => total + h.errors.length,
        0
      ),
    };
  }

  /**
   * Calculate average response time across all services
   */
  private calculateAverageResponseTime(
    healthStatuses: ServiceHealth[]
  ): number {
    if (healthStatuses.length === 0) return 0;

    const totalResponseTime = healthStatuses.reduce(
      (sum, health) => sum + health.metrics.responseTime,
      0
    );

    return totalResponseTime / healthStatuses.length;
  }
}

interface RegisteredService {
  name: string;
  instance: any;
  metadata: ServiceMetadata;
  registeredAt: Date;
  lastHeartbeat: Date;
}

interface ServiceMetadata {
  version?: string;
  description?: string;
  tags?: string[];
  endpoints?: string[];
  dependencies?: string[];
}

interface ServiceRegistryStats {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  degradedServices: number;
  averageResponseTime: number;
  totalErrors: number;
}
