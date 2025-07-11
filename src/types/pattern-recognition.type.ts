/**
 * Pattern Recognition Types
 * Defines types for advanced pattern recognition and analysis
 */

export enum PatternType {
  TEMPORAL = 'temporal',
  SPATIAL = 'spatial',
  BEHAVIORAL = 'behavioral',
  SEMANTIC = 'semantic',
  STRUCTURAL = 'structural',
  CAUSAL = 'causal',
  ANOMALY = 'anomaly',
  TREND = 'trend',
  CYCLE = 'cycle',
  CORRELATION = 'correlation',
}

export enum RecognitionMethod {
  STATISTICAL = 'statistical',
  MACHINE_LEARNING = 'machine_learning',
  DEEP_LEARNING = 'deep_learning',
  NEURAL_NETWORK = 'neural_network',
  FUZZY_LOGIC = 'fuzzy_logic',
  GENETIC_ALGORITHM = 'genetic_algorithm',
  ENSEMBLE = 'ensemble',
  HYBRID = 'hybrid',
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum PatternComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  HIGHLY_COMPLEX = 'highly_complex',
}

export interface PatternSignature {
  id: string;
  type: PatternType;
  features: Record<string, number>;
  fingerprint: string;
  complexity: PatternComplexity;
  dimensions: number;
  variability: number;
}

export interface DetectedPattern {
  id: string;
  signature: PatternSignature;
  instances: PatternInstance[];
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  support: number;
  frequency: number;
  stability: number;
  significance: number;
  discoveredAt: Date;
  lastSeen: Date;
  context: Record<string, any>;
}

export interface PatternInstance {
  id: string;
  patternId: string;
  data: any;
  location: PatternLocation;
  timestamp: Date;
  confidence: number;
  features: Record<string, number>;
  context: Record<string, any>;
  validated: boolean;
}

export interface PatternLocation {
  source: string;
  coordinates?: number[];
  dimension?: string;
  startIndex?: number;
  endIndex?: number;
  depth?: number;
}

export interface PatternRelationship {
  id: string;
  sourcePatternId: string;
  targetPatternId: string;
  relationshipType: RelationshipType;
  strength: number;
  confidence: number;
  temporal: boolean;
  causal: boolean;
  discovered: Date;
  validated: boolean;
}

export enum RelationshipType {
  CONTAINS = 'contains',
  PRECEDES = 'precedes',
  FOLLOWS = 'follows',
  CORRELATES = 'correlates',
  CAUSES = 'causes',
  SIMILAR = 'similar',
  OPPOSITE = 'opposite',
  TRANSFORMS = 'transforms',
}

export interface TemporalPattern {
  id: string;
  sequence: any[];
  duration: number;
  periodicity: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'oscillating';
  seasonality: boolean;
  cycleLength?: number;
  amplitude?: number;
  phase?: number;
}

export interface SpatialPattern {
  id: string;
  geometry: 'point' | 'line' | 'polygon' | 'cluster' | 'grid';
  coordinates: number[][];
  density: number;
  distribution: 'uniform' | 'clustered' | 'random' | 'regular';
  scale: number;
  orientation?: number;
}

export interface BehavioralPattern {
  id: string;
  actionSequence: string[];
  triggers: string[];
  conditions: Record<string, any>;
  outcomes: Record<string, any>;
  frequency: number;
  consistency: number;
  adaptability: number;
}

export interface SemanticPattern {
  id: string;
  concepts: string[];
  relationships: Array<{
    source: string;
    target: string;
    relation: string;
    weight: number;
  }>;
  domain: string;
  abstraction: number;
  coherence: number;
}

export interface AnomalyPattern {
  id: string;
  deviation: number;
  deviationType: 'statistical' | 'contextual' | 'collective';
  expectedValue: any;
  actualValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
}

export interface PatternEvolution {
  patternId: string;
  timeline: Array<{
    timestamp: Date;
    state: DetectedPattern;
    change: string;
    magnitude: number;
  }>;
  evolutionRate: number;
  stability: number;
  adaptations: string[];
}

export interface RecognitionMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  coverage: number;
  novelty: number;
  processingTime: number;
  memoryUsage: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface PatternSearch {
  query: PatternSignature;
  similarity: number;
  maxResults: number;
  filters: Record<string, any>;
  ordering: 'confidence' | 'frequency' | 'recency' | 'significance';
}
