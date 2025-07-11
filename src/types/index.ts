/**
 * // Memory types and interfaces
export * from './memory.interface.js';
export * from './memory.type.js';pes and interfaces for the AGI Platform
 *
 * This file re-exports all types and interfaces from specialized modules
 * for easy importing across the application.
 */

// Memory types and interfaces
export * from './memory.interface.js';
export * from './memory.type.js';

// Reasoning types and interfaces
export * from './reasoning.interface.js';
export * from './reasoning.type.js';

// Knowledge types and interfaces
export * from './knowledge.interface.js';
export * from './knowledge.type.js';

// Learning types and interfaces
export * from './learning.interface.js';
export * from './learning.type.js';

// System types and interfaces
export * from './system.interface.js';
export {
  AutonomousProcessType,
  Environment,
  LogLevel,
  MessagePriority,
  ModalityType,
  NeurotransmitterType,
  ProcessPriority,
  ProcessingStage,
  ResourceType,
  ServiceStatus,
  TaskType,
} from './system.type.js';
export type { PerformanceMetrics } from './system.type.js';

// Data Acquisition types and interfaces - selective exports to avoid conflicts
export * from './data-acquisition.interface.js';
export {
  CollectionPriority as DataCollectionPriority,
  TriggerConditionType,
} from './data-acquisition.type.js';
export type {
  CollectionConfiguration,
  CollectionResult as DataCollectionResult,
  KnowledgeCollectionTask as DataKnowledgeCollectionTask,
  DataPoint,
  ScrapedContent,
  SearchQuery,
  TriggerCondition,
  TrustedSource,
} from './data-acquisition.type.js';

// Reinforcement Learning types and interfaces
export * from './reinforcement-learning.interface.js';
export {
  ActionType,
  ExplorationStrategy,
  LearningStrategy as RLLearningStrategy,
  RewardType,
} from './reinforcement-learning.type.js';
export type {
  Episode,
  Experience,
  QValue,
  Action as RLAction,
  LearningMetrics as RLMetrics,
  Policy as RLPolicy,
  State as RLState,
} from './reinforcement-learning.type.js';

// Machine Learning types and interfaces
export * from './machine-learning.interface.js';
export * from './machine-learning.type.js';

// Pattern Recognition types and interfaces
export * from './pattern-recognition.interface.js';
export {
  PatternComplexity,
  ConfidenceLevel as PatternConfidenceLevel,
  RelationshipType as PatternRelationshipType,
  PatternType,
  RecognitionMethod,
} from './pattern-recognition.type.js';
export type {
  AnomalyPattern,
  BehavioralPattern,
  DetectedPattern,
  PatternEvolution,
  PatternInstance,
  PatternRelationship,
  PatternSearch,
  PatternSignature,
  RecognitionMetrics,
  SemanticPattern,
  SpatialPattern,
  TemporalPattern,
} from './pattern-recognition.type.js';
