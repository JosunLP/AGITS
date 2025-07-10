/**
 * Reasoning-related types and enums
 */

export enum ReasoningType {
  DEDUCTIVE = 'deductive',
  INDUCTIVE = 'inductive',
  ABDUCTIVE = 'abductive',
  ANALOGICAL = 'analogical',
  CAUSAL = 'causal',
  PROBABILISTIC = 'probabilistic',
  TEMPORAL = 'temporal',
  MODAL = 'modal',
  COUNTERFACTUAL = 'counterfactual',
}

export enum CertaintyLevel {
  VERY_LOW = 'very_low', // 0-20%
  LOW = 'low', // 20-40%
  MODERATE = 'moderate', // 40-60%
  HIGH = 'high', // 60-80%
  VERY_HIGH = 'very_high', // 80-95%
  CERTAIN = 'certain', // 95-100%
}

export enum ReasoningStrategy {
  FAST_AND_FRUGAL = 'fast_and_frugal',
  COMPREHENSIVE = 'comprehensive',
  SATISFICING = 'satisficing',
  OPTIMIZING = 'optimizing',
  HEURISTIC = 'heuristic',
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  IMPLIES = 'implies',
  IF_AND_ONLY_IF = 'if_and_only_if',
  XOR = 'xor',
}

export enum EvidenceType {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  CIRCUMSTANTIAL = 'circumstantial',
  STATISTICAL = 'statistical',
  EXPERT_OPINION = 'expert_opinion',
  EMPIRICAL = 'empirical',
}

export enum ReasoningQuality {
  POOR = 1,
  FAIR = 2,
  GOOD = 3,
  EXCELLENT = 4,
  OUTSTANDING = 5,
}
