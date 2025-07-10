/**
 * Reasoning-related interfaces
 */

import {
  CertaintyLevel,
  EvidenceType,
  LogicalOperator,
  ReasoningQuality,
  ReasoningStrategy,
  ReasoningType,
} from './reasoning.type.js';

export interface ReasoningStep {
  id: string;
  type: ReasoningType;
  premise: string;
  conclusion: string;
  confidence: number;
  evidence: string[];
  timestamp: Date;
  operator?: LogicalOperator;
  metadata?: Record<string, any>;
}

export interface ReasoningResult {
  id: string;
  query: string;
  type: ReasoningType;
  conclusion: string;
  confidence: number;
  reasoning_chain: ReasoningStep[];
  evidence: string[];
  counterarguments: string[];
  certainty_level: CertaintyLevel;
  execution_time: number;
  timestamp: Date;
  strategy?: ReasoningStrategy;
  quality?: ReasoningQuality;
  metadata?: Record<string, any>;
}

export interface ReasoningContext {
  domain: string;
  timeConstraints?: number;
  confidenceThreshold?: number;
  strategy?: ReasoningStrategy;
  priorKnowledge?: string[];
  assumptions?: string[];
  goals?: string[];
  constraints?: string[];
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  strength: number;
  reliability: number;
  source: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface Argument {
  id: string;
  premises: string[];
  conclusion: string;
  strength: number;
  type: 'supporting' | 'opposing' | 'neutral';
  evidence: Evidence[];
  logical_form?: string;
}

export interface ReasoningTask {
  id: string;
  type: ReasoningType;
  input: any;
  context: ReasoningContext;
  priority: number;
  deadline?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: ReasoningResult;
}

export interface ChainOfThoughtStep {
  stepNumber: number;
  thought: string;
  reasoning: string;
  conclusion: string;
  confidence: number;
  references: string[];
}

export interface ChainOfThoughtResult {
  steps: ChainOfThoughtStep[];
  finalConclusion: string;
  overallConfidence: number;
  reasoning_path: string[];
  alternative_paths?: string[][];
}

export interface AnalogicalMapping {
  sourceElement: string;
  targetElement: string;
  similarity: number;
  justification: string;
}

export interface AnalogicalCase {
  id: string;
  domain: string;
  elements: string[];
  relationships: string[];
  outcome?: string;
  context: Record<string, any>;
}

export interface AnalogicalResult {
  sourceCase: AnalogicalCase;
  targetCase: AnalogicalCase;
  mappings: AnalogicalMapping[];
  predictions: string[];
  confidence: number;
  similarities: number[];
}

export interface AbductiveExplanation {
  explanation: string;
  likelihood: number;
  complexity: number;
  evidence: Evidence[];
  score: number;
}

export interface AbductiveResult {
  observations: string[];
  explanations: AbductiveExplanation[];
  bestExplanation?: AbductiveExplanation;
  confidence: number;
  alternative_explanations: AbductiveExplanation[];
}

export interface CausalRelation {
  cause: string;
  effect: string;
  strength: number;
  confidence: number;
  conditions?: string[];
  temporal_order: number;
  mechanism?: string;
}

export interface CausalChain {
  relations: CausalRelation[];
  totalStrength: number;
  confidence: number;
  intermediateSteps: string[];
}

export interface ProbabilisticInference {
  hypothesis: string;
  priorProbability: number;
  likelihood: number;
  posteriorProbability: number;
  evidence: Evidence[];
  bayesianUpdate: boolean;
}
