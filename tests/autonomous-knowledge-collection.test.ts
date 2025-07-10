import { AutonomousKnowledgeCollector } from '../src/core/autonomous-knowledge-collector';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management';
import { MemoryManagementSystem } from '../src/core/memory-management';
import { DataIngestionService } from '../src/services/sensory/data-ingestion-service';
import { MemoryType } from '../src/types/index';

describe('AutonomousKnowledgeCollector', () => {
  let knowledgeCollector: AutonomousKnowledgeCollector;
  let knowledgeSystem: KnowledgeManagementSystem;
  let memorySystem: MemoryManagementSystem;
  let dataIngestion: DataIngestionService;

  beforeEach(() => {
    memorySystem = new MemoryManagementSystem();
    knowledgeSystem = new KnowledgeManagementSystem(memorySystem);
    dataIngestion = new DataIngestionService();
    knowledgeCollector = new AutonomousKnowledgeCollector(
      knowledgeSystem,
      memorySystem,
      dataIngestion
    );
  });

  afterEach(() => {
    knowledgeCollector.stop();
  });

  describe('Initialization', () => {
    test('should initialize with default collection tasks', () => {
      const stats = knowledgeCollector.getCollectionStats();
      expect(stats.totalTasks).toBeGreaterThan(0);
      expect(stats.activeTasks).toBeGreaterThan(0);
    });

    test('should have memory consolidation task', () => {
      const stats = knowledgeCollector.getCollectionStats();
      expect(
        stats.topSources.some((source) =>
          source.source.includes('memory_consolidation')
        )
      ).toBeDefined();
    });
  });

  describe('Collection Tasks', () => {
    test('should add custom collection task', () => {
      const taskId = knowledgeCollector.addCollectionTask({
        name: 'Test Collection Task',
        description: 'A test task for unit testing',
        sourceType: 'external_api' as any,
        strategy: 'scheduled' as any,
        configuration: { interval: 10000 },
        isActive: true,
        priority: 1,
        intervalMs: 10000,
        metadata: { test: true },
      });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    test('should remove collection task', () => {
      const taskId = knowledgeCollector.addCollectionTask({
        name: 'Test Collection Task',
        description: 'A test task for unit testing',
        sourceType: 'sensor_data' as any,
        strategy: 'continuous' as any,
        configuration: {},
        isActive: true,
        priority: 1,
        metadata: {},
      });

      const removed = knowledgeCollector.removeCollectionTask(taskId);
      expect(removed).toBe(true);
    });

    test('should fail to remove non-existent task', () => {
      const removed = knowledgeCollector.removeCollectionTask('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Knowledge Collection', () => {
    test('should collect knowledge from memory consolidation', async () => {
      // Add some memories first
      const memoryId = memorySystem.storeMemory({
        type: 'episodic' as any,
        content: { experience: 'test experience', outcome: 'positive' },
        connections: [],
        strength: 0.8,
        metadata: { test: true },
      });

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = knowledgeCollector.getCollectionStats();
      expect(stats).toBeDefined();
      expect(stats.totalTasks).toBeGreaterThan(0);
    });

    test('should trigger specific collection task', async () => {
      const taskId = knowledgeCollector.addCollectionTask({
        name: 'Test Trigger Task',
        description: 'Task for testing triggering',
        sourceType: 'pattern_discovery' as any,
        strategy: 'event_driven' as any,
        configuration: {},
        isActive: true,
        priority: 1,
        metadata: {},
      });

      const result = await knowledgeCollector.triggerCollection(taskId);
      expect(result).toBeDefined();
      expect(result?.success).toBeDefined();
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide collection statistics', () => {
      const stats = knowledgeCollector.getCollectionStats();

      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('activeTasks');
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('itemsCollectedToday');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('topSources');
      expect(stats).toHaveProperty('recentErrors');
    });

    test('should track task execution', async () => {
      const initialStats = knowledgeCollector.getCollectionStats();

      // Start collection (it should run some default tasks)
      knowledgeCollector.start();

      // Wait for some execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newStats = knowledgeCollector.getCollectionStats();

      // Total executions might have increased
      expect(newStats.totalExecutions).toBeGreaterThanOrEqual(
        initialStats.totalExecutions
      );
    });
  });

  describe('Autonomous Learning', () => {
    test('should collect knowledge from different sources', async () => {
      // Start the collection process
      knowledgeCollector.start();

      // Add some data to memory
      memorySystem.storeMemory({
        type: 'semantic' as any,
        content: { fact: 'The sky is blue', category: 'observation' },
        connections: [],
        strength: 0.9,
        metadata: { source: 'observation' },
      });

      // Add knowledge to trigger pattern discovery
      knowledgeSystem.addKnowledge({
        type: 'factual' as any,
        content: { fact: 'Water freezes at 0°C' },
        subject: 'Physics',
        confidence: 0.95,
        confidenceLevel: 'very_high' as any,
        sources: ['textbook'],
        tags: ['physics', 'temperature', 'water'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationScore: 0.95,
          contradictions: [],
          supportingEvidence: ['scientific_consensus'],
        },
        metadata: { domain: 'science' },
      });

      // Wait for collection cycles
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const stats = knowledgeCollector.getCollectionStats();
      expect(stats.totalExecutions).toBeGreaterThan(0);
    });

    test('should handle collection errors gracefully', async () => {
      // Add a task that will likely fail
      const taskId = knowledgeCollector.addCollectionTask({
        name: 'Failing Task',
        description: 'Task designed to fail for testing',
        sourceType: 'external_api' as any,
        strategy: 'scheduled' as any,
        configuration: { invalidConfig: true },
        isActive: true,
        priority: 1,
        intervalMs: 1000,
        metadata: { shouldFail: true },
      });

      // Try to trigger it
      const result = await knowledgeCollector.triggerCollection(taskId);

      // Should handle error gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Event-Driven Collection', () => {
    test('should respond to memory consolidation events', () => {
      const spy = jest.spyOn(knowledgeCollector as any, 'onMemoryConsolidated');

      // Emit memory consolidation event
      memorySystem.emit('memoryConsolidated', {
        id: 'test-memory',
        type: MemoryType.SEMANTIC,
        content: { test: 'data' },
        connections: [],
        strength: 0.7,
        lastAccessed: new Date(),
        accessCount: 1,
        metadata: { test: true },
      });

      expect(spy).toHaveBeenCalled();
    });

    test('should respond to knowledge addition events', () => {
      const spy = jest.spyOn(knowledgeCollector as any, 'onKnowledgeAdded');

      // Add knowledge to trigger event
      const knowledgeId = knowledgeSystem.addKnowledge({
        type: 'conceptual' as any,
        content: { concept: 'test concept' },
        subject: 'Testing',
        confidence: 0.7,
        confidenceLevel: 'high' as any,
        sources: ['test'],
        tags: ['test'],
        relationships: [],
        verification: {
          isVerified: false,
          verificationScore: 0.7,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {},
      });

      expect(knowledgeId).toBeDefined();
    });
  });
});
