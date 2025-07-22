/**
 * Autonomous System Core Types
 * Unified types for autonomous learning, knowledge collection, and scheduling
 */

import { CollectionStrategy } from './knowledge.type.js';

/**
 * Autonomous Task Types - defining the categories of background processes
 */
export enum AutonomousTaskType {
  // Memory & Cognitive Processes
  MEMORY_CONSOLIDATION = 'memory_consolidation',
  MEMORY_OPTIMIZATION = 'memory_optimization',
  SYNAPTIC_PRUNING = 'synaptic_pruning',
  SYNAPTIC_DECAY = 'synaptic_decay',

  // Learning & Knowledge
  LEARNING_CYCLE = 'learning_cycle',
  KNOWLEDGE_EXTRACTION = 'knowledge_extraction',
  KNOWLEDGE_COLLECTION = 'knowledge_collection',
  KNOWLEDGE_VALIDATION = 'knowledge_validation',

  // Pattern Recognition & Analysis
  PATTERN_DISCOVERY = 'pattern_discovery',
  PATTERN_ANALYSIS = 'pattern_analysis',

  // Decision Making & Planning
  GOAL_EVALUATION = 'goal_evaluation',
  DECISION_OPTIMIZATION = 'decision_optimization',

  // System Management
  ATTENTION_REBALANCING = 'attention_rebalancing',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  SYSTEM_OPTIMIZATION = 'system_optimization',
  HEALTH_CHECK = 'health_check',

  // Data Processing
  DATA_CLEANING = 'data_cleaning',
  DATA_INTEGRATION = 'data_integration',
}

/**
 * Task Priority Levels
 */
export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Knowledge Collection Priority
 */
export enum KnowledgeCollectionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Learning Strategies for different types of learning
 */
export enum LearningStrategy {
  SUPERVISED = 'supervised',
  UNSUPERVISED = 'unsupervised',
  REINFORCEMENT = 'reinforcement',
  TRANSFER = 'transfer',
  META = 'meta',
  ACTIVE = 'active',
  CONTINUAL = 'continual',
}

/**
 * Quality Assessment Levels
 */
export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXCELLENT = 'excellent',
}

/**
 * Confidence Levels for assessments
 */
export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

/**
 * Data Source Types for knowledge collection
 */
export enum DataSourceType {
  WEB_SCRAPING = 'web_scraping',
  API = 'api',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  MEMORY_SYSTEM = 'memory_system',
  SENSOR_DATA = 'sensor_data',
  USER_INPUT = 'user_input',
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
  RETRYING = 'retrying',
}

/**
 * System Performance Metrics
 */
export interface SystemPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  taskCompletionRate: number;
  learningEfficiency: number;
  knowledgeQuality: number;
  timestamp: Date;
}

/**
 * Enhanced Learning Progress Tracking
 */
export interface LearningProgress {
  id: string;
  strategy: LearningStrategy;
  startTime: Date;
  endTime: Date;
  totalLearningCycles: number;
  successfulLearning: number;
  failedLearning: number;
  averageLearningTime: number;
  learningEfficiency: number;
  knowledgeRetention: number;
  adaptabilityScore: number;
  performanceImprovement: number;
  lastLearningSession: Date;
  learningStreak: number;
  // Enhanced fields
  knowledgeGained: number;
  patternsDiscovered: number;
  connectionsStrengthened: number;
  qualityImprovement: number;
  efficiency: number;
  insights: string[];
  metrics: LearningMetrics;
}

/**
 * Knowledge Quality Assessment
 */
export interface KnowledgeQualityMetrics {
  relevance: number;
  accuracy: number;
  completeness: number;
  freshness: number;
  credibility: number;
  consistency: number;
  uniqueness: number;
  applicability: number;
  overallScore: number;
  assessmentTime: Date;
}

/**
 * Autonomous Task Definition
 */
export interface AutonomousTask {
  id: string;
  type: AutonomousTaskType;
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;

  // Scheduling
  intervalMs: number;
  nextExecution: Date;
  lastExecution?: Date;
  maxExecutionTime: number;

  // Configuration
  enabled: boolean;
  retryCount: number;
  maxRetries: number;

  // Metadata
  metadata: Record<string, any>;
  dependencies: string[];
  prerequisites: string[];

  // Tracking
  executionHistory: TaskExecutionResult[];
  totalExecutions: number;
  successfulExecutions: number;
  averageExecutionTime: number;

  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

/**
 * Task Execution Result
 */
export interface TaskExecutionResult {
  taskId: string;
  taskType: AutonomousTaskType;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  result?: any;
  error?: string;
  metrics: Record<string, number>;
  memoryUsage: number;
  cpuUsage: number;
  performanceImpact: number;
}

/**
 * Scheduler Performance Statistics
 */
export interface SchedulerStats {
  totalTasks: number;
  activeTasks: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  systemLoad: number;
  uptime: number;
  tasksPerHour: number;
  successRate: number;
  tasksByType: Record<AutonomousTaskType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<TaskStatus, number>;
  recentPerformance: SystemPerformanceMetrics[];
}

/**
 * Knowledge Collection Configuration
 */
export interface KnowledgeCollectionConfig {
  enabled: boolean;
  collectionInterval: number;
  maxConcurrentTasks: number;
  qualityThreshold: number;
  sources: KnowledgeSourceConfig[];
  filters: KnowledgeFilter[];
  processors: KnowledgeProcessor[];
  storage: KnowledgeStorageConfig;
}

/**
 * Knowledge Source Configuration
 */
export interface KnowledgeSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  url?: string;
  credentials?: Record<string, any>;
  priority: KnowledgeCollectionPriority;
  enabled: boolean;
  rateLimit: number;
  timeout: number;
  retryStrategy: RetryStrategy;
  qualityFilters: QualityFilter[];
  metadata: Record<string, any>;
}

/**
 * Quality Filter Configuration
 */
export interface QualityFilter {
  type: 'relevance' | 'credibility' | 'freshness' | 'completeness';
  threshold: number;
  weight: number;
  enabled: boolean;
}

/**
 * Retry Strategy Configuration
 */
export interface RetryStrategy {
  maxRetries: number;
  backoffType: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

/**
 * Knowledge Filter
 */
export interface KnowledgeFilter {
  id: string;
  name: string;
  type: 'content' | 'metadata' | 'quality' | 'domain';
  criteria: FilterCriteria;
  action: 'include' | 'exclude' | 'flag';
  enabled: boolean;
}

/**
 * Filter Criteria
 */
export interface FilterCriteria {
  keywords?: string[];
  domains?: string[];
  languages?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  qualityRange?: {
    min: number;
    max: number;
  };
  contentLength?: {
    min: number;
    max: number;
  };
  customRules?: string[];
}

/**
 * Knowledge Processor
 */
export interface KnowledgeProcessor {
  id: string;
  name: string;
  type: 'extraction' | 'transformation' | 'validation' | 'enrichment';
  config: ProcessorConfig;
  enabled: boolean;
  order: number;
}

/**
 * Processor Configuration
 */
export interface ProcessorConfig {
  extractors?: string[];
  transformers?: string[];
  validators?: string[];
  enrichers?: string[];
  nlpPipeline?: string[];
  customProcessors?: string[];
  settings: Record<string, any>;
}

/**
 * Knowledge Storage Configuration
 */
export interface KnowledgeStorageConfig {
  primaryStore: 'mongodb' | 'neo4j' | 'elasticsearch';
  backupStores: string[];
  indexing: IndexingConfig;
  compression: boolean;
  encryption: boolean;
  retention: RetentionPolicy;
}

/**
 * Indexing Configuration
 */
export interface IndexingConfig {
  fullText: boolean;
  semantic: boolean;
  metadata: boolean;
  customIndexes: string[];
  updateFrequency: number;
}

/**
 * Retention Policy
 */
export interface RetentionPolicy {
  maxAge: number; // in days
  maxSize: number; // in MB
  archiveOldData: boolean;
  compressionThreshold: number;
  deletionCriteria: DeletionCriteria;
}

/**
 * Deletion Criteria
 */
export interface DeletionCriteria {
  lowQualityThreshold: number;
  inactivityPeriod: number; // in days
  redundancyCheck: boolean;
  manualReview: boolean;
}

/**
 * Autonomous Learning Configuration
 */
export interface AutonomousLearningConfig {
  enabled: boolean;
  learningStrategies: LearningStrategy[];
  adaptiveLearning: boolean;
  metaLearning: boolean;
  continuousLearning: boolean;
  learningRate: number;
  batchSize: number;
  evaluationFrequency: number;
  performanceThresholds: PerformanceThresholds;
  optimization: OptimizationConfig;
}

/**
 * Performance Thresholds
 */
export interface PerformanceThresholds {
  accuracy: number;
  efficiency: number;
  latency: number;
  memoryUsage: number;
  convergence: number;
  stability: number;
}

/**
 * Optimization Configuration
 */
export interface OptimizationConfig {
  algorithmSelection: boolean;
  hyperparameterTuning: boolean;
  architectureSearch: boolean;
  resourceOptimization: boolean;
  autoMLEnabled: boolean;
  optimizationFrequency: number;
}

/**
 * System Services Registry
 */
export interface SystemServices {
  memorySystem?: any;
  knowledgeSystem?: any;
  learningOrchestrator?: any;
  reasoningEngine?: any;
  decisionEngine?: any;
  attentionManager?: any;
  patternRecognizer?: any;
  planningService?: any;
  performanceMonitor?: any;
  scheduler?: any;
  [serviceName: string]: any;
}

/**
 * Event Types for the autonomous system
 */
export interface AutonomousSystemEvents {
  taskScheduled: (task: AutonomousTask) => void;
  taskStarted: (taskId: string) => void;
  taskCompleted: (result: TaskExecutionResult) => void;
  taskFailed: (taskId: string, error: string) => void;
  systemOptimized: (metrics: SystemPerformanceMetrics) => void;
  knowledgeCollected: (knowledgeId: string, quality: number) => void;
  learningCycleCompleted: (progress: LearningProgress) => void;
  performanceThresholdReached: (metric: string, value: number) => void;
  systemHealthChanged: (status: 'healthy' | 'degraded' | 'critical') => void;
}

/**
 * Quality Assessment
 */
export interface QualityAssessment {
  score: number;
  level: QualityLevel;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  factors: {
    relevance: number;
    reliability: number;
    freshness: number;
    completeness: number;
    credibility?: number;
    accuracy?: number;
    consistency?: number;
    uniqueness?: number;
  };
  metadata?: {
    assessmentTime?: Date;
    assessmentModel?: string;
    sourceCredibility?: number;
    contentComplexity?: number;
    languageConfidence?: number;
  };
  recommendations?: string[];
  flags?: string[];
}

/**
 * Knowledge Collection Task
 */
export interface KnowledgeCollectionTask {
  id: string;
  source: string;
  priority: KnowledgeCollectionPriority;
  strategy?: CollectionStrategy;
  parameters?: Record<string, any>;
  scheduledTime?: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  metadata?: Record<string, any>;
  qualityConstraints?: {
    minScore?: number;
    maxAge?: number;
    requiredCredibility?: number;
  };
  context?: {
    trigger?: 'scheduled' | 'manual' | 'adaptive' | 'emergency';
    previousResults?: any[];
    systemLoad?: number;
    availableResources?: number;
  };
}

/**
 * Collection Stats
 */
export interface CollectionStats {
  totalCollections: number;
  successfulCollections: number;
  failedCollections: number;
  averageCollectionTime: number;
  averageQuality?: number;
  lastCollectionTime: Date | null;
  collectionsToday: number;
  dailyTrend?: number[];
  weeklyTrend?: number[];
  sourceStats: Map<
    string,
    {
      count: number;
      successRate: number;
      avgQuality: number;
      avgLatency?: number;
      credibilityScore?: number;
      lastAccess?: Date;
      errorRate?: number;
    }
  >;
  qualityDistribution: Record<QualityLevel, number>;
  performance?: {
    throughput?: number;
    efficiency?: number;
    resourceUtilization?: number;
    cacheHitRate?: number;
    networkLatency?: number;
  };
  contentAnalytics?: {
    topTopics?: Array<{ topic: string; count: number; avgQuality: number }>;
    languageDistribution?: Record<string, number>;
    domainDistribution?: Record<string, number>;
    contentTypes?: Record<string, number>;
  };
}

/**
 * Source Config
 */
export interface SourceConfig {
  name: string;
  type: 'web' | 'api' | 'database' | 'file';
  url?: string;
  credentials?: Record<string, string>;
  rateLimit?: { requests: number; window: number };
  priority: KnowledgeCollectionPriority;
  enabled: boolean;
  metadata: Record<string, any>;
  adaptiveSettings?: {
    enabled: boolean;
    learningRate: number;
    performanceWindow: number;
    qualityFeedback: boolean;
    dynamicRateLimit: boolean;
    contextualPriority: boolean;
  };
  monitoring?: {
    healthCheck: boolean;
    responseTimeTracking: boolean;
    contentChangeDetection: boolean;
    errorPatternAnalysis: boolean;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    invalidationStrategy: 'time' | 'content' | 'manual';
    compression: boolean;
  };
  preprocessing?: {
    enabled: boolean;
    filters: string[];
    transformations: string[];
    validation: string[];
  };
}

/**
 * Quality feedback for learning from user interactions
 */
export interface QualityFeedback {
  knowledgeId: string;
  rating: number; // 1-5 scale
  feedback: 'positive' | 'negative' | 'neutral';
  reason?: string;
  userId?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Collection performance metrics
 */
export interface CollectionPerformanceMetrics {
  totalCollections: number;
  successfulCollections: number;
  failedCollections: number;
  averageCollectionTime: number;
  sourcesOptimized: number;
  qualityImprovement: number;
  efficiencyScore: number;
  learningAccuracy: number;
  lastOptimization: Date;
  trendingMetrics: {
    dailyCollections: number[];
    qualityTrend: number[];
    performanceTrend: number[];
  };
}

/**
 * Enhanced learning strategy with ML integration
 */
export enum EnhancedLearningStrategy {
  SUPERVISED_LEARNING = 'supervised_learning',
  UNSUPERVISED_LEARNING = 'unsupervised_learning',
  REINFORCEMENT_LEARNING = 'reinforcement_learning',
  TRANSFER_LEARNING = 'transfer_learning',
  FEDERATED_LEARNING = 'federated_learning',
  ONLINE_LEARNING = 'online_learning',
  CONTINUAL_LEARNING = 'continual_learning',
  META_LEARNING = 'meta_learning',
}

/**
 * Comprehensive learning metrics for ML performance tracking
 */
export interface LearningMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  learningRate: number;
  convergenceRate: number;
  trainingTime: number;
  evaluationTime: number;
  memoryUsage: number;
  cpuUsage: number;
  epochs: number;
  loss: number;
  validationLoss: number;
  totalSamples: number;
  correctPredictions: number;
  adaptationRate: number;
  explorationRate: number;
  exploitationBalance: number;
  averageReward: number;
  cumulativeReward: number;
  episodeLength: number;
  successRate: number;
  retentionRate: number;
}

/**
 * Advanced learning configuration with ML parameters
 */
export interface AdvancedLearningConfig extends AutonomousLearningConfig {
  learningCycleInterval: number;
  optimizationInterval: number;
  strategies: EnhancedLearningStrategy[];
  modelParameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    validationSplit: number;
    regularization: number;
    dropout: number;
  };
  reinforcementLearning: {
    explorationRate: number;
    discountFactor: number;
    replayBufferSize: number;
    updateFrequency: number;
  };
  qualityAssessment: {
    enabled: boolean;
    thresholds: Record<string, number>;
    mlModel: string;
    confidenceThreshold: number;
  };
  patternRecognition: {
    enabled: boolean;
    algorithms: string[];
    minimumSupport: number;
    minimumConfidence: number;
  };
}

/**
 * Complete Autonomous System Configuration
 */
export interface AutonomousSystemConfig {
  enabledComponents: string[];
  memory: {
    hebbianLearningRate: number;
    decayRate: number;
    pruningThreshold: number;
    consolidationThreshold: number;
    maxMemorySize: number;
    enableConsolidation: boolean;
    consolidationInterval: number;
  };
  learningOrchestrator: AdvancedLearningConfig;
  knowledgeCollection: KnowledgeCollectionConfig;
  monitoring: {
    healthCheckInterval: number;
    performanceUpdateInterval: number;
    enableMetricsCollection: boolean;
    enableAlerting: boolean;
  };
  optimization: {
    autoOptimizationEnabled: boolean;
    optimizationInterval: number;
    memoryOptimizationThreshold: number;
    performanceOptimizationThreshold: number;
  };
}
