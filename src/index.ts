/**
 * AGITS Platform - Main entry point
 * Advanced General Intelligence Technological System
 *
 * This file initializes and orchestrates all core systems, services, and autonomous processes
 * for the AGI platform. It creates a comprehensive cognitive architecture with:
 * - Persistent memory management with consolidation
 * - Autonomous knowledge collection and learning
 * - Advanced reasoning and decision making
 * - Real-time performance monitoring
 * - Microservices-based cognitive architecture
 */

import { appConfig } from './config/app.js';
import { APIController } from './infrastructure/api-controller.js';
import { DataPersistenceLayer } from './infrastructure/data-persistence-layer.js';
import { HealthMonitor } from './infrastructure/health-monitor.js';
import { MetricsCollector } from './infrastructure/metrics-collector.js';
import { Server } from './infrastructure/server.js';
import { ServiceRegistry } from './infrastructure/service-registry.js';
import { Logger } from './utils/logger.js';

// Core cognitive systems
import { AutonomousKnowledgeCollector } from './core/autonomous-knowledge-collector.js';
import { AutonomousProcessScheduler } from './core/autonomous-scheduler.js';
import { ChemicalSignalingSystem } from './core/chemical-signaling.js';
import { KnowledgeManagementSystem } from './core/knowledge-management.js';
import { MemoryManagementSystem } from './core/memory-management.js';
import { MLQualityAssessmentEngine } from './core/ml-quality-assessment-engine.js';
import { PatternRecognitionEngine } from './core/pattern-recognition-engine.js';
import { PerformanceMonitor } from './core/performance-monitor.js';
import { QualityAssessmentEngine } from './core/quality-assessment-engine.js';
import { ReinforcementLearningAgent } from './core/reinforcement-learning-agent.js';

// Cognitive services
import { AttentionManager } from './services/cognitive/attention-manager.js';
import { LearningOrchestrator } from './services/cognitive/learning-orchestrator.js';
import { ReasoningEngineService } from './services/cognitive/reasoning-engine.js';

// Communication services
import { NaturalLanguageProcessor } from './services/communication/nlp-service.js';

// Data acquisition services
import { ExternalApiService } from './services/data-acquisition/external-api.service.js';
import { WebScrapingService } from './services/data-acquisition/web-scraping.service.js';

// Executive services
import { DecisionEngine } from './services/executive/decision-engine.js';
import { PlanningService } from './services/executive/planning-service.js';

// Sensory services
import { DataIngestionService } from './services/sensory/data-ingestion-service.js';

/**
 * AGITS Platform - Main application class
 */
export class AGITSPlatform {
  private server: Server;
  private serviceRegistry: ServiceRegistry;
  private healthMonitor: HealthMonitor;
  private metricsCollector: MetricsCollector;
  private logger: Logger;

  // Core systems - Initialize with persistence layer
  private memorySystem: MemoryManagementSystem;
  private knowledgeSystem: KnowledgeManagementSystem;
  private autonomousScheduler: AutonomousProcessScheduler;
  private knowledgeCollector: AutonomousKnowledgeCollector;
  private chemicalSignaling: ChemicalSignalingSystem;
  private performanceMonitor: PerformanceMonitor;
  private patternRecognition: PatternRecognitionEngine;
  private mlQualityEngine: MLQualityAssessmentEngine;
  private reinforcementAgent: ReinforcementLearningAgent;
  private dataPersistenceLayer: DataPersistenceLayer;

  // Cognitive services
  private reasoningEngine: ReasoningEngineService;
  private learningOrchestrator: LearningOrchestrator;
  private attentionManager: AttentionManager;

  // Executive services
  private decisionEngine: DecisionEngine;
  private planningService: PlanningService;

  // Communication services
  private nlpService: NaturalLanguageProcessor;

  // API Controller
  private apiController: APIController;

  // Infrastructure
  private webScrapingService: WebScrapingService;
  private externalApiService: ExternalApiService;

  constructor() {
    this.logger = new Logger('AGITSPlatform');
    this.serviceRegistry = new ServiceRegistry();
    this.healthMonitor = new HealthMonitor();
    this.metricsCollector = new MetricsCollector();
    this.server = new Server(appConfig, this.serviceRegistry);

    this.initializeCoreServices();
  }

  /**
   * Initialize core cognitive and infrastructure services
   */
  private initializeCoreServices(): void {
    this.logger.info('Initializing AGITS Platform core services...');

    // Initialize persistence layer
    this.dataPersistenceLayer = new DataPersistenceLayer(appConfig.database);

    // Initialize data acquisition services
    this.webScrapingService = new WebScrapingService();
    this.externalApiService = new ExternalApiService();

    // Initialize core systems
    this.memorySystem = new MemoryManagementSystem(
      appConfig.learning,
      this.dataPersistenceLayer
    );
    this.chemicalSignaling = new ChemicalSignalingSystem();

    // Initialize knowledge management
    this.knowledgeSystem = new KnowledgeManagementSystem(
      this.memorySystem,
      appConfig.learning,
      this.dataPersistenceLayer
    );

    // Initialize autonomous scheduler
    this.autonomousScheduler = new AutonomousProcessScheduler();

    // Initialize cognitive services
    this.reasoningEngine = new ReasoningEngineService(
      this.dataPersistenceLayer
    );
    this.learningOrchestrator = new LearningOrchestrator(this.memorySystem);
    this.attentionManager = new AttentionManager(this.chemicalSignaling);

    // Initialize executive services
    this.decisionEngine = new DecisionEngine(
      this.reasoningEngine,
      this.memorySystem
    );
    this.planningService = new PlanningService(this.decisionEngine);

    // Initialize communication services
    this.nlpService = new NaturalLanguageProcessor();

    // Initialize sensory services (if needed)
    const dataIngestionService = new DataIngestionService();

    // Initialize quality assessment engine and pattern recognition
    this.mlQualityEngine = new MLQualityAssessmentEngine(
      {} as any, // featureExtractor
      {} as any, // modelTrainer
      {} as any, // dataPreprocessor
      {} as any, // modelRegistry
      {} as any, // inferenceEngine
      this.logger
    );
    this.patternRecognition = new PatternRecognitionEngine();

    // Initialize autonomous knowledge collector with proper implementations
    const qualityEngine = new QualityAssessmentEngine();

    this.knowledgeCollector = new AutonomousKnowledgeCollector(
      this.dataPersistenceLayer,
      this.webScrapingService,
      this.externalApiService,
      qualityEngine,
      this.patternRecognition
    );

    // Initialize API controller
    this.apiController = new APIController(
      this.knowledgeSystem,
      this.autonomousScheduler,
      this.memorySystem,
      {
        knowledgeCollector: this.knowledgeCollector,
        chemicalSignaling: this.chemicalSignaling,
        learningOrchestrator: this.learningOrchestrator,
        reasoningEngine: this.reasoningEngine,
        attentionManager: this.attentionManager,
        decisionEngine: this.decisionEngine,
        planningService: this.planningService,
      }
    );

    // Register services
    this.registerServices();

    // Setup services for autonomous scheduler
    this.setupAutonomousScheduler();

    // Setup inter-service communication
    this.setupInterServiceCommunication();
  }

  /**
   * Register all services with the service registry
   */
  private registerServices(): void {
    this.serviceRegistry.registerService(
      'memory-management',
      this.memorySystem
    );
    this.serviceRegistry.registerService(
      'chemical-signaling',
      this.chemicalSignaling
    );
    this.serviceRegistry.registerService(
      'reasoning-engine',
      this.reasoningEngine
    );
    this.serviceRegistry.registerService(
      'learning-orchestrator',
      this.learningOrchestrator
    );
    this.serviceRegistry.registerService(
      'attention-manager',
      this.attentionManager
    );
    this.serviceRegistry.registerService(
      'decision-engine',
      this.decisionEngine
    );
    this.serviceRegistry.registerService(
      'planning-service',
      this.planningService
    );
    this.serviceRegistry.registerService('nlp-service', this.nlpService);
    this.serviceRegistry.registerService(
      'knowledge-management',
      this.knowledgeSystem
    );

    this.logger.info('All services registered successfully');
  }

  /**
   * Setup autonomous scheduler with system services
   */
  private setupAutonomousScheduler(): void {
    this.logger.info('Setting up autonomous scheduler...');

    // Configure scheduler with cognitive services
    this.autonomousScheduler.setServices({
      memorySystem: this.memorySystem,
      learningOrchestrator: this.learningOrchestrator,
      reasoningEngine: this.reasoningEngine,
      attentionManager: this.attentionManager,
      decisionEngine: this.decisionEngine,
      planningService: this.planningService,
    });

    this.logger.info('Autonomous scheduler setup successfully');
  }

  /**
   * Setup communication channels between services
   */
  private setupInterServiceCommunication(): void {
    // Memory system events
    this.memorySystem.on('memoryStored', (memory) => {
      this.learningOrchestrator.onMemoryStored(memory);
    });

    this.memorySystem.on('memoryConsolidated', (memory) => {
      // TODO: Adapt to enhanced ReasoningEngine API
      // this.reasoningEngine.onMemoryConsolidated(memory);
      this.logger.debug(
        'Memory consolidated:',
        memory.consolidatedMemories.length,
        'memories'
      );
    });

    // Chemical signaling events
    this.chemicalSignaling.on('message', (message) => {
      this.attentionManager.onNeurotransmitterMessage(message);
    });

    // Learning events
    this.learningOrchestrator.on('learningCompleted', (result) => {
      this.decisionEngine.onLearningCompleted(result);
    });

    // Decision events
    this.decisionEngine.on('decisionMade', (decision) => {
      this.planningService.onDecisionMade(decision);
    });

    this.logger.info('Inter-service communication channels established');
  }

  /**
   * Start the AGITS Platform
   */
  public async start(): Promise<void> {
    try {
      // Validate configuration
      appConfig.validate();

      // Start health monitoring
      await this.healthMonitor.start();

      // Start metrics collection
      await this.metricsCollector.start();

      // Start the server
      await this.server.start();

      // Register API routes
      this.apiController.registerRoutes(this.server.getInstance());

      this.logger.info(
        `AGITS Platform started successfully on ${appConfig.host}:${appConfig.port}`
      );
      this.logger.info(`Environment: ${appConfig.environment}`);

      // Start cognitive processes
      await this.startCognitiveProcesses();

      // Register shutdown handlers
      this.registerShutdownHandlers();
    } catch (error) {
      this.logger.error('Failed to start AGITS Platform:', error);
      process.exit(1);
    }
  }

  /**
   * Start autonomous cognitive processes
   */
  private async startCognitiveProcesses(): Promise<void> {
    this.logger.info('Starting autonomous cognitive processes...');

    // Start attention monitoring
    this.attentionManager.startMonitoring();

    // Start learning process
    this.learningOrchestrator.startLearning();

    // Start decision loop
    this.decisionEngine.startDecisionLoop();

    // Start autonomous process scheduler
    this.autonomousScheduler.start();

    // Start autonomous knowledge collection
    await this.knowledgeCollector.start();

    this.logger.info('Cognitive processes started successfully');
  }

  /**
   * Stop the AGITS Platform gracefully
   */
  public async stop(): Promise<void> {
    this.logger.info('Shutting down AGITS Platform...');

    try {
      // Stop cognitive processes
      this.attentionManager.stopMonitoring();
      this.learningOrchestrator.stopLearning();
      this.decisionEngine.stopDecisionLoop();

      // Stop infrastructure services
      await this.metricsCollector.stop();
      await this.healthMonitor.stop();
      await this.server.stop();

      this.logger.info('AGITS Platform shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }

  /**
   * Register process shutdown handlers
   */
  private registerShutdownHandlers(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, shutting down gracefully...`);
        await this.stop();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Get service registry for external access
   */
  public getServiceRegistry(): ServiceRegistry {
    return this.serviceRegistry;
  }

  /**
   * Get health status of the platform
   */
  public async getHealthStatus() {
    return await this.healthMonitor.getSystemHealth();
  }

  /**
   * Get platform metrics
   */
  public getMetrics() {
    return this.metricsCollector.getMetrics();
  }
}

/**
 * Main entry point
 */
async function main() {
  const logger = new Logger('Main');

  try {
    logger.info('🧠 Starting AGITS Platform...');

    const platform = new AGITSPlatform();
    await platform.start();

    logger.info('✅ AGITS Platform started successfully');
    logger.info('📡 API Server running on port 3000');
    logger.info('🤖 Autonomous processes activated');
    logger.info('💾 Persistence layer connected');
    logger.info('🔍 Knowledge collection in progress...');
  } catch (error) {
    logger.error('❌ Failed to start AGITS Platform:', error);
    process.exit(1);
  }
}

// Start the platform only if this file is run directly
// Check if this file is the main entry point
const isMainModule =
  (process.argv[1] && process.argv[1].endsWith('index.ts')) ||
  (process.argv[1] && process.argv[1].endsWith('index.js'));

if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default AGITSPlatform;
