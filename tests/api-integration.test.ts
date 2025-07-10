import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { fastify, FastifyInstance } from 'fastify';
import { AutonomousKnowledgeCollector } from '../src/core/autonomous-knowledge-collector.js';
import { AutonomousProcessScheduler } from '../src/core/autonomous-scheduler.js';
import { ChemicalSignalingSystem } from '../src/core/chemical-signaling.js';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management.js';
import { MemoryManagementSystem } from '../src/core/memory-management.js';
import { APIController } from '../src/infrastructure/api-controller.js';
import { AttentionManager } from '../src/services/cognitive/attention-manager.js';
import { LearningOrchestrator } from '../src/services/cognitive/learning-orchestrator.js';
import { ReasoningEngineService } from '../src/services/cognitive/reasoning-engine.js';
import { NaturalLanguageProcessor } from '../src/services/communication/nlp-service.js';
import { DecisionEngine } from '../src/services/executive/decision-engine.js';
import { PlanningService } from '../src/services/executive/planning-service.js';
import { LearningType, MemoryType } from '../src/types/index.js';
import { defaultLearningConfig } from '../src/config/app.js';

describe('AGITS API Integration Tests', () => {
  let memorySystem: MemoryManagementSystem;
  let knowledgeSystem: KnowledgeManagementSystem;
  let scheduler: AutonomousProcessScheduler;
  let knowledgeCollector: AutonomousKnowledgeCollector;
  let chemicalSignaling: ChemicalSignalingSystem;
  let learningOrchestrator: LearningOrchestrator;
  let attentionManager: AttentionManager;
  let reasoningEngine: ReasoningEngineService;
  let nlpService: NaturalLanguageProcessor;
  let decisionEngine: DecisionEngine;
  let planningService: PlanningService;
  let apiController: APIController;
  let server: FastifyInstance;

  beforeAll(async () => {
    // Initialize core systems
    memorySystem = new MemoryManagementSystem(defaultLearningConfig);
    knowledgeSystem = new KnowledgeManagementSystem(memorySystem, defaultLearningConfig);
    scheduler = new AutonomousProcessScheduler();

    // Initialize cognitive services
    learningOrchestrator = new LearningOrchestrator(memorySystem);
    chemicalSignaling = new ChemicalSignalingSystem();
    attentionManager = new AttentionManager(chemicalSignaling);
    reasoningEngine = new ReasoningEngineService();
    nlpService = new NaturalLanguageProcessor();

    // Initialize executive services
    decisionEngine = new DecisionEngine(reasoningEngine, memorySystem);
    planningService = new PlanningService(decisionEngine); // Initialize supporting systems
    const mockDataIngestionService = {
      async ingestData() {
        return { success: true };
      },
      ingestionQueue: [],
      activeStreams: new Map(),
      processingRates: new Map(),
      PROCESSING_INTERVAL: 1000,
      on: jest.fn(), // Add event listener mock
      emit: jest.fn(), // Add event emitter mock
      removeListener: jest.fn(), // Add remove listener mock
    };

    knowledgeCollector = new AutonomousKnowledgeCollector(
      knowledgeSystem,
      memorySystem,
      mockDataIngestionService as any
    );

    // Initialize API controller with all services
    apiController = new APIController(
      knowledgeSystem,
      scheduler,
      memorySystem,
      {
        knowledgeCollector,
        chemicalSignaling,
        learningOrchestrator,
        reasoningEngine,
        attentionManager,
        decisionEngine,
        planningService,
        nlpService,
      }
    );

    // Setup Fastify server
    server = fastify({ logger: false });
    apiController.registerRoutes(server);

    await server.listen({ port: 0 }); // Use random port for testing
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  beforeEach(() => {
    // Clear systems before each test - implement custom reset logic
    // memorySystem and knowledgeSystem will be re-initialized for each test
  });

  describe('Health and Status Endpoints', () => {
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
      expect(result.knowledge).toBeDefined();
      expect(result.processes).toBeDefined();
    });
  });

  describe('Knowledge Management Endpoints', () => {
    it('should add knowledge successfully', async () => {
      const knowledge = {
        content: 'Test knowledge content',
        type: 'factual',
        domain: 'testing',
        confidence: 0.9,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: { knowledge },
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.knowledgeId).toBeDefined();
    });

    it('should search knowledge', async () => {
      // First add some knowledge
      const knowledge = {
        content: 'Advanced AI techniques for autonomous systems',
        type: 'technical',
        domain: 'artificial-intelligence',
        confidence: 0.85,
      };

      await server.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: { knowledge },
      });

      // Then search for it
      const response = await server.inject({
        method: 'GET',
        url: '/api/knowledge/search?query=AI techniques',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should get knowledge statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/knowledge/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalKnowledge).toBeDefined();
      expect(result.byDomain).toBeDefined();
      expect(result.byType).toBeDefined();
    });
  });

  describe('Memory Management Endpoints', () => {
    it('should store memory successfully', async () => {
      const memory = {
        type: MemoryType.SEMANTIC,
        content: {
          fact: 'Testing memory storage',
          context: 'API integration test',
        },
        connections: [],
        strength: 0.8,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/memory',
        payload: { memory },
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.memoryId).toBeDefined();
    });

    it('should search memories', async () => {
      // Store a memory first
      const memory = {
        type: MemoryType.EPISODIC,
        content: {
          event: 'Learning session completed',
          outcome: 'successful',
          topic: 'natural language processing',
        },
        connections: [],
        strength: 0.9,
        metadata: {
          source: 'learning',
        },
      };

      await server.inject({
        method: 'POST',
        url: '/api/memory',
        payload: { memory },
      });

      // Search for the memory
      const response = await server.inject({
        method: 'GET',
        url: '/api/memory/search?query=learning session',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.memories).toBeDefined();
      expect(Array.isArray(result.memories)).toBe(true);
    });

    it('should get memory statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/memory/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalMemories).toBeDefined();
      expect(result.byType).toBeDefined();
      expect(result.averageStrength).toBeDefined();
    });

    it('should trigger memory consolidation', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/memory/consolidate',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.consolidatedCount).toBeDefined();
    });
  });

  describe('Learning Endpoints', () => {
    it('should trigger learning process', async () => {
      const learningData = {
        type: LearningType.SUPERVISED,
        input: 'Sample learning input',
        expectedOutput: 'Expected result',
        context: {
          domain: 'testing',
          difficulty: 'medium',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/learn',
        payload: learningData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.learningId).toBeDefined();
    });

    it('should learn from experience', async () => {
      const experience = {
        experienceType: 'task_completion',
        outcome: 'success',
        context: {
          task: 'knowledge_search',
          duration: 1500,
          accuracy: 0.92,
        },
        lessons: ['Optimize search algorithms', 'Improve result ranking'],
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/learn/experience',
        payload: { experience },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Experience processed successfully');
    });

    it('should get learning statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/learn/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalSessions).toBeDefined();
      expect(result.successRate).toBeDefined();
      expect(result.averageAccuracy).toBeDefined();
    });
  });

  describe('Reasoning Endpoints', () => {
    it('should perform basic reasoning', async () => {
      const reasoningData = {
        input: 'All cats are mammals. Fluffy is a cat. What can we conclude?',
        context: {
          type: 'logical_reasoning',
          domain: 'animals',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/reason',
        payload: reasoningData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should perform chain-of-thought reasoning', async () => {
      const problemData = {
        problem:
          'How can we improve the efficiency of autonomous knowledge collection?',
        context: {
          domain: 'system_optimization',
          constraints: ['limited_resources', 'real_time_processing'],
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/reason/chain-of-thought',
        payload: problemData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.reasoningChain).toBeDefined();
      expect(Array.isArray(result.reasoningChain)).toBe(true);
    });

    it('should perform analogical reasoning', async () => {
      const analogyData = {
        source: 'human brain neural networks',
        target: 'artificial neural networks',
        context: {
          purpose: 'learning_optimization',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/reason/analogical',
        payload: analogyData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.analogy).toBeDefined();
      expect(result.insights).toBeDefined();
    });
  });

  describe('Chat and NLP Endpoints', () => {
    it('should handle basic chat interaction', async () => {
      const chatData = {
        message: 'Hello, can you help me understand autonomous systems?',
        context: {
          sessionId: 'test_session_1',
          domain: 'general',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/chat',
        payload: chatData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
    });

    it('should handle conversation management', async () => {
      const conversationData = {
        message: 'What are the key components of the AGITS system?',
        conversationId: 'conv_test_1',
        context: {
          domain: 'technical',
          level: 'advanced',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/chat/conversation',
        payload: conversationData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.response).toBeDefined();
      expect(result.data.understanding).toBeDefined();
      expect(result.data.confidence).toBeGreaterThan(0);
    });
  });

  describe('Decision Making Endpoints', () => {
    it('should make basic decisions', async () => {
      const decisionData = {
        options: [
          { name: 'option_a', priority: 'high', risk: 'low' },
          { name: 'option_b', priority: 'medium', risk: 'medium' },
        ],
        context: {
          domain: 'resource_allocation',
          constraints: ['time_limited'],
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/decisions/make',
        payload: decisionData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.decision).toBeDefined();
      expect(result.reasoning).toBeDefined();
    });

    it('should get recent decisions', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/decisions/recent',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.decisions).toBeDefined();
      expect(Array.isArray(result.decisions)).toBe(true);
    });
  });

  describe('Autonomous Processes Endpoints', () => {
    it('should get process status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/processes/status',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBeDefined();
      expect(result.activeProcesses).toBeDefined();
      expect(result.queuedTasks).toBeDefined();
    });

    it('should trigger specific process', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/processes/trigger/knowledge_collection',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.processTriggered).toBe('knowledge_collection');
    });

    it('should get scheduler statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/processes/scheduler/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalTasks).toBeDefined();
      expect(result.completedTasks).toBeDefined();
      expect(result.failedTasks).toBeDefined();
    });
  });

  describe('Attention Management Endpoints', () => {
    it('should get attention statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/attention/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.currentTargets).toBeDefined();
      expect(result.focusDistribution).toBeDefined();
      expect(result.averageAttention).toBeDefined();
    });

    it('should set attention focus', async () => {
      const focusData = {
        targetId: 'target_knowledge_search',
        type: 'task',
        priority: 0.8,
        metadata: {
          domain: 'learning',
          urgency: 'high',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/attention/focus',
        payload: focusData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Attention focus set successfully');
    });
  });

  describe('Knowledge Collection Endpoints', () => {
    it('should get collection statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/collection/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalCollected).toBeDefined();
      expect(result.successRate).toBeDefined();
      expect(result.averageQuality).toBeDefined();
    });

    it('should trigger knowledge collection', async () => {
      const collectionData = {
        sources: ['internal_memories', 'reasoning_results'],
        filters: {
          minConfidence: 0.7,
          domains: ['artificial_intelligence', 'autonomous_systems'],
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/collection/trigger',
        payload: collectionData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.collectionId).toBeDefined();
    });
  });

  describe('Chemical Signaling Endpoints', () => {
    it('should get chemical signal statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/chemical-signals/stats',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.totalSignals).toBeDefined();
      expect(result.activeSignals).toBeDefined();
      expect(result.signalTypes).toBeDefined();
    });

    it('should send chemical signal', async () => {
      const signalData = {
        type: 'dopamine',
        intensity: 0.8,
        target: 'learning_system',
        metadata: {
          trigger: 'successful_task_completion',
          context: 'api_test',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/chemical-signals/send',
        payload: signalData,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.signalId).toBeDefined();
    });
  });

  describe('System Integration Tests', () => {
    it('should demonstrate end-to-end learning flow', async () => {
      // 1. Add initial knowledge
      const knowledge = {
        content: 'Machine learning requires data preprocessing',
        type: 'technical',
        domain: 'machine_learning',
        confidence: 0.9,
      };

      const knowledgeResponse = await server.inject({
        method: 'POST',
        url: '/api/knowledge',
        payload: { knowledge },
      });

      expect(knowledgeResponse.statusCode).toBe(201);

      // 2. Store related memory
      const memory = {
        type: MemoryType.SEMANTIC,
        content: {
          concept: 'data preprocessing importance',
          domain: 'machine_learning',
          strength: 0.85,
        },
        connections: [],
        strength: 0.85,
        metadata: { source: 'integration_test' },
      };

      const memoryResponse = await server.inject({
        method: 'POST',
        url: '/api/memory',
        payload: { memory },
      });

      expect(memoryResponse.statusCode).toBe(201);

      // 3. Trigger learning from experience
      const experience = {
        experienceType: 'concept_reinforcement',
        outcome: 'success',
        context: {
          concept: 'data_preprocessing',
          reinforcement_strength: 0.9,
        },
        lessons: ['Data quality affects model performance'],
      };

      const learningResponse = await server.inject({
        method: 'POST',
        url: '/api/learn/experience',
        payload: { experience },
      });

      expect(learningResponse.statusCode).toBe(200);

      // 4. Test reasoning about the learned concept
      const reasoningResponse = await server.inject({
        method: 'POST',
        url: '/api/reason',
        payload: {
          input: 'Why is data preprocessing important in machine learning?',
          context: { domain: 'machine_learning' },
        },
      });

      expect(reasoningResponse.statusCode).toBe(200);
      const reasoningResult = JSON.parse(reasoningResponse.payload);
      expect(reasoningResult.success).toBe(true);

      // 5. Chat interaction about the concept
      const chatResponse = await server.inject({
        method: 'POST',
        url: '/api/chat',
        payload: {
          message: 'Tell me about data preprocessing in machine learning',
          context: { domain: 'machine_learning' },
        },
      });

      expect(chatResponse.statusCode).toBe(200);
      const chatResult = JSON.parse(chatResponse.payload);
      expect(chatResult.success).toBe(true);
    });

    it('should demonstrate autonomous decision making flow', async () => {
      // 1. Set up goals and constraints
      const goals = [
        {
          id: 'goal_1',
          description: 'Optimize system performance',
          type: 'optimization',
          priority: 1,
        },
      ];

      const constraints = [
        {
          id: 'constraint_1',
          description: 'Resource usage must not exceed 80%',
          type: 'resource',
        },
      ];

      // 2. Make complex decision
      const decisionResponse = await server.inject({
        method: 'POST',
        url: '/api/decisions/complex',
        payload: {
          options: [
            {
              name: 'increase_batch_size',
              performance_gain: 0.3,
              resource_cost: 0.6,
            },
            {
              name: 'optimize_algorithms',
              performance_gain: 0.2,
              resource_cost: 0.3,
            },
          ],
          goals,
          constraints,
          context: { domain: 'performance_optimization' },
        },
      });

      expect(decisionResponse.statusCode).toBe(200);
      const decisionResult = JSON.parse(decisionResponse.payload);
      expect(decisionResult.success).toBe(true);
      expect(decisionResult.data.decision).toBeDefined();

      // 3. Create strategic plan based on decision
      const planResponse = await server.inject({
        method: 'POST',
        url: '/api/planning/strategic',
        payload: {
          goal: {
            description: 'Implement performance optimization',
            type: 'long_term',
            priority: 1,
          },
          constraints,
          context: { domain: 'system_optimization' },
        },
      });

      expect(planResponse.statusCode).toBe(200);
      const planResult = JSON.parse(planResponse.payload);
      expect(planResult.success).toBe(true);
      expect(planResult.data.planId).toBeDefined();
    });
  });
});
