import { config } from 'dotenv';
import { Environment, LogLevel, ServiceConfig } from '../types/index.js';
import { DatabaseConfig, defaultDatabaseConfig } from './database.js';

// Load environment variables
config();

/**
 * Learning Configuration - Controls autonomous learning behavior
 */
export interface LearningConfig {
  // Autonomous process intervals (milliseconds)
  memoryConsolidationInterval: number;
  synapticPruningInterval: number;
  synapticDecayInterval: number;
  learningCycleInterval: number;
  knowledgeExtractionInterval: number;
  patternDiscoveryInterval: number;
  goalEvaluationInterval: number;
  performanceAnalysisInterval: number;

  // Learning parameters
  learningRate: number;
  explorationRate: number;
  batchSize: number;
  maxQueueSize: number;

  // Memory thresholds
  hebbianLearningRate: number;
  decayRate: number;
  pruningThreshold: number;
  consolidationThreshold: number;

  // Knowledge collection
  maxConcurrentCollectionTasks: number;
  collectionHistoryLimit: number;
  errorThreshold: number;
  confidenceThreshold: number;
}

/**
 * Cognitive Configuration - Controls cognitive processing
 */
export interface CognitiveConfig {
  // Attention management
  attentionUpdateInterval: number;
  maxAttentionTargets: number;
  attentionDecayRate: number;

  // Decision making
  decisionLoopInterval: number;
  maxDecisionTimeMs: number;
  confidenceThreshold: number;

  // Reasoning
  maxReasoningDepth: number;
  chainOfThoughtEnabled: boolean;
  analogicalReasoningEnabled: boolean;

  // Language processing
  maxResponseLength: number;
  contextWindowSize: number;
  sentimentAnalysisEnabled: boolean;
}

export const defaultLearningConfig: LearningConfig = {
  // Autonomous process intervals (milliseconds)
  memoryConsolidationInterval: 10000, // 10 seconds
  synapticPruningInterval: 30000, // 30 seconds
  synapticDecayInterval: 5000, // 5 seconds
  learningCycleInterval: 15000, // 15 seconds
  knowledgeExtractionInterval: 60000, // 60 seconds
  patternDiscoveryInterval: 45000, // 45 seconds
  goalEvaluationInterval: 20000, // 20 seconds
  performanceAnalysisInterval: 300000, // 5 minutes

  // Learning parameters
  learningRate: 0.01,
  explorationRate: 0.1,
  batchSize: 10,
  maxQueueSize: 1000,

  // Memory thresholds
  hebbianLearningRate: 0.01,
  decayRate: 0.001,
  pruningThreshold: 0.1,
  consolidationThreshold: 5,

  // Knowledge collection
  maxConcurrentCollectionTasks: 3,
  collectionHistoryLimit: 1000,
  errorThreshold: 0.2,
  confidenceThreshold: 0.5,
};

export const defaultCognitiveConfig: CognitiveConfig = {
  // Attention management
  attentionUpdateInterval: 100, // 100ms
  maxAttentionTargets: 5,
  attentionDecayRate: 0.01,

  // Decision making
  decisionLoopInterval: 1000, // 1 second
  maxDecisionTimeMs: 5000, // 5 seconds
  confidenceThreshold: 0.7,

  // Reasoning
  maxReasoningDepth: 10,
  chainOfThoughtEnabled: true,
  analogicalReasoningEnabled: true,

  // Language processing
  maxResponseLength: 4000,
  contextWindowSize: 8000,
  sentimentAnalysisEnabled: true,
};

/**
 * Application configuration with environment-specific settings
 */
export class AppConfig {
  public readonly environment: Environment;
  public readonly port: number;
  public readonly host: string;
  public readonly logLevel: LogLevel;
  public readonly learning: LearningConfig;
  public readonly cognitive: CognitiveConfig;
  public readonly database: DatabaseConfig;

  // Service-specific configurations
  public readonly services: Record<string, ServiceConfig> = {};

  constructor() {
    this.environment =
      (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.host = process.env.HOST || '0.0.0.0';
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.learning = defaultLearningConfig;
    this.cognitive = defaultCognitiveConfig;
    this.database = defaultDatabaseConfig as DatabaseConfig;

    this.loadServiceConfigs();
  }

  private loadServiceConfigs(): void {
    // Load service-specific configurations
    this.services['memory'] = {
      name: 'memory',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.MEMORY_SERVICE_PORT || '3001', 10),
      instances: parseInt(process.env.MEMORY_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['consolidation', 'decay', 'pruning'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        consolidationInterval: this.learning.memoryConsolidationInterval,
        decayInterval: this.learning.synapticDecayInterval,
        pruningInterval: this.learning.synapticPruningInterval,
      },
    };

    this.services['knowledge'] = {
      name: 'knowledge',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.KNOWLEDGE_SERVICE_PORT || '3002', 10),
      instances: parseInt(process.env.KNOWLEDGE_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['extraction', 'inference'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        extractionInterval: this.learning.knowledgeExtractionInterval,
        confidenceThreshold: this.learning.confidenceThreshold,
      },
    };

    this.services['learning'] = {
      name: 'learning',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.LEARNING_SERVICE_PORT || '3003', 10),
      instances: parseInt(process.env.LEARNING_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['adaptive', 'reinforcement'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        learningRate: this.learning.learningRate,
        batchSize: this.learning.batchSize,
        cycleInterval: this.learning.learningCycleInterval,
      },
    };

    this.services['reasoning'] = {
      name: 'reasoning',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.REASONING_SERVICE_PORT || '3004', 10),
      instances: parseInt(process.env.REASONING_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['deductive', 'inductive', 'analogical'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        maxDepth: this.cognitive.maxReasoningDepth,
        chainOfThought: this.cognitive.chainOfThoughtEnabled,
        analogical: this.cognitive.analogicalReasoningEnabled,
      },
    };

    this.services['attention'] = {
      name: 'attention',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.ATTENTION_SERVICE_PORT || '3005', 10),
      instances: parseInt(process.env.ATTENTION_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['focus', 'switching'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        updateInterval: this.cognitive.attentionUpdateInterval,
        maxTargets: this.cognitive.maxAttentionTargets,
        decayRate: this.cognitive.attentionDecayRate,
      },
    };

    this.services['decision'] = {
      name: 'decision',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.DECISION_SERVICE_PORT || '3006', 10),
      instances: parseInt(process.env.DECISION_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['optimization', 'multi-criteria'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        loopInterval: this.cognitive.decisionLoopInterval,
        maxDecisionTime: this.cognitive.maxDecisionTimeMs,
        confidenceThreshold: this.cognitive.confidenceThreshold,
      },
    };

    this.services['nlp'] = {
      name: 'nlp',
      version: '1.0.0',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      port: parseInt(process.env.NLP_SERVICE_PORT || '3007', 10),
      instances: parseInt(process.env.NLP_SERVICE_INSTANCES || '1', 10),
      healthCheckPath: '/health',
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthCheck: true,
      dependencies: [],
      features: ['tokenization', 'sentiment', 'entities'],
      resources: {
        maxMemory: 512,
        maxCpu: 50,
        maxConnections: 100,
      },
      config: {
        maxResponseLength: this.cognitive.maxResponseLength,
        contextWindowSize: this.cognitive.contextWindowSize,
        sentimentAnalysis: this.cognitive.sentimentAnalysisEnabled,
      },
    };
  }

  /**
   * Get configuration for a specific service
   */
  public getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.services[serviceName];
  }

  /**
   * Check if a service is enabled
   */
  public isServiceEnabled(serviceName: string): boolean {
    return this.services[serviceName]?.enabled || false;
  }

  /**
   * Get all enabled services
   */
  public getEnabledServices(): string[] {
    return Object.keys(this.services).filter((name) =>
      this.isServiceEnabled(name)
    );
  }

  /**
   * Update service configuration
   */
  public updateServiceConfig(
    serviceName: string,
    config: Partial<ServiceConfig>
  ): void {
    if (this.services[serviceName]) {
      this.services[serviceName] = {
        ...this.services[serviceName],
        ...config,
      };
    }
  }

  /**
   * Validate configuration
   */
  public validate(): string[] {
    const errors: string[] = [];

    if (this.port < 1 || this.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    if (!this.host) {
      errors.push('Host is required');
    }

    if (this.learning.learningRate <= 0 || this.learning.learningRate > 1) {
      errors.push('Learning rate must be between 0 and 1');
    }

    if (
      this.learning.explorationRate < 0 ||
      this.learning.explorationRate > 1
    ) {
      errors.push('Exploration rate must be between 0 and 1');
    }

    if (this.learning.batchSize <= 0) {
      errors.push('Batch size must be positive');
    }

    return errors;
  }
}

// Export default instance
export const appConfig = new AppConfig();
