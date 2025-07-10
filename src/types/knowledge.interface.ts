/**
 * Knowledge-related interfaces
 */

import {
  CollectionStrategy,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeType,
  RelationshipType,
  ValidationMethod,
} from './knowledge.type.js';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  subject: string;
  description?: string;
  content: any;
  confidence: number;
  confidenceLevel?: string;
  source: KnowledgeSourceType;
  sources?: string[];
  tags: string[];
  status: KnowledgeStatus;
  relationships: KnowledgeRelationship[];
  validation: VerificationInfo;
  verification?: {
    isVerified: boolean;
    verifiedAt?: Date;
    verificationMethod?: string;
  };
  metadata: KnowledgeMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
  accessCount?: number;
  lastValidated?: Date;
}

export interface KnowledgeRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number;
  confidence: number;
  bidirectional: boolean;
  context?: string;
  evidence: string[];
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface VerificationInfo {
  isVerified: boolean;
  verificationMethod?: ValidationMethod;
  verifiedBy?: string;
  verificationDate?: Date;
  verificationScore: number;
  contradictions: string[];
  supportingEvidence: string[];
  reviewers?: string[];
  consensus?: number;
}

export interface KnowledgeMetadata {
  domain: string;
  complexity: number;
  importance: number;
  frequency: number;
  context: Record<string, any>;
  derivedFrom: string[];
  relatedConcepts: string[];
  applications: string[];
  limitations: string[];
  assumptions: string[];
  [key: string]: any;
}

export interface KnowledgeQuery {
  subjects?: string[];
  types?: KnowledgeType[];
  tags?: string[];
  confidenceMin?: number;
  confidenceMax?: number;
  dateRange?: { start: Date; end: Date };
  limit?: number;
  includeRelated?: boolean;
  textSearch?: string;
  status?: KnowledgeStatus[];
  domains?: string[];
}

export interface KnowledgeCollectionTask {
  id?: string;
  name: string;
  description: string;
  sourceType: KnowledgeSourceType;
  strategy: CollectionStrategy;
  configuration: Record<string, any>;
  isActive: boolean;
  priority: number;
  intervalMs?: number;
  lastExecuted?: Date;
  nextExecution?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  metadata: Record<string, any>;
}

export interface CollectionResult {
  taskId: string;
  taskName: string;
  executionTime: number;
  itemsCollected: number;
  knowledgeIds: string[];
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface KnowledgePattern {
  id: string;
  type: string;
  description: string;
  frequency: number;
  confidence: number;
  examples: any[];
  relatedKnowledge: string[];
  discoveredAt: Date;
  metadata: Record<string, any>;
}

export interface KnowledgeInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'pattern' | 'gap';
  description: string;
  confidence: number;
  evidence: string[];
  implications: string[];
  relatedKnowledge: string[];
  actionable: boolean;
  priority: number;
  discoveredAt: Date;
}

export interface ExtractionResult {
  extractedItems: KnowledgeItem[];
  patterns: KnowledgePattern[];
  insights: KnowledgeInsight[];
  confidence: number;
  processingTime: number;
  summary: string;
  statistics: ExtractionStatistics;
}

export interface ExtractionStatistics {
  totalItemsProcessed: number;
  newKnowledgeItems: number;
  updatedKnowledgeItems: number;
  duplicatesFound: number;
  patternsDiscovered: number;
  insightsGenerated: number;
  averageConfidence: number;
  errorRate: number;
}

export interface KnowledgeOptimizationResult {
  optimizedItems: KnowledgeItem[];
  mergedItems: string[];
  removedDuplicates: string[];
  strengthenedRelationships: KnowledgeRelationship[];
  weakenedRelationships: KnowledgeRelationship[];
  newInsights: KnowledgeInsight[];
  processingTime: number;
  improvementMetrics: OptimizationMetrics;
}

export interface OptimizationMetrics {
  qualityImprovement: number;
  redundancyReduction: number;
  connectivityImprovement: number;
  consistencyImprovement: number;
  completenessImprovement: number;
}
