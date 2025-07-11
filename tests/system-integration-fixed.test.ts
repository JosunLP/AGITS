import { defaultLearningConfig } from '../src/config/app.js';
import { AutonomousProcessScheduler } from '../src/core/autonomous-scheduler';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management';
import { MemoryManagementSystem } from '../src/core/memory-management';
import { LearningOrchestrator } from '../src/services/cognitive/learning-orchestrator';
import { ReasoningEngineService } from '../src/services/cognitive/reasoning-engine';
import { DecisionEngine } from '../src/services/executive/decision-engine';
import { PlanningService } from '../src/services/executive/planning-service';
import {
  ConfidenceLevel,
  ConsolidationPhase,
  KnowledgeStatus,
  KnowledgeType,
  LearningExperience,
  LearningType,
  MemoryPriority,
  MemoryType,
} from '../src/types/index';

describe('AGITS System Integration Tests (Fixed)', () => {
  let memorySystem: MemoryManagementSystem;
  let knowledgeSystem: KnowledgeManagementSystem;
  let scheduler: AutonomousProcessScheduler;
  let learningOrchestrator: LearningOrchestrator;
  let reasoningEngine: ReasoningEngineService;
  let decisionEngine: DecisionEngine;
  let planningService: PlanningService;

  beforeEach(() => {
    // Initialize core systems with correct constructor arguments
    memorySystem = new MemoryManagementSystem(defaultLearningConfig);
    knowledgeSystem = new KnowledgeManagementSystem(defaultLearningConfig);
    scheduler = new AutonomousProcessScheduler();
    learningOrchestrator = new LearningOrchestrator(defaultLearningConfig);
    reasoningEngine = new ReasoningEngineService(knowledgeSystem);
    decisionEngine = new DecisionEngine();
    planningService = new PlanningService();
  });

  afterEach(() => {
    scheduler.stop();
    decisionEngine.stop();
  });

  describe('Memory Management Integration', () => {
    it('should store and retrieve memories correctly', async () => {
      const memoryContent = {
        concept: 'machine learning',
        description: 'A subset of artificial intelligence',
        context: 'integration test',
      };

      const memoryId = await memorySystem.storeMemory({
        type: MemoryType.SEMANTIC,
        content: memoryContent,
        connections: [],
        strength: 0.8,
        createdAt: new Date(),
        decayRate: 0.01,
        consolidationLevel: 1,
        priority: MemoryPriority.HIGH,
        metadata: {
          source: 'test',
          tags: ['integration', 'test'],
          category: 'testing',
          importance: 0.8,
          emotionalValence: 0.5,
          contextualRelevance: 0.7,
          validationStatus: 'validated',
          consolidationPhase: ConsolidationPhase.ENCODING,
          associatedGoals: [],
          confidence: 0.8,
        },
      });

      expect(memoryId).toBeDefined();
      expect(typeof memoryId).toBe('string');

      const retrievedMemory = memorySystem.retrieveMemory(memoryId);
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory?.content.concept).toBe('machine learning');
    });

    it('should handle memory consolidation', async () => {
      const memoryId = await memorySystem.storeMemory({
        type: MemoryType.EPISODIC,
        content: { event: 'test event', location: 'test environment' },
        connections: [],
        strength: 0.7,
        createdAt: new Date(),
        decayRate: 0.02,
        consolidationLevel: 0,
        priority: MemoryPriority.NORMAL,
        metadata: {
          source: 'test',
          tags: ['episodic', 'test'],
          category: 'testing',
          importance: 0.7,
          emotionalValence: 0.5,
          contextualRelevance: 0.6,
          validationStatus: 'validated',
          consolidationPhase: ConsolidationPhase.ENCODING,
          associatedGoals: [],
          confidence: 0.7,
        },
      });

      expect(memoryId).toBeDefined();

      // Test consolidation process
      await memorySystem.performMemoryConsolidation();

      const consolidatedMemory = memorySystem.retrieveMemory(memoryId);
      expect(consolidatedMemory).toBeDefined();
    });
  });

  describe('Knowledge Management Integration', () => {
    it('should add and query knowledge correctly', () => {
      const knowledgeItem = {
        type: KnowledgeType.FACTUAL,
        content: 'TypeScript is a typed superset of JavaScript',
        subject: 'testing',
        source: 'integration test',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.HIGH,
        sources: ['test'],
        tags: ['testing'],
        relationships: [],
        status: KnowledgeStatus.ACTIVE,
        validation: {
          isVerified: true,
          verifiedAt: new Date(),
          verificationMethod: 'test',
        },
        verification: {
          isVerified: true,
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {
          domain: 'programming',
          complexity: 0.5,
          importance: 0.8,
          frequency: 0.7,
          context: 'testing',
          lastValidated: new Date(),
          validationCount: 1,
          qualityScore: 0.9,
          reliability: 0.8,
          provenance: 'test',
        },
      };

      const knowledgeId = knowledgeSystem.addKnowledge(knowledgeItem);
      expect(knowledgeId).toBeDefined();
      expect(typeof knowledgeId).toBe('string');

      const queryResults = knowledgeSystem.queryKnowledge({
        subjects: ['testing'],
        tags: ['testing'],
        confidence: { min: 0.8 },
      });

      expect(queryResults).toBeDefined();
      expect(Array.isArray(queryResults)).toBe(true);
    });
  });

  describe('Learning Orchestrator Integration', () => {
    it('should process learning experiences', async () => {
      const learningExperience: LearningExperience = {
        id: 'test-learning-1',
        type: LearningType.SUPERVISED,
        data: { input: 'test data', output: 'expected result' },
        outcome: { result: 'successful learning', accuracy: 0.85 },
        timestamp: new Date(),
        context: {
          sessionId: 'test-session',
          environment: { type: 'test' },
          goals: [],
          constraints: [],
          priorKnowledge: [],
          resources: [],
        },
        feedback: { rating: 0.8, comments: 'Good learning outcome' },
        metadata: { source: 'integration test', difficulty: 0.5 },
      };

      const result =
        await learningOrchestrator.processLearningExperience(
          learningExperience
        );
      expect(result).toBeDefined();
    });
  });

  describe('System Health and Monitoring', () => {
    it('should allow memory operations', async () => {
      const memoryId = await memorySystem.storeMemory({
        type: MemoryType.SEMANTIC,
        content: { test: 'health check' },
        connections: [],
        strength: 0.8,
        createdAt: new Date(),
        decayRate: 0.01,
        consolidationLevel: 1,
        priority: MemoryPriority.NORMAL,
        metadata: {
          source: 'health_test',
          tags: ['health', 'test'],
          category: 'testing',
          importance: 0.8,
          emotionalValence: 0.5,
          contextualRelevance: 0.7,
          validationStatus: 'validated',
          consolidationPhase: ConsolidationPhase.ENCODING,
          associatedGoals: [],
          confidence: 0.8,
        },
      });

      const memory = memorySystem.retrieveMemory(memoryId);
      expect(memory).toBeDefined();
      expect(memory?.content.test).toBe('health check');
    });

    it('should allow knowledge operations', () => {
      const knowledgeId = knowledgeSystem.addKnowledge({
        type: KnowledgeType.FACTUAL,
        content: 'Health check knowledge',
        subject: 'health',
        source: 'health test',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.HIGH,
        sources: ['test'],
        tags: ['health'],
        relationships: [],
        status: KnowledgeStatus.ACTIVE,
        validation: {
          isVerified: true,
          verifiedAt: new Date(),
          verificationMethod: 'test',
        },
        verification: {
          isVerified: true,
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {
          domain: 'health',
          complexity: 0.3,
          importance: 0.9,
          frequency: 0.8,
          context: 'health testing',
          lastValidated: new Date(),
          validationCount: 1,
          qualityScore: 0.9,
          reliability: 0.9,
          provenance: 'test',
        },
      });

      expect(knowledgeId).toBeDefined();
      expect(typeof knowledgeId).toBe('string');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle memory-knowledge integration', async () => {
      // Store a memory
      const memoryId = await memorySystem.storeMemory({
        type: MemoryType.SEMANTIC,
        content: { concept: 'machine learning' },
        connections: [],
        strength: 0.9,
        createdAt: new Date(),
        decayRate: 0.01,
        consolidationLevel: 1,
        priority: MemoryPriority.HIGH,
        metadata: {
          source: 'integration_test',
          tags: ['ml', 'ai'],
          category: 'concepts',
          importance: 0.9,
          emotionalValence: 0.6,
          contextualRelevance: 0.8,
          validationStatus: 'validated',
          consolidationPhase: ConsolidationPhase.STORAGE,
          associatedGoals: [],
          confidence: 0.9,
        },
      });

      // Add related knowledge
      const knowledgeId = knowledgeSystem.addKnowledge({
        type: KnowledgeType.FACTUAL,
        content:
          'Machine learning enables computers to learn without explicit programming',
        subject: 'AI',
        source: 'integration test',
        confidence: 0.95,
        confidenceLevel: ConfidenceLevel.HIGH,
        sources: ['test'],
        tags: ['ml', 'ai'],
        relationships: [],
        status: KnowledgeStatus.ACTIVE,
        validation: {
          isVerified: true,
          verifiedAt: new Date(),
          verificationMethod: 'test',
        },
        verification: {
          isVerified: true,
          verificationScore: 0.95,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {
          domain: 'AI',
          complexity: 0.7,
          importance: 0.9,
          frequency: 0.8,
          context: 'machine learning concepts',
          lastValidated: new Date(),
          validationCount: 1,
          qualityScore: 0.95,
          reliability: 0.9,
          provenance: 'test',
        },
      });

      // Process learning experience
      const learningExperience: LearningExperience = {
        id: 'integration-learning-1',
        type: LearningType.REINFORCEMENT,
        data: { concept: 'machine learning', related_memory: memoryId },
        outcome: { understanding: 'improved', confidence: 0.85 },
        timestamp: new Date(),
        context: {
          sessionId: 'integration-session',
          environment: { type: 'integration' },
          goals: [],
          constraints: [],
          priorKnowledge: [knowledgeId],
          resources: [],
        },
        feedback: { rating: 0.9, comments: 'Excellent integration' },
        metadata: { source: 'integration test', complexity: 0.8 },
      };

      const result =
        await learningOrchestrator.processLearningExperience(
          learningExperience
        );

      // Verify integration
      const retrievedMemory = memorySystem.retrieveMemory(memoryId);
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory?.content.concept).toBe('machine learning');

      expect(result).toBeDefined();
    });

    it('should demonstrate system interconnectivity', () => {
      // Test that all systems are properly initialized and can interact
      expect(memorySystem).toBeDefined();
      expect(knowledgeSystem).toBeDefined();
      expect(scheduler).toBeDefined();
      expect(learningOrchestrator).toBeDefined();
      expect(reasoningEngine).toBeDefined();
      expect(decisionEngine).toBeDefined();
      expect(planningService).toBeDefined();

      // Test basic system operations
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);

      decisionEngine.start();
      // Basic functionality verification would go here

      scheduler.stop();
      decisionEngine.stop();
    });
  });
});
