/**
 * Reinforcement Learning Types
 * Defines types for reinforcement learning components
 */

export enum ActionType {
  // Knowledge actions
  COLLECT_KNOWLEDGE = 'collect_knowledge',
  VALIDATE_KNOWLEDGE = 'validate_knowledge',
  CONSOLIDATE_MEMORY = 'consolidate_memory',
  PRUNE_CONNECTIONS = 'prune_connections',

  // Learning actions
  EXPLORE_DATA = 'explore_data',
  EXPLOIT_KNOWLEDGE = 'exploit_knowledge',
  UPDATE_MODEL = 'update_model',
  ADJUST_PARAMETERS = 'adjust_parameters',

  // Decision actions
  MAKE_DECISION = 'make_decision',
  PLAN_STRATEGY = 'plan_strategy',
  EXECUTE_TASK = 'execute_task',
  EVALUATE_OUTCOME = 'evaluate_outcome',
}

export enum RewardType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

export enum LearningStrategy {
  Q_LEARNING = 'q_learning',
  DEEP_Q_LEARNING = 'deep_q_learning',
  POLICY_GRADIENT = 'policy_gradient',
  ACTOR_CRITIC = 'actor_critic',
  TEMPORAL_DIFFERENCE = 'temporal_difference',
}

export enum ExplorationStrategy {
  EPSILON_GREEDY = 'epsilon_greedy',
  UCB = 'upper_confidence_bound',
  THOMPSON_SAMPLING = 'thompson_sampling',
  BOLTZMANN = 'boltzmann',
}

export interface State {
  id: string;
  timestamp: Date;
  features: Record<string, number>;
  context: Record<string, any>;
  confidence: number;
  priority: number;
}

export interface Action {
  id: string;
  type: ActionType;
  parameters: Record<string, any>;
  expectedReward: number;
  confidence: number;
  cost: number;
  priority: number;
}

export interface Experience {
  id: string;
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
  timestamp: Date;
  episodeId: string;
}

export interface QValue {
  stateId: string;
  actionId: string;
  value: number;
  visits: number;
  lastUpdated: Date;
}

export interface Policy {
  id: string;
  name: string;
  strategy: LearningStrategy;
  parameters: Record<string, number>;
  performance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Episode {
  id: string;
  experiences: Experience[];
  totalReward: number;
  duration: number;
  startState: State;
  endState: State;
  successful: boolean;
  timestamp: Date;
}

export interface LearningMetrics {
  totalEpisodes: number;
  averageReward: number;
  explorationRate: number;
  learningRate: number;
  convergenceScore: number;
  performanceTrend: number[];
  lastEpisodeReward: number;
}
