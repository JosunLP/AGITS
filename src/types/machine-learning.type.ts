/**
 * Machine Learning Quality Assessment Types
 * Defines types for ML-based quality evaluation
 */

export enum QualityMetric {
  ACCURACY = 'accuracy',
  PRECISION = 'precision',
  RECALL = 'recall',
  F1_SCORE = 'f1_score',
  AUC_ROC = 'auc_roc',
  CONFIDENCE = 'confidence',
  COHERENCE = 'coherence',
  RELEVANCE = 'relevance',
  NOVELTY = 'novelty',
  TRUSTWORTHINESS = 'trustworthiness',
}

export enum DataQualityDimension {
  COMPLETENESS = 'completeness',
  ACCURACY = 'accuracy',
  CONSISTENCY = 'consistency',
  TIMELINESS = 'timeliness',
  VALIDITY = 'validity',
  UNIQUENESS = 'uniqueness',
}

export enum ModelType {
  CLASSIFICATION = 'classification',
  REGRESSION = 'regression',
  CLUSTERING = 'clustering',
  ANOMALY_DETECTION = 'anomaly_detection',
  NEURAL_NETWORK = 'neural_network',
  ENSEMBLE = 'ensemble',
}

export enum FeatureType {
  NUMERICAL = 'numerical',
  CATEGORICAL = 'categorical',
  TEXT = 'text',
  TEMPORAL = 'temporal',
  STRUCTURAL = 'structural',
  SEMANTIC = 'semantic',
}

export interface QualityFeatures {
  // Content features
  lengthScore: number;
  complexityScore: number;
  readabilityScore: number;
  structureScore: number;

  // Source features
  sourceCredibility: number;
  sourceReliability: number;
  sourceRecency: number;
  sourceConsensus: number;

  // Semantic features
  semanticCoherence: number;
  topicRelevance: number;
  factualConsistency: number;
  linguisticQuality: number;

  // Context features
  domainRelevance: number;
  temporalRelevance: number;
  culturalRelevance: number;
  personalRelevance: number;
}

export interface QualityPrediction {
  overallScore: number;
  confidence: number;
  dimensionScores: Record<DataQualityDimension, number>;
  metricScores: Record<QualityMetric, number>;
  features: QualityFeatures;
  explanation: string[];
  recommendations: string[];
  uncertainties: string[];
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
  crossValidationScores: number[];
  trainingLoss: number[];
  validationLoss: number[];
}

export interface TrainingConfiguration {
  modelType: ModelType;
  hyperparameters: Record<string, any>;
  featureColumns: string[];
  targetColumn: string;
  validationSplit: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
  regularization: Record<string, number>;
}

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  modelType: ModelType;
  createdAt: Date;
  updatedAt: Date;
  trainingDataSize: number;
  features: FeatureType[];
  performance: ModelPerformance;
  configuration: TrainingConfiguration;
  deploymentStatus: 'training' | 'ready' | 'deployed' | 'deprecated';
}

export interface DataPoint {
  id: string;
  features: Record<string, any>;
  target?: any;
  timestamp: Date;
  source: string;
  quality?: QualityPrediction;
  processed: boolean;
}

export interface BatchPrediction {
  batchId: string;
  dataPoints: DataPoint[];
  predictions: QualityPrediction[];
  modelId: string;
  timestamp: Date;
  processingTime: number;
  confidence: number;
}

export interface LearningCurve {
  epoch: number;
  trainingLoss: number;
  validationLoss: number;
  trainingAccuracy: number;
  validationAccuracy: number;
  learningRate: number;
}

export interface FeatureAnalysis {
  name: string;
  type: FeatureType;
  importance: number;
  correlation: number;
  distribution: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    categories?: string[];
  };
  missing: number;
  outliers: number;
}

/**
 * Quality Assessment Result
 */
export interface QualityAssessmentResult {
  id: string;
  type: 'data_quality' | 'model_performance' | 'learning_effectiveness';
  timestamp: Date;
  metrics: QualityMetrics;
  overallScore: number;
  recommendations: string[];
  context: Record<string, any>;
  processingTime: number;
}

/**
 * Comprehensive Quality Metrics
 */
export interface QualityMetrics {
  dataQuality?: DataQualityMetrics;
  modelPerformance?: ModelPerformanceMetrics;
  learningEffectiveness?: LearningEffectivenessMetrics;
}

/**
 * Data Quality Metrics
 */
export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  freshness: number;
  relevance: number;
  duplicateRate: number;
  outlierRate: number;
  missingValueRate: number;
  schemaCompliance: number;
  dataDistribution: Record<string, number>;
  overallScore: number;
}

/**
 * Model Performance Metrics
 */
export interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  auc: number;
  mse: number;
  mae: number;
  rmse: number;
  confidence: number;
  bias: number;
  variance: number;
  overallScore: number;
}

/**
 * Learning Effectiveness Metrics
 */
export interface LearningEffectivenessMetrics {
  convergenceRate: number;
  stabilityScore: number;
  adaptabilityScore: number;
  knowledgeRetention: number;
  transferability: number;
  learningSpeed: number;
  plateauResistance: number;
  generalizationCapacity: number;
  forgettingRate: number;
  overallScore: number;
}

/**
 * Quality Thresholds
 */
export interface QualityThresholds {
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    freshness: number;
    relevance: number;
  };
  modelPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confidence: number;
  };
  learningEffectiveness: {
    convergenceRate: number;
    stabilityScore: number;
    adaptabilityScore: number;
    knowledgeRetention: number;
    transferability: number;
  };
}
