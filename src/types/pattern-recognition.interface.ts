/**
 * Pattern Recognition Interfaces
 * Defines interfaces for advanced pattern recognition and analysis
 */

import {
  AnomalyPattern,
  BehavioralPattern,
  DetectedPattern,
  PatternEvolution,
  PatternRelationship,
  PatternSearch,
  PatternSignature,
  RecognitionMetrics,
  SemanticPattern,
  SpatialPattern,
  TemporalPattern,
} from './pattern-recognition.type.js';

export interface IPatternRecognizer {
  // Core pattern recognition
  detectPatterns(data: any[]): Promise<DetectedPattern[]>;
  recognizePattern(data: any, signature: PatternSignature): Promise<number>;

  // Pattern validation
  validatePattern(pattern: DetectedPattern): Promise<boolean>;
  refinePattern(
    pattern: DetectedPattern,
    newData: any[]
  ): Promise<DetectedPattern>;

  // Pattern search
  searchPatterns(query: PatternSearch): Promise<DetectedPattern[]>;
  findSimilarPatterns(
    pattern: DetectedPattern,
    threshold: number
  ): Promise<DetectedPattern[]>;

  // Performance metrics
  getRecognitionMetrics(): RecognitionMetrics;
  evaluateAccuracy(
    testData: any[],
    groundTruth: DetectedPattern[]
  ): Promise<RecognitionMetrics>;
}

export interface ITemporalPatternAnalyzer {
  // Time series pattern detection
  detectTemporalPatterns(timeSeries: any[]): Promise<TemporalPattern[]>;
  analyzeTrends(data: any[], timeWindow: number): Promise<TemporalPattern[]>;

  // Seasonality and cycles
  detectSeasonality(data: any[]): Promise<{
    hasSeason: boolean;
    period: number;
    strength: number;
  }>;

  detectCycles(data: any[]): Promise<{
    cycles: Array<{ period: number; amplitude: number; phase: number }>;
    dominantCycle?: { period: number; amplitude: number; phase: number };
  }>;

  // Forecasting patterns
  forecastPattern(pattern: TemporalPattern, steps: number): Promise<any[]>;
  predictNextValue(
    timeSeries: any[]
  ): Promise<{ value: any; confidence: number }>;
}

export interface ISpatialPatternAnalyzer {
  // Spatial pattern detection
  detectSpatialPatterns(spatialData: any[]): Promise<SpatialPattern[]>;
  analyzeClusters(points: number[][]): Promise<SpatialPattern[]>;

  // Density analysis
  calculateDensity(points: number[][], radius: number): Promise<number[]>;
  findDensityHotspots(points: number[][]): Promise<SpatialPattern[]>;

  // Geometric patterns
  detectGeometricShapes(points: number[][]): Promise<SpatialPattern[]>;
  analyzeDistribution(points: number[][]): Promise<{
    type: 'uniform' | 'clustered' | 'random' | 'regular';
    uniformity: number;
    clustering: number;
  }>;
}

export interface IBehavioralPatternAnalyzer {
  // Behavior sequence analysis
  detectBehavioralPatterns(behaviors: any[]): Promise<BehavioralPattern[]>;
  analyzeActionSequences(sequences: string[][]): Promise<BehavioralPattern[]>;

  // Pattern prediction
  predictNextAction(actionHistory: string[]): Promise<{
    action: string;
    confidence: number;
    alternatives: Array<{ action: string; probability: number }>;
  }>;

  // Habit detection
  detectHabits(behaviors: any[]): Promise<BehavioralPattern[]>;
  analyzeRoutines(
    timeStampedActions: Array<{ action: string; timestamp: Date }>
  ): Promise<BehavioralPattern[]>;
}

export interface ISemanticPatternAnalyzer {
  // Semantic relationship detection
  detectSemanticPatterns(text: string[]): Promise<SemanticPattern[]>;
  extractConceptualPatterns(documents: string[]): Promise<SemanticPattern[]>;

  // Knowledge graph analysis
  analyzeKnowledgeGraph(graph: any): Promise<SemanticPattern[]>;
  findSemanticClusters(concepts: string[]): Promise<SemanticPattern[]>;

  // Topic modeling
  extractTopics(
    documents: string[],
    numTopics: number
  ): Promise<SemanticPattern[]>;
  analyzeSentiment(text: string[]): Promise<{
    overall: number;
    patterns: SemanticPattern[];
  }>;
}

export interface IAnomalyDetector {
  // Anomaly detection
  detectAnomalies(data: any[]): Promise<AnomalyPattern[]>;
  isAnomaly(
    dataPoint: any,
    context: any[]
  ): Promise<{
    isAnomaly: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
  }>;

  // Outlier detection
  detectOutliers(data: number[]): Promise<{
    outliers: number[];
    indices: number[];
    threshold: number;
  }>;

  // Change point detection
  detectChangePoints(timeSeries: number[]): Promise<{
    changePoints: number[];
    confidence: number[];
  }>;
}

export interface IPatternEvolutionTracker {
  // Pattern lifecycle tracking
  trackPatternEvolution(patternId: string): Promise<PatternEvolution>;
  analyzePatternLifecycle(pattern: DetectedPattern): Promise<{
    stage: 'emerging' | 'mature' | 'declining' | 'stable';
    lifespan: number;
    stability: number;
  }>;

  // Pattern adaptation
  adaptPattern(
    pattern: DetectedPattern,
    newData: any[]
  ): Promise<DetectedPattern>;
  mergePatterns(patterns: DetectedPattern[]): Promise<DetectedPattern>;

  // Evolution prediction
  predictPatternEvolution(
    pattern: DetectedPattern,
    timeHorizon: number
  ): Promise<PatternEvolution>;
}

export interface IPatternRelationshipAnalyzer {
  // Relationship discovery
  discoverRelationships(
    patterns: DetectedPattern[]
  ): Promise<PatternRelationship[]>;
  analyzePatternInteractions(
    patterns: DetectedPattern[]
  ): Promise<PatternRelationship[]>;

  // Causal analysis
  inferCausality(
    sourcePattern: DetectedPattern,
    targetPattern: DetectedPattern
  ): Promise<{
    causal: boolean;
    confidence: number;
    direction: 'forward' | 'backward' | 'bidirectional';
  }>;

  // Network analysis
  buildPatternNetwork(patterns: DetectedPattern[]): Promise<{
    nodes: DetectedPattern[];
    edges: PatternRelationship[];
    metrics: {
      density: number;
      clustering: number;
      centrality: Record<string, number>;
    };
  }>;
}

export interface IPatternRepository {
  // Pattern storage
  storePattern(pattern: DetectedPattern): Promise<string>;
  getPattern(patternId: string): Promise<DetectedPattern>;
  updatePattern(
    patternId: string,
    updates: Partial<DetectedPattern>
  ): Promise<void>;
  deletePattern(patternId: string): Promise<void>;

  // Pattern querying
  findPatterns(criteria: Partial<DetectedPattern>): Promise<DetectedPattern[]>;
  searchBySignature(
    signature: PatternSignature,
    threshold: number
  ): Promise<DetectedPattern[]>;

  // Pattern analytics
  getPatternStatistics(): Promise<{
    totalPatterns: number;
    patternsByType: Record<string, number>;
    averageConfidence: number;
    mostFrequentPatterns: DetectedPattern[];
  }>;

  // Bulk operations
  importPatterns(patterns: DetectedPattern[]): Promise<string[]>;
  exportPatterns(patternIds: string[]): Promise<DetectedPattern[]>;
}
