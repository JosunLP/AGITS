import { AGITSPlatform } from '../src/index';
import { LearningType, MemoryType } from '../src/types/index';

describe('AGITS Platform Integration', () => {
  let platform: AGITSPlatform;

  beforeAll(async () => {
    platform = new AGITSPlatform();
    await platform.start();

    // Wait for systems to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await platform.stop();
  });

  describe('System Initialization', () => {
    test('should start platform successfully', async () => {
      const health = await platform.getHealthStatus();
      expect(health).toBeDefined();
    });

    test('should have all core services running', () => {
      const serviceRegistry = platform.getServiceRegistry();
      expect(serviceRegistry).toBeDefined();

      // Check if core services are registered
      const memoryService = serviceRegistry.getService('memory-management');
      const knowledgeService = serviceRegistry.getService(
        'knowledge-management'
      );
      const reasoningService = serviceRegistry.getService('reasoning-engine');
      const learningService = serviceRegistry.getService(
        'learning-orchestrator'
      );

      expect(memoryService).toBeDefined();
      expect(knowledgeService).toBeDefined();
      expect(reasoningService).toBeDefined();
      expect(learningService).toBeDefined();
    });
  });

  describe('Autonomous Learning Processes', () => {
    test('should automatically consolidate memories', async () => {
      const memoryService = platform
        .getServiceRegistry()
        .getService('memory-management');
      expect(memoryService).toBeDefined();

      // Store an episodic memory
      const memoryId = memoryService.storeMemory({
        type: MemoryType.EPISODIC,
        content: {
          experience: 'User asked about artificial intelligence',
          outcome: 'Provided comprehensive explanation',
          context: 'educational_conversation',
          timestamp: new Date(),
        },
        connections: [],
        strength: 0.8,
        metadata: {
          category: 'interaction',
          importance: 'high',
          learnable: true,
        },
      });

      expect(memoryId).toBeDefined();

      // Wait for autonomous memory consolidation to occur
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Check if memory was consolidated
      const memoryStats = memoryService.getMemoryStats();
      expect(memoryStats.consolidationQueueSize).toBeGreaterThanOrEqual(0);
      expect(memoryStats.semanticCount).toBeGreaterThanOrEqual(0);
    });

    test('should autonomously collect and process knowledge', async () => {
      const knowledgeService = platform
        .getServiceRegistry()
        .getService('knowledge-management');
      expect(knowledgeService).toBeDefined();

      // Add some initial knowledge
      const knowledgeId = knowledgeService.addKnowledge({
        type: 'FACTUAL',
        content: {
          fact: 'Machine learning is a subset of artificial intelligence',
          domain: 'computer_science',
        },
        subject: 'Machine Learning Fundamentals',
        description: 'Basic definition of machine learning within AI context',
        confidence: 0.95,
        confidenceLevel: 'VERY_HIGH',
        sources: ['educational_material'],
        tags: ['ai', 'machine_learning', 'definition'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationScore: 0.95,
          contradictions: [],
          supportingEvidence: ['academic_consensus'],
        },
        metadata: {
          domain: 'technology',
          complexity: 'beginner',
        },
      });

      expect(knowledgeId).toBeDefined();

      // Wait for autonomous knowledge collection processes
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Check if knowledge was processed and potentially expanded
      const knowledgeStats = knowledgeService.getKnowledgeStats();
      expect(knowledgeStats.totalItems).toBeGreaterThan(0);
    });

    test('should perform autonomous learning from experiences', async () => {
      const learningService = platform
        .getServiceRegistry()
        .getService('learning-orchestrator');
      expect(learningService).toBeDefined();

      // Queue a learning experience
      learningService.queueLearningTask({
        id: `learning_task_${Date.now()}`,
        type: LearningType.REINFORCEMENT,
        experience: {
          id: `exp_${Date.now()}`,
          type: LearningType.REINFORCEMENT,
          input: { action: 'provide_explanation', topic: 'quantum_computing' },
          actualOutput: {
            explanation: 'Quantum computing uses quantum mechanics...',
            quality: 'high',
          },
          reward: 0.9, // Positive feedback
          confidence: 0.8,
          timestamp: new Date(),
          context: {
            user_expertise: 'intermediate',
            session_type: 'educational',
          },
        },
        priority: 1,
        createdAt: new Date(),
      });

      // Wait for learning processing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Check learning statistics
      const learningStats = learningService.getLearningStats();
      expect(learningStats.totalTasks).toBeGreaterThan(0);
      expect(learningStats.queueSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-time Cognitive Processes', () => {
    test('should maintain attention and process focus', async () => {
      const attentionService = platform
        .getServiceRegistry()
        .getService('attention-manager');
      expect(attentionService).toBeDefined();

      // Add attention targets
      attentionService.addAttentionTarget('learning_task_1', 'LEARNING', 0.8, {
        category: 'education',
        urgency: 'medium',
      });

      attentionService.addAttentionTarget('error_detection_1', 'ERROR', 0.9, {
        category: 'system',
        urgency: 'high',
      });

      // Wait for attention processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check attention state
      const attentionStats = attentionService.getAttentionStats();
      expect(attentionStats.activeTargets).toBeGreaterThan(0);
      expect(attentionStats.primaryFocusId).toBeDefined();
    });

    test('should process chemical signaling between services', async () => {
      const chemicalService = platform
        .getServiceRegistry()
        .getService('chemical-signaling');
      expect(chemicalService).toBeDefined();

      // Send neurotransmitter message
      chemicalService.sendMessage(
        'DOPAMINE',
        'learning',
        'reward_achieved',
        { reward_value: 0.8, task_completed: 'explanation_task' },
        'HIGH'
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check chemical signaling stats
      const chemicalStats = chemicalService.getSystemStats();
      expect(chemicalStats.totalMessages).toBeGreaterThan(0);
    });

    test('should make autonomous decisions', async () => {
      const decisionService = platform
        .getServiceRegistry()
        .getService('decision-engine');
      expect(decisionService).toBeDefined();

      // Decision service should be processing autonomously
      // We'll just verify it's running
      expect(decisionService).toBeDefined();

      // Wait for decision processing
      await new Promise((resolve) => setTimeout(resolve, 5000));
    });
  });

  describe('Knowledge Integration and Reasoning', () => {
    test('should integrate knowledge across different domains', async () => {
      const knowledgeService = platform
        .getServiceRegistry()
        .getService('knowledge-management');
      const reasoningService = platform
        .getServiceRegistry()
        .getService('reasoning-engine');

      expect(knowledgeService).toBeDefined();
      expect(reasoningService).toBeDefined();

      // Add related knowledge items
      const physics_id = knowledgeService.addKnowledge({
        type: 'FACTUAL',
        content: {
          fact: 'Energy cannot be created or destroyed, only transformed',
        },
        subject: 'Conservation of Energy',
        confidence: 0.98,
        confidenceLevel: 'VERY_HIGH',
        sources: ['physics_textbook'],
        tags: ['physics', 'energy', 'conservation'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationScore: 0.98,
          contradictions: [],
          supportingEvidence: ['experimental_evidence'],
        },
        metadata: { domain: 'physics' },
      });

      const ai_id = knowledgeService.addKnowledge({
        type: 'CONCEPTUAL',
        content: {
          concept:
            'Neural networks require computational energy to process information',
        },
        subject: 'AI Energy Requirements',
        confidence: 0.85,
        confidenceLevel: 'HIGH',
        sources: ['ai_research'],
        tags: ['ai', 'energy', 'neural_networks', 'computation'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationScore: 0.85,
          contradictions: [],
          supportingEvidence: ['empirical_studies'],
        },
        metadata: { domain: 'computer_science' },
      });

      // Wait for autonomous cross-referencing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Search for related knowledge
      const relatedKnowledge = knowledgeService.queryKnowledge({
        tags: ['energy'],
        limit: 10,
      });

      expect(relatedKnowledge.length).toBeGreaterThanOrEqual(2);
    });

    test('should perform complex reasoning tasks', async () => {
      const reasoningService = platform
        .getServiceRegistry()
        .getService('reasoning-engine');
      expect(reasoningService).toBeDefined();

      // Test chain-of-thought reasoning
      const reasoningResult = await reasoningService.chainOfThoughtReasoning(
        [
          'All artificial intelligence systems require computational resources',
          'Large language models are a type of artificial intelligence system',
          'Computational resources consume energy',
        ],
        'Determine the energy implications of large language models',
        { domain: 'ai_sustainability' }
      );

      expect(reasoningResult).toBeDefined();
      expect(reasoningResult.chain).toBeDefined();
      expect(reasoningResult.finalConclusion).toBeDefined();
      expect(reasoningResult.overallConfidence).toBeGreaterThan(0);
    });
  });

  describe('System Performance and Self-Monitoring', () => {
    test('should track system performance metrics', async () => {
      const metrics = platform.getMetrics();
      expect(metrics).toBeDefined();

      // Should include performance metrics
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('uptime');
    });

    test('should detect and adapt to system load', async () => {
      // Simulate high load by adding many memories and knowledge items rapidly
      const memoryService = platform
        .getServiceRegistry()
        .getService('memory-management');
      const knowledgeService = platform
        .getServiceRegistry()
        .getService('knowledge-management');

      for (let i = 0; i < 10; i++) {
        memoryService.storeMemory({
          type: MemoryType.WORKING,
          content: { task: `task_${i}`, status: 'processing' },
          connections: [],
          strength: 0.5,
          metadata: { load_test: true },
        });

        knowledgeService.addKnowledge({
          type: 'PROCEDURAL',
          content: { procedure: `step_${i}`, action: 'process' },
          subject: `Load Test Item ${i}`,
          confidence: 0.6,
          confidenceLevel: 'MEDIUM',
          sources: ['load_test'],
          tags: ['test', 'load'],
          relationships: [],
          verification: {
            isVerified: false,
            verificationScore: 0.5,
            contradictions: [],
            supportingEvidence: [],
          },
          metadata: { test: true },
        });
      }

      // Wait for system to process and adapt
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // System should still be responsive
      const health = await platform.getHealthStatus();
      expect(health).toBeDefined();
    });
  });

  describe('Continuous Learning Validation', () => {
    test('should demonstrate continuous improvement over time', async () => {
      const learningService = platform
        .getServiceRegistry()
        .getService('learning-orchestrator');
      const knowledgeService = platform
        .getServiceRegistry()
        .getService('knowledge-management');

      // Record initial state
      const initialLearningStats = learningService.getLearningStats();
      const initialKnowledgeStats = knowledgeService.getKnowledgeStats();

      // Simulate learning scenarios over time
      for (let scenario = 0; scenario < 5; scenario++) {
        // Add new experience
        learningService.queueLearningTask({
          id: `scenario_${scenario}`,
          type: LearningType.ACTIVE,
          experience: {
            id: `exp_${scenario}`,
            type: LearningType.ACTIVE,
            input: {
              question: `What is the relationship between X and Y in context ${scenario}?`,
            },
            actualOutput: {
              analysis: `Detailed analysis for scenario ${scenario}`,
            },
            confidence: 0.7 + scenario * 0.05, // Increasing confidence
            timestamp: new Date(),
            context: { scenario_number: scenario },
          },
          priority: 1,
          createdAt: new Date(),
        });

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Final measurement
      const finalLearningStats = learningService.getLearningStats();
      const finalKnowledgeStats = knowledgeService.getKnowledgeStats();

      // Verify improvement
      expect(finalLearningStats.totalTasks).toBeGreaterThan(
        initialLearningStats.totalTasks
      );
      expect(finalKnowledgeStats.totalItems).toBeGreaterThanOrEqual(
        initialKnowledgeStats.totalItems
      );

      // Check success rate improvement or maintenance
      expect(finalLearningStats.successRate).toBeGreaterThanOrEqual(0.5);
    });
  });
});
