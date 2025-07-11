/**
 * Memory-related interfaces
 */

import {
  ConnectionType,
  ConsolidationPhase,
  HierarchicalMemoryStats,
  // Enhanced memory types
  MemoryHierarchyLevel,
  MemoryPriority,
  MemoryStrength,
  MemoryTrace,
  MemoryType,
  SynapticConnection,
  SynapticPlasticityType,
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
}

// Enhanced Memory Management Interfaces
export interface IHierarchicalMemoryManager {
  // Core Memory Operations (keep existing signatures)
  storeMemory(
    memory: Omit<MemoryNode, 'id' | 'lastAccessed' | 'accessCount'>
  ): Promise<string>;
  retrieveMemory(memoryId: string): MemoryNode | null;

  // Extended Memory Operations
  storeMemoryWithHierarchy?(
    memory: MemoryNode,
    hierarchyLevel: MemoryHierarchyLevel
  ): Promise<MemoryTrace>;
  forgetMemory?(memoryId: string, natural?: boolean): Promise<boolean>;

  // Hierarchical Memory Management
  promoteMemory?(
    memoryId: string,
    targetLevel: MemoryHierarchyLevel
  ): Promise<boolean>;
  demoteMemory?(
    memoryId: string,
    targetLevel: MemoryHierarchyLevel
  ): Promise<boolean>;
  transferMemory?(
    memoryId: string,
    fromLevel: MemoryHierarchyLevel,
    toLevel: MemoryHierarchyLevel
  ): Promise<boolean>;

  // Enhanced Connection Management
  createConnection(
    sourceId: string,
    targetId: string,
    connectionType: ConnectionType,
    weight?: number
  ): void;
  createSynapticConnection?(
    sourceId: string,
    targetId: string,
    weight: number,
    type: SynapticPlasticityType
  ): Promise<SynapticConnection>;
  updateConnectionWeight?(
    connectionId: string,
    newWeight: number
  ): Promise<boolean>;
  pruneWeakConnections?(threshold: number): Promise<string[]>;
  strengthenConnections?(memoryIds: string[], factor: number): Promise<boolean>;

  // Memory Statistics and Analytics
  getHierarchyStats?(): Promise<HierarchicalMemoryStats>;
  predictRetention?(memoryId: string, timeFrame: number): Promise<number>;
}
