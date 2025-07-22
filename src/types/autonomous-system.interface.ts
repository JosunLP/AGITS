/**
 * Autonomous System Core Interfaces
 * Defines the contracts for autonomous learning, knowledge collection, and system management
 */

import {
  AutonomousLearningConfig,
  AutonomousTask,
  AutonomousTaskType,
  DataSourceType,
  KnowledgeCollectionConfig,
  KnowledgeQualityMetrics,
  KnowledgeSourceConfig,
  LearningProgress,
  LearningStrategy,
  SchedulerStats,
  SystemPerformanceMetrics,
  SystemServices,
  TaskExecutionResult,
  TaskPriority,
  TaskStatus,
} from './autonomous-system.type.js';

import { KnowledgeItem } from './knowledge.interface.js';
import { MemoryNode } from './memory.interface.js';

/**
 * Core interface for autonomous task scheduling and execution
 */
export interface IAutonomousScheduler {
  // Lifecycle Management
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;

  // Task Management
  addTask(task: Omit<AutonomousTask, 'id' | 'createdAt' | 'updatedAt'>): string;
  removeTask(taskId: string): boolean;
  enableTask(taskId: string): boolean;
  disableTask(taskId: string): boolean;
  updateTask(taskId: string, updates: Partial<AutonomousTask>): boolean;

  // Task Execution
  executeTask(taskId: string): Promise<TaskExecutionResult>;
  executeTaskType(taskType: AutonomousTaskType): Promise<TaskExecutionResult[]>;
  cancelTask(taskId: string): boolean;

  // Task Query
  getTask(taskId: string): AutonomousTask | null;
  getAllTasks(): AutonomousTask[];
  getTasksByType(taskType: AutonomousTaskType): AutonomousTask[];
  getTasksByPriority(priority: TaskPriority): AutonomousTask[];
  getTasksByStatus(status: TaskStatus): AutonomousTask[];

  // Performance & Statistics
  getStats(): SchedulerStats;
  getExecutionHistory(taskId?: string): TaskExecutionResult[];
  getPerformanceMetrics(): SystemPerformanceMetrics;

  // System Integration
  setServices(services: SystemServices): void;
  addService(name: string, service: any): void;
  removeService(name: string): boolean;

  // Configuration
  setTaskInterval(taskId: string, intervalMs: number): boolean;
  setTaskPriority(taskId: string, priority: TaskPriority): boolean;
  setGlobalConfig(config: any): void;

  // Health & Monitoring
  isHealthy(): boolean;
  getSystemLoad(): number;
  getResourceUsage(): SystemPerformanceMetrics;
}

/**
 * Interface for autonomous knowledge collection with enhanced ML capabilities
 */
export interface IAutonomousKnowledgeCollector {
  // Lifecycle Management
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;

  // Autonomous Collection
  collectNow(): Promise<void>;
  collectFromSource(sourceId: string): Promise<KnowledgeItem[]>;
  collectByType(type: DataSourceType): Promise<KnowledgeItem[]>;
  triggerEnhancedCollection(): Promise<void>;

  // Intelligent Source Management
  addSource(config: KnowledgeSourceConfig): void;
  removeSource(sourceId: string): boolean;
  updateSource(
    sourceId: string,
    config: Partial<KnowledgeSourceConfig>
  ): boolean;
  enableSource(sourceId: string): boolean;
  disableSource(sourceId: string): boolean;
  optimizeSources(): Promise<void>;

  // Advanced Source Query
  getSource(sourceId: string): KnowledgeSourceConfig | null;
  getAllSources(): KnowledgeSourceConfig[];
  getSourcesByType(type: DataSourceType): KnowledgeSourceConfig[];
  getActiveSources(): KnowledgeSourceConfig[];
  getTrustedSources(): KnowledgeSourceConfig[];

  // ML-Enhanced Quality Assessment
  assessKnowledgeQuality(
    knowledge: KnowledgeItem
  ): Promise<KnowledgeQualityMetrics>;
  validateKnowledge(knowledge: KnowledgeItem): Promise<boolean>;
  assessSourceCredibility(sourceId: string): Promise<number>;
  detectKnowledgeDuplicates(knowledge: KnowledgeItem): Promise<string[]>;

  // Autonomous Learning & Optimization
  learnFromFeedback(
    knowledgeId: string,
    feedback: any // QualityFeedback placeholder
  ): Promise<void>;
  adaptCollectionStrategy(): Promise<void>;
  performMaintenance(): Promise<void>;

  // Configuration & Monitoring
  setConfig(config: KnowledgeCollectionConfig): void;
  getConfig(): KnowledgeCollectionConfig;
  getCollectionStats(): any;
  getSourceStats(sourceId?: string): any;
  getQualityMetrics(): KnowledgeQualityMetrics;
  getPerformanceMetrics(): any; // CollectionPerformanceMetrics placeholder

  // Event Handling
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, ...args: any[]): void;
}

/**
 * Interface for autonomous learning orchestration
 */
export interface IAutonomousLearningOrchestrator {
  // Lifecycle Management
  start(): Promise<void>;
  stop(): Promise<void>;

  // Learning Management
  startLearningCycle(): Promise<LearningProgress>;
  stopLearningCycle(): Promise<void>;
  pauseLearning(): Promise<void>;
  resumeLearning(): Promise<void>;

  // Learning Strategies
  addLearningStrategy(strategy: LearningStrategy): void;
  removeLearningStrategy(strategy: LearningStrategy): void;
  setActiveStrategies(strategies: LearningStrategy[]): void;
  getActiveStrategies(): LearningStrategy[];

  // Learning from Data
  learnFromKnowledge(knowledge: KnowledgeItem[]): Promise<LearningProgress>;
  learnFromMemory(memories: MemoryNode[]): Promise<LearningProgress>;
  learnFromExperience(experience: any): Promise<LearningProgress>;
  learnFromFeedback(feedback: any): Promise<LearningProgress>;

  // Adaptive Learning
  adaptLearningParameters(): Promise<void>;
  optimizeLearningStrategy(): Promise<void>;
  evaluateLearningPerformance(): Promise<any>;

  // Configuration
  setConfig(config: AutonomousLearningConfig): void;
  getConfig(): AutonomousLearningConfig;

  // Progress & Statistics
  getLearningProgress(): LearningProgress;
  getLearningStats(): any;
  getPerformanceMetrics(): any;

  // Integration
  integrateLearningResults(): Promise<void>;
  consolidateLearning(): Promise<void>;
  transferLearning(targetDomain: string): Promise<void>;
}

/**
 * Interface for quality assessment and validation
 */
export interface IQualityAssessmentEngine {
  // Quality Assessment
  assessDataQuality(data: any): Promise<KnowledgeQualityMetrics>;
  assessKnowledgeQuality(
    knowledge: KnowledgeItem
  ): Promise<KnowledgeQualityMetrics>;
  assessMemoryQuality(memory: MemoryNode): Promise<any>;

  // Validation
  validateData(data: any): Promise<boolean>;
  validateKnowledge(knowledge: KnowledgeItem): Promise<boolean>;
  validateLearningResult(result: any): Promise<boolean>;

  // Quality Improvement
  improveDataQuality(data: any): Promise<any>;
  suggestQualityImprovements(assessment: KnowledgeQualityMetrics): string[];

  // Configuration
  setQualityThresholds(thresholds: Record<string, number>): void;
  getQualityThresholds(): Record<string, number>;

  // Statistics
  getQualityStats(): any;
  getValidationHistory(): any;
}

/**
 * Interface for system performance monitoring
 */
export interface IPerformanceMonitor {
  // Monitoring Lifecycle
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;

  // Metrics Collection
  collectMetrics(): Promise<SystemPerformanceMetrics>;
  collectResourceUsage(): Promise<any>;
  collectTaskMetrics(taskId: string): Promise<any>;

  // Performance Analysis
  analyzePerformance(): Promise<any>;
  identifyBottlenecks(): Promise<string[]>;
  suggestOptimizations(): Promise<string[]>;

  // Alerts & Thresholds
  setPerformanceThresholds(thresholds: Record<string, number>): void;
  checkThresholds(): Promise<any[]>;

  // Historical Data
  getPerformanceHistory(timeRange?: {
    from: Date;
    to: Date;
  }): Promise<SystemPerformanceMetrics[]>;
  getMetricTrends(metric: string): Promise<any>;

  // Reporting
  generatePerformanceReport(): Promise<any>;
  exportMetrics(format: 'json' | 'csv' | 'xlsx'): Promise<Buffer>;
}

/**
 * Interface for autonomous system health management
 */
export interface ISystemHealthManager {
  // Health Monitoring
  checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    details: any;
  }>;
  checkServiceHealth(serviceName: string): Promise<boolean>;
  checkDatabaseHealth(): Promise<boolean>;
  checkExternalServicesHealth(): Promise<Record<string, boolean>>;

  // Health Recovery
  recoverFromFailure(errorType: string): Promise<boolean>;
  restartFailedServices(): Promise<string[]>;
  optimizeSystemResources(): Promise<void>;

  // Diagnostics
  runDiagnostics(): Promise<any>;
  collectSystemLogs(): Promise<string[]>;
  analyzeErrorPatterns(): Promise<any>;

  // Configuration
  setHealthThresholds(thresholds: Record<string, number>): void;
  getHealthThresholds(): Record<string, number>;

  // Notifications
  enableHealthAlerts(enabled: boolean): void;
  setAlertHandlers(handlers: Record<string, Function>): void;
}

/**
 * Interface for adaptive optimization
 */
export interface IAdaptiveOptimizer {
  // Optimization Lifecycle
  startOptimization(): Promise<void>;
  stopOptimization(): Promise<void>;

  // System Optimization
  optimizeSystem(): Promise<any>;
  optimizePerformance(): Promise<any>;
  optimizeResourceUsage(): Promise<any>;
  optimizeLearning(): Promise<any>;

  // Adaptive Behavior
  adaptToWorkload(): Promise<void>;
  adaptToEnvironment(): Promise<void>;
  adaptToUserPreferences(): Promise<void>;

  // Optimization Strategies
  selectOptimizationStrategy(context: any): Promise<string>;
  applyOptimization(strategy: string, parameters: any): Promise<any>;

  // Learning from Optimization
  learnFromOptimizationResults(results: any): Promise<void>;
  updateOptimizationStrategies(): Promise<void>;

  // Configuration
  setOptimizationConfig(config: any): void;
  getOptimizationConfig(): any;

  // Results & Analysis
  getOptimizationResults(): Promise<any>;
  analyzeOptimizationImpact(): Promise<any>;
}

/**
 * Interface for memory management system
 */
export interface IMemoryManager {
  storeMemory(memory: any): Promise<string>;
  retrieveMemory(id: string): Promise<any>;
  consolidateMemories(): Promise<any>;
  on(event: string, handler: Function): void;
}

/**
 * Interface for knowledge management system
 */
export interface IKnowledgeManager {
  addKnowledge(knowledge: any): Promise<string>;
  searchKnowledge(query: any): Promise<any[]>;
  validateKnowledge(knowledge: any): Promise<boolean>;
  on(event: string, handler: Function): void;
}

/**
 * Interface for pattern recognition engine
 */
export interface IPatternRecognizer {
  detectPatterns(data: any[]): Promise<any[]>;
  recognizePattern(data: any, signature: any): Promise<number>;
  on?(event: string, handler: Function): void;
}

/**
 * Interface for reinforcement learning agent
 */
export interface IReinforcementLearningAgent {
  learn(experience: any): Promise<void>;
  act(state: any): Promise<any>;
  getMetrics(): any;
}

/**
 * Main interface for the unified autonomous system
 */
export interface IAutonomousSystem {
  // Core Components
  scheduler: IAutonomousScheduler;
  knowledgeCollector: IAutonomousKnowledgeCollector;
  learningOrchestrator: IAutonomousLearningOrchestrator;
  qualityAssessment: IQualityAssessmentEngine;
  performanceMonitor: IPerformanceMonitor;
  healthManager: ISystemHealthManager;
  optimizer: IAdaptiveOptimizer;

  // System Lifecycle
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  shutdown(): Promise<void>;

  // Configuration Management
  setGlobalConfig(config: any): void;
  getGlobalConfig(): any;
  updateConfig(updates: any): void;

  // Service Registry
  registerService(name: string, service: any): void;
  unregisterService(name: string): boolean;
  getService(name: string): any;
  getAllServices(): Record<string, any>;

  // System Status
  getSystemStatus(): Promise<any>;
  isRunning(): boolean;
  isHealthy(): Promise<boolean>;

  // Event System
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, ...args: any[]): void;
}
