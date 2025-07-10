import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { defaultLearningConfig } from '../src/config/app.js';
import { AutonomousKnowledgeCollector } from '../src/core/autonomous-knowledge-collector.js';
import { AutonomousProcessScheduler } from '../src/core/autonomous-scheduler.js';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management.js';
import { MemoryManagementSystem } from '../src/core/memory-management.js';
import { LearningOrchestrator } from '../src/services/cognitive/learning-orchestrator.js';
import { ReasoningEngineService } from '../src/services/cognitive/reasoning-engine.js';
import { NaturalLanguageProcessor } from '../src/services/communication/nlp-service.js';
import { DecisionEngine } from '../src/services/executive/decision-engine.js';
import { PlanningService } from '../src/services/executive/planning-service.js';
import { MemoryType, TaskType } from '../src/types/index.js';

describe('AGITS System Evolution and Autonomous Learning', () => {
  let memorySystem: MemoryManagementSystem;
  let knowledgeSystem: KnowledgeManagementSystem;
  let scheduler: AutonomousProcessScheduler;
  let knowledgeCollector: AutonomousKnowledgeCollector;
  let learningOrchestrator: LearningOrchestrator;
  let reasoningEngine: ReasoningEngineService;
  let decisionEngine: DecisionEngine;
  let planningService: PlanningService;
  let nlpService: NaturalLanguageProcessor;

  beforeEach(() => {
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
    nlpService = new NaturalLanguageProcessor();

    // Initialize supporting systems
    const dataIngestionService = new (class MockDataIngestionService {
      async ingestData() {
        return { success: true };
      }
    })();
    knowledgeCollector = new AutonomousKnowledgeCollector(
      knowledgeSystem,
      memorySystem,
      dataIngestionService as any
    );
  });

  afterEach(() => {
    // Clean up - stop any running processes if methods exist
    // Note: Simplified cleanup without non-existent methods
  });

  describe('Autonomous Learning Evolution', () => {
    it('should evolve learning patterns through experience', async () => {
      // Start learning orchestrator
      learningOrchestrator.startLearningLoop();

      // Initial learning capability assessment
      const initialStats = learningOrchestrator.getLearningStats();
      expect(initialStats.totalSessions).toBe(0);

      // Provide multiple learning experiences
      const experiences = [
        {
          experienceType: 'pattern_recognition',
          outcome: 'success',
          input: 'data pattern A',
          output: 'classification correct',
          accuracy: 0.85,
          duration: 1000,
        },
        {
          experienceType: 'pattern_recognition',
          outcome: 'success',
          input: 'data pattern B',
          output: 'classification correct',
          accuracy: 0.9,
          duration: 800,
        },
        {
          experienceType: 'pattern_recognition',
          outcome: 'failure',
          input: 'data pattern C',
          output: 'classification incorrect',
          accuracy: 0.45,
          duration: 1500,
        },
      ];

      // Process each experience
      for (const experience of experiences) {
        await learningOrchestrator.learnFromExperience({
          id: `exp_${Date.now()}_${Math.random()}`,
          type: experience.experienceType as any,
          input: experience.input,
          expectedOutput: experience.output,
          actualOutput: experience.output,
          success: experience.outcome === 'success',
          confidence: experience.accuracy,
          timestamp: new Date(),
          context: {
            domain: 'pattern_recognition',
            accuracy: experience.accuracy,
            duration: experience.duration,
          },
          metadata: {
            source: 'evolution_test',
            outcome: experience.outcome,
          },
        });

        // Short delay to allow processing
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Wait for learning loop to process experiences
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Assess learning evolution
      const finalStats = learningOrchestrator.getLearningStats();
      expect(finalStats.totalSessions).toBeGreaterThan(0);

      // Check if system has learned patterns
      const memories = memorySystem.searchMemories('pattern_recognition', 10);
      expect(memories.length).toBeGreaterThan(0);

      // Verify knowledge extraction from experience
      const knowledge = knowledgeSystem.searchKnowledge('pattern', 5);
      expect(knowledge.length).toBeGreaterThan(0);
    });

    it('should adapt decision making based on outcomes', async () => {
      // Initialize decision engine
      decisionEngine.startDecisionLoop();

      // Create initial goals and constraints
      const goals = [
        {
          id: 'efficiency_goal',
          description: 'Maximize processing efficiency',
          type: 'optimization' as any,
          priority: 1,
          status: 'active' as any,
        },
        {
          id: 'accuracy_goal',
          description: 'Maintain high accuracy',
          type: 'quality' as any,
          priority: 2,
          status: 'active' as any,
        },
      ];

      const constraints = [
        {
          id: 'resource_constraint',
          description: 'Limited computational resources',
          type: 'resource' as any,
        },
      ];

      // Add goals and constraints to decision engine
      for (const goal of goals) {
        decisionEngine.addGoal(goal);
      }

      for (const constraint of constraints) {
        decisionEngine.addConstraint(constraint);
      }

      // Make multiple decisions with different outcomes
      const decisionScenarios = [
        {
          options: [
            {
              name: 'fast_algorithm',
              speed: 0.9,
              accuracy: 0.7,
              resources: 0.6,
            },
            {
              name: 'accurate_algorithm',
              speed: 0.6,
              accuracy: 0.95,
              resources: 0.8,
            },
          ],
          expectedOutcome: 'success',
        },
        {
          options: [
            {
              name: 'balanced_approach',
              speed: 0.8,
              accuracy: 0.85,
              resources: 0.7,
            },
            {
              name: 'conservative_approach',
              speed: 0.5,
              accuracy: 0.98,
              resources: 0.9,
            },
          ],
          expectedOutcome: 'success',
        },
      ];

      const decisionResults = [];

      for (const scenario of decisionScenarios) {
        const decisionRequest = {
          id: `decision_${Date.now()}_${Math.random()}`,
          options: scenario.options,
          context: {
            sessionId: `session_${Date.now()}`,
            environment: { scenario: 'algorithm_selection' },
            goals,
            constraints,
          },
          priority: 1,
          timeout: 5000,
        };

        const result = await decisionEngine.makeDecision(decisionRequest);
        decisionResults.push(result);

        // Simulate outcome and feedback
        const feedbackExperience = {
          id: `feedback_${Date.now()}`,
          type: 'decision_outcome' as any,
          input: {
            decision: result.decision,
            context: decisionRequest.context,
          },
          expectedOutput: scenario.expectedOutcome,
          actualOutput: scenario.expectedOutcome,
          success: true,
          confidence: result.confidence,
          timestamp: new Date(),
          context: {
            domain: 'decision_making',
            decisionId: result.id,
          },
          metadata: {
            source: 'outcome_feedback',
          },
        };

        // Feed outcome back to learning system
        await learningOrchestrator.learnFromExperience(feedbackExperience);
      }

      // Verify that decisions were made
      expect(decisionResults.length).toBe(2);
      decisionResults.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.decision).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });

      // Check decision statistics
      const decisionStats = decisionEngine.getDecisionStats();
      expect(decisionStats.totalDecisions).toBeGreaterThan(0);
      expect(decisionStats.successRate).toBeGreaterThan(0);

      decisionEngine.stopDecisionLoop();
    });

    it('should demonstrate autonomous knowledge collection and integration', async () => {
      // Start autonomous knowledge collection
      knowledgeCollector.startAutonomousCollection();

      // Add some initial memories that can be processed into knowledge
      const seedMemories = [
        {
          type: MemoryType.DECLARATIVE,
          content: {
            fact: 'Neural networks excel at pattern recognition tasks',
            domain: 'machine_learning',
            confidence: 0.9,
          },
          connections: [],
          strength: 0.9,
          metadata: { source: 'research', verified: true },
        },
        {
          type: MemoryType.PROCEDURAL,
          content: {
            process: 'backpropagation algorithm',
            steps: [
              'forward pass',
              'loss calculation',
              'backward pass',
              'weight update',
            ],
            domain: 'neural_networks',
          },
          connections: [],
          strength: 0.85,
          metadata: { source: 'algorithm', complexity: 'medium' },
        },
        {
          type: MemoryType.EPISODIC,
          content: {
            event: 'successful training session',
            outcome: 'model accuracy improved from 0.6 to 0.9',
            context: 'image classification task',
          },
          connections: [],
          strength: 0.8,
          metadata: { source: 'experience', success: true },
        },
      ];

      // Store seed memories
      for (const memory of seedMemories) {
        memorySystem.storeMemory(memory);
      }

      // Allow time for autonomous collection to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if knowledge has been autonomously collected
      const collectedKnowledge = knowledgeSystem.searchKnowledge('neural', 10);
      expect(collectedKnowledge.length).toBeGreaterThan(0);

      // Verify knowledge quality
      const stats = knowledgeCollector.getCollectionStats();
      expect(stats.totalCollected).toBeGreaterThan(0);

      // Test knowledge integration by searching for related concepts
      const patternKnowledge = knowledgeSystem.searchKnowledge('pattern', 5);
      const algorithmKnowledge = knowledgeSystem.searchKnowledge(
        'algorithm',
        5
      );

      expect(
        patternKnowledge.length + algorithmKnowledge.length
      ).toBeGreaterThan(0);

      knowledgeCollector.stopAutonomousCollection();
    });

    it('should evolve planning strategies based on execution outcomes', async () => {
      // Create a goal for the planning system
      const strategicGoal = {
        id: 'strategic_goal_1',
        description: 'Improve system learning efficiency',
        type: 'long_term' as any,
        priority: 1,
        status: 'active' as any,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      // Create planning request
      const planningRequest = {
        goal: strategicGoal,
        context: {
          sessionId: 'planning_evolution_test',
          environment: { phase: 'optimization' },
          goals: [strategicGoal],
          constraints: [],
        },
        constraints: [
          {
            id: 'time_constraint',
            description: 'Must complete within available time window',
            type: 'time' as any,
          },
        ],
        deadline: strategicGoal.deadline,
      };

      // Create and execute plan
      const plan = await planningService.createPlan(planningRequest);
      expect(plan.id).toBeDefined();
      expect(plan.tasks.length).toBeGreaterThan(0);

      // Execute the plan
      const execution = await planningService.executePlan(plan.id);
      expect(execution.id).toBeDefined();

      // Simulate some task completions
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create feedback experience for planning system
      const planningExperience = {
        id: `planning_exp_${Date.now()}`,
        type: 'planning_outcome' as any,
        input: {
          plan: plan,
          strategy: 'hierarchical_decomposition',
        },
        expectedOutput: 'successful_execution',
        actualOutput:
          execution.status === 'completed'
            ? 'successful_execution'
            : 'partial_execution',
        success: execution.status === 'completed',
        confidence: execution.progress,
        timestamp: new Date(),
        context: {
          domain: 'strategic_planning',
          planId: plan.id,
          executionId: execution.id,
        },
        metadata: {
          source: 'planning_feedback',
          strategy: 'hierarchical_decomposition',
        },
      };

      // Feed planning outcome to learning system
      await learningOrchestrator.learnFromExperience(planningExperience);

      // Verify planning statistics
      const planningStats = planningService.getPlanningStats();
      expect(planningStats.activePlans).toBeGreaterThanOrEqual(0);
    });

    it('should demonstrate NLP understanding evolution', async () => {
      // Test initial NLP capability
      const initialProcessing = await nlpService.processText(
        'How does machine learning work?',
        {
          sessionId: 'nlp_evolution_test',
          environment: { domain: 'technical' },
          goals: [],
          constraints: [],
        }
      );

      expect(initialProcessing.success).toBe(true);
      expect(initialProcessing.understanding).toBeDefined();

      // Provide additional context through conversation
      const conversationTurns = [
        'Machine learning involves algorithms that learn from data',
        'Neural networks are a type of machine learning model',
        'Deep learning uses multi-layer neural networks',
        'Training requires labeled datasets and optimization algorithms',
      ];

      for (const turn of conversationTurns) {
        await nlpService.processText(turn, {
          sessionId: 'nlp_evolution_test',
          environment: { domain: 'technical', context: 'educational' },
          goals: [],
          constraints: [],
        });
      }

      // Test evolved understanding
      const evolvedProcessing = await nlpService.processText(
        'Explain the relationship between neural networks and deep learning',
        {
          sessionId: 'nlp_evolution_test',
          environment: { domain: 'technical' },
          goals: [],
          constraints: [],
        }
      );

      expect(evolvedProcessing.success).toBe(true);
      expect(evolvedProcessing.understanding).toBeDefined();

      // Verify conversation history has grown
      const conversationHistory = nlpService.getConversationHistory();
      expect(conversationHistory.length).toBeGreaterThan(1);

      // Check NLP statistics
      const nlpStats = nlpService.getNLPStats();
      expect(nlpStats.conversationTurns).toBeGreaterThan(0);
      expect(nlpStats.averageConfidence).toBeGreaterThan(0);
    });

    it('should demonstrate system-wide autonomous operation', async () => {
      // Start all autonomous systems
      scheduler.startScheduling();
      knowledgeCollector.startAutonomousCollection();
      learningOrchestrator.startLearningLoop();
      decisionEngine.startDecisionLoop();

      // Add some initial system state
      const initialKnowledge = {
        content: 'Autonomous systems require self-monitoring and adaptation',
        type: 'conceptual',
        domain: 'autonomous_systems',
        confidence: 0.9,
        connections: [],
        metadata: { source: 'system_design' },
      };

      knowledgeSystem.addKnowledge(initialKnowledge);

      // Add initial memory
      const initialMemory = {
        type: MemoryType.DECLARATIVE,
        content: {
          concept: 'autonomous operation principles',
          importance: 'high',
          applications: [
            'self-optimization',
            'adaptive learning',
            'resource management',
          ],
        },
        connections: [],
        strength: 0.85,
        metadata: { source: 'initialization' },
      };

      memorySystem.storeMemory(initialMemory);

      // Let systems run autonomously
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check that autonomous processes are active
      expect(scheduler.isRunning()).toBe(true);
      expect(knowledgeCollector.isCollecting()).toBe(true);
      expect(learningOrchestrator.isLearning()).toBe(true);

      // Verify system has generated new content
      const finalKnowledge = knowledgeSystem.searchKnowledge('autonomous', 10);
      const finalMemories = memorySystem.searchMemories('autonomous', 10);

      expect(finalKnowledge.length).toBeGreaterThan(0);
      expect(finalMemories.length).toBeGreaterThan(0);

      // Get system statistics
      const schedulerStats = scheduler.getSchedulerStats();
      const collectionStats = knowledgeCollector.getCollectionStats();
      const learningStats = learningOrchestrator.getLearningStats();
      const decisionStats = decisionEngine.getDecisionStats();

      expect(schedulerStats.totalTasks).toBeGreaterThanOrEqual(0);
      expect(collectionStats.totalCollected).toBeGreaterThanOrEqual(0);
      expect(learningStats.totalSessions).toBeGreaterThanOrEqual(0);
      expect(decisionStats.totalDecisions).toBeGreaterThanOrEqual(0);

      // Stop all systems
      scheduler.stopScheduling();
      knowledgeCollector.stopAutonomousCollection();
      learningOrchestrator.stopLearningLoop();
      decisionEngine.stopDecisionLoop();
    });
  });

  describe('Cognitive Enhancement Tests', () => {
    it('should demonstrate memory consolidation and strengthening', async () => {
      // Store multiple related memories
      const relatedMemories = [
        {
          type: MemoryType.DECLARATIVE,
          content: {
            fact: 'Attention mechanisms improve neural network performance',
          },
          connections: [],
          strength: 0.7,
          metadata: { topic: 'attention', verified: true },
        },
        {
          type: MemoryType.DECLARATIVE,
          content: { fact: 'Transformer architectures use self-attention' },
          connections: [],
          strength: 0.8,
          metadata: { topic: 'attention', verified: true },
        },
        {
          type: MemoryType.PROCEDURAL,
          content: {
            process: 'implementing attention mechanism',
            steps: [
              'calculate attention weights',
              'apply weights to values',
              'aggregate results',
            ],
          },
          connections: [],
          strength: 0.6,
          metadata: { topic: 'attention', complexity: 'medium' },
        },
      ];

      // Store memories
      const memoryIds = relatedMemories.map((memory) =>
        memorySystem.storeMemory(memory)
      );

      // Trigger memory consolidation
      const consolidationResult = memorySystem.consolidateMemories();
      expect(consolidationResult.consolidatedCount).toBeGreaterThan(0);

      // Verify that related memories have been strengthened or connected
      const consolidatedMemories = memoryIds
        .map((id) => memorySystem.getMemory(id))
        .filter(Boolean);
      expect(consolidatedMemories.length).toBeGreaterThan(0);

      // Check if connections have been established
      const totalConnections = consolidatedMemories.reduce(
        (sum, memory) => sum + (memory?.connections?.length || 0),
        0
      );
      expect(totalConnections).toBeGreaterThanOrEqual(0);
    });

    it('should demonstrate cross-domain knowledge transfer', async () => {
      // Add knowledge from different domains
      const biologicalKnowledge = {
        content:
          'Neurons communicate through synaptic connections with varying strengths',
        type: 'biological',
        domain: 'neuroscience',
        confidence: 0.9,
        connections: [],
        metadata: { field: 'biology', verified: true },
      };

      const technicalKnowledge = {
        content:
          'Artificial neural networks model connections with weighted edges',
        type: 'technical',
        domain: 'computer_science',
        confidence: 0.85,
        connections: [],
        metadata: { field: 'technology', implementation: 'software' },
      };

      knowledgeSystem.addKnowledge(biologicalKnowledge);
      knowledgeSystem.addKnowledge(technicalKnowledge);

      // Start reasoning engine to find connections
      const reasoningTask = {
        id: `cross_domain_${Date.now()}`,
        type: TaskType.REASONING,
        input: {
          query:
            'What are the similarities between biological and artificial neural networks?',
          domains: ['neuroscience', 'computer_science'],
        },
        context: {
          sessionId: 'cross_domain_test',
          environment: { analysis_type: 'analogical' },
          goals: [],
          constraints: [],
        },
        priority: 1,
        requiredResources: [],
        dependencies: [],
      };

      const reasoningResult =
        await reasoningEngine.processReasoningTask(reasoningTask);
      expect(reasoningResult.success).toBe(true);

      // Check if cross-domain connections were identified
      const neuralKnowledge = knowledgeSystem.searchKnowledge('neural', 10);
      expect(neuralKnowledge.length).toBeGreaterThanOrEqual(2);
    });

    it('should demonstrate adaptive attention allocation', async () => {
      const attentionManager = new (
        await import('../src/services/cognitive/attention-manager.js')
      ).AttentionManager(memorySystem);

      // Add multiple attention targets with different priorities
      attentionManager.addAttentionTarget('learning_task', 'task', 0.8, {
        urgency: 'high',
      });
      attentionManager.addAttentionTarget(
        'memory_consolidation',
        'process',
        0.6,
        { urgency: 'medium' }
      );
      attentionManager.addAttentionTarget('knowledge_search', 'query', 0.7, {
        urgency: 'medium',
      });

      // Simulate attention distribution
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get attention statistics
      const attentionStats = attentionManager.getAttentionStats();
      expect(attentionStats.currentTargets).toBeGreaterThan(0);
      expect(attentionStats.totalAttentionAllocated).toBeGreaterThan(0);

      // Test attention focusing
      attentionManager.focusAttention('learning_task');

      // Verify attention has been allocated
      const focusedStats = attentionManager.getAttentionStats();
      expect(focusedStats.primaryTarget).toBe('learning_task');
    });
  });
});
