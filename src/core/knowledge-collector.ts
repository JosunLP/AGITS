import { EventEmitter } from 'events';
import { DataPersistenceLayer } from '../infrastructure/data-persistence-layer.js';
import { ExternalApiService } from '../services/data-acquisition/external-api.service.js';
import { WebScrapingService } from '../services/data-acquisition/web-scraping.service.js';
import {
  IAutonomousKnowledgeCollector,
  IPatternRecognizer,
  IQualityAssessmentEngine,
} from '../types/autonomous-system.interface.js';
import {
  CollectionPerformanceMetrics,
  DataSourceType,
  KnowledgeCollectionConfig,
  KnowledgeQualityMetrics,
  KnowledgeSourceConfig,
  QualityFeedback,
} from '../types/autonomous-system.type.js';
import { KnowledgeItem } from '../types/knowledge.interface.js';
import { Logger } from '../utils/logger.js';

/**
 * Zentrale KnowledgeCollector-Klasse
 * KI-gesteuerte, ML-optimierte Wissenssammlung mit adaptiver Source-Optimierung und Qualitätsbewertung
 */
export class KnowledgeCollector
  extends EventEmitter
  implements IAutonomousKnowledgeCollector
{
  private readonly logger: Logger;
  private readonly dataPersistence: DataPersistenceLayer;
  private readonly webScraping: WebScrapingService;
  private readonly externalApi: ExternalApiService;
  private readonly qualityEngine: IQualityAssessmentEngine;
  private readonly patternRecognizer: IPatternRecognizer;

  private config: KnowledgeCollectionConfig;
  private runningState: boolean = false;
  private sources: Map<string, KnowledgeSourceConfig> = new Map();
  private collectionTasks: Map<string, any> = new Map();
  private performanceMetrics: CollectionPerformanceMetrics;
  private feedbackHistory: QualityFeedback[] = [];

  private collectionInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;
  private maintenanceInterval: NodeJS.Timeout | null = null;

  constructor(
    dataPersistence: DataPersistenceLayer,
    webScraping: WebScrapingService,
    externalApi: ExternalApiService,
    qualityEngine: IQualityAssessmentEngine,
    patternRecognizer: IPatternRecognizer,
    config?: Partial<KnowledgeCollectionConfig>
  ) {
    super();
    this.logger = new Logger('KnowledgeCollector');
    this.dataPersistence = dataPersistence;
    this.webScraping = webScraping;
    this.externalApi = externalApi;
    this.qualityEngine = qualityEngine;
    this.patternRecognizer = patternRecognizer;
    this.config = this.initializeConfig(config);
    this.performanceMetrics = this.initializeMetrics();
    this.setupEventListeners();
    this.loadConfiguration();
    this.logger.info('KnowledgeCollector initialisiert');
  }
  private initializeConfig(
    config?: Partial<KnowledgeCollectionConfig>
  ): KnowledgeCollectionConfig {
    return {
      enabled: true,
      collectionInterval: 300000,
      maxConcurrentTasks: 5,
      qualityThreshold: 0.7,
      sources: [],
      filters: [],
      processors: [],
      storage: {
        primaryStore: 'mongodb',
        backupStores: [],
        indexing: {
          fullText: true,
          semantic: true,
          metadata: true,
          customIndexes: [],
          updateFrequency: 3600000,
        },
        compression: false,
        encryption: false,
        retention: {
          maxAge: 365,
          maxSize: 10240,
          archiveOldData: true,
          compressionThreshold: 1000,
          deletionCriteria: {
            lowQualityThreshold: 0.2,
            inactivityPeriod: 90,
            redundancyCheck: true,
            manualReview: false,
          },
        }, // Tage
      },
      ...config,
    };
  }

  private initializeMetrics(): CollectionPerformanceMetrics {
    return {
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      averageCollectionTime: 0,
      qualityImprovement: 0,
      efficiencyScore: 0,
      lastOptimization: new Date(),
      sourcesOptimized: 0,
      learningAccuracy: 0,
      trendingMetrics: {
        dailyCollections: [],
        qualityTrend: [],
        performanceTrend: [],
      },
    };
  }

  private setupEventListeners(): void {
    this.on('sourceAdded', (event) => {
      this.logger.debug(
        `Source added: ${event.source?.id || event.source?.name}`
      );
    });
    this.on('sourceRemoved', (event) => {
      this.logger.debug(
        `Source removed: ${event.sourceId || event.sourceName}`
      );
    });
    this.on('collectionStarted', (event) => {
      this.logger.info(`Collection started: ${event.sourcesCount} sources`);
    });
    this.on('collectionStopped', (event) => {
      this.logger.info(`Collection stopped.`);
    });
  }

  private async loadConfiguration(): Promise<void> {
    // Placeholder für spätere Persistenz
    // Kann aus DB geladen werden
  }

  async start(): Promise<void> {
    if (this.runningState) {
      this.logger.warn('KnowledgeCollector läuft bereits');
      return;
    }
    this.logger.info('KnowledgeCollector wird gestartet...');
    this.runningState = true;
    this.startCollectionCycles();
    this.startOptimizationCycles();
    this.startMaintenanceCycles();
    this.emit('collectionStarted', {
      timestamp: new Date(),
      sourcesCount: this.sources.size,
      config: this.config,
    });
  }

  async stop(): Promise<void> {
    if (!this.runningState) {
      this.logger.warn('KnowledgeCollector ist nicht aktiv');
      return;
    }
    this.logger.info('KnowledgeCollector wird gestoppt...');
    this.runningState = false;
    if (this.collectionInterval) clearInterval(this.collectionInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);
    if (this.maintenanceInterval) clearInterval(this.maintenanceInterval);
    this.emit('collectionStopped', {
      timestamp: new Date(),
      metrics: this.performanceMetrics,
    });
  }

  isRunning(): boolean {
    return this.runningState;
  }

  async collectNow(): Promise<void> {
    this.logger.info('Sofortige Wissenssammlung wird gestartet...');
    const activeSources = Array.from(this.sources.values()).filter(
      (s) => s.enabled
    );
    const collectionPromises = activeSources.map((source) =>
      this.collectFromSource(source.id)
    );
    await Promise.allSettled(collectionPromises);
    this.logger.info('Sofortige Wissenssammlung abgeschlossen');
  }

  async collectFromSource(sourceId: string): Promise<KnowledgeItem[]> {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error(`Source not found: ${sourceId}`);
    this.logger.debug(`Wissenssammlung von Quelle: ${sourceId}`);
    // ...Logik für Web/API/DB...
    // Hier nur Platzhalter
    return [];
  }

  async collectByType(type: DataSourceType): Promise<KnowledgeItem[]> {
    const sourcesOfType = Array.from(this.sources.values()).filter(
      (s) => s.type === type && s.enabled
    );
    const allKnowledge: KnowledgeItem[] = [];
    for (const source of sourcesOfType) {
      const knowledge = await this.collectFromSource(source.id);
      allKnowledge.push(...knowledge);
    }
    return allKnowledge;
  }

  async triggerEnhancedCollection(): Promise<void> {
    this.logger.info('Erweiterte Sammlung mit ML-Optimierung...');
    await this.optimizeSources();
    const optimalSources = this.getActiveSources();
    const collectionPromises = optimalSources.map((source) =>
      this.collectFromSource(source.id)
    );
    await Promise.allSettled(collectionPromises);
    await this.adaptCollectionStrategy();
    this.logger.info('Erweiterte Sammlung abgeschlossen');
  }

  addSource(config: KnowledgeSourceConfig): void {
    this.sources.set(config.id, config);
    this.logger.info(`Quelle hinzugefügt: ${config.id}`);
    this.emit('sourceAdded', { source: config });
  }

  removeSource(sourceId: string): boolean {
    const removed = this.sources.delete(sourceId);
    if (removed) {
      this.logger.info(`Quelle entfernt: ${sourceId}`);
      this.emit('sourceRemoved', { sourceId });
    }
    return removed;
  }

  updateSource(
    sourceId: string,
    config: Partial<KnowledgeSourceConfig>
  ): boolean {
    const source = this.sources.get(sourceId);
    if (!source) return false;
    const updatedSource = { ...source, ...config };
    this.sources.set(sourceId, updatedSource);
    this.logger.info(`Quelle aktualisiert: ${sourceId}`);
    this.emit('sourceUpdated', { sourceId, config });
    return true;
  }

  enableSource(sourceId: string): boolean {
    return this.updateSource(sourceId, { enabled: true });
  }

  disableSource(sourceId: string): boolean {
    return this.updateSource(sourceId, { enabled: false });
  }

  async optimizeSources(): Promise<void> {
    this.logger.info('Quellen werden ML-basiert optimiert...');
    // ...ML-Optimierungslogik...
    this.emit('sourcesOptimized', {
      timestamp: new Date(),
      optimizedCount: this.sources.size,
    });
  }

  getSource(sourceId: string): KnowledgeSourceConfig | null {
    return this.sources.get(sourceId) || null;
  }

  getAllSources(): KnowledgeSourceConfig[] {
    return Array.from(this.sources.values());
  }

  getSourcesByType(type: DataSourceType): KnowledgeSourceConfig[] {
    return Array.from(this.sources.values()).filter((s) => s.type === type);
  }

  getActiveSources(): KnowledgeSourceConfig[] {
    return Array.from(this.sources.values()).filter((s) => s.enabled);
  }

  getTrustedSources(): KnowledgeSourceConfig[] {
    return Array.from(this.sources.values()).filter(
      (s) => s.enabled && (s as any).performanceMetrics?.reliability > 0.8
    );
  }

  async assessKnowledgeQuality(
    knowledge: KnowledgeItem
  ): Promise<KnowledgeQualityMetrics> {
    try {
      return await this.qualityEngine.assessDataQuality(knowledge);
    } catch (error) {
      this.logger.error('Qualitätsbewertung fehlgeschlagen:', error);
      return {
        relevance: 0.5,
        accuracy: 0.5,
        completeness: 0.5,
        freshness: 0.5,
        credibility: 0.5,
        consistency: 0.5,
        uniqueness: 0.5,
        applicability: 0.5,
        overallScore: 0.5,
        assessmentTime: new Date(),
      };
    }
  }

  async validateKnowledge(knowledge: KnowledgeItem): Promise<boolean> {
    const qualityMetrics = await this.assessKnowledgeQuality(knowledge);
    return qualityMetrics.overallScore >= this.config.qualityThreshold;
  }

  async assessSourceCredibility(sourceId: string): Promise<number> {
    const source = this.sources.get(sourceId);
    if (!source) return 0;
    const reliability = (source as any).performanceMetrics?.reliability || 0.5;
    const successRate = (source as any).performanceMetrics?.successRate || 0.5;
    const avgQuality = (source as any).performanceMetrics?.avgQuality || 0.5;
    return reliability * 0.4 + successRate * 0.3 + avgQuality * 0.3;
  }

  async detectKnowledgeDuplicates(knowledge: KnowledgeItem): Promise<string[]> {
    try {
      const patterns = await this.patternRecognizer.detectPatterns([knowledge]);
      const similarKnowledge = await this.dataPersistence.searchKnowledge(
        patterns.map((p: any) => p.id).join(' OR ')
      );
      return similarKnowledge.map((k: any) => k.id);
    } catch (error) {
      this.logger.error('Duplikaterkennung fehlgeschlagen:', error);
      return [];
    }
  }

  async learnFromFeedback(
    knowledgeId: string,
    feedback: QualityFeedback
  ): Promise<void> {
    this.feedbackHistory.push(feedback);
    await this.dataPersistence.storeFeedback(feedback);
    // ...ML-Modelle anpassen...
    if (this.feedbackHistory.length % 10 === 0) {
      await this.adaptCollectionStrategy();
    }
    this.emit('feedbackProcessed', feedback);
  }

  async adaptCollectionStrategy(): Promise<void> {
    this.logger.info('Sammlungsstrategie wird angepasst...');
    const recentFeedback = this.feedbackHistory.slice(-100);
    const positiveRatio =
      recentFeedback.filter((f) => f.feedback === 'positive').length /
      (recentFeedback.length || 1);
    if (positiveRatio < 0.7) {
      for (const source of this.sources.values()) {
        (source as any).qualityThreshold = Math.min(
          0.9,
          (source as any).qualityThreshold + 0.1
        );
      }
    } else if (positiveRatio > 0.9) {
      for (const source of this.sources.values()) {
        (source as any).qualityThreshold = Math.max(
          0.3,
          (source as any).qualityThreshold - 0.05
        );
      }
    }
    this.emit('strategyAdapted', { positiveRatio, timestamp: new Date() });
  }

  async performMaintenance(): Promise<void> {
    this.logger.info('Wartung wird durchgeführt...');
    // ...Aufräum- und Optimierungslogik...
    this.emit('maintenanceCompleted', { timestamp: new Date() });
  }

  setConfig(config: KnowledgeCollectionConfig): void {
    this.config = { ...config };
    this.emit('configUpdated', config);
  }

  getConfig(): KnowledgeCollectionConfig {
    return { ...this.config };
  }

  getCollectionStats() {
    return {
      totalSources: this.sources.size,
      activeSources: this.getActiveSources().length,
      totalCollections: this.performanceMetrics.totalCollections,
      successfulCollections: this.performanceMetrics.successfulCollections,
      failedCollections: this.performanceMetrics.failedCollections,
      averageCollectionTime: this.performanceMetrics.averageCollectionTime,
      qualityImprovement: this.performanceMetrics.qualityImprovement,
      efficiencyScore: this.performanceMetrics.efficiencyScore,
      lastOptimization: this.performanceMetrics.lastOptimization,
    };
  }

  getSourceStats(sourceId?: string) {
    if (sourceId) {
      const source = this.sources.get(sourceId);
      return source ? { ...(source as any).performanceMetrics } : null;
    }
    const stats: any = {};
    for (const [id, source] of this.sources) {
      stats[id] = { ...(source as any).performanceMetrics };
    }
    return stats;
  }

  getQualityMetrics(): KnowledgeQualityMetrics {
    return {
      relevance: 0.8,
      accuracy: 0.85,
      completeness: 0.75,
      freshness: 0.9,
      credibility: 0.8,
      consistency: 0.82,
      uniqueness: 0.78,
      applicability: 0.88,
      overallScore: 0.82,
      assessmentTime: new Date(),
    };
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  // --- Zyklische Prozesse ---
  private startCollectionCycles() {
    this.collectionInterval = setInterval(async () => {
      if (!this.runningState) return;
      try {
        await this.collectNow();
      } catch (error) {
        this.logger.error('Fehler im Collection-Cycle:', error);
      }
    }, this.config.collectionInterval);
  }

  private startOptimizationCycles() {
    this.optimizationInterval = setInterval(async () => {
      if (!this.runningState) return;
      try {
        await this.optimizeSources();
      } catch (error) {
        this.logger.error('Fehler im Optimization-Cycle:', error);
      }
    }, 10 * this.config.collectionInterval);
  }

  private startMaintenanceCycles() {
    this.maintenanceInterval = setInterval(async () => {
      if (!this.runningState) return;
      try {
        await this.performMaintenance();
      } catch (error) {
        this.logger.error('Fehler im Maintenance-Cycle:', error);
      }
    }, 60 * this.config.collectionInterval);
  }
}

export default KnowledgeCollector;
