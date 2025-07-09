import { FastifyInstance } from 'fastify';
import { AutonomousProcessScheduler } from '../core/autonomous-scheduler.js';
import { KnowledgeManagementSystem } from '../core/knowledge-management.js';
import { MemoryManagementSystem } from '../core/memory-management.js';
import { Logger } from '../utils/logger.js';

/**
 * API Controller for AGITS Platform interactions
 * Provides REST endpoints for system interaction and monitoring
 */
export class APIController {
  private logger: Logger;
  private knowledgeSystem: KnowledgeManagementSystem;
  private scheduler: AutonomousProcessScheduler;
  private memorySystem: MemoryManagementSystem;

  constructor(
    knowledgeSystem: KnowledgeManagementSystem,
    scheduler: AutonomousProcessScheduler,
    memorySystem: MemoryManagementSystem
  ) {
    this.logger = new Logger('APIController');
    this.knowledgeSystem = knowledgeSystem;
    this.scheduler = scheduler;
    this.memorySystem = memorySystem;
  }

  /**
   * Register API routes with Fastify server
   */
  public registerRoutes(server: FastifyInstance): void {
    // Health and status endpoints
    server.get('/api/health', this.getHealth.bind(this));
    server.get('/api/status', this.getStatus.bind(this));

    // Knowledge management endpoints
    server.post('/api/knowledge', this.addKnowledge.bind(this));
    server.get('/api/knowledge/search', this.searchKnowledge.bind(this));
    server.get('/api/knowledge/stats', this.getKnowledgeStats.bind(this));

    // Memory management endpoints
    server.get('/api/memory/stats', this.getMemoryStats.bind(this));
    server.post(
      '/api/memory/consolidate',
      this.triggerMemoryConsolidation.bind(this)
    );

    // Autonomous processes endpoints
    server.get('/api/processes/status', this.getProcessStatus.bind(this));
    server.post('/api/processes/trigger/:type', this.triggerProcess.bind(this));

    // Learning and interaction endpoints
    server.post('/api/learn', this.learn.bind(this));
    server.post('/api/query', this.query.bind(this));
    server.post('/api/reason', this.reason.bind(this));

    this.logger.info('API routes registered successfully');
  }

  /**
   * Health check endpoint
   */
  private async getHealth(request: any, reply: any) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
      };

      reply.code(200).send(health);
    } catch (error) {
      this.logger.error('Health check failed:', error);
      reply.code(500).send({ error: 'Health check failed' });
    }
  }

  /**
   * System status endpoint
   */
  private async getStatus(request: any, reply: any) {
    try {
      const status = {
        platform: 'AGITS',
        status: 'running',
        timestamp: new Date().toISOString(),
        systems: {
          knowledgeBase: {
            status: 'active',
            description: 'Knowledge management system running',
          },
          memorySystem: {
            status: 'active',
            description: 'Memory management system running',
          },
          autonomousProcesses: {
            status: 'active',
            description: 'Autonomous processes running',
          },
        },
      };

      reply.code(200).send(status);
    } catch (error) {
      this.logger.error('Status check failed:', error);
      reply.code(500).send({ error: 'Status check failed' });
    }
  }

  /**
   * Add knowledge endpoint
   */
  private async addKnowledge(request: any, reply: any) {
    try {
      const { knowledge } = request.body;

      if (!knowledge) {
        return reply.code(400).send({ error: 'Knowledge data required' });
      }

      const knowledgeId = this.knowledgeSystem.addKnowledge(knowledge);

      reply.code(201).send({
        success: true,
        knowledgeId,
        message: 'Knowledge added successfully',
      });
    } catch (error) {
      this.logger.error('Failed to add knowledge:', error);
      reply.code(500).send({ error: 'Failed to add knowledge' });
    }
  }

  /**
   * Search knowledge endpoint
   */
  private async searchKnowledge(request: any, reply: any) {
    try {
      const query = request.query;
      const results = this.knowledgeSystem.queryKnowledge(query);

      reply.code(200).send({
        success: true,
        results,
        count: results.length,
      });
    } catch (error) {
      this.logger.error('Knowledge search failed:', error);
      reply.code(500).send({ error: 'Knowledge search failed' });
    }
  }

  /**
   * Get knowledge statistics
   */
  private async getKnowledgeStats(request: any, reply: any) {
    try {
      const stats = {
        status: 'active',
        description: 'Knowledge system statistics',
        timestamp: new Date().toISOString(),
      };
      reply.code(200).send(stats);
    } catch (error) {
      this.logger.error('Failed to get knowledge stats:', error);
      reply.code(500).send({ error: 'Failed to get knowledge stats' });
    }
  }

  /**
   * Get memory statistics
   */
  private async getMemoryStats(request: any, reply: any) {
    try {
      const stats = {
        status: 'active',
        description: 'Memory system statistics',
        timestamp: new Date().toISOString(),
      };
      reply.code(200).send(stats);
    } catch (error) {
      this.logger.error('Failed to get memory stats:', error);
      reply.code(500).send({ error: 'Failed to get memory stats' });
    }
  }

  /**
   * Trigger memory consolidation
   */
  private async triggerMemoryConsolidation(request: any, reply: any) {
    try {
      // Trigger memory consolidation through events
      this.memorySystem.emit('consolidationRequested');

      reply.code(200).send({
        success: true,
        message: 'Memory consolidation triggered',
      });
    } catch (error) {
      this.logger.error('Failed to trigger memory consolidation:', error);
      reply.code(500).send({ error: 'Failed to trigger memory consolidation' });
    }
  }

  /**
   * Get autonomous process status
   */
  private async getProcessStatus(request: any, reply: any) {
    try {
      const status = this.scheduler.getStats();
      reply.code(200).send(status);
    } catch (error) {
      this.logger.error('Failed to get process status:', error);
      reply.code(500).send({ error: 'Failed to get process status' });
    }
  }

  /**
   * Trigger specific autonomous process
   */
  private async triggerProcess(request: any, reply: any) {
    try {
      const { type } = request.params;

      // Trigger process through scheduler (simplified)
      this.scheduler.emit('processTriggered', { type });

      reply.code(200).send({
        success: true,
        message: `Process ${type} trigger requested`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to trigger process ${request.params.type}:`,
        error
      );
      reply
        .code(500)
        .send({ error: `Failed to trigger process ${request.params.type}` });
    }
  }

  /**
   * Learning endpoint - add new information for the AI to learn
   */
  private async learn(request: any, reply: any) {
    try {
      const { data, context } = request.body;

      if (!data) {
        return reply.code(400).send({ error: 'Learning data required' });
      }

      // Process learning data
      const learningResult = await this.processLearningData(data, context);

      reply.code(200).send({
        success: true,
        result: learningResult,
        message: 'Learning completed successfully',
      });
    } catch (error) {
      this.logger.error('Learning failed:', error);
      reply.code(500).send({ error: 'Learning failed' });
    }
  }

  /**
   * Query endpoint - ask the AI questions
   */
  private async query(request: any, reply: any) {
    try {
      const { question, context } = request.body;

      if (!question) {
        return reply.code(400).send({ error: 'Question required' });
      }

      // Process query
      const answer = await this.processQuery(question, context);

      reply.code(200).send({
        success: true,
        question,
        answer,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Query failed:', error);
      reply.code(500).send({ error: 'Query failed' });
    }
  }

  /**
   * Reasoning endpoint - request the AI to reason about something
   */
  private async reason(request: any, reply: any) {
    try {
      const { scenario, constraints } = request.body;

      if (!scenario) {
        return reply.code(400).send({ error: 'Reasoning scenario required' });
      }

      // Process reasoning
      const reasoning = await this.processReasoning(scenario, constraints);

      reply.code(200).send({
        success: true,
        scenario,
        reasoning,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Reasoning failed:', error);
      reply.code(500).send({ error: 'Reasoning failed' });
    }
  }

  /**
   * Process learning data
   */
  private async processLearningData(data: any, context?: any): Promise<any> {
    // Extract knowledge from the provided data
    const extractedKnowledge = await this.extractKnowledgeFromData(
      data,
      context
    );

    // Store in knowledge base
    const knowledgeIds = [];
    for (const knowledge of extractedKnowledge) {
      const id = this.knowledgeSystem.addKnowledge(knowledge);
      knowledgeIds.push(id);
    }

    return {
      extractedKnowledge: extractedKnowledge.length,
      knowledgeIds,
      status: 'learned',
    };
  }

  /**
   * Process query and provide answer
   */
  private async processQuery(question: string, context?: any): Promise<string> {
    // Search relevant knowledge
    const relevantKnowledge = this.knowledgeSystem.queryKnowledge({
      textSearch: question,
      limit: 10,
      confidenceMin: 0.3,
    });

    // Generate answer based on knowledge
    if (relevantKnowledge.length > 0) {
      return this.generateAnswerFromKnowledge(question, relevantKnowledge);
    } else {
      return "I don't have enough knowledge to answer that question. Please provide more information or try a different question.";
    }
  }

  /**
   * Process reasoning scenario
   */
  private async processReasoning(
    scenario: string,
    constraints?: any
  ): Promise<any> {
    // Search for relevant knowledge and patterns
    const relevantKnowledge = this.knowledgeSystem.queryKnowledge({
      textSearch: scenario,
      limit: 20,
      includeRelated: true,
    });

    // Apply reasoning logic
    return {
      analysis: `Analyzed scenario: ${scenario}`,
      considerations: relevantKnowledge.slice(0, 5).map((k) => k.subject),
      reasoning:
        'Based on available knowledge, here are the logical conclusions...',
      confidence: relevantKnowledge.length > 0 ? 0.7 : 0.3,
    };
  }

  /**
   * Extract knowledge from raw data
   */
  private async extractKnowledgeFromData(
    data: any,
    context?: any
  ): Promise<any[]> {
    const extractedKnowledge = [];

    // Simple extraction logic - can be enhanced with NLP
    if (typeof data === 'string') {
      extractedKnowledge.push({
        type: 'FACTUAL',
        content: data,
        subject: 'user-provided',
        confidence: 0.6,
        confidenceLevel: 'MEDIUM',
        sources: ['user-input'],
        tags: ['user-provided', 'text'],
        relationships: [],
        verification: {
          isVerified: false,
          verificationScore: 0.5,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: { source: 'api', context: context || {} },
      });
    }

    return extractedKnowledge;
  }

  /**
   * Generate answer from knowledge base
   */
  private generateAnswerFromKnowledge(
    question: string,
    knowledge: any[]
  ): string {
    // Simple answer generation - can be enhanced with NLP
    const relevantInfo = knowledge.map((k) => k.content).join(' ');
    return `Based on my knowledge: ${relevantInfo.substring(0, 500)}...`;
  }
}
