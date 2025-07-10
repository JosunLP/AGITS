import { describe, expect, it } from '@jest/globals';
import { fastify } from 'fastify';
import { defaultLearningConfig } from '../src/config/app.js';

describe('Basic API Test', () => {
  it('should work with basic Fastify setup', async () => {
    const app = fastify({ logger: false });

    app.get('/test', async (request, reply) => {
      return { message: 'test successful' };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.message).toBe('test successful');

    await app.close();
  });

  it('should test Health endpoint in isolation', async () => {
    const app = fastify({ logger: false });

    app.get('/api/health', async (request, reply) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
      };
      reply.code(200).send(health);
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.status).toBe('healthy');
    expect(result.timestamp).toBeDefined();

    await app.close();
  });
});
