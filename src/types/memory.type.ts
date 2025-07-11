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

// Enhanced Memory Hierarchy Types
export enum MemoryHierarchyLevel {
  SENSORY = 'sensory', // Ultra-short term (100-500ms)
  WORKING = 'working', // Short term (seconds to minutes)
  SHORT_TERM = 'short_term', // Minutes to hours
  MEDIUM_TERM = 'medium_term', // Hours to days
  LONG_TERM = 'long_term', // Days to lifetime
  PERMANENT = 'permanent', // Persistent core memories
}

export enum MemoryConsolidationStage {
  INITIAL = 'initial',
  STABILIZING = 'stabilizing',
  CONSOLIDATING = 'consolidating',
  CONSOLIDATED = 'consolidated',
  RECONSOLIDATING = 'reconsolidating',
  PERMANENT = 'permanent',
}

export enum SynapticPlasticityType {
  LTP = 'long_term_potentiation', // Strengthen connections
  LTD = 'long_term_depression', // Weaken connections
  HOMEOSTATIC = 'homeostatic', // Balance network activity
  HEBBIAN = 'hebbian', // Fire together, wire together
  SPIKE_TIMING = 'spike_timing', // Precise timing dependent
}

export enum MemoryInterferenceType {
  PROACTIVE = 'proactive', // Old memories interfere with new
  RETROACTIVE = 'retroactive', // New memories interfere with old
  SIMILARITY = 'similarity', // Similar memories interfere
  CONTEXT = 'context', // Context-dependent interference
}

export interface MemoryTrace {
  id: string;
  formation: Date;
  lastActivation: Date;
  activationCount: number;
  strength: number;
  decay: number;
  consolidationStage: MemoryConsolidationStage;
  hierarchyLevel: MemoryHierarchyLevel;
  tags: string[];
  associations: string[];
}

export interface SynapticConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;
  plasticityType: SynapticPlasticityType;
  lastModified: Date;
  activationHistory: number[];
  bidirectional: boolean;
  context: Record<string, any>;
}

export interface HierarchicalMemoryStats {
  sensoryCount: number;
  workingCount: number;
  shortTermCount: number;
  mediumTermCount: number;
  longTermCount: number;
  permanentCount: number;
  totalConnections: number;
  averageConnectionStrength: number;
  consolidationRate: number;
  interferenceRate: number;
}
