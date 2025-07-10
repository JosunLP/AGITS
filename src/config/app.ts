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

  // Database configurations
  public readonly mongodb: {
    uri: string;
    database: string;
    options: Record<string, any>;
  };

  public readonly neo4j: {
    uri: string;
    username: string;
    password: string;
    database: string;
  };

  public readonly redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  public readonly pinecone: {
    apiKey: string;
    environment: string;
    indexName: string;
  };

  // Message queue configuration
  public readonly kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };

  // Security configuration
  public readonly security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    corsOrigins: string[];
    rateLimitMax: number;
    rateLimitWindowMs: number;
  };

  // Monitoring configuration
  public readonly monitoring: {
    metricsPort: number;
    tracingEnabled: boolean;
    jaegerEndpoint?: string;
    prometheusEnabled: boolean;
  };

  // AI/ML configuration
  public readonly ai: {
    modelRegistry: string;
    inferenceTimeout: number;
    batchSize: number;
    learningRate: number;
  };

  constructor() {
    this.environment =
      (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.host = process.env.HOST || '0.0.0.0';
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.learning = defaultLearningConfig;
    this.cognitive = defaultCognitiveConfig;
    this.database = defaultDatabaseConfig as DatabaseConfig;

    // Database configurations
    this.mongodb = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DATABASE || 'agits_platform',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5', 10),
        maxIdleTimeMS: parseInt(
          process.env.MONGODB_MAX_IDLE_TIME || '30000',
          10
        ),
        serverSelectionTimeoutMS: parseInt(
          process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000',
          10
        ),
      },
    };

    this.neo4j = {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
      database: process.env.NEO4J_DATABASE || 'agits',
    };

    this.redis = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ...(process.env.REDIS_PASSWORD && {
        password: process.env.REDIS_PASSWORD,
      }),
      db: parseInt(process.env.REDIS_DB || '0', 10),
    };

    this.pinecone = {
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
      indexName: process.env.PINECONE_INDEX_NAME || 'agits-embeddings',
    };

    // Message queue configuration
    this.kafka = {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'agits-platform',
      groupId: process.env.KAFKA_GROUP_ID || 'agits-cognitive-services',
    };

    // Security configuration
    this.security = {
      jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(
        ','
      ),
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
      rateLimitWindowMs: parseInt(
        process.env.RATE_LIMIT_WINDOW_MS || '900000',
        10
      ), // 15 minutes
    };

    // Monitoring configuration
    this.monitoring = {
      metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
      tracingEnabled: process.env.TRACING_ENABLED === 'true',
      ...(process.env.JAEGER_ENDPOINT && {
        jaegerEndpoint: process.env.JAEGER_ENDPOINT,
      }),
      prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
    };

    // AI/ML configuration
    this.ai = {
      modelRegistry: process.env.MODEL_REGISTRY_URL || 'http://localhost:5000',
      inferenceTimeout: parseInt(process.env.INFERENCE_TIMEOUT || '30000', 10),
      batchSize: parseInt(process.env.BATCH_SIZE || '32', 10),
      learningRate: parseFloat(process.env.LEARNING_RATE || '0.001'),
    };

    // Learning Configuration - Controls autonomous learning behavior
    this.learning = {
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

    // Cognitive Configuration - Controls cognitive processing
    this.cognitive = {
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
  }

  /**
   * Validate configuration on startup
   */
  public validate(): void {
    const requiredEnvVars = [
      'MONGODB_URI',
      'NEO4J_URI',
      'REDIS_HOST',
      'JWT_SECRET',
    ];

    if (this.environment === Environment.PRODUCTION) {
      requiredEnvVars.push('PINECONE_API_KEY', 'NEO4J_PASSWORD');
    }

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }
  }

  /**
   * Get service-specific configuration
   */
  public getServiceConfig(serviceName: string): ServiceConfig {
    return {
      name: serviceName,
      version: process.env.SERVICE_VERSION || '1.0.0',
      port: this.port,
      environment: this.environment,
      dependencies: [],
      resources: {
        cpu: process.env.CPU_LIMIT || '1000m',
        memory: process.env.MEMORY_LIMIT || '512Mi',
        storage: process.env.STORAGE_LIMIT || '1Gi',
        network: process.env.NETWORK_LIMIT || '100Mbps',
      },
      enabled: true,
      instances: 1,
      healthCheckPath: '/health',
      config: {},
      monitoring: {
        metricsEnabled: this.monitoring.prometheusEnabled,
        tracingEnabled: this.monitoring.tracingEnabled,
        loggingLevel: this.logLevel,
        healthCheckInterval: parseInt(
          process.env.HEALTH_CHECK_INTERVAL || '30000',
          10
        ),
      },
    };
  }
}

// Export singleton instance
export const appConfig = new AppConfig();
