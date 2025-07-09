import fastify, { FastifyInstance } from 'fastify';
import path from 'path';
import { AppConfig } from '../config/app.js';
import { Logger } from '../utils/logger.js';
import { loggerPlugin } from './plugins/logger.js';
import { ServiceRegistry } from './service-registry.js';

/**
 * Fastify-based HTTP server for the AGITS Platform
 */
export class Server {
  private app: FastifyInstance;
  private config: AppConfig;
  private serviceRegistry: ServiceRegistry;
  private logger: Logger;
  private isStarted = false;

  constructor(config: AppConfig, serviceRegistry: ServiceRegistry) {
    this.config = config;
    this.serviceRegistry = serviceRegistry;
    this.logger = new Logger('Server');

    this.app = fastify({
      logger: false, // We use our own logger
      trustProxy: true,
      disableRequestLogging: true,
      requestIdLogLabel: 'requestId',
      genReqId: () =>
        `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    });

    this.setupPlugins();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  /**
   * Setup Fastify plugins
   */
  private async setupPlugins(): Promise<void> {
    // Register logger plugin
    await this.app.register(loggerPlugin);

    // Register plugins conditionally (with error handling)
    try {
      // Try to register sensible plugin for httpErrors
      const sensible = await import('@fastify/sensible');
      await this.app.register(sensible.default);
    } catch (error) {
      this.logger.warn('Failed to register @fastify/sensible plugin:', error);
    }

    // Register static file serving
    try {
      const staticPlugin = await import('@fastify/static');
      await this.app.register(staticPlugin.default, {
        root: path.join(process.cwd(), 'public'),
        prefix: '/', // optional: default '/'
      });
    } catch (error) {
      this.logger.warn('Failed to register @fastify/static plugin:', error);
    }

    try {
      // Register CORS if available
      const cors = await import('@fastify/cors');
      await this.app.register(cors.default, {
        origin: this.config.security.corsOrigins,
        credentials: true,
      });
    } catch (error) {
      this.logger.warn('Failed to register @fastify/cors plugin:', error);
    }

    try {
      // Register rate limiting if available
      const rateLimit = await import('@fastify/rate-limit');
      await this.app.register(rateLimit.default, {
        max: this.config.security.rateLimitMax,
        timeWindow: this.config.security.rateLimitWindowMs,
        allowList: ['127.0.0.1'],
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to register @fastify/rate-limit plugin:', error);
    }

    // Register Swagger documentation
    await this.app.register(import('@fastify/swagger'), {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'AGITS Platform API',
          description: 'Advanced General Intelligence Technological System',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://${this.config.host}:${this.config.port}`,
            description: 'Development server',
          },
        ],
      },
    });

    try {
      // Register Swagger UI if available
      const swaggerUi = await import('@fastify/swagger-ui');
      await this.app.register(swaggerUi.default, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to register @fastify/swagger-ui plugin:', error);
    }

    try {
      // Register JWT authentication if available
      const jwt = await import('@fastify/jwt');
      await this.app.register(jwt.default, {
        secret: this.config.security.jwtSecret,
      });
    } catch (error) {
      this.logger.warn('Failed to register @fastify/jwt plugin:', error);
    }
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get(
      '/health',
      {
        schema: {
          description: 'Health check endpoint',
          tags: ['health'],
          response: {
            200: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                services: { type: 'object' },
              },
            },
          },
        },
      },
      async () => {
        const services = this.serviceRegistry.getAllServiceHealth();
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          services: services.reduce(
            (acc, service) => {
              acc[service.serviceId] = service.status;
              return acc;
            },
            {} as Record<string, string>
          ),
        };
      }
    );

    // Service registry endpoints
    this.app.get(
      '/api/services',
      {
        schema: {
          description: 'Get all registered services',
          tags: ['services'],
          response: {
            200: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string' },
                  lastHeartbeat: { type: 'string' },
                },
              },
            },
          },
        },
      },
      async () => {
        return this.serviceRegistry.getAllServices().map((service) => ({
          name: service.name,
          status:
            this.serviceRegistry.getServiceHealth(service.name)?.status ||
            'unknown',
          lastHeartbeat: service.lastHeartbeat.toISOString(),
        }));
      }
    );

    // Service health endpoint
    this.app.get(
      '/api/services/:serviceName/health',
      {
        schema: {
          description: 'Get service health',
          tags: ['services'],
          params: {
            type: 'object',
            properties: {
              serviceName: { type: 'string' },
            },
            required: ['serviceName'],
          },
        },
      },
      async (request: any, reply: any) => {
        const { serviceName } = request.params;
        const health = this.serviceRegistry.getServiceHealth(serviceName);

        if (!health) {
          // Create error response
          reply.code(404).send({
            error: 'Not Found',
            message: `Service '${serviceName}' not found`,
          });
          return;
        }

        return health;
      }
    );

    // Metrics endpoint
    this.app.get(
      '/api/metrics',
      {
        schema: {
          description: 'Get system metrics',
          tags: ['metrics'],
        },
      },
      async () => {
        return this.serviceRegistry.getStats();
      }
    );

    // Cognitive services endpoints
    this.app.post(
      '/api/cognitive/reasoning',
      {
        schema: {
          description: 'Submit a reasoning task',
          tags: ['cognitive'],
          body: {
            type: 'object',
            properties: {
              input: { type: 'object' },
              context: { type: 'object' },
            },
            required: ['input'],
          },
        },
      },
      async (request: any, reply: any) => {
        const reasoningEngine =
          this.serviceRegistry.getService('reasoning-engine');
        if (!reasoningEngine) {
          reply.code(503).send({
            error: 'Service Unavailable',
            message: 'Reasoning engine not available',
          });
          return;
        }

        const task = {
          id: `task_${Date.now()}`,
          type: 'reasoning',
          input: request.body.input,
          context: request.body.context || {},
          priority: 1,
          requiredResources: [],
          dependencies: [],
        };

        return await reasoningEngine.processReasoningTask(task);
      }
    );

    // Memory endpoints
    this.app.post(
      '/api/memory',
      {
        schema: {
          description: 'Store a memory',
          tags: ['memory'],
          body: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              content: { type: 'object' },
              strength: { type: 'number' },
            },
            required: ['type', 'content'],
          },
        },
      },
      async (request: any, reply: any) => {
        const memorySystem =
          this.serviceRegistry.getService('memory-management');
        if (!memorySystem) {
          reply.code(503).send({
            error: 'Service Unavailable',
            message: 'Memory system not available',
          });
          return;
        }

        const memoryId = memorySystem.storeMemory({
          type: request.body.type,
          content: request.body.content,
          connections: [],
          strength: request.body.strength || 0.5,
          metadata: {},
        });

        return { memoryId };
      }
    );

    this.app.get(
      '/api/memory/:memoryId',
      {
        schema: {
          description: 'Retrieve a memory',
          tags: ['memory'],
          params: {
            type: 'object',
            properties: {
              memoryId: { type: 'string' },
            },
            required: ['memoryId'],
          },
        },
      },
      async (request: any, reply: any) => {
        const memorySystem =
          this.serviceRegistry.getService('memory-management');
        if (!memorySystem) {
          reply.code(503).send({
            error: 'Service Unavailable',
            message: 'Memory system not available',
          });
          return;
        }

        const memory = memorySystem.retrieveMemory(request.params.memoryId);
        if (!memory) {
          reply.code(404).send({
            error: 'Not Found',
            message: 'Memory not found',
          });
          return;
        }

        return memory;
      }
    );

    // Root endpoint
    this.app.get('/', async () => {
      return {
        name: 'AGITS Platform',
        version: '1.0.0',
        description: 'Advanced General Intelligence Technological System',
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    this.app.setErrorHandler((error, request, reply) => {
      this.logger.error(
        {
          error: error.message,
          stack: error.stack,
          url: request.url,
          method: request.method,
        },
        'Request error'
      );

      const statusCode = error.statusCode || 500;
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
        },
      });
    });

    this.app.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: {
          message: 'Route not found',
          statusCode: 404,
          url: request.url,
        },
      });
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      await this.app.listen({
        port: this.config.port,
        host: this.config.host,
      });

      this.isStarted = true;
      this.logger.info(
        `Server started on ${this.config.host}:${this.config.port}`
      );
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    if (!this.isStarted) return;

    try {
      await this.app.close();
      this.isStarted = false;
      this.logger.info('Server stopped');
    } catch (error) {
      this.logger.error('Error stopping server:', error);
      throw error;
    }
  }

  /**
   * Get the Fastify instance
   */
  public getFastifyInstance(): FastifyInstance {
    return this.app;
  }

  /**
   * Get the Fastify instance for registering additional routes
   */
  public getInstance(): FastifyInstance {
    return this.app;
  }

  /**
   * Check if server is started
   */
  public isRunning(): boolean {
    return this.isStarted;
  }
}
