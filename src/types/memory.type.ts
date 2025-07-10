/**
 * Memory-related types and enums
 */

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
}

export enum ConnectionType {
  ASSOCIATIVE = 'associative',
  CAUSAL = 'causal',
  TEMPORAL = 'temporal',
  HIERARCHICAL = 'hierarchical',
  SEMANTIC = 'semantic',
  SPATIAL = 'spatial',
}

export enum MemoryStrength {
  VERY_WEAK = 0.1,
  WEAK = 0.3,
  MODERATE = 0.5,
  STRONG = 0.7,
  VERY_STRONG = 0.9,
}

export enum ConsolidationPhase {
  ENCODING = 'encoding',
  STORAGE = 'storage',
  RETRIEVAL = 'retrieval',
  RECONSOLIDATION = 'reconsolidation',
}

export enum MemoryPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
  VITAL = 5,
}
