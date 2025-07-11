import { DataPersistenceLayer } from '../infrastructure/data-persistence-layer.js';
import { ExternalApiService } from '../services/data-acquisition/external-api.service.js';
import { WebScrapingService } from '../services/data-acquisition/web-scraping.service.js';
import type { ScrapedContent } from '../types/data-acquisition.type.js';
import type {
  KnowledgeItem,
  KnowledgeMetadata,
} from '../types/knowledge.interface.js';
import {
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeType,
} from '../types/knowledge.type.js';
import type { Logger } from '../utils/logger.js';
import { EventEmitter } from '../utils/node-polyfill.js';

/**
 * Collection Priority Level
 */
export enum CollectionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Collection Strategy
 */
export enum CollectionStrategy {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  HYBRID = 'hybrid',
  CONTINUOUS = 'continuous',
  SCHEDULED = 'scheduled',
}

/**
 * Quality Assessment Result
 */
export interface QualityAssessment {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: {
    relevance: number;
    reliability: number;
    freshness: number;
    completeness: number;
  };
  confidence: number;
}

/**
 * Collection Task Definition
 */
export interface KnowledgeCollectionTask {
  id: string;
  source: string;
  priority: CollectionPriority;
  strategy: CollectionStrategy;
  parameters: Record<string, any>;
  scheduledTime?: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Collection Statistics
 */
export interface CollectionStats {
  totalCollections: number;
  successfulCollections: number;
  failedCollections: number;
  averageCollectionTime: number;
  lastCollectionTime: Date | null;
  collectionsToday: number;
  sourceStats: Map<
    string,
    { count: number; successRate: number; avgQuality: number }
  >;
  qualityDistribution: { high: number; medium: number; low: number };
}

/**
 * Source Configuration
 */
export interface SourceConfig {
  name: string;
  type: 'web' | 'api' | 'database' | 'file';
  url?: string;
  credentials?: Record<string, string>;
  rateLimit?: { requests: number; window: number };
  priority: CollectionPriority;
  enabled: boolean;
  metadata: Record<string, any>;
}

/**
 * Enhanced Autonomous Knowledge Collector
 * Continuously collects, validates, and integrates knowledge from multiple sources
 */
export class AutonomousKnowledgeCollector extends EventEmitter {
  private readonly dataPersistence: DataPersistenceLayer;
  private readonly webScraping: WebScrapingService;
  private readonly externalApi: ExternalApiService;
  private readonly logger: Logger;

  private isRunning: boolean = false;
  private collectionTasks: Map<string, KnowledgeCollectionTask> = new Map();
  private stats: CollectionStats;
  private sources: Map<string, SourceConfig> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;
  private readonly collectionIntervalMs: number;

  constructor(
    dataPersistence: DataPersistenceLayer,
    webScraping: WebScrapingService,
    externalApi: ExternalApiService,
    logger: Logger,
    collectionIntervalMs: number = 300000 // 5 minutes default
  ) {
    super();

    this.dataPersistence = dataPersistence;
    this.webScraping = webScraping;
    this.externalApi = externalApi;
    this.logger = logger;
    this.collectionIntervalMs = collectionIntervalMs;

    this.initializeStats();
    this.setupDefaultSources();
    this.setupEventListeners();
  }

  /**
   * Start autonomous knowledge collection
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Autonomous knowledge collector is already running');
      return;
    }

    this.logger.info('Starting autonomous knowledge collection...');
    this.isRunning = true;

    // Start continuous collection cycle
    this.startCollectionCycle();

    // Emit start event
    this.emit('collectionStarted', { timestamp: new Date() });

    this.logger.info('Autonomous knowledge collection started successfully');
  }

  /**
   * Stop autonomous knowledge collection
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Autonomous knowledge collector is not running');
      return;
    }

    this.logger.info('Stopping autonomous knowledge collection...');
    this.isRunning = false;

    // Clear collection interval
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    // Cancel pending tasks
    this.cancelPendingTasks();

    // Emit stop event
    this.emit('collectionStopped', { timestamp: new Date() });

    this.logger.info('Autonomous knowledge collection stopped');
  }

  /**
   * Add a new knowledge source
   */
  addSource(config: SourceConfig): void {
    this.sources.set(config.name, config);

    // Initialize source statistics
    if (!this.stats.sourceStats.has(config.name)) {
      this.stats.sourceStats.set(config.name, {
        count: 0,
        successRate: 0,
        avgQuality: 0,
      });
    }

    this.logger.info(`Added knowledge source: ${config.name} (${config.type})`);
    this.emit('sourceAdded', { source: config });
  }

  /**
   * Remove a knowledge source
   */
  removeSource(sourceName: string): boolean {
    const removed = this.sources.delete(sourceName);

    if (removed) {
      // Cancel tasks for this source
      this.cancelTasksForSource(sourceName);
      this.logger.info(`Removed knowledge source: ${sourceName}`);
      this.emit('sourceRemoved', { sourceName });
    }

    return removed;
  }

  /**
   * Schedule a collection task
   */
  scheduleTask(
    task: Omit<
      KnowledgeCollectionTask,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    >
  ): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullTask: KnowledgeCollectionTask = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.collectionTasks.set(taskId, fullTask);

    this.logger.info(
      `Scheduled collection task: ${taskId} for source: ${task.source}`
    );
    this.emit('taskScheduled', { task: fullTask });

    return taskId;
  }

  /**
   * Get collection statistics
   */
  getStats(): CollectionStats {
    return {
      ...this.stats,
      sourceStats: new Map(this.stats.sourceStats),
      qualityDistribution: { ...this.stats.qualityDistribution },
    };
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): KnowledgeCollectionTask[] {
    return Array.from(this.collectionTasks.values()).filter(
      (task) => task.status === 'pending' || task.status === 'running'
    );
  }

  /**
   * Force immediate collection from all enabled sources
   */
  async collectNow(): Promise<void> {
    this.logger.info('Starting immediate knowledge collection...');

    const enabledSources = Array.from(this.sources.values()).filter(
      (source) => source.enabled
    );

    const collectionPromises = enabledSources.map((source) =>
      this.collectFromSource(source)
    );

    await Promise.allSettled(collectionPromises);

    this.logger.info('Immediate knowledge collection completed');
  }

  /**
   * Start the collection cycle
   */
  private startCollectionCycle(): void {
    this.collectionInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.performScheduledCollections();
      } catch (error) {
        this.logger.error('Error in collection cycle:', error);
        this.emit('collectionError', { error, timestamp: new Date() });
      }
    }, this.collectionIntervalMs);
  }

  /**
   * Perform scheduled collections
   */
  private async performScheduledCollections(): Promise<void> {
    const now = new Date();
    const enabledSources = Array.from(this.sources.values()).filter(
      (source) => source.enabled
    );

    // Collect from sources based on their priority and strategy
    for (const source of enabledSources) {
      if (this.shouldCollectFromSource(source, now)) {
        await this.collectFromSource(source);
      }
    }

    // Process pending tasks
    await this.processPendingTasks();
  }

  /**
   * Determine if we should collect from a source
   */
  private shouldCollectFromSource(source: SourceConfig, now: Date): boolean {
    const sourceStats = this.stats.sourceStats.get(source.name);

    // Basic rate limiting
    if (sourceStats && sourceStats.count > 0) {
      const timeSinceLastCollection =
        now.getTime() - (this.stats.lastCollectionTime?.getTime() || 0);
      const minInterval = this.getMinIntervalForPriority(source.priority);

      if (timeSinceLastCollection < minInterval) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get minimum interval based on priority
   */
  private getMinIntervalForPriority(priority: CollectionPriority): number {
    switch (priority) {
      case CollectionPriority.CRITICAL:
        return 60000; // 1 minute
      case CollectionPriority.HIGH:
        return 300000; // 5 minutes
      case CollectionPriority.NORMAL:
        return 900000; // 15 minutes
      case CollectionPriority.LOW:
        return 3600000; // 1 hour
      default:
        return 900000;
    }
  }

  /**
   * Collect knowledge from a specific source
   */
  private async collectFromSource(source: SourceConfig): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting collection from source: ${source.name}`);

      let collectedData: any[] = [];

      // Collect based on source type
      switch (source.type) {
        case 'web':
          collectedData = await this.collectFromWeb(source);
          break;
        case 'api':
          collectedData = await this.collectFromApi(source);
          break;
        default:
          this.logger.warn(`Unsupported source type: ${source.type}`);
          return;
      }

      // Process and store collected data
      if (collectedData.length > 0) {
        await this.processCollectedData(collectedData, source);
        this.updateSourceStats(source.name, true, Date.now() - startTime);

        this.emit('dataCollected', {
          source: source.name,
          itemCount: collectedData.length,
          timestamp: new Date(),
        });
      }

      this.updateCollectionStats();
    } catch (error) {
      this.logger.error(`Collection failed for source ${source.name}:`, error);
      this.updateSourceStats(source.name, false, Date.now() - startTime);
      this.stats.failedCollections++;

      this.emit('collectionError', {
        source: source.name,
        error,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Collect data from web source
   */
  private async collectFromWeb(
    source: SourceConfig
  ): Promise<ScrapedContent[]> {
    if (!source.url) {
      throw new Error(`Web source ${source.name} missing URL`);
    }

    const content = await this.webScraping.scrapeUrl(source.url);
    return content ? [content] : [];
  }

  /**
   * Collect data from API source
   */
  private async collectFromApi(source: SourceConfig): Promise<any[]> {
    if (!source.url) {
      throw new Error(`API source ${source.name} missing URL`);
    }

    const response = await this.externalApi.makeRequest({
      url: source.url,
      method: 'GET',
      params: source.credentials || {},
      timeout: 30000,
    });

    return response.data
      ? Array.isArray(response.data)
        ? response.data
        : [response.data]
      : [];
  }

  /**
   * Process and store collected data
   */
  private async processCollectedData(
    data: any[],
    source: SourceConfig
  ): Promise<void> {
    for (const item of data) {
      try {
        // Assess quality
        const quality = this.assessDataQuality(item, source);

        // Only store high and medium quality data
        if (quality.level !== 'low') {
          // Convert to knowledge item
          const knowledgeItem = this.convertToKnowledgeItem(
            item,
            source,
            quality
          );

          // Store in persistence layer
          await this.dataPersistence.storeKnowledge(knowledgeItem);

          // Update quality distribution
          this.stats.qualityDistribution[quality.level]++;
        }
      } catch (error) {
        this.logger.error('Error processing collected item:', error);
      }
    }
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(
    data: any,
    source: SourceConfig
  ): QualityAssessment {
    const factors = {
      relevance: this.assessRelevance(data),
      reliability: this.assessReliability(data, source),
      freshness: this.assessFreshness(data),
      completeness: this.assessCompleteness(data),
    };

    const score =
      (factors.relevance +
        factors.reliability +
        factors.freshness +
        factors.completeness) /
      4;

    let level: 'low' | 'medium' | 'high';
    if (score >= 0.8) level = 'high';
    else if (score >= 0.5) level = 'medium';
    else level = 'low';

    return {
      score,
      level,
      factors,
      confidence: Math.min(score + 0.1, 1.0),
    };
  }

  /**
   * Convert data to knowledge item
   */
  private convertToKnowledgeItem(
    data: any,
    source: SourceConfig,
    quality: QualityAssessment
  ): KnowledgeItem {
    const metadata: KnowledgeMetadata = {
      domain: source.metadata?.category || 'general',
      complexity: 0.5,
      importance: quality.score,
      frequency: 1,
      context: {
        source: source.name,
        sourceType: source.type,
        collectionTime: new Date(),
        quality: quality,
        confidence: quality.confidence,
      },
      derivedFrom: [],
      relatedConcepts: [],
      applications: [],
      limitations: [],
      assumptions: [],
    };

    return {
      id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: KnowledgeType.FACTUAL,
      subject: this.extractSubject(data),
      description: this.extractDescription(data),
      content: data,
      confidence: quality.confidence,
      confidenceLevel: this.getConfidenceLevel(quality.confidence),
      source: KnowledgeSourceType.WEB_SCRAPING,
      sources: [source.name],
      tags: this.extractTags(data, source),
      status: KnowledgeStatus.PENDING,
      relationships: [],
      validation: {
        isVerified: false,
        verificationScore: quality.score,
        contradictions: [],
        supportingEvidence: [],
        consensus: quality.confidence,
      },
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1,
      lastValidated: new Date(),
    };
  }

  /**
   * Extract subject from data
   */
  private extractSubject(data: any): string {
    if (typeof data === 'object' && data.title) {
      return data.title;
    }
    if (typeof data === 'string') {
      return data.substring(0, 100) + (data.length > 100 ? '...' : '');
    }
    return 'Collected Knowledge';
  }

  /**
   * Extract description from data
   */
  private extractDescription(data: any): string {
    if (typeof data === 'object' && data.description) {
      return data.description;
    }
    if (typeof data === 'object' && data.content) {
      return (
        data.content.substring(0, 200) +
        (data.content.length > 200 ? '...' : '')
      );
    }
    return 'Knowledge collected from external source';
  }

  /**
   * Extract tags from data and source
   */
  private extractTags(data: any, source: SourceConfig): string[] {
    const tags = ['collected', source.type];

    if (source.metadata?.category) {
      tags.push(source.metadata.category);
    }

    if (typeof data === 'object' && data.tags) {
      tags.push(...data.tags);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get confidence level from score
   */
  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.8) return 'very_high';
    if (confidence >= 0.6) return 'high';
    if (confidence >= 0.4) return 'medium';
    if (confidence >= 0.2) return 'low';
    return 'very_low';
  }

  /**
   * Assessment helper methods
   */
  private assessRelevance(data: any): number {
    // Simple heuristic - can be enhanced with ML
    if (typeof data === 'string' && data.length > 50) return 0.7;
    if (typeof data === 'object' && Object.keys(data).length > 3) return 0.8;
    return 0.5;
  }

  private assessReliability(data: any, source: SourceConfig): number {
    const sourceStats = this.stats.sourceStats.get(source.name);
    return sourceStats ? sourceStats.successRate : 0.5;
  }

  private assessFreshness(data: any): number {
    // Assume new data is fresh
    return 0.9;
  }

  private assessCompleteness(data: any): number {
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return Math.min(keys.length / 5, 1.0); // Assume 5 fields is complete
    }
    if (typeof data === 'string') {
      return Math.min(data.length / 100, 1.0); // Assume 100 chars is complete
    }
    return 0.5;
  }

  /**
   * Process pending tasks
   */
  private async processPendingTasks(): Promise<void> {
    const pendingTasks = Array.from(this.collectionTasks.values())
      .filter((task) => task.status === 'pending')
      .sort(
        (a, b) =>
          this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
      );

    for (const task of pendingTasks.slice(0, 5)) {
      // Process max 5 tasks per cycle
      await this.executeTask(task);
    }
  }

  /**
   * Execute a collection task
   */
  private async executeTask(task: KnowledgeCollectionTask): Promise<void> {
    try {
      task.status = 'running';
      task.updatedAt = new Date();

      const source = this.sources.get(task.source);
      if (!source) {
        throw new Error(`Source not found: ${task.source}`);
      }

      await this.collectFromSource(source);

      task.status = 'completed';
      task.updatedAt = new Date();

      // Remove completed task
      this.collectionTasks.delete(task.id);
    } catch (error) {
      task.status = 'failed';
      task.retryCount++;
      task.updatedAt = new Date();

      if (task.retryCount >= task.maxRetries) {
        this.collectionTasks.delete(task.id);
        this.logger.error(`Task ${task.id} failed permanently:`, error);
      } else {
        task.status = 'pending';
        this.logger.warn(
          `Task ${task.id} failed, will retry (${task.retryCount}/${task.maxRetries}):`,
          error
        );
      }
    }
  }

  /**
   * Update source statistics
   */
  private updateSourceStats(
    sourceName: string,
    success: boolean,
    duration: number
  ): void {
    const stats = this.stats.sourceStats.get(sourceName) || {
      count: 0,
      successRate: 0,
      avgQuality: 0,
    };

    stats.count++;
    stats.successRate = success
      ? (stats.successRate * (stats.count - 1) + 1) / stats.count
      : (stats.successRate * (stats.count - 1)) / stats.count;

    this.stats.sourceStats.set(sourceName, stats);
  }

  /**
   * Update collection statistics
   */
  private updateCollectionStats(): void {
    this.stats.totalCollections++;
    this.stats.successfulCollections++;
    this.stats.lastCollectionTime = new Date();

    // Update collections today
    const today = new Date().toDateString();
    const lastCollection = this.stats.lastCollectionTime.toDateString();

    if (today === lastCollection) {
      this.stats.collectionsToday++;
    } else {
      this.stats.collectionsToday = 1;
    }
  }

  /**
   * Get priority numeric value
   */
  private getPriorityValue(priority: CollectionPriority): number {
    switch (priority) {
      case CollectionPriority.CRITICAL:
        return 4;
      case CollectionPriority.HIGH:
        return 3;
      case CollectionPriority.NORMAL:
        return 2;
      case CollectionPriority.LOW:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Cancel pending tasks
   */
  private cancelPendingTasks(): void {
    const pendingTasks = Array.from(this.collectionTasks.values()).filter(
      (task) => task.status === 'pending' || task.status === 'running'
    );

    pendingTasks.forEach((task) => {
      this.collectionTasks.delete(task.id);
    });

    this.logger.info(`Cancelled ${pendingTasks.length} pending tasks`);
  }

  /**
   * Cancel tasks for a specific source
   */
  private cancelTasksForSource(sourceName: string): void {
    const sourceTasks = Array.from(this.collectionTasks.values()).filter(
      (task) => task.source === sourceName
    );

    sourceTasks.forEach((task) => {
      this.collectionTasks.delete(task.id);
    });

    this.logger.info(
      `Cancelled ${sourceTasks.length} tasks for source: ${sourceName}`
    );
  }

  /**
   * Initialize collection statistics
   */
  private initializeStats(): void {
    this.stats = {
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      averageCollectionTime: 0,
      lastCollectionTime: null,
      collectionsToday: 0,
      sourceStats: new Map(),
      qualityDistribution: { high: 0, medium: 0, low: 0 },
    };
  }

  /**
   * Setup default knowledge sources
   */
  private setupDefaultSources(): void {
    // Add some default sources
    this.addSource({
      name: 'news-feed',
      type: 'web',
      url: 'https://example.com/news',
      priority: CollectionPriority.HIGH,
      enabled: true,
      metadata: { category: 'news', language: 'en' },
    });

    this.addSource({
      name: 'research-papers',
      type: 'api',
      url: 'https://api.example.com/papers',
      priority: CollectionPriority.NORMAL,
      enabled: true,
      metadata: { category: 'research', format: 'academic' },
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('dataCollected', (event) => {
      this.logger.debug(
        `Data collected from ${event.source}: ${event.itemCount} items`
      );
    });

    this.on('collectionError', (event) => {
      this.logger.error(`Collection error from ${event.source}:`, event.error);
    });
  }

  // ========== Legacy API Compatibility Methods ==========

  /**
   * Legacy method - alias for getStats
   */
  getStatus() {
    return this.getStats();
  }

  /**
   * Legacy method - alias for getStats
   */
  getCollectionStats() {
    return this.getStats();
  }

  /**
   * Legacy method - alias for collectNow
   */
  async triggerCollection() {
    await this.collectNow();
    return { success: true, message: 'Collection triggered successfully' };
  }

  /**
   * Legacy method for web knowledge collection
   */
  async collectWebKnowledge(options: any) {
    // Simulate web collection with provided options
    await this.collectNow();
    return { success: true, collected: 1, source: 'web' };
  }

  /**
   * Legacy method for API knowledge collection
   */
  async collectApiKnowledge(options: any) {
    // Simulate API collection with provided options
    await this.collectNow();
    return { success: true, collected: 1, source: 'api' };
  }

  /**
   * Legacy method for enhanced collection
   */
  async triggerEnhancedCollection(options: any) {
    await this.collectNow();
    return { success: true, message: 'Enhanced collection completed' };
  }

  /**
   * Legacy method to get knowledge sources
   */
  async getKnowledgeSources() {
    return Array.from(this.sources.values());
  }

  /**
   * Legacy method to get trusted sources
   */
  async getTrustedSources() {
    return Array.from(this.sources.values()).filter((source) => source.enabled);
  }

  /**
   * Legacy method for web scraping stats
   */
  async getWebScrapingStats() {
    const stats = this.getStats();
    return {
      totalScrapes: stats.totalCollections,
      successfulScrapes: stats.successfulCollections,
      failedScrapes: stats.failedCollections,
      lastScrapeTime: stats.lastCollectionTime,
    };
  }

  /**
   * Legacy method for external API stats
   */
  async getExternalApiStats() {
    const stats = this.getStats();
    return {
      totalRequests: stats.totalCollections,
      successfulRequests: stats.successfulCollections,
      failedRequests: stats.failedCollections,
      lastRequestTime: stats.lastCollectionTime,
    };
  }
}

// Default export for compatibility
export default AutonomousKnowledgeCollector;
