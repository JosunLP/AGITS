/**
 * Machine Learning Quality Assessment Interfaces
 * Defines interfaces for ML-based quality evaluation
 */

import {
  BatchPrediction,
  DataPoint,
  FeatureAnalysis,
  LearningCurve,
  ModelMetadata,
  ModelPerformance,
  QualityFeatures,
  QualityPrediction,
  TrainingConfiguration,
} from './machine-learning.type.js';

export interface IQualityAssessmentModel {
  // Model training and management
  train(trainingData: DataPoint[]): Promise<ModelPerformance>;
  retrain(newData: DataPoint[]): Promise<ModelPerformance>;

  // Quality prediction
  predict(data: any): Promise<QualityPrediction>;
  predictBatch(dataPoints: DataPoint[]): Promise<BatchPrediction>;

  // Model evaluation
  evaluate(testData: DataPoint[]): Promise<ModelPerformance>;
  crossValidate(data: DataPoint[], folds: number): Promise<number[]>;

  // Feature analysis
  extractFeatures(data: any): Promise<QualityFeatures>;
  analyzeFeatureImportance(): Promise<Record<string, number>>;

  // Model metadata
  getMetadata(): ModelMetadata;
  updateMetadata(metadata: Partial<ModelMetadata>): Promise<void>;
}

export interface IFeatureExtractor {
  // Content feature extraction
  extractContentFeatures(content: string): Promise<{
    lengthScore: number;
    complexityScore: number;
    readabilityScore: number;
    structureScore: number;
  }>;

  // Source feature extraction
  extractSourceFeatures(source: any): Promise<{
    sourceCredibility: number;
    sourceReliability: number;
    sourceRecency: number;
    sourceConsensus: number;
  }>;

  // Semantic feature extraction
  extractSemanticFeatures(
    content: string,
    context?: any
  ): Promise<{
    semanticCoherence: number;
    topicRelevance: number;
    factualConsistency: number;
    linguisticQuality: number;
  }>;

  // Context feature extraction
  extractContextFeatures(
    data: any,
    context: any
  ): Promise<{
    domainRelevance: number;
    temporalRelevance: number;
    culturalRelevance: number;
    personalRelevance: number;
  }>;
}

export interface IModelTrainer {
  // Training operations
  trainModel(
    configuration: TrainingConfiguration,
    trainingData: DataPoint[]
  ): Promise<ModelMetadata>;

  // Hyperparameter optimization
  optimizeHyperparameters(
    baseConfig: TrainingConfiguration,
    searchSpace: Record<string, any[]>
  ): Promise<TrainingConfiguration>;

  // Training monitoring
  monitorTraining(
    modelId: string,
    callback: (curve: LearningCurve) => void
  ): Promise<void>;

  // Model validation
  validateModel(
    modelId: string,
    validationData: DataPoint[]
  ): Promise<ModelPerformance>;
}

export interface IDataPreprocessor {
  // Data cleaning
  cleanData(data: DataPoint[]): Promise<DataPoint[]>;
  handleMissingValues(data: DataPoint[]): Promise<DataPoint[]>;
  detectOutliers(
    data: DataPoint[]
  ): Promise<{ data: DataPoint[]; outliers: DataPoint[] }>;

  // Feature engineering
  engineerFeatures(data: DataPoint[]): Promise<DataPoint[]>;
  normalizeFeatures(data: DataPoint[]): Promise<DataPoint[]>;
  encodeCategories(data: DataPoint[]): Promise<DataPoint[]>;

  // Data augmentation
  augmentData(data: DataPoint[], factor: number): Promise<DataPoint[]>;

  // Data analysis
  analyzeFeatures(data: DataPoint[]): Promise<FeatureAnalysis[]>;
  getDataStatistics(data: DataPoint[]): Promise<Record<string, any>>;
}

export interface IModelRegistry {
  // Model management
  registerModel(metadata: ModelMetadata): Promise<string>;
  getModel(modelId: string): Promise<ModelMetadata>;
  listModels(filter?: Partial<ModelMetadata>): Promise<ModelMetadata[]>;
  updateModel(modelId: string, updates: Partial<ModelMetadata>): Promise<void>;
  deleteModel(modelId: string): Promise<void>;

  // Model versioning
  createVersion(modelId: string, metadata: ModelMetadata): Promise<string>;
  getVersions(modelId: string): Promise<ModelMetadata[]>;
  promoteVersion(modelId: string, version: string): Promise<void>;

  // Model deployment
  deployModel(modelId: string): Promise<void>;
  undeployModel(modelId: string): Promise<void>;
  getDeployedModels(): Promise<ModelMetadata[]>;
}

export interface IInferenceEngine {
  // Prediction services
  predict(modelId: string, data: any): Promise<QualityPrediction>;
  predictBatch(
    modelId: string,
    dataPoints: DataPoint[]
  ): Promise<BatchPrediction>;

  // Model loading
  loadModel(modelId: string): Promise<void>;
  unloadModel(modelId: string): Promise<void>;

  // Performance monitoring
  getModelPerformance(modelId: string): Promise<ModelPerformance>;
  monitorPredictions(
    modelId: string,
    callback: (prediction: QualityPrediction) => void
  ): void;
}

export interface IActiveLearningSampler {
  // Sample selection strategies
  selectUncertainSamples(
    model: IQualityAssessmentModel,
    candidates: DataPoint[],
    count: number
  ): Promise<DataPoint[]>;

  selectDiverseSamples(
    candidates: DataPoint[],
    count: number
  ): Promise<DataPoint[]>;

  selectRepresentativeSamples(
    candidates: DataPoint[],
    count: number
  ): Promise<DataPoint[]>;

  // Query strategies
  queryByCommittee(
    models: IQualityAssessmentModel[],
    candidates: DataPoint[],
    count: number
  ): Promise<DataPoint[]>;

  queryByExpectedModelChange(
    model: IQualityAssessmentModel,
    candidates: DataPoint[],
    count: number
  ): Promise<DataPoint[]>;
}
