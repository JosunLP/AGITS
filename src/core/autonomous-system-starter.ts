/**
 * Autonomous System Starter - Vereinfachte Integration
 * Startet das AGITS System mit allen autonomen Komponenten
 */

import { EventEmitter } from 'events';
import { DataPersistenceLayer } from '../infrastructure/data-persistence-layer.js';
import { Logger } from '../utils/logger.js';

// Bestehende Core Components
import { AutonomousKnowledgeCollector } from './autonomous-knowledge-collector.js';
import { AutonomousProcessScheduler } from './autonomous-scheduler.js';
import { MemoryManagementSystem } from './memory-management.js';
import { MLQualityAssessmentEngine } from './ml-quality-assessment-engine.js';
import { PatternRecognitionEngine } from './pattern-recognition-engine.js';
import { PerformanceMonitor } from './performance-monitor.js';
import { ReinforcementLearningAgent } from './reinforcement-learning-agent.js';

// Services
import { ExternalApiService } from '../services/data-acquisition/external-api.service.js';
import { WebScrapingService } from '../services/data-acquisition/web-scraping.service.js';

/**
 * Autonomes System - Vereinfachte Version
 * Orchestriert alle autonomen Komponenten für intelligenten Betrieb
 */
export class AutonomousSystemStarter extends EventEmitter {
  private readonly logger: Logger;
  private readonly dataPersistence: DataPersistenceLayer;

  // Core Components
  private memorySystem: MemoryManagementSystem;
  private scheduler: AutonomousProcessScheduler;
  private knowledgeCollector: AutonomousKnowledgeCollector;
  private qualityEngine: MLQualityAssessmentEngine;
  private patternEngine: PatternRecognitionEngine;
  private learningAgent: ReinforcementLearningAgent;
  private performanceMonitor: PerformanceMonitor;

  // Services
  private webScraper: WebScrapingService;
  private apiService: ExternalApiService;

  // System state
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private startTime: Date | null = null;

  constructor(dataPersistence: DataPersistenceLayer) {
    super();

    this.logger = new Logger('AutonomousSystemStarter');
    this.dataPersistence = dataPersistence;

    this.logger.info('Initializing Autonomous System Components...');

    // Initialize services first
    this.webScraper = new WebScrapingService();
    this.apiService = new ExternalApiService();

    // Initialize core components - compatible with LearningConfig
    const memoryConfig = {
      // Required intervals
      memoryConsolidationInterval: 300000,
      synapticPruningInterval: 600000,
      synapticDecayInterval: 900000,
      learningCycleInterval: 180000,
      knowledgeExtractionInterval: 240000,
      patternDiscoveryInterval: 360000,
      goalEvaluationInterval: 420000,
      performanceAnalysisInterval: 300000,

      // Learning parameters
      learningRate: 0.01,
      explorationRate: 0.1,
      batchSize: 32,
      maxQueueSize: 1000,

      // Memory thresholds
      hebbianLearningRate: 0.1,
      decayRate: 0.01,
      pruningThreshold: 0.3,
      consolidationThreshold: 0.7,

      // Knowledge collection
      maxConcurrentCollectionTasks: 3,
      collectionHistoryLimit: 1000,
      errorThreshold: 0.2,
      confidenceThreshold: 0.6,
    };

    this.memorySystem = new MemoryManagementSystem(
      memoryConfig,
      dataPersistence
    );
    this.scheduler = new AutonomousProcessScheduler();
    this.performanceMonitor = new PerformanceMonitor();

    // Initialize ML components with simplified constructors
    this.qualityEngine = new MLQualityAssessmentEngine();
    this.patternEngine = new PatternRecognitionEngine();
    this.learningAgent = new ReinforcementLearningAgent(
      {} as any, // State analyzer
      {} as any, // Action selector
      {} as any, // Reward calculator
      {} as any, // Q-learning algorithm
      {} as any, // Experience replay buffer
      this.logger
    );

    // Initialize knowledge collector with services
    this.knowledgeCollector = new AutonomousKnowledgeCollector(
      dataPersistence,
      this.webScraper,
      this.apiService,
      this.logger
    );

    this.logger.info('Autonomous System components initialized');
  }

  /**
   * Initialize the autonomous system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('System is already initialized');
      return;
    }

    this.logger.info('Initializing Autonomous System...');

    try {
      // Initialize data persistence
      await this.dataPersistence.initialize();

      // Initialize memory system
      await this.memorySystem.initialize();

      // Setup component communication
      this.setupComponentCommunication();

      this.isInitialized = true;
      this.logger.info('Autonomous System initialization completed');

      this.emit('systemInitialized', {
        timestamp: new Date(),
        components: this.getComponentNames(),
      });
    } catch (error) {
      this.logger.error('Failed to initialize Autonomous System:', error);
      throw error;
    }
  }

  /**
   * Start the autonomous system
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRunning) {
      this.logger.warn('System is already running');
      return;
    }

    this.logger.info('Starting Autonomous System...');
    this.startTime = new Date();

    try {
      // Start core components
      await this.scheduler.start();
      await this.knowledgeCollector.start();
      await this.performanceMonitor.startMonitoring();

      // Add autonomous tasks
      this.addAutonomousTasks();

      this.isRunning = true;

      this.logger.info('Autonomous System started successfully');

      this.emit('systemStarted', {
        timestamp: new Date(),
        startTime: this.startTime,
        components: this.getRunningComponents(),
      });
    } catch (error) {
      this.isRunning = false;
      this.logger.error('Failed to start Autonomous System:', error);
      throw error;
    }
  }

  /**
   * Stop the autonomous system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('System is not running');
      return;
    }

    this.logger.info('Stopping Autonomous System...');

    try {
      await this.performanceMonitor.stopMonitoring();
      await this.knowledgeCollector.stop();
      await this.scheduler.stop();

      this.isRunning = false;

      this.logger.info('Autonomous System stopped successfully');

      this.emit('systemStopped', {
        timestamp: new Date(),
        uptime: this.getUptime(),
      });
    } catch (error) {
      this.logger.error('Error stopping Autonomous System:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    running: boolean;
    uptime: number;
    components: string[];
    startTime: Date | null;
  } {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      uptime: this.getUptime(),
      components: this.getComponentNames(),
      startTime: this.startTime,
    };
  }

  /**
   * Get uptime in milliseconds
   */
  private getUptime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0;
  }

  /**
   * Get component names
   */
  private getComponentNames(): string[] {
    return [
      'memorySystem',
      'scheduler',
      'knowledgeCollector',
      'qualityEngine',
      'patternEngine',
      'learningAgent',
      'performanceMonitor',
      'webScraper',
      'apiService',
    ];
  }

  /**
   * Get running components
   */
  private getRunningComponents(): string[] {
    const running: string[] = [];

    if (this.isRunning) {
      running.push('scheduler', 'knowledgeCollector', 'performanceMonitor');
    }

    return running;
  }

  /**
   * Setup communication between components
   */
  private setupComponentCommunication(): void {
    this.logger.info('Setting up component communication...');

    // Memory system events
    this.memorySystem.on('memoryConsolidated', (event) => {
      this.logger.info('Memory consolidated:', event.consolidatedNodes);
      this.emit('memoryConsolidated', event);
    });

    // Knowledge collector events
    this.knowledgeCollector.on('dataCollected', (event) => {
      this.logger.info('Data collected:', event.sourceType);
      this.emit('dataCollected', event);

      // Trigger memory storage
      this.memorySystem.storeMemory({
        id: `knowledge_${Date.now()}`,
        content: event.data,
        type: 'knowledge',
        source: event.sourceType,
        timestamp: new Date(),
        metadata: {
          collector: 'autonomous',
          quality: event.quality || 0.5,
        },
      });
    });

    // Performance monitor events
    this.performanceMonitor.on('thresholdExceeded', (metric, value) => {
      this.logger.warn(`Performance threshold exceeded: ${metric} = ${value}`);
      this.emit('performanceAlert', { metric, value });
    });

    this.logger.info('Component communication setup completed');
  }

  /**
   * Add autonomous tasks to scheduler
   */
  private addAutonomousTasks(): void {
    this.logger.info('Adding autonomous tasks...');

    // Knowledge collection task
    this.scheduler.addTask({
      name: 'Continuous Knowledge Collection',
      description: 'Continuously collect knowledge from sources',
      intervalMs: 300000, // 5 minutes
      callback: async () => {
        try {
          await this.knowledgeCollector.collectFromAllSources();
          this.logger.info('Autonomous knowledge collection completed');
        } catch (error) {
          this.logger.error('Autonomous knowledge collection failed:', error);
        }
      },
    });

    // Memory consolidation task
    this.scheduler.addTask({
      name: 'Memory Consolidation',
      description: 'Consolidate and optimize memory storage',
      intervalMs: 600000, // 10 minutes
      callback: async () => {
        try {
          await this.memorySystem.consolidateMemories();
          this.logger.info('Memory consolidation completed');
        } catch (error) {
          this.logger.error('Memory consolidation failed:', error);
        }
      },
    });

    // Performance monitoring task
    this.scheduler.addTask({
      name: 'Performance Analysis',
      description: 'Analyze system performance and optimize',
      intervalMs: 180000, // 3 minutes
      callback: async () => {
        try {
          const metrics = await this.performanceMonitor.collectMetrics();
          this.logger.info('Performance metrics collected:', {
            cpuUsage: metrics.cpuUsage,
            memoryUsage: metrics.memoryUsage,
          });
        } catch (error) {
          this.logger.error('Performance analysis failed:', error);
        }
      },
    });

    this.logger.info('Autonomous tasks added to scheduler');
  }

  /**
   * Get access to core components for external use
   */
  getComponents() {
    return {
      memorySystem: this.memorySystem,
      scheduler: this.scheduler,
      knowledgeCollector: this.knowledgeCollector,
      qualityEngine: this.qualityEngine,
      patternEngine: this.patternEngine,
      learningAgent: this.learningAgent,
      performanceMonitor: this.performanceMonitor,
      webScraper: this.webScraper,
      apiService: this.apiService,
    };
  }
}

export default AutonomousSystemStarter;
