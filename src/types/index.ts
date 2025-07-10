/**
 * Core types and interfaces for the AGI Platform
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
