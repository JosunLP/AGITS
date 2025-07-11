/**
 * Reinforcement Learning Interfaces
 * Defines interfaces for reinforcement learning components
 */

import {
  Action,
  Episode,
  Experience,
  LearningMetrics,
  LearningStrategy,
  Policy,
  QValue,
  RewardType,
  State,
} from './reinforcement-learning.type.js';

export interface IReinforcementLearningAgent {
  // Core learning methods
  learn(experience: Experience): Promise<void>;
  act(state: State): Promise<Action>;
  evaluate(state: State, action: Action): Promise<number>;

  // Policy management
  updatePolicy(policy: Policy): Promise<void>;
  getCurrentPolicy(): Policy;

  // Experience management
  addExperience(experience: Experience): Promise<void>;
  getExperiences(filter?: Partial<Experience>): Promise<Experience[]>;

  // Training methods
  train(episodes: Episode[]): Promise<LearningMetrics>;
  retrain(): Promise<void>;

  // State management
  perceiveState(): Promise<State>;
  updateState(state: State): void;

  // Metrics and monitoring
  getMetrics(): LearningMetrics;
  getPerformance(): number;

  // Configuration
  setLearningRate(rate: number): void;
  setExplorationRate(rate: number): void;
  setStrategy(strategy: LearningStrategy): void;
}

export interface IRewardFunction {
  calculateReward(
    state: State,
    action: Action,
    nextState: State,
    context?: Record<string, any>
  ): Promise<number>;

  getRewardType(reward: number): RewardType;

  // Reward shaping
  shapeReward(baseReward: number, context: Record<string, any>): number;
}

export interface IEnvironment {
  // Environment interaction
  step(action: Action): Promise<{
    nextState: State;
    reward: number;
    done: boolean;
    info: Record<string, any>;
  }>;

  reset(): Promise<State>;
  render(): string;

  // State management
  getCurrentState(): State;
  isTerminal(state: State): boolean;

  // Action validation
  getValidActions(state: State): Promise<Action[]>;
  isValidAction(state: State, action: Action): boolean;
}

export interface IExplorationStrategy {
  selectAction(
    state: State,
    availableActions: Action[],
    qValues: QValue[]
  ): Promise<Action>;

  updateExplorationRate(episode: number): void;
  getExplorationRate(): number;
}

export interface IValueFunction {
  // Q-Learning
  getQValue(state: State, action: Action): Promise<number>;
  updateQValue(state: State, action: Action, value: number): Promise<void>;

  // State value
  getStateValue(state: State): Promise<number>;

  // Batch operations
  batchUpdate(
    updates: Array<{
      state: State;
      action: Action;
      value: number;
    }>
  ): Promise<void>;
}

export interface IExperienceReplay {
  // Memory management
  store(experience: Experience): Promise<void>;
  sample(batchSize: number): Promise<Experience[]>;

  // Prioritized replay
  samplePrioritized(
    batchSize: number,
    priorityWeight: number
  ): Promise<Experience[]>;

  updatePriorities(
    experiences: Experience[],
    priorities: number[]
  ): Promise<void>;

  // Memory operations
  clear(): Promise<void>;
  size(): number;
}

export interface IModelPredictor {
  // Model-based predictions
  predictNextState(state: State, action: Action): Promise<State>;
  predictReward(state: State, action: Action): Promise<number>;

  // Model learning
  updateModel(experiences: Experience[]): Promise<void>;
  getModelAccuracy(): number;
}

export interface IMetaLearner {
  // Meta-learning capabilities
  adaptToNewTask(taskDescription: string): Promise<Policy>;
  transferKnowledge(sourceTask: string, targetTask: string): Promise<void>;

  // Few-shot learning
  learnFromFewExamples(examples: Experience[]): Promise<Policy>;

  // Strategy optimization
  optimizeStrategy(metrics: LearningMetrics): Promise<LearningStrategy>;
}
