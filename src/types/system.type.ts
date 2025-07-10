/**
 * System-related types and enums
 */

export enum ServiceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

export enum TaskType {
  PERCEPTION = 'perception',
  REASONING = 'reasoning',
  LEARNING = 'learning',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  COMMUNICATION = 'communication',
  MEMORY_CONSOLIDATION = 'memory_consolidation',
  KNOWLEDGE_EXTRACTION = 'knowledge_extraction',
  PATTERN_RECOGNITION = 'pattern_recognition',
}

export enum ResourceType {
  CPU = 'cpu',
  MEMORY = 'memory',
  GPU = 'gpu',
  NETWORK = 'network',
  STORAGE = 'storage',
  BANDWIDTH = 'bandwidth',
}

export enum ProcessPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  BACKGROUND = 5,
}

export enum AutonomousProcessType {
  MEMORY_CONSOLIDATION = 'memory_consolidation',
  SYNAPTIC_PRUNING = 'synaptic_pruning',
  SYNAPTIC_DECAY = 'synaptic_decay',
  LEARNING_CYCLE = 'learning_cycle',
  KNOWLEDGE_EXTRACTION = 'knowledge_extraction',
  PATTERN_DISCOVERY = 'pattern_discovery',
  GOAL_EVALUATION = 'goal_evaluation',
  DECISION_MAKING = 'decision_making',
  ATTENTION_MANAGEMENT = 'attention_management',
  CHEMICAL_SIGNALING = 'chemical_signaling',
}

export enum NeurotransmitterType {
  DOPAMINE = 'dopamine',
  SEROTONIN = 'serotonin',
  NOREPINEPHRINE = 'norepinephrine',
  ACETYLCHOLINE = 'acetylcholine',
  GABA = 'gaba',
  GLUTAMATE = 'glutamate',
  OXYTOCIN = 'oxytocin',
  ENDORPHIN = 'endorphin',
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  FAILED = 'failed',
  UNKNOWN = 'unknown',
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  RATE = 'rate',
}

export enum Environment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum ServiceConfigEnum {
  API_PORT = 'api_port',
  DB_CONNECTION = 'db_connection',
  MAX_MEMORY = 'max_memory',
  LOG_LEVEL = 'log_level',
  ENVIRONMENT = 'environment',
}

export enum DataModality {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  SENSOR = 'sensor',
  MULTIMODAL = 'multimodal',
}

export enum ModalityType {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  TEXTUAL = 'textual',
  SENSORY = 'sensory',
  TEMPORAL = 'temporal',
  SPATIAL = 'spatial',
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
  NORMALIZED = 'normalized',
  VALIDATED = 'validated',
  READY = 'ready',
}

/**
 * Performance metrics for system monitoring
 */
export interface PerformanceMetrics {
  totalExecutionTime: number;
  averageResponseTime: number;
  successRate: number;
  failureCount: number;
  requestCount: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  timestamp: Date;
}
