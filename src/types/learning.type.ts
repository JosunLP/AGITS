/**
 * Learning-related types and enums
 */

export enum LearningType {
  SUPERVISED = 'supervised',
  UNSUPERVISED = 'unsupervised',
  REINFORCEMENT = 'reinforcement',
  IMITATION = 'imitation',
  ACTIVE = 'active',
  TRANSFER = 'transfer',
  META = 'meta',
  CONTINUAL = 'continual',
  SELF_SUPERVISED = 'self_supervised',
}

export enum LearningPhase {
  EXPLORATION = 'exploration',
  EXPLOITATION = 'exploitation',
  CONSOLIDATION = 'consolidation',
  REFINEMENT = 'refinement',
  GENERALIZATION = 'generalization',
}

export enum LearningStrategy {
  INCREMENTAL = 'incremental',
  BATCH = 'batch',
  ONLINE = 'online',
  ADAPTIVE = 'adaptive',
  CURRICULUM = 'curriculum',
  SELF_PACED = 'self_paced',
}

export enum PerformanceMetric {
  ACCURACY = 'accuracy',
  PRECISION = 'precision',
  RECALL = 'recall',
  F1_SCORE = 'f1_score',
  LOSS = 'loss',
  REWARD = 'reward',
  EFFICIENCY = 'efficiency',
  GENERALIZATION = 'generalization',
}

export enum LearningDifficulty {
  TRIVIAL = 1,
  EASY = 2,
  MODERATE = 3,
  HARD = 4,
  EXPERT = 5,
}

export enum AdaptationTrigger {
  PERFORMANCE_DROP = 'performance_drop',
  NEW_DATA = 'new_data',
  ENVIRONMENT_CHANGE = 'environment_change',
  FEEDBACK = 'feedback',
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
}
