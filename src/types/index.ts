/**
 * Core types and interfaces for the AGI Platform
 */

// Neurotransmitter types for inter-service communication
export enum NeurotransmitterType {
  DOPAMINE = 'dopamine',
  SEROTONIN = 'serotonin',
  NOREPINEPHRINE = 'norepinephrine',
  ACETYLCHOLINE = 'acetylcholine',
  GABA = 'gaba',
  GLUTAMATE = 'glutamate',
}

// Service communication message
export interface NeurotransmitterMessage {
  id: string;
  type: NeurotransmitterType;
  sourceService: string;
  targetService: string;
  payload: Record<string, any>;
  timestamp: Date;
  priority: MessagePriority;
  ttl: number; // Time to live in milliseconds
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

// Memory types
export interface MemoryNode {
  id: string;
  type: MemoryType;
  content: any;
  connections: MemoryConnection[];
  strength: number; // Synaptic strength
  lastAccessed: Date;
  accessCount: number;
  metadata: Record<string, any>;
}

export interface MemoryConnection {
  targetId: string;
  weight: number;
  type: ConnectionType;
}

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
}

export enum ConnectionType {
  ASSOCIATIVE = 'associative',
  CAUSAL = 'causal',
  TEMPORAL = 'temporal',
  HIERARCHICAL = 'hierarchical',
}

// Cognitive processing types
export interface CognitiveTask {
  id: string;
  type: TaskType;
  priority: number;
  requiredResources: ResourceRequirement[];
  input: any;
  context: ProcessingContext;
  deadline?: Date;
  dependencies: string[]; // Task IDs
}

export enum TaskType {
  PERCEPTION = 'perception',
  REASONING = 'reasoning',
  DEDUCTIVE_REASONING = 'deductive_reasoning',
  INDUCTIVE_REASONING = 'inductive_reasoning',
  ABDUCTIVE_REASONING = 'abductive_reasoning',
  ANALOGICAL_REASONING = 'analogical_reasoning',
  LEARNING = 'learning',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  COMMUNICATION = 'communication',
}

export interface ResourceRequirement {
  type: ResourceType;
  amount: number;
  unit: string;
}

export enum ResourceType {
  CPU = 'cpu',
  MEMORY = 'memory',
  GPU = 'gpu',
  NETWORK = 'network',
  STORAGE = 'storage',
}

export interface ProcessingContext {
  sessionId: string;
  userId?: string;
  environment: Record<string, any>;
  goals: Goal[];
  constraints: Constraint[];
}

// Goal and constraint types
export interface Goal {
  id: string;
  description: string;
  type: GoalType;
  priority: number;
  deadline?: Date;
  metrics: GoalMetric[];
  subGoals: string[]; // Goal IDs
  status: GoalStatus;
}

export enum GoalType {
  IMMEDIATE = 'immediate',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  SURVIVAL = 'survival',
}

export interface GoalMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
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
}

export enum ConstraintType {
  RESOURCE = 'resource',
  TIME = 'time',
  ETHICAL = 'ethical',
  LEGAL = 'legal',
  SAFETY = 'safety',
}

export enum ConstraintSeverity {
  SOFT = 'soft',
  HARD = 'hard',
  CRITICAL = 'critical',
}

// Learning types
export interface LearningExperience {
  id: string;
  type: LearningType;
  input: any;
  expectedOutput?: any;
  actualOutput?: any;
  reward: number;
  confidence: number;
  timestamp: Date;
  context: ProcessingContext;
}

export enum LearningType {
  SUPERVISED = 'supervised',
  UNSUPERVISED = 'unsupervised',
  REINFORCEMENT = 'reinforcement',
  IMITATION = 'imitation',
  ACTIVE = 'active',
}

// Service health and monitoring
export interface ServiceHealth {
  serviceId: string;
  status: ServiceStatus;
  lastHeartbeat: Date;
  metrics: ServiceMetrics;
  errors: ServiceError[];
}

export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface ServiceMetrics {
  cpu: number;
  memory: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  custom: Record<string, number>;
}

export interface ServiceError {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity: ErrorSeverity;
  resolved: boolean;
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Data modalities
export interface MultiModalData {
  id: string;
  timestamp: Date;
  modalities: DataModality[];
  metadata: Record<string, any>;
}

export interface DataModality {
  type: ModalityType;
  data: any;
  format: string;
  confidence: number;
  processingStage: ProcessingStage;
}

export enum ModalityType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  SENSOR = 'sensor',
  STRUCTURED = 'structured',
}

export enum ProcessingStage {
  RAW = 'raw',
  PREPROCESSED = 'preprocessed',
  FEATURES_EXTRACTED = 'features_extracted',
  ANALYZED = 'analyzed',
  INTERPRETED = 'interpreted',
}

// API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  requestId?: string;
  timestamp: string;
  processingTime?: number;
  version?: string;
  taskId?: string;
  queuePosition?: number;
  [key: string]: any; // Allow additional metadata fields
}

// Configuration types
export interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  environment: Environment;
  dependencies: ServiceDependency[];
  resources: ResourceLimits;
  monitoring: MonitoringConfig;
}

export enum Environment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface ServiceDependency {
  name: string;
  type: DependencyType;
  url: string;
  authentication?: AuthConfig;
  timeout: number;
  retries: number;
}

export enum DependencyType {
  HTTP = 'http',
  GRPC = 'grpc',
  DATABASE = 'database',
  MESSAGE_QUEUE = 'message_queue',
  CACHE = 'cache',
}

export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, any>;
}

export enum AuthType {
  API_KEY = 'api_key',
  BEARER_TOKEN = 'bearer_token',
  BASIC = 'basic',
  OAUTH = 'oauth',
  MUTUAL_TLS = 'mutual_tls',
}

export interface ResourceLimits {
  cpu: string;
  memory: string;
  storage: string;
  network: string;
}

export interface MonitoringConfig {
  metricsEnabled: boolean;
  tracingEnabled: boolean;
  loggingLevel: LogLevel;
  healthCheckInterval: number;
}

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Decision making types
export interface Decision {
  id: string;
  goal: Goal;
  selectedOption: EvaluatedOption;
  alternatives: EvaluatedOption[];
  confidence: number;
  reasoning: string[];
  timestamp: Date;
  context: ProcessingContext;
  executionPlan?: ExecutionStep[];
}

export interface EvaluatedOption {
  id: string;
  description: string;
  utility: number;
  risk: number;
  cost: number;
  timeToComplete: number;
  resources: ResourceRequirement[];
  constraints: Constraint[];
  confidence: number;
}

export interface ExecutionStep {
  id: string;
  action: string;
  parameters: Record<string, any>;
  expectedDuration: number;
  dependencies: string[]; // Step IDs
  validationCriteria: ValidationCriteria[];
}

export interface ValidationCriteria {
  metric: string;
  expectedValue: any;
  tolerance: number;
  required: boolean;
}
