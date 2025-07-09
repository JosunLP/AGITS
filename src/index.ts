/**
 * AGITS Platform - Main entry point
 * Advanced General Intelligence Technological System
 */

import { appConfig } from './config/app.js';
import { HealthMonitor } from './infrastructure/health-monitor.js';
import { MetricsCollector } from './infrastructure/metrics-collector.js';
import { Server } from './infrastructure/server.js';
import { ServiceRegistry } from './infrastructure/service-registry.js';
import { Logger } from './utils/logger.js';

// Core cognitive services
import { ChemicalSignalingSystem } from './core/chemical-signaling.js';
import { MemoryManagementSystem } from './core/memory-management.js';
import { AttentionManager } from './services/cognitive/attention-manager.js';
import { LearningOrchestrator } from './services/cognitive/learning-orchestrator.js';
import { ReasoningEngineService } from './services/cognitive/reasoning-engine.js';
import { NaturalLanguageProcessor } from './services/communication/nlp-service.js';
import { DecisionEngine } from './services/executive/decision-engine.js';
import { PlanningService } from './services/executive/planning-service.js';

/**
 * AGITS Platform - Main application class
 */
export class AGITSPlatform {
  private server: Server;
  private serviceRegistry: ServiceRegistry;
  private healthMonitor: HealthMonitor;
  private metricsCollector: MetricsCollector;
  private logger: Logger;

  // Core systems
  private memorySystem: MemoryManagementSystem;
  private chemicalSignaling: ChemicalSignalingSystem;

  // Cognitive services
  private reasoningEngine: ReasoningEngineService;
  private learningOrchestrator: LearningOrchestrator;
  private attentionManager: AttentionManager;

  // Executive services
  private decisionEngine: DecisionEngine;
  private planningService: PlanningService;

  // Communication services
  private nlpService: NaturalLanguageProcessor;

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

    // Initialize core systems
    this.memorySystem = new MemoryManagementSystem();
    this.chemicalSignaling = new ChemicalSignalingSystem();

    // Initialize cognitive services
    this.reasoningEngine = new ReasoningEngineService();
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

    // Register services
    this.registerServices();

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

    this.logger.info('All services registered successfully');
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
      this.reasoningEngine.onMemoryConsolidated(memory);
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
  const platform = new AGITSPlatform();
  await platform.start();
}

// Start the platform if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start AGITS Platform:', error);
    process.exit(1);
  });
}

export default AGITSPlatform;
