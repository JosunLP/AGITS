import { MemoryManagementSystem } from '../../core/memory-management.js';
import {
  LearningExperience,
  LearningType,
  MemoryType,
} from '../../types/index.js';
import { EventMap, TypedEventEmitter } from '../../utils/event-emitter';
import { Logger } from '../../utils/logger.js';

/**
 * Event map for LearningOrchestrator
 */
interface LearningEvents extends EventMap {
  learningCompleted: (result: LearningResult) => void;
  learningStarted: (task: LearningTask) => void;
  patternDiscovered: (pattern: any) => void;
}

/**
 * Learning Orchestrator - Manages continuous learning across the system
 */
export class LearningOrchestrator extends TypedEventEmitter<LearningEvents> {
  private logger: Logger;
  private memorySystem: MemoryManagementSystem;
  private isLearning = false;
  private learningQueue: LearningTask[] = [];
  private learningHistory: LearningResult[] = [];

  // Learning parameters
  private readonly LEARNING_RATE = 0.01;
  private readonly EXPLORATION_RATE = 0.1;
  private readonly BATCH_SIZE = 10;
  private readonly MAX_QUEUE_SIZE = 1000;

  constructor(memorySystem: MemoryManagementSystem) {
    super();
    this.logger = new Logger('LearningOrchestrator');
    this.memorySystem = memorySystem;
    this.setupMemoryListeners();
  }

  /**
   * Setup memory system event listeners
   */
  private setupMemoryListeners(): void {
    // Note: Memory system might not have .on() method - handle gracefully
    if (typeof this.memorySystem.on === 'function') {
      this.memorySystem.on('memoryStored', (memory) => {
        this.onMemoryStored(memory);
      });

      this.memorySystem.on('memoryConsolidated', (memory) => {
        this.onMemoryConsolidated(memory);
      });
    } else {
      this.logger.warn('Memory system does not support event listeners');
    }
  }

  /**
   * Handle new memory storage events
   */
  public onMemoryStored(memory: any): void {
    // Analyze memory for learning opportunities
    if (memory.type === MemoryType.EPISODIC && memory.metadata?.reward) {
      this.queueLearningTask({
        id: `learning_${Date.now()}`,
        type: LearningType.REINFORCEMENT,
        experience: {
          id: memory.id,
          type: LearningType.REINFORCEMENT,
          input: memory.content.experience,
          actualOutput: memory.content.outcome,
          reward: memory.metadata.reward,
          confidence: memory.strength,
          timestamp: memory.lastAccessed,
          context: memory.content.context || { metadata: {} },
          metadata: {
            sessionId: `session_${Date.now()}`,
            modelVersion: '1.0.0',
            environment: 'memory_learning',
            experimentGroup: 'reinforcement',
          },
        },
        priority: memory.metadata.reward > 0 ? 1 : 0.5,
        createdAt: new Date(),
      });
    }
  }

  /**
   * Handle memory consolidation events
   */
  public onMemoryConsolidated(memory: any): void {
    this.logger.debug(`Memory consolidated: ${memory.id}`);
    // Update learning patterns based on consolidated memories
  }

  /**
   * Start the learning process
   */
  public startLearning(): void {
    if (this.isLearning) {
      this.logger.warn('Learning process is already running');
      return;
    }

    this.isLearning = true;
    this.logger.info('Learning orchestrator started');

    // Start learning loop
    this.learningLoop();
  }

  /**
   * Stop the learning process
   */
  public stopLearning(): void {
    this.isLearning = false;
    this.logger.info('Learning orchestrator stopped');
  }

  /**
   * Queue a learning task
   */
  public queueLearningTask(task: LearningTask): void {
    if (this.learningQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest task
      this.learningQueue.shift();
      this.logger.warn('Learning queue full, removing oldest task');
    }

    // Insert task based on priority
    const insertIndex = this.findInsertIndex(task.priority);
    this.learningQueue.splice(insertIndex, 0, task);

    this.logger.debug(`Learning task queued: ${task.id}`);
  }

  /**
   * Process learning from experience
   */
  public async learnFromExperience(
    experience: LearningExperience
  ): Promise<LearningResult> {
    this.logger.debug(`Learning from experience: ${experience.id}`);

    let result: LearningResult = {
      id: `result_${Date.now()}`,
      taskId: experience.id,
      type: experience.type,
      success: false,
      confidence: 0,
      learningGain: 0,
      timestamp: new Date(),
      metrics: {},
    };

    try {
      switch (experience.type) {
        case LearningType.SUPERVISED:
          result = await this.supervisedLearning(experience);
          break;
        case LearningType.UNSUPERVISED:
          result = await this.unsupervisedLearning(experience);
          break;
        case LearningType.REINFORCEMENT:
          result = await this.reinforcementLearning(experience);
          break;
        case LearningType.IMITATION:
          result = await this.imitationLearning(experience);
          break;
        case LearningType.ACTIVE:
          result = await this.activeLearning(experience);
          break;
      }

      // Store learning result in memory
      this.memorySystem.storeMemory({
        type: MemoryType.SEMANTIC,
        content: {
          learningResult: result,
          experience: experience,
        },
        connections: [],
        strength: result.confidence,
        createdAt: new Date(),
        priority: 2, // Normal priority for learning memories
        decayRate: 0.1,
        consolidationLevel: 0.5,
        metadata: {
          learningType: experience.type,
          learningGain: result.learningGain,
          tags: ['learning', 'experience'],
          source: 'learning_orchestrator',
          category: 'learning_result',
          importance: result.confidence,
          emotionalValence: 0.0,
          contextualRelevance: result.confidence,
          temporalContext: 'recent',
          confidence: result.confidence,
          qualityScore: result.confidence,
          lastUpdated: new Date(),
          validationStatus: 'pending',
          consolidationPhase: 'encoding' as any,
          associatedGoals: [],
        },
      });

      this.learningHistory.push(result);
      this.emit('learningCompleted', result);
    } catch (error) {
      this.logger.error(
        `Learning failed for experience ${experience.id}:`,
        error
      );
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Supervised learning implementation
   */
  private async supervisedLearning(
    experience: LearningExperience
  ): Promise<LearningResult> {
    // Simplified supervised learning
    const expectedOutput = experience.expectedOutput;
    const actualOutput = experience.actualOutput;

    if (!expectedOutput || !actualOutput) {
      throw new Error(
        'Supervised learning requires both expected and actual outputs'
      );
    }

    // Calculate error/loss
    const error = this.calculateError(expectedOutput, actualOutput);
    const learningGain = Math.max(0, 1 - error);

    return {
      id: `sup_${Date.now()}`,
      taskId: experience.id,
      type: LearningType.SUPERVISED,
      success: error < 0.5,
      confidence: 1 - error,
      learningGain,
      timestamp: new Date(),
      metrics: {
        error,
        accuracy: 1 - error,
      },
    };
  }

  /**
   * Unsupervised learning implementation
   */
  private async unsupervisedLearning(
    experience: LearningExperience
  ): Promise<LearningResult> {
    // Simplified unsupervised learning - pattern discovery
    const patterns = this.findPatterns(experience.input);
    const learningGain = patterns.length * 0.1;

    return {
      id: `unsup_${Date.now()}`,
      taskId: experience.id,
      type: LearningType.UNSUPERVISED,
      success: patterns.length > 0,
      confidence: Math.min(patterns.length * 0.2, 1.0),
      learningGain,
      timestamp: new Date(),
      metrics: {
        patternsFound: patterns.length,
        novelty: this.calculateNovelty(patterns),
      },
    };
  }

  /**
   * Reinforcement learning implementation
   */
  private async reinforcementLearning(
    experience: LearningExperience
  ): Promise<LearningResult> {
    const reward = experience.reward;
    const learningGain = Math.abs(reward) * this.LEARNING_RATE;

    // Update policy based on reward
    if (reward > 0) {
      // Positive reinforcement - strengthen the behavior
      this.strengthenPolicy(experience);
    } else {
      // Negative reinforcement - weaken the behavior
      this.weakenPolicy(experience);
    }

    return {
      id: `rl_${Date.now()}`,
      taskId: experience.id,
      type: LearningType.REINFORCEMENT,
      success: true,
      confidence: experience.confidence,
      learningGain,
      timestamp: new Date(),
      metrics: {
        reward,
        policyUpdate: learningGain,
      },
    };
  }

  /**
   * Imitation learning implementation
   */
  private async imitationLearning(
    experience: LearningExperience
  ): Promise<LearningResult> {
    // Learn by observing expert behavior
    const similarity = this.calculateSimilarity(
      experience.input,
      experience.actualOutput
    );
    const learningGain = similarity * 0.5;

    return {
      id: `imit_${Date.now()}`,
      taskId: experience.id,
      type: LearningType.IMITATION,
      success: similarity > 0.5,
      confidence: similarity,
      learningGain,
      timestamp: new Date(),
      metrics: {
        similarity,
        imitationAccuracy: similarity,
      },
    };
  }

  /**
   * Active learning implementation
   */
  private async activeLearning(
    experience: LearningExperience
  ): Promise<LearningResult> {
    // Actively select most informative examples
    const informativeness = this.calculateInformativeness(experience.input);
    const learningGain = informativeness * 0.3;

    return {
      id: `active_${Date.now()}`,
      taskId: experience.id,
      type: LearningType.ACTIVE,
      success: informativeness > 0.3,
      confidence: informativeness,
      learningGain,
      timestamp: new Date(),
      metrics: {
        informativeness,
        uncertainty: 1 - informativeness,
      },
    };
  }

  /**
   * Main learning loop
   */
  private async learningLoop(): Promise<void> {
    while (this.isLearning) {
      try {
        // Process batch of learning tasks
        const batch = this.learningQueue.splice(0, this.BATCH_SIZE);

        if (batch.length > 0) {
          await this.processBatch(batch);
        }

        // Short delay before next iteration
        await this.sleep(1000);
      } catch (error) {
        this.logger.error('Error in learning loop:', error);
        await this.sleep(5000); // Longer delay on error
      }
    }
  }

  /**
   * Process a batch of learning tasks
   */
  private async processBatch(batch: LearningTask[]): Promise<void> {
    const results = await Promise.allSettled(
      batch.map((task) => this.learnFromExperience(task.experience))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const task = batch[i];

      if (result.status === 'fulfilled') {
        this.logger.debug(`Learning task completed: ${task.id}`);
      } else {
        this.logger.error(`Learning task failed: ${task.id}`, result.reason);
      }
    }
  }

  /**
   * Helper methods
   */
  private findInsertIndex(priority: number): number {
    for (let i = 0; i < this.learningQueue.length; i++) {
      if (this.learningQueue[i].priority < priority) {
        return i;
      }
    }
    return this.learningQueue.length;
  }

  private calculateError(expected: any, actual: any): number {
    // Simplified error calculation
    if (typeof expected === 'number' && typeof actual === 'number') {
      return Math.abs(expected - actual) / Math.max(Math.abs(expected), 1);
    }

    // For other types, use string comparison
    const expectedStr = JSON.stringify(expected);
    const actualStr = JSON.stringify(actual);
    return expectedStr === actualStr ? 0 : 1;
  }

  private findPatterns(input: any): any[] {
    // Simplified pattern finding
    return []; // Placeholder
  }

  private calculateNovelty(patterns: any[]): number {
    // Simplified novelty calculation
    return patterns.length > 0 ? 0.5 : 0;
  }

  private strengthenPolicy(experience: LearningExperience): void {
    // Strengthen successful behaviors
    this.logger.debug(
      `Strengthening policy for positive reward: ${experience.reward}`
    );
  }

  private weakenPolicy(experience: LearningExperience): void {
    // Weaken unsuccessful behaviors
    this.logger.debug(
      `Weakening policy for negative reward: ${experience.reward}`
    );
  }

  private calculateSimilarity(input: any, output: any): number {
    // Simplified similarity calculation
    return Math.random() * 0.8 + 0.2; // Placeholder
  }

  private calculateInformativeness(input: any): number {
    // Simplified informativeness calculation
    return Math.random() * 0.7 + 0.3; // Placeholder
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get learning statistics
   */
  public getLearningStats(): LearningStats {
    const recentResults = this.learningHistory.slice(-100); // Last 100 results

    return {
      totalTasks: this.learningHistory.length,
      queueSize: this.learningQueue.length,
      successRate:
        recentResults.filter((r) => r.success).length /
        Math.max(recentResults.length, 1),
      averageConfidence:
        recentResults.reduce((sum, r) => sum + r.confidence, 0) /
        Math.max(recentResults.length, 1),
      averageLearningGain:
        recentResults.reduce((sum, r) => sum + r.learningGain, 0) /
        Math.max(recentResults.length, 1),
      learningByType: this.groupResultsByType(recentResults),
    };
  }

  private groupResultsByType(
    results: LearningResult[]
  ): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const result of results) {
      grouped[result.type] = (grouped[result.type] || 0) + 1;
    }
    return grouped;
  }
}

interface LearningTask {
  id: string;
  type: LearningType;
  experience: LearningExperience;
  priority: number;
  createdAt: Date;
}

interface LearningResult {
  id: string;
  taskId: string;
  type: LearningType;
  success: boolean;
  confidence: number;
  learningGain: number;
  timestamp: Date;
  metrics: Record<string, number>;
  error?: string;
}

interface LearningStats {
  totalTasks: number;
  queueSize: number;
  successRate: number;
  averageConfidence: number;
  averageLearningGain: number;
  learningByType: Record<string, number>;
}
