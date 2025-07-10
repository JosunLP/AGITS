import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { fastify, FastifyInstance } from 'fastify';
import { AutonomousProcessScheduler } from '../src/core/autonomous-scheduler.js';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management.js';
import { MemoryManagementSystem } from '../src/core/memory-management.js';
import { APIController } from '../src/infrastructure/api-controller.js';
import { defaultLearningConfig } from '../src/config/app.js';

describe('AGITS API Integration Tests (Simplified)', () => {
  let server: FastifyInstance;
  let apiController: APIController;

  beforeAll(async () => {
    try {
      // Initialize only core systems for basic testing
      const memorySystem = new MemoryManagementSystem(defaultLearningConfig);
      const knowledgeSystem = new KnowledgeManagementSystem(memorySystem, defaultLearningConfig);
      const scheduler = new AutonomousProcessScheduler();

      // Initialize API controller with minimal services
      apiController = new APIController(
        knowledgeSystem,
        scheduler,
        memorySystem
      );

      // Setup Fastify server with minimal configuration
      server = fastify({
        logger: false,
        disableRequestLogging: true,
      });

      // Register routes
      apiController.registerRoutes(server);

      // Start server on random port
      await server.listen({ port: 0, host: '127.0.0.1' });

      console.log('Test server started successfully');
    } catch (error) {
      console.error('Failed to start test server:', error);
      throw error;
    }
  }, 15000); // Increase timeout to 15 seconds

  afterAll(async () => {
    if (server) {
      try {
        await server.close();
        console.log('Test server closed successfully');
      } catch (error) {
        console.error('Error closing test server:', error);
      }
    }
  });

  describe('Basic Health and Status Endpoints', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return system status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/status',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.platform).toBe('AGITS');
      expect(result.status).toBe('running');
      expect(result.systems).toBeDefined();
    });

    it('should return system metrics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.memory).toBeDefined();
      expect(result.performance).toBeDefined();
    });
  });

  describe('Knowledge Management Endpoints', () => {
    it('should add knowledge successfully', async () => {
      const knowledgeData = {
        content: 'Test knowledge content',
        category: 'test',
        metadata: { source: 'test' },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: knowledgeData,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should search knowledge', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/knowledge/search?query=test',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should return knowledge stats', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/knowledge/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalKnowledge).toBeDefined();
      expect(typeof result.totalKnowledge).toBe('number');
    });
  });

  describe('Memory Management Endpoints', () => {
    it('should store memory successfully', async () => {
      const memoryData = {
        type: 'episodic',
        content: 'Test memory content',
        importance: 0.8,
        tags: ['test'],
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/memory',
        payload: memoryData,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.memoryId).toBeDefined();
    });

    it('should return memory stats', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/memory/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalMemories).toBeDefined();
      expect(typeof result.totalMemories).toBe('number');
    });

    it('should search memories', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/memory/search?query=test',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(Array.isArray(result.memories)).toBe(true);
    });
  });

  describe('Process Management Endpoints', () => {
    it('should return process status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/processes/status',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.scheduler).toBeDefined();
      expect(result.runningProcesses).toBeDefined();
    });

    it('should return scheduler stats', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/processes/scheduler/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalTasks).toBeDefined();
      expect(typeof result.totalTasks).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent endpoints gracefully', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/non-existent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid JSON in POST requests', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
