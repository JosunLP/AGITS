/**
 * Reinforcement Learning Agent
 * Advanced RL agent for autonomous decision making and learning
 */

import { EventEmitter } from 'events';
import {
  RLAction as Action,
  Episode,
  Experience,
  IEnvironment,
  IExperienceReplay,
  IExplorationStrategy,
  IReinforcementLearningAgent,
  IRewardFunction,
  IValueFunction,
  RLMetrics as LearningMetrics,
  RLLearningStrategy as LearningStrategy,
  RLPolicy as Policy,
  QValue,
  RLState as State,
} from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class ReinforcementLearningAgent
  extends EventEmitter
  implements IReinforcementLearningAgent
{
  private readonly logger: Logger;
  private readonly environment: IEnvironment;
  private readonly rewardFunction: IRewardFunction;
  private readonly valueFunction: IValueFunction;
  private readonly explorationStrategy: IExplorationStrategy;
  private readonly experienceReplay: IExperienceReplay;

  private currentPolicy: Policy;
  private currentState: State | null = null;
  private learningRate: number = 0.001;
  private explorationRate: number = 0.1;
  private discountFactor: number = 0.99;
  private episodes: Episode[] = [];
  private experiences: Experience[] = [];
  private isTraining: boolean = false;

  // Performance tracking
  private metrics: LearningMetrics = {
    totalEpisodes: 0,
    averageReward: 0,
    explorationRate: 0.1,
    learningRate: 0.001,
    convergenceScore: 0,
    performanceTrend: [],
    lastEpisodeReward: 0,
  };

  constructor(
    environment: IEnvironment,
    rewardFunction: IRewardFunction,
    valueFunction: IValueFunction,
    explorationStrategy: IExplorationStrategy,
    experienceReplay: IExperienceReplay,
    logger: Logger
  ) {
    super();

    this.environment = environment;
    this.rewardFunction = rewardFunction;
    this.valueFunction = valueFunction;
    this.explorationStrategy = explorationStrategy;
    this.experienceReplay = experienceReplay;
    this.logger = logger;

    // Initialize default policy
    this.currentPolicy = {
      id: 'default',
      name: 'Default Q-Learning Policy',
      strategy: LearningStrategy.Q_LEARNING,
      parameters: {
        learningRate: this.learningRate,
        discountFactor: this.discountFactor,
        explorationRate: this.explorationRate,
      },
      performance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Core learning from experience
   */
  async learn(experience: Experience): Promise<void> {
    try {
      // Store experience
      await this.addExperience(experience);

      // Update Q-values based on the experience
      await this.updateValueFunction(experience);

      // Emit learning event
      this.emit('experienceLearned', experience);

      this.logger.debug('Learned from experience', {
        state: experience.state.id,
        action: experience.action.type,
        reward: experience.reward,
      });
    } catch (error) {
      this.logger.error('Error learning from experience:', error);
      throw error;
    }
  }

  /**
   * Select action based on current policy
   */
  async act(state: State): Promise<Action> {
    try {
      this.currentState = state;

      // Get valid actions for current state
      const validActions = await this.environment.getValidActions(state);

      if (validActions.length === 0) {
        throw new Error('No valid actions available for current state');
      }

      // Get Q-values for all valid actions
      const qValues: QValue[] = [];
      for (const action of validActions) {
        const value = await this.valueFunction.getQValue(state, action);
        qValues.push({
          stateId: state.id,
          actionId: action.id,
          value,
          visits: 1,
          lastUpdated: new Date(),
        });
      }

      // Use exploration strategy to select action
      const selectedAction = await this.explorationStrategy.selectAction(
        state,
        validActions,
        qValues
      );

      this.logger.debug('Action selected', {
        state: state.id,
        action: selectedAction.type,
        explorationRate: this.explorationRate,
      });

      return selectedAction;
    } catch (error) {
      this.logger.error('Error selecting action:', error);
      throw error;
    }
  }

  /**
   * Evaluate state-action pair
   */
  async evaluate(state: State, action: Action): Promise<number> {
    return await this.valueFunction.getQValue(state, action);
  }

  /**
   * Update policy
   */
  async updatePolicy(policy: Policy): Promise<void> {
    this.currentPolicy = {
      ...policy,
      updatedAt: new Date(),
    };

    // Update learning parameters
    this.learningRate = policy.parameters.learningRate || this.learningRate;
    this.explorationRate =
      policy.parameters.explorationRate || this.explorationRate;
    this.discountFactor =
      policy.parameters.discountFactor || this.discountFactor;

    this.emit('policyUpdated', this.currentPolicy);
  }

  /**
   * Get current policy
   */
  getCurrentPolicy(): Policy {
    return { ...this.currentPolicy };
  }

  /**
   * Add experience to memory
   */
  async addExperience(experience: Experience): Promise<void> {
    this.experiences.push(experience);
    await this.experienceReplay.store(experience);

    // Limit experience buffer size
    if (this.experiences.length > 10000) {
      this.experiences.shift();
    }
  }

  /**
   * Get experiences with optional filtering
   */
  async getExperiences(filter?: Partial<Experience>): Promise<Experience[]> {
    if (!filter) {
      return [...this.experiences];
    }

    return this.experiences.filter((exp) => {
      for (const [key, value] of Object.entries(filter)) {
        if (exp[key as keyof Experience] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Train the agent using episodes
   */
  async train(episodes: Episode[]): Promise<LearningMetrics> {
    this.isTraining = true;

    try {
      this.logger.info(`Starting training with ${episodes.length} episodes`);

      // Extract all experiences from episodes
      const allExperiences: Experience[] = [];
      for (const episode of episodes) {
        allExperiences.push(...episode.experiences);
      }

      // Batch update value function
      const updates = [];
      for (const experience of allExperiences) {
        const target = await this.calculateTarget(experience);
        updates.push({
          state: experience.state,
          action: experience.action,
          value: target,
        });
      }

      await this.valueFunction.batchUpdate(updates);

      // Update metrics
      this.episodes.push(...episodes);
      await this.updateMetrics(episodes);

      // Decay exploration rate
      this.decayExplorationRate();

      this.logger.info('Training completed', {
        episodeCount: episodes.length,
        averageReward: this.metrics.averageReward,
        explorationRate: this.explorationRate,
      });

      this.emit('trainingCompleted', this.metrics);

      return this.metrics;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Retrain using experience replay
   */
  async retrain(): Promise<void> {
    const batchSize = 64;
    const experiences = await this.experienceReplay.sample(batchSize);

    for (const experience of experiences) {
      await this.learn(experience);
    }

    this.logger.info(`Retrained with ${experiences.length} experiences`);
  }

  /**
   * Perceive current state from environment
   */
  async perceiveState(): Promise<State> {
    const state = this.environment.getCurrentState();
    this.currentState = state;
    return state;
  }

  /**
   * Update current state
   */
  updateState(state: State): void {
    this.currentState = state;
  }

  /**
   * Get learning metrics
   */
  getMetrics(): LearningMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance score
   */
  getPerformance(): number {
    return this.currentPolicy.performance;
  }

  /**
   * Set learning rate
   */
  setLearningRate(rate: number): void {
    this.learningRate = Math.max(0, Math.min(1, rate));
    this.currentPolicy.parameters.learningRate = this.learningRate;
  }

  /**
   * Set exploration rate
   */
  setExplorationRate(rate: number): void {
    this.explorationRate = Math.max(0, Math.min(1, rate));
    this.currentPolicy.parameters.explorationRate = this.explorationRate;
  }

  /**
   * Set learning strategy
   */
  setStrategy(strategy: LearningStrategy): void {
    this.currentPolicy.strategy = strategy;
    this.emit('strategyChanged', strategy);
  }

  /**
   * Calculate Q-learning target value
   */
  private async calculateTarget(experience: Experience): Promise<number> {
    if (experience.done) {
      return experience.reward;
    }

    // Get max Q-value for next state
    const nextStateActions = await this.environment.getValidActions(
      experience.nextState
    );
    let maxNextQValue = -Infinity;

    for (const action of nextStateActions) {
      const qValue = await this.valueFunction.getQValue(
        experience.nextState,
        action
      );
      maxNextQValue = Math.max(maxNextQValue, qValue);
    }

    // Q-learning update formula: reward + discount * max(Q(s', a'))
    return experience.reward + this.discountFactor * (maxNextQValue || 0);
  }

  /**
   * Update value function based on experience
   */
  private async updateValueFunction(experience: Experience): Promise<void> {
    const currentQValue = await this.valueFunction.getQValue(
      experience.state,
      experience.action
    );

    const target = await this.calculateTarget(experience);
    const newQValue =
      currentQValue + this.learningRate * (target - currentQValue);

    await this.valueFunction.updateQValue(
      experience.state,
      experience.action,
      newQValue
    );
  }

  /**
   * Update learning metrics
   */
  private async updateMetrics(episodes: Episode[]): Promise<void> {
    const totalReward = episodes.reduce((sum, ep) => sum + ep.totalReward, 0);
    const avgReward = episodes.length > 0 ? totalReward / episodes.length : 0;

    this.metrics.totalEpisodes += episodes.length;
    this.metrics.averageReward =
      (this.metrics.averageReward *
        (this.metrics.totalEpisodes - episodes.length) +
        totalReward) /
      this.metrics.totalEpisodes;

    this.metrics.explorationRate = this.explorationRate;
    this.metrics.learningRate = this.learningRate;
    this.metrics.lastEpisodeReward =
      episodes[episodes.length - 1]?.totalReward || 0;

    // Update performance trend
    this.metrics.performanceTrend.push(avgReward);
    if (this.metrics.performanceTrend.length > 100) {
      this.metrics.performanceTrend.shift();
    }

    // Calculate convergence score (stability of recent performance)
    if (this.metrics.performanceTrend.length >= 10) {
      const recentTrend = this.metrics.performanceTrend.slice(-10);
      const variance = this.calculateVariance(recentTrend);
      this.metrics.convergenceScore = Math.max(0, 1 - variance);
    }

    // Update policy performance
    this.currentPolicy.performance = this.metrics.averageReward;
  }

  /**
   * Decay exploration rate over time
   */
  private decayExplorationRate(): void {
    const decayRate = 0.995;
    const minExplorationRate = 0.01;

    this.explorationRate = Math.max(
      minExplorationRate,
      this.explorationRate * decayRate
    );

    this.explorationStrategy.updateExplorationRate(this.metrics.totalEpisodes);
  }

  /**
   * Calculate variance of a numeric array
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
