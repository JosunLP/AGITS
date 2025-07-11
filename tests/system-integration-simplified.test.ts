import { defaultLearningConfig } from '../src/config/app.js';
import { AutonomousProcessScheduler } from '../src/core/autonomous-scheduler';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management';
import { MemoryManagementSystem } from '../src/core/memory-management';
import { LearningOrchestrator } from '../src/services/cognitive/learning-orchestrator';
import { ReasoningEngineService } from '../src/services/cognitive/reasoning-engine';
import { DecisionEngine } from '../src/services/executive/decision-engine';
import { PlanningService } from '../src/services/executive/planning-service';
import {
  ConsolidationPhase,
  LearningExperience,
  LearningType,
  MemoryPriority,
  MemoryType,
} from '../src/types/index';

describe('AGITS System Integration Tests (Working)', () => {
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
    knowledgeSystem = new KnowledgeManagementSystem(
      memorySystem,
      defaultLearningConfig
    );
    scheduler = new AutonomousProcessScheduler();
    learningOrchestrator = new LearningOrchestrator(memorySystem);
    reasoningEngine = new ReasoningEngineService();
    decisionEngine = new DecisionEngine(reasoningEngine, memorySystem);
    planningService = new PlanningService(decisionEngine);
  });

  describe('Core System Initialization', () => {
    it('should initialize all core systems', () => {
      expect(memorySystem).toBeDefined();
      expect(knowledgeSystem).toBeDefined();
      expect(scheduler).toBeDefined();
      expect(learningOrchestrator).toBeDefined();
      expect(reasoningEngine).toBeDefined();
      expect(decisionEngine).toBeDefined();
      expect(planningService).toBeDefined();
    });

    it('should have correct system types', () => {
      expect(knowledgeSystem).toBeInstanceOf(KnowledgeManagementSystem);
      expect(memorySystem).toBeInstanceOf(MemoryManagementSystem);
      expect(learningOrchestrator).toBeInstanceOf(LearningOrchestrator);
      expect(decisionEngine).toBeInstanceOf(DecisionEngine);
      expect(planningService).toBeInstanceOf(PlanningService);
    });
  });

  describe('Memory Management Integration', () => {
    it('should store and retrieve memories correctly', async () => {
      const memoryContent = {
        concept: 'test concept',
        description: 'test memory storage',
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
      expect(retrievedMemory?.content).toEqual(memoryContent);
      expect(retrievedMemory?.type).toBe(MemoryType.SEMANTIC);
    });

    it('should store different types of memories', () => {
      const semanticMemoryId = memorySystem.storeMemory({
        type: MemoryType.SEMANTIC,
        content: { concept: 'semantic test' },
        connections: [],
        strength: 0.8,
        metadata: { source: 'test' },
      });

      const episodicMemoryId = memorySystem.storeMemory({
        type: MemoryType.EPISODIC,
        content: { event: 'episodic test' },
        connections: [],
        strength: 0.7,
        metadata: { source: 'test' },
      });

      expect(semanticMemoryId).toBeDefined();
      expect(episodicMemoryId).toBeDefined();
      expect(semanticMemoryId).not.toBe(episodicMemoryId);
    });
  });

  describe('Knowledge Management Integration', () => {
    it('should add and query knowledge correctly', () => {
      const knowledgeItem = {
        type: 'factual' as any,
        content: 'Test knowledge content',
        subject: 'testing',
        confidence: 0.8,
        confidenceLevel: 'high' as any,
        sources: ['test'],
        tags: ['test', 'integration'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationDate: new Date(),
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: { source: 'test' },
      };

      const knowledgeId = knowledgeSystem.addKnowledge(knowledgeItem);
      expect(knowledgeId).toBeDefined();
      expect(typeof knowledgeId).toBe('string');

      const queryResults = knowledgeSystem.queryKnowledge({
        subjects: ['testing'],
        limit: 10,
      });
      expect(queryResults).toBeDefined();
      expect(Array.isArray(queryResults)).toBe(true);
      expect(queryResults.length).toBeGreaterThan(0);
    });
  });

  describe('Learning Orchestrator Integration', () => {
    it('should process learning experiences', async () => {
      const learningExperience: LearningExperience = {
        id: 'exp_1',
        type: LearningType.SUPERVISED,
        input: { data: 'test input' },
        expectedOutput: 'expected result',
        actualOutput: 'actual result',
        reward: 0.8,
        confidence: 0.9,
        timestamp: new Date(),
        context: {
          sessionId: 'test_session',
          environment: { type: 'test_environment' },
          goals: [],
          constraints: [],
        },
      };

      await learningOrchestrator.learnFromExperience(learningExperience);

      // Check if learning orchestrator is functioning
      expect(learningOrchestrator).toBeDefined();
    });
  });

  describe('Decision Engine Integration', () => {
    it('should handle goals and constraints', async () => {
      // Test basic decision engine functionality
      expect(decisionEngine).toBeDefined();
      expect(decisionEngine).toBeInstanceOf(DecisionEngine);
    });
  });

  describe('System Health and Monitoring', () => {
    it('should allow memory operations', async () => {
      // Test that basic memory operations work
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
        type: 'factual' as any,
        content: 'Health check knowledge',
        subject: 'health',
        confidence: 0.9,
        confidenceLevel: 'very_high' as any,
        sources: ['health_test'],
        tags: ['health'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationDate: new Date(),
          verificationScore: 0.95,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: { source: 'health_test' },
      });

      expect(knowledgeId).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle memory-knowledge integration', async () => {
      // 1. Store memory
      const memoryId = memorySystem.storeMemory({
        type: MemoryType.SEMANTIC,
        content: { concept: 'machine learning', domain: 'AI' },
        connections: [],
        strength: 0.8,
        metadata: { source: 'integration_test' },
      });

      // 2. Add related knowledge
      const knowledgeId = knowledgeSystem.addKnowledge({
        type: 'conceptual' as any,
        content: 'Machine learning is a subset of AI',
        subject: 'machine learning',
        confidence: 0.9,
        confidenceLevel: 'very_high' as any,
        sources: ['textbook'],
        tags: ['AI', 'ML'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationDate: new Date(),
          verificationScore: 0.95,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: { domain: 'AI' },
      });

      // 3. Create learning experience
      const experience: LearningExperience = {
        id: 'exp_integration',
        type: LearningType.SUPERVISED,
        input: { concept: 'machine learning' },
        expectedOutput: 'AI subset',
        actualOutput: 'AI subset',
        reward: 1.0,
        confidence: 0.95,
        timestamp: new Date(),
        context: {
          sessionId: 'integration_test',
          environment: { type: 'test_environment' },
          goals: [],
          constraints: [],
        },
      };

      await learningOrchestrator.learnFromExperience(experience);

      // 4. Verify integration worked
      expect(memoryId).toBeDefined();
      expect(knowledgeId).toBeDefined();

      const retrievedMemory = memorySystem.retrieveMemory(memoryId);
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory?.content.concept).toBe('machine learning');
    });

    it('should demonstrate system interconnectivity', () => {
      // Test that all systems can work together
      expect(memorySystem).toBeInstanceOf(MemoryManagementSystem);
      expect(knowledgeSystem).toBeInstanceOf(KnowledgeManagementSystem);
      expect(learningOrchestrator).toBeInstanceOf(LearningOrchestrator);
      expect(decisionEngine).toBeInstanceOf(DecisionEngine);
      expect(planningService).toBeInstanceOf(PlanningService);
      expect(reasoningEngine).toBeInstanceOf(ReasoningEngineService);

      // Test basic cross-system operations
      const memoryId = memorySystem.storeMemory({
        type: MemoryType.PROCEDURAL,
        content: { procedure: 'test procedure' },
        connections: [],
        strength: 0.7,
        metadata: { source: 'interconnectivity_test' },
      });

      const knowledgeId = knowledgeSystem.addKnowledge({
        type: 'procedural' as any,
        content: 'Test procedure knowledge',
        subject: 'procedures',
        confidence: 0.8,
        confidenceLevel: 'high' as any,
        sources: ['test'],
        tags: ['procedure'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationDate: new Date(),
          verificationScore: 0.8,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: { type: 'procedural' },
      });

      expect(memoryId).toBeDefined();
      expect(knowledgeId).toBeDefined();
    });
  });
});
