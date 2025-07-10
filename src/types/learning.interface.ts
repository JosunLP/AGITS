/**
 * Learning-related interfaces
 */

import {
  AdaptationTrigger,
  LearningDifficulty,
  LearningPhase,
  LearningStrategy,
  LearningType,
  PerformanceMetric,
} from './learning.type.js';

export interface LearningExperience {
  id: string;
  type: LearningType;
  input: any;
  expectedOutput?: any;
  actualOutput?: any;
  reward: number;
  confidence: number;
  timestamp: Date;
  context: LearningContext;
  feedback?: LearningFeedback;
  difficulty?: LearningDifficulty;
  metadata: Record<string, any>;
}

export interface LearningContext {
  sessionId: string;
  environment: Record<string, any>;
  goals: string[];
  constraints: string[];
  priorKnowledge: string[];
  resources: ResourceAvailability;
  timeConstraints?: number;
}

export interface ResourceAvailability {
  computeUnits: number;
  memoryGB: number;
  storageGB: number;
  networkBandwidth: number;
  timeSeconds: number;
}

export interface LearningFeedback {
  type: 'positive' | 'negative' | 'neutral' | 'corrective';
  strength: number;
  source: string;
  explanation?: string;
  suggestions?: string[];
  timestamp: Date;
}

export interface LearningTask {
  id: string;
  type: LearningType;
  experience: LearningExperience;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: LearningResult;
  retryCount: number;
  maxRetries: number;
}

export interface LearningResult {
  taskId: string;
  type: LearningType;
  success: boolean;
  performance: LearningPerformanceMetrics;
  insights: LearningInsight[];
  adaptations: ModelAdaptation[];
  processingTime: number;
  resourceUsage: LearningResourceUsage;
  confidence: number;
  error?: string;
  metadata: Record<string, any>;
}

export interface LearningPerformanceMetrics {
  [PerformanceMetric.ACCURACY]?: number;
  [PerformanceMetric.PRECISION]?: number;
  [PerformanceMetric.RECALL]?: number;
  [PerformanceMetric.F1_SCORE]?: number;
  [PerformanceMetric.LOSS]?: number;
  [PerformanceMetric.REWARD]?: number;
  [PerformanceMetric.EFFICIENCY]?: number;
  [PerformanceMetric.GENERALIZATION]?: number;
  custom?: Record<string, number>;
}

export interface LearningResourceUsage {
  cpuTime: number;
  memoryPeak: number;
  storageUsed: number;
  networkTransfer: number;
  energyConsumed?: number;
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'improvement' | 'degradation' | 'anomaly' | 'opportunity';
  description: string;
  confidence: number;
  actionable: boolean;
  priority: number;
  relatedExperiences: string[];
  recommendations: string[];
  discoveredAt: Date;
}

export interface ModelAdaptation {
  type:
    | 'weight_update'
    | 'structure_change'
    | 'parameter_tuning'
    | 'strategy_change';
  description: string;
  trigger: AdaptationTrigger;
  magnitude: number;
  confidence: number;
  expectedImprovement: number;
  appliedAt: Date;
  validatedAt?: Date;
  success?: boolean;
}

export interface LearningCycle {
  id: string;
  phase: LearningPhase;
  strategy: LearningStrategy;
  startTime: Date;
  endTime?: Date;
  experiencesProcessed: number;
  performanceGain: number;
  adaptationsMade: number;
  insightsGained: number;
  status: 'active' | 'completed' | 'paused' | 'aborted';
  metadata: Record<string, any>;
}

export interface AdaptiveLearningConfig {
  baseStrategy: LearningStrategy;
  adaptationThreshold: number;
  performanceWindow: number;
  maxAdaptations: number;
  evaluationInterval: number;
  fallbackStrategy: LearningStrategy;
  enableMetaLearning: boolean;
  curriculumDifficulty: LearningDifficulty;
}

export interface CurriculumItem {
  id: string;
  difficulty: LearningDifficulty;
  prerequisites: string[];
  learningObjectives: string[];
  experiences: LearningExperience[];
  estimatedDuration: number;
  success_criteria: SuccessCriteria;
}

export interface SuccessCriteria {
  minimumAccuracy: number;
  minimumConfidence: number;
  maximumErrors: number;
  consistency: number;
  generalization: number;
}

export interface LearningProgress {
  totalExperiences: number;
  successfulExperiences: number;
  failedExperiences: number;
  averagePerformance: LearningPerformanceMetrics;
  learningRate: number;
  forgettingRate: number;
  knowledgeRetention: number;
  skillTransfer: number;
  currentPhase: LearningPhase;
  timeSpent: number;
  milestonesAchieved: string[];
}

export interface MetaLearningState {
  learningToLearnProgress: number;
  optimalStrategies: Map<string, LearningStrategy>;
  transferPatterns: TransferPattern[];
  adaptationHistory: ModelAdaptation[];
  performanceTrends: PerformanceTrend[];
  metacognitiveMoments: MetacognitiveInsight[];
}

export interface TransferPattern {
  sourceTask: string;
  targetTask: string;
  transferability: number;
  sharedFeatures: string[];
  adaptationRequired: ModelAdaptation[];
  successProbability: number;
}

export interface PerformanceTrend {
  metric: PerformanceMetric;
  values: number[];
  timestamps: Date[];
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  confidence: number;
  predictedNext: number;
}

export interface MetacognitiveInsight {
  id: string;
  type: 'strength' | 'weakness' | 'strategy' | 'bias' | 'limitation';
  description: string;
  confidence: number;
  evidence: string[];
  implications: string[];
  recommendations: string[];
  discoveredAt: Date;
}
