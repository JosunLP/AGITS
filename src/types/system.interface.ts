/**
 * System-related interfaces
 */

import {
  AutonomousProcessType,
  Environment,
  HealthStatus,
  LogLevel,
  MessagePriority,
  NeurotransmitterType,
  ProcessPriority,
  ResourceType,
  ServiceStatus,
  TaskType,
} from './system.type.js';

export interface ServiceHealth {
  serviceId: string;
  status: ServiceStatus;
  lastHeartbeat: Date;
  metrics: ServiceMetrics;
  errors: ServiceError[];
  uptime: number;
  version: string;
  dependencies: ServiceDependency[];
}

export interface ServiceMetrics {
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  latency: number;
  throughput: number;
  availability: number;
  responseTime: number;
  errorRate: number;
  customMetrics: Record<string, number>;
}

export interface ServiceError {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ServiceDependency {
  serviceId: string;
  status: ServiceStatus;
  required: boolean;
  lastCheck: Date;
  responseTime: number;
}

export interface CognitiveTask {
  id: string;
  type: TaskType;
  priority: ProcessPriority;
  requiredResources: ResourceRequirement[];
  input: any;
  context: ProcessingContext;
  deadline?: Date;
  dependencies: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface ResourceRequirement {
  type: ResourceType;
  amount: number;
  unit: string;
  duration?: number;
  priority: ProcessPriority;
}

export interface ProcessingContext {
  sessionId: string;
  userId?: string;
  environment: Record<string, any>;
  goals: Goal[];
  constraints: Constraint[];
  metadata: Record<string, any>;
}

export interface Goal {
  id: string;
  description: string;
  type: GoalType;
  priority: number;
  deadline?: Date;
  metrics: GoalMetric[];
  subGoals: string[];
  status: GoalStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum GoalType {
  IMMEDIATE = 'immediate',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  SURVIVAL = 'survival',
  OPTIMIZATION = 'optimization',
  LEARNING = 'learning',
}

export interface GoalMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  weight: number;
  threshold?: number;
}

export enum GoalStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Constraint {
  id: string;
  type: ConstraintType;
  description: string;
  severity: ConstraintSeverity;
  conditions: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  validUntil?: Date;
}

export enum ConstraintType {
  RESOURCE = 'resource',
  TIME = 'time',
  ETHICAL = 'ethical',
  LEGAL = 'legal',
  SAFETY = 'safety',
  PERFORMANCE = 'performance',
  QUALITY = 'quality',
}

export enum ConstraintSeverity {
  SOFT = 'soft',
  HARD = 'hard',
  CRITICAL = 'critical',
}

export interface AutonomousProcess {
  id: string;
  type: AutonomousProcessType;
  name: string;
  description: string;
  isActive: boolean;
  isRunning: boolean;
  intervalMs: number;
  lastExecution: Date | null;
  nextExecution: Date | null;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  priority: ProcessPriority;
  dependencies: string[];
  configuration: Record<string, any>;
  metrics: ProcessMetrics;
  healthStatus: HealthStatus;
}

export interface ProcessMetrics {
  executionTime: number[];
  successRate: number;
  errorRate: number;
  throughput: number;
  resourceUsage: ResourceUsage;
  performance: number;
  efficiency: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  duration: number;
}

export interface NeurotransmitterMessage {
  id: string;
  type: NeurotransmitterType;
  sourceService: string;
  targetService: string;
  payload: Record<string, any>;
  timestamp: Date;
  priority: MessagePriority;
  ttl: number;
  routingInfo?: MessageRoutingInfo;
  metadata: Record<string, any>;
}

export interface MessageRoutingInfo {
  hops: string[];
  retries: number;
  maxRetries: number;
  deliveryGuarantee: 'at_most_once' | 'at_least_once' | 'exactly_once';
  compression: boolean;
  encryption: boolean;
}

export interface SystemConfiguration {
  memory: MemoryConfiguration;
  learning: LearningConfiguration;
  reasoning: ReasoningConfiguration;
  knowledge: KnowledgeConfiguration;
  autonomous: AutonomousConfiguration;
  performance: PerformanceConfiguration;
}

export interface MemoryConfiguration {
  consolidationInterval: number;
  decayRate: number;
  pruningThreshold: number;
  maxConnections: number;
  enableAutoConsolidation: boolean;
  enableAutoPruning: boolean;
}

export interface LearningConfiguration {
  batchSize: number;
  learningRate: number;
  explorationRate: number;
  adaptationThreshold: number;
  maxConcurrentTasks: number;
  enableContinualLearning: boolean;
}

export interface ReasoningConfiguration {
  maxDepth: number;
  confidenceThreshold: number;
  timeoutSeconds: number;
  parallelProcessing: boolean;
  cachingEnabled: boolean;
  defaultStrategy: string;
}

export interface KnowledgeConfiguration {
  extractionInterval: number;
  validationThreshold: number;
  maxItemsPerQuery: number;
  enableAutoExtraction: boolean;
  enableValidation: boolean;
}

export interface AutonomousConfiguration {
  enableAll: boolean;
  processIntervals: Record<AutonomousProcessType, number>;
  priorities: Record<AutonomousProcessType, ProcessPriority>;
  resourceLimits: Record<ResourceType, number>;
}

export interface PerformanceConfiguration {
  monitoringInterval: number;
  alertThresholds: Record<string, number>;
  optimizationEnabled: boolean;
  scalingEnabled: boolean;
  maxConcurrentTasks: number;
}

export interface SystemMetrics {
  timestamp: Date;
  services: Map<string, ServiceMetrics>;
  resources: ResourceUsage;
  performance: PerformanceMetrics;
  errors: SystemError[];
  health: HealthStatus;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  availability: number;
  reliability: number;
  scalability: number;
}

export interface SystemError {
  id: string;
  timestamp: Date;
  level: 'warning' | 'error' | 'critical';
  service: string;
  component: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  impact: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  traceId?: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number;
  version: string;
  rateLimit?: RateLimitInfo;
  taskId?: string;
  queuePosition?: number;
  source?: string;
  estimatedProcessingTime?: number;
  selectedModels?: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  window: number;
}

export interface DataModalityInput {
  type: string;
  data: any;
  quality?: number;
  metadata?: Record<string, any>;
}

export interface MultiModalData {
  id: string;
  modalities: ProcessedDataModality[];
  primaryModality: string;
  timestamp: Date;
  metadata: Record<string, any>;
  quality: number;
  processed: boolean;
  features?: Record<string, any>;
}

export interface ProcessedDataModality {
  id: string;
  type: string;
  data: any;
  quality: number;
  timestamp: Date;
  metadata: Record<string, any>;
  original?: {
    data: any;
    size: number;
  };
}

export interface Decision {
  id: string;
  description: string;
  options: DecisionOption[];
  selectedOption?: string;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  outcome?: string;
  metadata: Record<string, any>;
}

export interface DecisionOption {
  id: string;
  name: string;
  value: any;
  score: number;
  pros: string[];
  cons: string[];
  risks: Risk[];
  metadata: Record<string, any>;
}

export interface Risk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
  category: string;
}

export interface ServiceConfig {
  name: string;
  version: string;
  environment: Environment;
  port?: number;
  host?: string;
  logLevel: LogLevel;
  enableMetrics: boolean;
  enableHealthCheck: boolean;
  enabled: boolean;
  instances?: number;
  healthCheckPath?: string;
  config?: Record<string, any>;
  dependencies: string[];
  features: string[];
  resources: {
    maxMemory: number;
    maxCpu: number;
    maxConnections: number;
    cpu?: string;
    memory?: string;
    storage?: string;
    network?: string;
  };
}
