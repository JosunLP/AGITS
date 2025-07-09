import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Logger } from '../../utils/logger.js';

/**
 * Logger plugin for Fastify with structured logging
 */
export const loggerPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  const logger = new Logger('FastifyServer');

  // Add logger to fastify instance
  fastify.decorate('logger', logger);

  // Request logging
  fastify.addHook('onRequest', async (request) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        remoteAddress: request.ip,
        requestId: request.id,
      },
      'Request received'
    );
  });

  // Response logging
  fastify.addHook('onResponse', async (request, reply) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id,
      },
      'Request completed'
    );
  });

  // Error logging
  fastify.addHook('onError', async (request, reply, error) => {
    logger.error(
      {
        method: request.method,
        url: request.url,
        error: error.message,
        stack: error.stack,
        requestId: request.id,
      },
      'Request error'
    );
  });
};
