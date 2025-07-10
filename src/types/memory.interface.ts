/**
 * Memory-related interfaces
 */

import {
  ConnectionType,
  ConsolidationPhase,
  MemoryPriority,
  MemoryStrength,
  MemoryType,
} from './memory.type.js';

export interface MemoryNode {
  id: string;
  type: MemoryType;
  content: any;
  connections: MemoryConnection[];
  strength: number;
  lastAccessed: Date;
  createdAt: Date;
  accessCount: number;
  decayRate: number;
  consolidationLevel: number;
  priority: MemoryPriority;
  metadata: MemoryMetadata;
}

export interface MemoryConnection {
  targetId: string;
  weight: number;
  type: ConnectionType;
  strength: MemoryStrength;
  lastActivated: Date;
  activationCount: number;
  bidirectional: boolean;
  metadata: Record<string, any>;
}

export interface MemoryMetadata {
  tags: string[];
  source: string;
  category: string;
  importance: number;
  emotionalValence: number;
  contextualRelevance: number;
  validationStatus: 'pending' | 'validated' | 'disputed' | 'rejected';
  consolidationPhase: ConsolidationPhase;
  associatedGoals: string[];
  confidence: number;
  [key: string]: any;
}

export interface AccessPattern {
  nodeId: string;
  accessTimes: Date[];
  strengthHistory: number[];
  associatedNodes: string[];
  accessFrequency: number;
  recentAccess: boolean;
  averageInterval: number;
}

export interface MemorySearchQuery {
  content?: string;
  type?: MemoryType;
  tags?: string[];
  strengthMin?: number;
  strengthMax?: number;
  dateRange?: { start: Date; end: Date };
  limit?: number;
  includeConnections?: boolean;
  semantic?: boolean;
}

export interface MemoryConsolidationResult {
  consolidatedMemories: MemoryNode[];
  newConnections: MemoryConnection[];
  strengthenedConnections: MemoryConnection[];
  weakenedConnections: MemoryConnection[];
  prunedMemories: string[];
  insights: MemoryInsight[];
  processingTime: number;
}

export interface MemoryInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'correlation';
  description: string;
  confidence: number;
  evidence: string[];
  relatedMemories: string[];
  timestamp: Date;
}

export interface MemoryMaintenanceConfig {
  consolidationInterval: number;
  decayCheckInterval: number;
  pruningInterval: number;
  strengthThreshold: number;
  maxMemoryAge: number;
  maxConnectionsPerNode: number;
  enableAutoConsolidation: boolean;
  enableAutoPruning: boolean;
}
