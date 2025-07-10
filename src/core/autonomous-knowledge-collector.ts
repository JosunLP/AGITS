import { EventEmitter } from 'events';
import { DataIngestionService } from '../services/sensory/data-ingestion-service.js';
import { Logger } from '../utils/logger.js';
import { KnowledgeManagementSystem } from './knowledge-management.js';
import { MemoryManagementSystem } from './memory-management.js';

/**
 * Knowledge source types
 */
export enum KnowledgeSourceType {
  MEMORY_CONSOLIDATION = 'memory_consolidation',
  EXTERNAL_API = 'external_api',
  FILE_SYSTEM = 'file_system',
  SENSOR_DATA = 'sensor_data',
  USER_INTERACTION = 'user_interaction',
  PATTERN_DISCOVERY = 'pattern_discovery',
  CROSS_REFERENCE = 'cross_reference',
}

/**
 * Collection strategy
 */
export enum CollectionStrategy {
  CONTINUOUS = 'continuous',
  SCHEDULED = 'scheduled',
  EVENT_DRIVEN = 'event_driven',
  THRESHOLD_BASED = 'threshold_based',
}

/**
 * Knowledge collection task
 */
interface KnowledgeCollectionTask {
  id: string;
  name: string;
  description: string;
  sourceType: KnowledgeSourceType;
  strategy: CollectionStrategy;
  configuration: any;
  isActive: boolean;
  priority: number;
  intervalMs?: number;
  lastExecution?: Date;
  nextExecution?: Date;
  executionCount: number;
  successCount: number;
  errorCount: number;
  metadata: Record<string, any>;
}

/**
 * Collection result
 */
interface CollectionResult {
  taskId: string;
  success: boolean;
  itemsCollected: number;
  knowledgeItems: string[];
  executionTime: number;
  timestamp: Date;
  error?: string;
  metadata: Record<string, any>;
}

/**
 * Collection statistics
 */
interface CollectionStats {
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successRate: number;
  itemsCollectedToday: number;
  averageExecutionTime: number;
  topSources: Array<{ source: string; count: number }>;
  recentErrors: string[];
}

/**
 * Autonomous Knowledge Collection System - Continuously gathers knowledge from various sources
 * Implements intelligent data discovery, cross-referencing, and knowledge synthesis
 */
export class AutonomousKnowledgeCollector extends EventEmitter {
  private logger: Logger;
  private knowledgeSystem: KnowledgeManagementSystem;
  private memorySystem: MemoryManagementSystem;
  private dataIngestion: DataIngestionService;

  private collectionTasks = new Map<string, KnowledgeCollectionTask>();
  private collectionHistory: CollectionResult[] = [];
  private isRunning = false;

  // Collection parameters
  private readonly COLLECTION_INTERVAL = 5000; // 5 seconds
  private readonly MAX_CONCURRENT_TASKS = 3;
  private readonly HISTORY_LIMIT = 1000;
  private readonly ERROR_THRESHOLD = 0.2; // 20% error rate

  private runningTasks = new Set<string>();

  constructor(
    knowledgeSystem: KnowledgeManagementSystem,
    memorySystem: MemoryManagementSystem,
    dataIngestion: DataIngestionService
  ) {
    super();
    this.logger = new Logger('AutonomousKnowledgeCollector');
    this.knowledgeSystem = knowledgeSystem;
    this.memorySystem = memorySystem;
    this.dataIngestion = dataIngestion;

    this.initializeDefaultTasks();
    this.setupEventListeners();
  }

  /**
   * Start autonomous knowledge collection
   */
  public start(): void {
    if (this.isRunning) {
      this.logger.warn('Knowledge collection is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Autonomous knowledge collection started');
    this.collectionLoop();
  }

  /**
   * Stop autonomous knowledge collection
   */
  public stop(): void {
    this.isRunning = false;
    this.logger.info('Autonomous knowledge collection stopped');
  }

  /**
   * Add knowledge collection task
   */
  public addCollectionTask(
    task: Omit<
      KnowledgeCollectionTask,
      'id' | 'executionCount' | 'successCount' | 'errorCount'
    >
  ): string {
    const taskId = `task_${task.sourceType}_${Date.now()}`;

    const collectionTask: KnowledgeCollectionTask = {
      id: taskId,
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
      ...task,
    };

    // Set next execution time
    if (task.strategy === CollectionStrategy.SCHEDULED && task.intervalMs) {
      collectionTask.nextExecution = new Date(Date.now() + task.intervalMs);
    }

    this.collectionTasks.set(taskId, collectionTask);
    this.logger.info(`Knowledge collection task added: ${taskId}`);

    return taskId;
  }

  /**
   * Remove collection task
   */
  public removeCollectionTask(taskId: string): boolean {
    const task = this.collectionTasks.get(taskId);
    if (!task) {
      return false;
    }

    this.collectionTasks.delete(taskId);
    this.runningTasks.delete(taskId);
    this.logger.info(`Collection task removed: ${taskId}`);

    return true;
  }

  /**
   * Get collection statistics
   */
  public getCollectionStats(): CollectionStats {
    const recentHistory = this.collectionHistory.slice(-100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayResults = this.collectionHistory.filter(
      (result) => result.timestamp >= today
    );

    return {
      totalTasks: this.collectionTasks.size,
      activeTasks: Array.from(this.collectionTasks.values()).filter(
        (t) => t.isActive
      ).length,
      totalExecutions: this.collectionHistory.length,
      successRate:
        recentHistory.filter((r) => r.success).length /
        Math.max(recentHistory.length, 1),
      itemsCollectedToday: todayResults.reduce(
        (sum, result) => sum + result.itemsCollected,
        0
      ),
      averageExecutionTime:
        recentHistory.reduce((sum, result) => sum + result.executionTime, 0) /
        Math.max(recentHistory.length, 1),
      topSources: this.getTopSources(),
      recentErrors: recentHistory
        .filter((r) => !r.success && r.error)
        .map((r) => r.error!)
        .slice(-5),
    };
  }

  /**
   * Trigger immediate collection for a specific task
   */
  public async triggerCollection(
    taskId: string
  ): Promise<CollectionResult | null> {
    const task = this.collectionTasks.get(taskId);
    if (!task) {
      this.logger.warn(`Collection task not found: ${taskId}`);
      return null;
    }

    if (this.runningTasks.has(taskId)) {
      this.logger.warn(`Collection task already running: ${taskId}`);
      return null;
    }

    return await this.executeCollectionTask(task);
  }

  /**
   * Initialize default collection tasks
   */
  private initializeDefaultTasks(): void {
    // Memory consolidation collection
    this.addCollectionTask({
      name: 'Memory Consolidation Collection',
      description: 'Extract knowledge from consolidated memories',
      sourceType: KnowledgeSourceType.MEMORY_CONSOLIDATION,
      strategy: CollectionStrategy.SCHEDULED,
      configuration: {
        minMemoryStrength: 0.5,
        maxMemoriesPerBatch: 50,
      },
      isActive: true,
      priority: 1,
      intervalMs: 30000, // 30 seconds
      metadata: {
        defaultTask: true,
      },
    });

    // Pattern discovery collection
    this.addCollectionTask({
      name: 'Pattern Discovery Collection',
      description: 'Discover new patterns in existing knowledge',
      sourceType: KnowledgeSourceType.PATTERN_DISCOVERY,
      strategy: CollectionStrategy.SCHEDULED,
      configuration: {
        analysisDepth: 'moderate',
        patternTypes: ['frequency', 'correlation', 'sequence'],
      },
      isActive: true,
      priority: 2,
      intervalMs: 60000, // 1 minute
      metadata: {
        defaultTask: true,
      },
    });

    // Cross-reference collection
    this.addCollectionTask({
      name: 'Cross-Reference Collection',
      description: 'Find relationships between existing knowledge items',
      sourceType: KnowledgeSourceType.CROSS_REFERENCE,
      strategy: CollectionStrategy.THRESHOLD_BASED,
      configuration: {
        similarityThreshold: 0.7,
        maxRelationshipsPerItem: 10,
      },
      isActive: true,
      priority: 2,
      intervalMs: 45000, // 45 seconds
      metadata: {
        defaultTask: true,
      },
    });

    // Sensor data collection
    this.addCollectionTask({
      name: 'Sensor Data Analysis',
      description: 'Extract insights from sensor and operational data',
      sourceType: KnowledgeSourceType.SENSOR_DATA,
      strategy: CollectionStrategy.CONTINUOUS,
      configuration: {
        dataTypes: ['performance', 'system', 'user_behavior'],
        aggregationWindow: 300000, // 5 minutes
      },
      isActive: true,
      priority: 3,
      metadata: {
        defaultTask: true,
      },
    });

    this.logger.info(
      `Initialized ${this.collectionTasks.size} default collection tasks`
    );
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for memory events
    this.memorySystem.on('memoryConsolidated', (memory) => {
      this.onMemoryConsolidated(memory);
    });

    // Listen for knowledge events
    this.knowledgeSystem.on('knowledgeAdded', (knowledge) => {
      this.onKnowledgeAdded(knowledge);
    });

    // Listen for data ingestion events - safely check if it's an event emitter
    if (this.dataIngestion && typeof this.dataIngestion.on === 'function') {
      this.dataIngestion.on('dataProcessed', (data) => {
        this.onDataProcessed(data);
      });
    } else {
      this.logger.debug(
        'Data ingestion service does not support events, skipping event listener setup'
      );
    }
  }

  /**
   * Main collection loop
   */
  private async collectionLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processCollectionTasks();
        await this.sleep(this.COLLECTION_INTERVAL);
      } catch (error) {
        this.logger.error('Error in collection loop:', error);
        await this.sleep(10000); // Longer delay on error
      }
    }
  }

  /**
   * Process ready collection tasks
   */
  private async processCollectionTasks(): Promise<void> {
    const now = new Date();
    const readyTasks: KnowledgeCollectionTask[] = [];

    // Find tasks ready for execution
    for (const task of this.collectionTasks.values()) {
      if (
        this.isTaskReady(task, now) &&
        this.runningTasks.size < this.MAX_CONCURRENT_TASKS
      ) {
        readyTasks.push(task);
      }
    }

    // Sort by priority
    readyTasks.sort((a, b) => a.priority - b.priority);

    // Execute ready tasks
    const executionPromises = readyTasks
      .slice(0, this.MAX_CONCURRENT_TASKS - this.runningTasks.size)
      .map((task) => this.executeCollectionTask(task));

    if (executionPromises.length > 0) {
      await Promise.allSettled(executionPromises);
    }
  }

  /**
   * Check if task is ready for execution
   */
  private isTaskReady(task: KnowledgeCollectionTask, now: Date): boolean {
    if (!task.isActive || this.runningTasks.has(task.id)) {
      return false;
    }

    // Check error rate
    const errorRate =
      task.executionCount > 0 ? task.errorCount / task.executionCount : 0;
    if (errorRate > this.ERROR_THRESHOLD) {
      return false;
    }

    switch (task.strategy) {
      case CollectionStrategy.CONTINUOUS:
        return true;

      case CollectionStrategy.SCHEDULED:
        return task.nextExecution ? task.nextExecution <= now : true;

      case CollectionStrategy.EVENT_DRIVEN:
        return false; // Triggered by events

      case CollectionStrategy.THRESHOLD_BASED:
        return this.checkThresholdConditions(task);

      default:
        return false;
    }
  }

  /**
   * Check threshold conditions for task execution
   */
  private checkThresholdConditions(task: KnowledgeCollectionTask): boolean {
    const stats = this.knowledgeSystem.getKnowledgeStats();

    switch (task.sourceType) {
      case KnowledgeSourceType.CROSS_REFERENCE:
        // Execute if we have enough unlinked knowledge
        return stats.networkDensity < 0.3 && stats.totalItems > 10;

      case KnowledgeSourceType.PATTERN_DISCOVERY:
        // Execute if we have new knowledge to analyze
        return stats.recentlyUpdated > 5;

      default:
        return true;
    }
  }

  /**
   * Execute a collection task
   */
  private async executeCollectionTask(
    task: KnowledgeCollectionTask
  ): Promise<CollectionResult> {
    const startTime = Date.now();
    this.runningTasks.add(task.id);

    this.logger.debug(
      `Executing collection task: ${task.id} (${task.sourceType})`
    );

    let result: CollectionResult = {
      taskId: task.id,
      success: false,
      itemsCollected: 0,
      knowledgeItems: [],
      executionTime: 0,
      timestamp: new Date(),
      metadata: {},
    };

    try {
      // Execute based on source type
      const collectionData = await this.collectFromSource(task);

      result = {
        taskId: task.id,
        success: true,
        itemsCollected: collectionData.items.length,
        knowledgeItems: collectionData.knowledgeIds,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        metadata: collectionData.metadata,
      };

      // Update task statistics
      task.executionCount++;
      task.successCount++;
      task.lastExecution = new Date();

      // Schedule next execution for scheduled tasks
      if (task.strategy === CollectionStrategy.SCHEDULED && task.intervalMs) {
        task.nextExecution = new Date(Date.now() + task.intervalMs);
      }

      this.logger.debug(
        `Collection task completed: ${task.id} - ${result.itemsCollected} items`
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;

      result = {
        taskId: task.id,
        success: false,
        itemsCollected: 0,
        knowledgeItems: [],
        executionTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {},
      };

      task.executionCount++;
      task.errorCount++;

      this.logger.error(`Collection task failed: ${task.id} - ${result.error}`);
    } finally {
      this.runningTasks.delete(task.id);

      // Store result
      this.collectionHistory.push(result);

      // Trim history
      if (this.collectionHistory.length > this.HISTORY_LIMIT) {
        this.collectionHistory = this.collectionHistory.slice(
          -this.HISTORY_LIMIT
        );
      }

      this.emit('collectionCompleted', result);
    }

    return result;
  }

  /**
   * Collect knowledge from specific source
   */
  private async collectFromSource(task: KnowledgeCollectionTask): Promise<{
    items: any[];
    knowledgeIds: string[];
    metadata: Record<string, any>;
  }> {
    switch (task.sourceType) {
      case KnowledgeSourceType.MEMORY_CONSOLIDATION:
        return await this.collectFromMemoryConsolidation(task);

      case KnowledgeSourceType.PATTERN_DISCOVERY:
        return await this.collectFromPatternDiscovery(task);

      case KnowledgeSourceType.CROSS_REFERENCE:
        return await this.collectFromCrossReference(task);

      case KnowledgeSourceType.SENSOR_DATA:
        return await this.collectFromSensorData(task);

      default:
        throw new Error(`Unsupported source type: ${task.sourceType}`);
    }
  }

  /**
   * Collect knowledge from memory consolidation
   */
  private async collectFromMemoryConsolidation(
    task: KnowledgeCollectionTask
  ): Promise<{
    items: any[];
    knowledgeIds: string[];
    metadata: Record<string, any>;
  }> {
    const config = task.configuration;
    const extractionResult =
      await this.knowledgeSystem.extractKnowledgeFromMemories();

    const knowledgeIds: string[] = [];
    extractionResult.extractedItems.forEach((item) => {
      if (item.confidence >= (config.minMemoryStrength || 0.5)) {
        // Item is already added to knowledge base in extractKnowledgeFromMemories
        knowledgeIds.push(item.id);
      }
    });

    return {
      items: extractionResult.extractedItems,
      knowledgeIds,
      metadata: {
        patternsFound: extractionResult.patterns.length,
        insightsGenerated: extractionResult.insights.length,
        processingTime: extractionResult.processingTime,
      },
    };
  }

  /**
   * Collect knowledge from pattern discovery
   */
  private async collectFromPatternDiscovery(
    task: KnowledgeCollectionTask
  ): Promise<{
    items: any[];
    knowledgeIds: string[];
    metadata: Record<string, any>;
  }> {
    const knowledge = this.knowledgeSystem.queryKnowledge({ limit: 100 });
    const patterns: any[] = [];
    const knowledgeIds: string[] = [];

    // Simple pattern discovery
    const typeGroups = this.groupKnowledgeByType(knowledge);
    const subjectGroups = this.groupKnowledgeBySubject(knowledge);

    // Create pattern knowledge items
    Object.entries(typeGroups).forEach(([type, items]) => {
      if (items.length > 3) {
        const patternId = this.knowledgeSystem.addKnowledge({
          type: 'CONCEPTUAL' as any,
          content: { pattern: `${type}_frequency`, items: items.length },
          subject: `Pattern: ${type} frequency`,
          description: `Identified pattern of ${type} knowledge items`,
          confidence: Math.min(items.length / 10, 1),
          confidenceLevel: 'MEDIUM' as any,
          sources: ['pattern_discovery'],
          tags: ['pattern', 'meta_knowledge', type],
          relationships: [],
          verification: {
            isVerified: false,
            verificationScore: 0,
            contradictions: [],
            supportingEvidence: [],
          },
          metadata: {
            patternType: 'frequency',
            discoveredAt: new Date(),
            sourceTask: task.id,
          },
        });

        patterns.push({ type, count: items.length });
        knowledgeIds.push(patternId);
      }
    });

    return {
      items: patterns,
      knowledgeIds,
      metadata: {
        typePatterns: Object.keys(typeGroups).length,
        subjectPatterns: Object.keys(subjectGroups).length,
      },
    };
  }

  /**
   * Collect knowledge from cross-referencing
   */
  private async collectFromCrossReference(
    task: KnowledgeCollectionTask
  ): Promise<{
    items: any[];
    knowledgeIds: string[];
    metadata: Record<string, any>;
  }> {
    const knowledge = this.knowledgeSystem.queryKnowledge({ limit: 50 });
    const relationships: any[] = [];
    const knowledgeIds: string[] = [];

    // Find potential relationships
    for (let i = 0; i < knowledge.length; i++) {
      for (let j = i + 1; j < knowledge.length; j++) {
        const item1 = knowledge[i];
        const item2 = knowledge[j];

        const similarity = this.calculateKnowledgeSimilarity(item1, item2);
        if (similarity > (task.configuration.similarityThreshold || 0.7)) {
          // Create relationship knowledge
          const relationshipId = this.knowledgeSystem.addKnowledge({
            type: 'CONTEXTUAL' as any,
            content: {
              relationship: 'similar_to',
              items: [item1.id, item2.id],
              similarity,
            },
            subject: `Relationship: ${item1.subject} ↔ ${item2.subject}`,
            description: `Discovered similarity between knowledge items`,
            confidence: similarity,
            confidenceLevel: 'HIGH' as any,
            sources: ['cross_reference'],
            tags: ['relationship', 'meta_knowledge'],
            relationships: [],
            verification: {
              isVerified: false,
              verificationScore: 0,
              contradictions: [],
              supportingEvidence: [],
            },
            metadata: {
              relationshipType: 'similarity',
              discoveredAt: new Date(),
              sourceTask: task.id,
            },
          });

          relationships.push({ item1: item1.id, item2: item2.id, similarity });
          knowledgeIds.push(relationshipId);
        }
      }
    }

    return {
      items: relationships,
      knowledgeIds,
      metadata: {
        relationshipsFound: relationships.length,
        averageSimilarity:
          relationships.reduce((sum, rel) => sum + rel.similarity, 0) /
          Math.max(relationships.length, 1),
      },
    };
  }

  /**
   * Collect knowledge from sensor data
   */
  private async collectFromSensorData(task: KnowledgeCollectionTask): Promise<{
    items: any[];
    knowledgeIds: string[];
    metadata: Record<string, any>;
  }> {
    // Get system performance and operational data
    const systemStats = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    const knowledgeId = this.knowledgeSystem.addKnowledge({
      type: 'FACTUAL' as any,
      content: { systemStats, source: 'sensor_data' },
      subject: 'System Performance Data',
      description: `System performance snapshot at ${new Date().toISOString()}`,
      confidence: 0.9,
      confidenceLevel: 'VERY_HIGH' as any,
      sources: ['system_sensors'],
      tags: ['system', 'performance', 'sensor_data'],
      relationships: [],
      verification: {
        isVerified: true,
        verificationScore: 0.9,
        contradictions: [],
        supportingEvidence: ['direct_measurement'],
      },
      metadata: {
        sensorType: 'system_performance',
        collectedAt: new Date(),
        sourceTask: task.id,
      },
    });

    return {
      items: [systemStats],
      knowledgeIds: [knowledgeId],
      metadata: {
        memoryUsageMB: systemStats.memoryUsage.heapUsed / 1024 / 1024,
        uptimeHours: systemStats.uptime / 3600,
      },
    };
  }

  /**
   * Event handlers
   */
  private onMemoryConsolidated(memory: any): void {
    // Trigger event-driven collection for memory consolidation
    const tasks = Array.from(this.collectionTasks.values()).filter(
      (task) =>
        task.sourceType === KnowledgeSourceType.MEMORY_CONSOLIDATION &&
        task.strategy === CollectionStrategy.EVENT_DRIVEN
    );

    tasks.forEach((task) => {
      this.executeCollectionTask(task);
    });
  }

  private onKnowledgeAdded(knowledge: any): void {
    // Update collection strategies based on new knowledge
    this.logger.debug(
      `Knowledge added, updating collection strategies: ${knowledge.id}`
    );
  }

  private onDataProcessed(data: any): void {
    // Process new data for knowledge extraction
    this.logger.debug(
      `Data processed, checking for knowledge extraction: ${data.id}`
    );
  }

  /**
   * Helper methods
   */
  private groupKnowledgeByType(knowledge: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    knowledge.forEach((item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
    });
    return groups;
  }

  private groupKnowledgeBySubject(knowledge: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    knowledge.forEach((item) => {
      const subject = item.subject.toLowerCase();
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(item);
    });
    return groups;
  }

  private calculateKnowledgeSimilarity(item1: any, item2: any): number {
    // Simple similarity calculation based on tags and subject
    const tags1 = new Set(item1.tags);
    const tags2 = new Set(item2.tags);
    const tagIntersection = new Set([...tags1].filter((tag) => tags2.has(tag)));
    const tagUnion = new Set([...tags1, ...tags2]);

    const tagSimilarity = tagIntersection.size / Math.max(tagUnion.size, 1);

    const subjectSimilarity = item1.subject === item2.subject ? 1 : 0;

    return tagSimilarity * 0.7 + subjectSimilarity * 0.3;
  }

  private getTopSources(): Array<{ source: string; count: number }> {
    const sourceCounts: Record<string, number> = {};

    this.collectionHistory.forEach((result) => {
      const task = this.collectionTasks.get(result.taskId);
      if (task) {
        const source = task.sourceType;
        sourceCounts[source] =
          (sourceCounts[source] || 0) + result.itemsCollected;
      }
    });

    return Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
