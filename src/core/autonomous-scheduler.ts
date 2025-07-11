import { Logger } from '../utils/logger.js';
import { EventEmitter } from '../utils/node-polyfill.js';

/**
 * Task types for autonomous processes
 */
export enum AutonomousTaskType {
  MEMORY_CONSOLIDATION = 'memory_consolidation',
  SYNAPTIC_PRUNING = 'synaptic_pruning',
  SYNAPTIC_DECAY = 'synaptic_decay',
  LEARNING_CYCLE = 'learning_cycle',
  KNOWLEDGE_EXTRACTION = 'knowledge_extraction',
  PATTERN_DISCOVERY = 'pattern_discovery',
  GOAL_EVALUATION = 'goal_evaluation',
  MEMORY_OPTIMIZATION = 'memory_optimization',
  ATTENTION_REBALANCING = 'attention_rebalancing',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
  BACKGROUND = 'background',
}

/**
 * Task execution status
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Autonomous task configuration
 */
interface AutonomousTask {
  id: string;
  type: AutonomousTaskType;
  priority: TaskPriority;
  intervalMs: number;
  maxExecutionTime: number;
  enabled: boolean;
  lastExecution?: Date;
  nextExecution: Date;
  executionCount: number;
  failureCount: number;
  averageExecutionTime: number;
  status: TaskStatus;
  metadata: Record<string, any>;
}

/**
 * Task execution result
 */
interface TaskExecutionResult {
  taskId: string;
  type: AutonomousTaskType;
  startTime: Date;
  endTime: Date;
  executionTime: number;
  success: boolean;
  result?: any;
  error?: string;
  metrics: Record<string, number>;
}

/**
 * Scheduler statistics
 */
interface SchedulerStats {
  totalTasks: number;
  activeTasks: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  systemLoad: number;
  uptime: number;
  tasksByType: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

/**
 * System services interface for task execution
 */
interface SystemServices {
  memorySystem?: any;
  learningOrchestrator?: any;
  reasoningEngine?: any;
  attentionManager?: any;
  decisionEngine?: any;
  planningService?: any;
}

/**
 * Autonomous Process Scheduler - Manages background cognitive processes
 * Coordinates regular execution of learning, memory management, and optimization tasks
 */
export class AutonomousProcessScheduler extends EventEmitter {
  private logger: Logger;
  private isRunning = false;
  private tasks = new Map<string, AutonomousTask>();
  private executionHistory: TaskExecutionResult[] = [];
  private services: SystemServices = {};
  private startTime = Date.now();

  // Scheduler parameters
  private readonly MAX_CONCURRENT_TASKS = 5;
  private readonly EXECUTION_HISTORY_LIMIT = 1000;
  private readonly SCHEDULER_TICK_INTERVAL = 1000; // 1 second
  private readonly TASK_TIMEOUT_MULTIPLIER = 1.5;

  private runningTasks = new Set<string>();

  constructor(services?: SystemServices) {
    super();
    this.logger = new Logger('AutonomousProcessScheduler');
    if (services) {
      this.services = services;
    }
    this.initializeDefaultTasks();
  }

  /**
   * Set system services for task execution
   */
  public setServices(services: SystemServices): void {
    this.services = { ...this.services, ...services };
    this.logger.info('System services updated');
  }

  /**
   * Start the autonomous process scheduler
   */
  public start(): void {
    if (this.isRunning) {
      this.logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Autonomous process scheduler started');
    this.schedulerLoop();
  }

  /**
   * Stop the autonomous process scheduler
   */
  public stop(): void {
    this.isRunning = false;
    this.logger.info('Autonomous process scheduler stopped');
  }

  /**
   * Add or update an autonomous task
   */
  public addTask(
    config: Omit<
      AutonomousTask,
      | 'id'
      | 'executionCount'
      | 'failureCount'
      | 'averageExecutionTime'
      | 'status'
    >
  ): string {
    const taskId = `task_${config.type}_${Date.now()}`;

    const task: AutonomousTask = {
      id: taskId,
      executionCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      status: TaskStatus.PENDING,
      ...config,
    };

    this.tasks.set(taskId, task);
    this.logger.info(`Autonomous task added: ${taskId} (${config.type})`);

    return taskId;
  }

  /**
   * Remove an autonomous task
   */
  public removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // Cancel if running
    if (task.status === TaskStatus.RUNNING) {
      task.status = TaskStatus.CANCELLED;
    }

    this.tasks.delete(taskId);
    this.runningTasks.delete(taskId);
    this.logger.info(`Autonomous task removed: ${taskId}`);

    return true;
  }

  /**
   * Enable or disable a task
   */
  public setTaskEnabled(taskId: string, enabled: boolean): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.enabled = enabled;
    this.logger.info(`Task ${taskId} ${enabled ? 'enabled' : 'disabled'}`);

    return true;
  }

  /**
   * Get scheduler statistics
   */
  public getStats(): SchedulerStats {
    const recentHistory = this.executionHistory.slice(-500);
    const completedExecutions = recentHistory.filter((r) => r.success);
    const failedExecutions = recentHistory.filter((r) => !r.success);

    return {
      totalTasks: this.tasks.size,
      activeTasks: Array.from(this.tasks.values()).filter((t) => t.enabled)
        .length,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      averageExecutionTime: this.calculateAverageExecutionTime(recentHistory),
      systemLoad: this.runningTasks.size / this.MAX_CONCURRENT_TASKS,
      uptime: Date.now() - this.startTime,
      tasksByType: this.groupTasksByType(),
      tasksByPriority: this.groupTasksByPriority(),
    };
  }

  /**
   * Trigger immediate execution of a task
   */
  public async triggerTask(
    taskId: string
  ): Promise<TaskExecutionResult | null> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      return null;
    }

    if (task.status === TaskStatus.RUNNING) {
      this.logger.warn(`Task already running: ${taskId}`);
      return null;
    }

    return await this.executeTask(task);
  }

  /**
   * Initialize default autonomous tasks
   */
  private initializeDefaultTasks(): void {
    // Memory consolidation every 10 seconds
    this.addTask({
      type: AutonomousTaskType.MEMORY_CONSOLIDATION,
      priority: TaskPriority.HIGH,
      intervalMs: 10000,
      maxExecutionTime: 5000,
      enabled: true,
      nextExecution: new Date(Date.now() + 10000),
      metadata: {
        description:
          'Consolidate memories from short-term to long-term storage',
      },
    });

    // Synaptic pruning every 30 seconds
    this.addTask({
      type: AutonomousTaskType.SYNAPTIC_PRUNING,
      priority: TaskPriority.NORMAL,
      intervalMs: 30000,
      maxExecutionTime: 8000,
      enabled: true,
      nextExecution: new Date(Date.now() + 30000),
      metadata: { description: 'Remove weak or unused neural connections' },
    });

    // Synaptic decay every 5 seconds
    this.addTask({
      type: AutonomousTaskType.SYNAPTIC_DECAY,
      priority: TaskPriority.NORMAL,
      intervalMs: 5000,
      maxExecutionTime: 2000,
      enabled: true,
      nextExecution: new Date(Date.now() + 5000),
      metadata: { description: 'Apply natural decay to connection strengths' },
    });

    // Learning cycle every 15 seconds
    this.addTask({
      type: AutonomousTaskType.LEARNING_CYCLE,
      priority: TaskPriority.HIGH,
      intervalMs: 15000,
      maxExecutionTime: 10000,
      enabled: true,
      nextExecution: new Date(Date.now() + 15000),
      metadata: { description: 'Process queued learning experiences' },
    });

    // Knowledge extraction every 60 seconds
    this.addTask({
      type: AutonomousTaskType.KNOWLEDGE_EXTRACTION,
      priority: TaskPriority.NORMAL,
      intervalMs: 60000,
      maxExecutionTime: 15000,
      enabled: true,
      nextExecution: new Date(Date.now() + 60000),
      metadata: {
        description: 'Extract patterns and knowledge from accumulated data',
      },
    });

    // Pattern discovery every 45 seconds
    this.addTask({
      type: AutonomousTaskType.PATTERN_DISCOVERY,
      priority: TaskPriority.NORMAL,
      intervalMs: 45000,
      maxExecutionTime: 12000,
      enabled: true,
      nextExecution: new Date(Date.now() + 45000),
      metadata: { description: 'Discover new patterns in processed data' },
    });

    // Goal evaluation every 20 seconds
    this.addTask({
      type: AutonomousTaskType.GOAL_EVALUATION,
      priority: TaskPriority.HIGH,
      intervalMs: 20000,
      maxExecutionTime: 5000,
      enabled: true,
      nextExecution: new Date(Date.now() + 20000),
      metadata: { description: 'Evaluate and adjust current goals' },
    });

    // Memory optimization every 120 seconds
    this.addTask({
      type: AutonomousTaskType.MEMORY_OPTIMIZATION,
      priority: TaskPriority.LOW,
      intervalMs: 120000,
      maxExecutionTime: 20000,
      enabled: true,
      nextExecution: new Date(Date.now() + 120000),
      metadata: { description: 'Optimize memory storage and retrieval' },
    });

    // Attention rebalancing every 8 seconds
    this.addTask({
      type: AutonomousTaskType.ATTENTION_REBALANCING,
      priority: TaskPriority.NORMAL,
      intervalMs: 8000,
      maxExecutionTime: 3000,
      enabled: true,
      nextExecution: new Date(Date.now() + 8000),
      metadata: { description: 'Rebalance attention allocation across tasks' },
    });

    // Performance analysis every 300 seconds
    this.addTask({
      type: AutonomousTaskType.PERFORMANCE_ANALYSIS,
      priority: TaskPriority.LOW,
      intervalMs: 300000,
      maxExecutionTime: 30000,
      enabled: true,
      nextExecution: new Date(Date.now() + 300000),
      metadata: {
        description: 'Analyze system performance and suggest optimizations',
      },
    });

    this.logger.info(`Initialized ${this.tasks.size} default autonomous tasks`);
  }

  /**
   * Main scheduler loop
   */
  private async schedulerLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processPendingTasks();
        await this.sleep(this.SCHEDULER_TICK_INTERVAL);
      } catch (error) {
        this.logger.error('Error in scheduler loop:', error);
        await this.sleep(5000); // Longer delay on error
      }
    }
  }

  /**
   * Process pending tasks that are ready for execution
   */
  private async processPendingTasks(): Promise<void> {
    const now = new Date();
    const readyTasks: AutonomousTask[] = [];

    // Find tasks ready for execution
    for (const task of this.tasks.values()) {
      if (
        task.enabled &&
        task.status !== TaskStatus.RUNNING &&
        task.nextExecution <= now &&
        this.runningTasks.size < this.MAX_CONCURRENT_TASKS
      ) {
        readyTasks.push(task);
      }
    }

    // Sort by priority and execution time
    readyTasks.sort((a, b) => {
      const priorityOrder = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3,
        background: 4,
      };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.nextExecution.getTime() - b.nextExecution.getTime();
    });

    // Execute ready tasks
    const executionPromises = readyTasks
      .slice(0, this.MAX_CONCURRENT_TASKS - this.runningTasks.size)
      .map((task) => this.executeTask(task));

    if (executionPromises.length > 0) {
      await Promise.allSettled(executionPromises);
    }
  }

  /**
   * Execute a single autonomous task
   */
  private async executeTask(
    task: AutonomousTask
  ): Promise<TaskExecutionResult> {
    const startTime = new Date();
    task.status = TaskStatus.RUNNING;
    task.lastExecution = startTime;
    this.runningTasks.add(task.id);

    this.logger.debug(`Executing autonomous task: ${task.id} (${task.type})`);

    let result: TaskExecutionResult = {
      taskId: task.id,
      type: task.type,
      startTime,
      endTime: startTime,
      executionTime: 0,
      success: false,
      metrics: {},
    };

    try {
      // Set timeout for task execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Task execution timeout')),
          task.maxExecutionTime * this.TASK_TIMEOUT_MULTIPLIER
        );
      });

      // Execute the task based on its type
      const executionPromise = this.executeTaskByType(task);
      const taskResult = await Promise.race([executionPromise, timeoutPromise]);

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      result = {
        taskId: task.id,
        type: task.type,
        startTime,
        endTime,
        executionTime,
        success: true,
        result: taskResult,
        metrics: this.extractMetrics(taskResult),
      };

      // Update task statistics
      task.executionCount++;
      task.averageExecutionTime =
        (task.averageExecutionTime * (task.executionCount - 1) +
          executionTime) /
        task.executionCount;
      task.status = TaskStatus.COMPLETED;

      // Schedule next execution
      task.nextExecution = new Date(startTime.getTime() + task.intervalMs);

      this.logger.debug(`Task completed: ${task.id} in ${executionTime}ms`);
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      result = {
        taskId: task.id,
        type: task.type,
        startTime,
        endTime,
        executionTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {},
      };

      task.failureCount++;
      task.status = TaskStatus.FAILED;

      // Schedule next execution with exponential backoff
      const backoffMultiplier = Math.min(Math.pow(2, task.failureCount), 8);
      task.nextExecution = new Date(
        startTime.getTime() + task.intervalMs * backoffMultiplier
      );

      this.logger.error(`Task failed: ${task.id} - ${result.error}`);
    } finally {
      this.runningTasks.delete(task.id);

      // Store execution result
      this.executionHistory.push(result);

      // Trim history if too large
      if (this.executionHistory.length > this.EXECUTION_HISTORY_LIMIT) {
        this.executionHistory = this.executionHistory.slice(
          -this.EXECUTION_HISTORY_LIMIT
        );
      }

      this.emit('taskExecuted', result);
    }

    return result;
  }

  /**
   * Execute task based on its type
   */
  private async executeTaskByType(task: AutonomousTask): Promise<any> {
    switch (task.type) {
      case AutonomousTaskType.MEMORY_CONSOLIDATION:
        return await this.executeMemoryConsolidation();

      case AutonomousTaskType.SYNAPTIC_PRUNING:
        return await this.executeSynapticPruning();

      case AutonomousTaskType.SYNAPTIC_DECAY:
        return await this.executeSynapticDecay();

      case AutonomousTaskType.LEARNING_CYCLE:
        return await this.executeLearningCycle();

      case AutonomousTaskType.KNOWLEDGE_EXTRACTION:
        return await this.executeKnowledgeExtraction();

      case AutonomousTaskType.PATTERN_DISCOVERY:
        return await this.executePatternDiscovery();

      case AutonomousTaskType.GOAL_EVALUATION:
        return await this.executeGoalEvaluation();

      case AutonomousTaskType.MEMORY_OPTIMIZATION:
        return await this.executeMemoryOptimization();

      case AutonomousTaskType.ATTENTION_REBALANCING:
        return await this.executeAttentionRebalancing();

      case AutonomousTaskType.PERFORMANCE_ANALYSIS:
        return await this.executePerformanceAnalysis();

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Task execution implementations
   */
  private async executeMemoryConsolidation(): Promise<any> {
    if (this.services.memorySystem?.performMemoryConsolidation) {
      const result = this.services.memorySystem.performMemoryConsolidation();
      return {
        consolidated: result?.consolidated || 0,
        type: 'memory_consolidation',
      };
    }
    return { consolidated: 0, message: 'Memory system not available' };
  }

  private async executeSynapticPruning(): Promise<any> {
    if (this.services.memorySystem?.performSynapticPruning) {
      const result = this.services.memorySystem.performSynapticPruning();
      return { pruned: result?.pruned || 0, type: 'synaptic_pruning' };
    }
    return { pruned: 0, message: 'Memory system not available' };
  }

  private async executeSynapticDecay(): Promise<any> {
    if (this.services.memorySystem?.applySynapticDecay) {
      const result = this.services.memorySystem.applySynapticDecay();
      return { decayed: result?.decayed || 0, type: 'synaptic_decay' };
    }
    return { decayed: 0, message: 'Memory system not available' };
  }

  private async executeLearningCycle(): Promise<any> {
    if (this.services.learningOrchestrator?.getLearningStats) {
      const stats = this.services.learningOrchestrator.getLearningStats();
      return {
        queueSize: stats.queueSize,
        successRate: stats.successRate,
        type: 'learning_cycle',
      };
    }
    return { processed: 0, message: 'Learning orchestrator not available' };
  }

  private async executeKnowledgeExtraction(): Promise<any> {
    // Extract knowledge patterns from memory
    if (
      this.services.memorySystem?.searchMemories &&
      this.services.reasoningEngine
    ) {
      const recentMemories =
        this.services.memorySystem.getRecentMemories?.(100) || [];
      return {
        memoriesAnalyzed: recentMemories.length,
        patternsFound: Math.floor(Math.random() * 10), // Placeholder
        type: 'knowledge_extraction',
      };
    }
    return { memoriesAnalyzed: 0, message: 'Required services not available' };
  }

  private async executePatternDiscovery(): Promise<any> {
    // Discover new patterns in data
    if (this.services.memorySystem?.getMemoryStats) {
      const stats = this.services.memorySystem.getMemoryStats();
      return {
        patternsDiscovered: Math.floor(Math.random() * 5), // Placeholder
        memoryConnections: stats.totalConnections || 0,
        type: 'pattern_discovery',
      };
    }
    return { patternsDiscovered: 0, message: 'Memory system not available' };
  }

  private async executeGoalEvaluation(): Promise<any> {
    // Evaluate current goals and priorities
    if (this.services.decisionEngine?.getDecisionStats) {
      const stats = this.services.decisionEngine.getDecisionStats();
      return {
        goalsEvaluated: stats.activeGoals || 0,
        decisionsReviewed: stats.recentDecisions || 0,
        type: 'goal_evaluation',
      };
    }
    return { goalsEvaluated: 0, message: 'Decision engine not available' };
  }

  private async executeMemoryOptimization(): Promise<any> {
    // Optimize memory storage and retrieval
    if (this.services.memorySystem?.optimizeMemoryStorage) {
      const result = this.services.memorySystem.optimizeMemoryStorage();
      return {
        optimizationsApplied: result?.optimizations || 0,
        spaceFreed: result?.spaceFreed || 0,
        type: 'memory_optimization',
      };
    }
    return { optimizationsApplied: 0, message: 'Memory system not available' };
  }

  private async executeAttentionRebalancing(): Promise<any> {
    // Rebalance attention allocation
    if (this.services.attentionManager?.getAttentionStats) {
      const stats = this.services.attentionManager.getAttentionStats();
      return {
        focusPointsRebalanced: stats.activeFoci || 0,
        attentionEfficiency: stats.efficiency || 0,
        type: 'attention_rebalancing',
      };
    }
    return {
      focusPointsRebalanced: 0,
      message: 'Attention manager not available',
    };
  }

  private async executePerformanceAnalysis(): Promise<any> {
    // Analyze system performance
    const schedulerStats = this.getStats();
    return {
      totalTasks: schedulerStats.totalTasks,
      systemLoad: schedulerStats.systemLoad,
      uptime: schedulerStats.uptime,
      recommendations: this.generatePerformanceRecommendations(schedulerStats),
      type: 'performance_analysis',
    };
  }

  /**
   * Extract metrics from task execution result
   */
  private extractMetrics(result: any): Record<string, number> {
    if (!result || typeof result !== 'object') return {};

    const metrics: Record<string, number> = {};

    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'number') {
        metrics[key] = value;
      }
    }

    return metrics;
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(stats: SchedulerStats): string[] {
    const recommendations: string[] = [];

    if (stats.systemLoad > 0.8) {
      recommendations.push(
        'High system load detected - consider reducing task frequency'
      );
    }

    if (
      stats.failedExecutions /
        (stats.completedExecutions + stats.failedExecutions) >
      0.1
    ) {
      recommendations.push(
        'High failure rate - investigate task execution issues'
      );
    }

    if (stats.averageExecutionTime > 10000) {
      recommendations.push(
        'Long average execution time - optimize task implementations'
      );
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private calculateAverageExecutionTime(
    history: TaskExecutionResult[]
  ): number {
    if (history.length === 0) return 0;
    return (
      history.reduce((sum, result) => sum + result.executionTime, 0) /
      history.length
    );
  }

  private groupTasksByType(): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const task of this.tasks.values()) {
      grouped[task.type] = (grouped[task.type] || 0) + 1;
    }
    return grouped;
  }

  private groupTasksByPriority(): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const task of this.tasks.values()) {
      grouped[task.priority] = (grouped[task.priority] || 0) + 1;
    }
    return grouped;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
