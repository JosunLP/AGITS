import { describe, expect, it } from '@jest/globals';
import { fastify } from 'fastify';
import { defaultLearningConfig } from '../src/config/app.js';
import { AutonomousProcessScheduler } from '../src/core/autonomous-scheduler.js';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management.js';
import { MemoryManagementSystem } from '../src/core/memory-management.js';
import { APIController } from '../src/infrastructure/api-controller.js';

describe('AGITS API Integration Tests (No Server)', () => {
  let apiController: APIController;
  let app: ReturnType<typeof fastify>;

  beforeEach(() => {
    // Initialize core systems for each test
    const memorySystem = new MemoryManagementSystem(defaultLearningConfig);
    const knowledgeSystem = new KnowledgeManagementSystem(
      memorySystem,
      defaultLearningConfig
    );
    const scheduler = new AutonomousProcessScheduler();

    // Initialize API controller
    apiController = new APIController(knowledgeSystem, scheduler, memorySystem);

    // Setup Fastify app without listening
    app = fastify({ logger: false });
    apiController.registerRoutes(app);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health and Status Endpoints', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.memory).toBeDefined();
      expect(result.version).toBe('1.0.0');
    });

    it('should return system status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/status',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.platform).toBe('AGITS');
      expect(result.status).toBe('running');
      expect(result.systems).toBeDefined();
      expect(result.systems.knowledgeBase).toBeDefined();
      expect(result.systems.memorySystem).toBeDefined();
      expect(result.systems.scheduler).toBeDefined();
    });

    it('should return system metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.memory).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.uptime).toBeDefined();
    });
  });

  describe('Knowledge Management Endpoints', () => {
    it('should add knowledge successfully', async () => {
      const knowledgeData = {
        content: 'Test knowledge content for API integration',
        category: 'test',
        metadata: {
          source: 'api-test',
          timestamp: new Date().toISOString(),
          importance: 0.7,
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: knowledgeData,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      // Fix: The API returns an object with id property, not a string directly
      expect(typeof result.id).toBe('string');
    });

    it('should search knowledge', async () => {
      // First add some knowledge
      await app.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: {
          content: 'Searchable test content',
          category: 'test',
          metadata: { source: 'test' },
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/knowledge/search?query=searchable',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.total).toBeDefined();
      expect(typeof result.total).toBe('number');
    });

    it('should return knowledge stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/knowledge/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalKnowledge).toBeDefined();
      expect(typeof result.totalKnowledge).toBe('number');
      expect(result.categories).toBeDefined();
      expect(result.averageImportance).toBeDefined();
    });

    it('should handle knowledge validation errors', async () => {
      const invalidData = {
        // Missing required fields
        invalidField: 'test',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBeDefined();
    });
  });

  describe('Memory Management Endpoints', () => {
    it('should store memory successfully', async () => {
      const memoryData = {
        type: 'episodic',
        content: 'Test episodic memory content',
        importance: 0.8,
        tags: ['test', 'integration'],
        metadata: {
          timestamp: new Date().toISOString(),
          context: 'api-test',
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/memory',
        payload: memoryData,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.memoryId).toBeDefined();
      expect(typeof result.memoryId).toBe('string');
    });

    it('should return memory stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/memory/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalMemories).toBeDefined();
      expect(typeof result.totalMemories).toBe('number');
      expect(result.memoryTypes).toBeDefined();
      expect(result.averageImportance).toBeDefined();
    });

    it('should search memories', async () => {
      // First store a memory
      await app.inject({
        method: 'POST',
        url: '/api/memory',
        payload: {
          type: 'semantic',
          content: 'Searchable memory content',
          importance: 0.6,
          tags: ['searchable'],
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/memory/search?query=searchable',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(Array.isArray(result.memories)).toBe(true);
      expect(result.total).toBeDefined();
      expect(typeof result.total).toBe('number');
    });

    it('should trigger memory consolidation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/memory/consolidate',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.consolidatedMemories).toBeDefined();
    });
  });

  describe('Process Management Endpoints', () => {
    it('should return process status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/processes/status',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.scheduler).toBeDefined();
      expect(result.runningProcesses).toBeDefined();
      expect(Array.isArray(result.runningProcesses)).toBe(true);
      expect(result.queuedProcesses).toBeDefined();
    });

    it('should return scheduler stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/processes/scheduler/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalTasks).toBeDefined();
      expect(typeof result.totalTasks).toBe('number');
      expect(result.completedTasks).toBeDefined();
      expect(result.averageExecutionTime).toBeDefined();
    });

    it('should trigger a process', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/processes/trigger/memory_consolidation',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent endpoints gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/non-existent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid JSON in POST requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing required parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/knowledge/search', // Missing query parameter
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid process types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/processes/trigger/invalid_process',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBeDefined();
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent response format for successful operations', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: {
          content: 'Response format test',
          category: 'test',
          metadata: { source: 'format-test' },
        },
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('id');
      expect(result.success).toBe(true);
    });

    it('should return consistent error format for failed operations', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: {}, // Empty payload should cause validation error
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });
  });
});
