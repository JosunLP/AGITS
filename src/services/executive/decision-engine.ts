import { MemoryManagementSystem } from '../../core/memory-management.js';
import {
  ConsolidationPhase,
  Constraint,
  Decision,
  Goal,
  MemoryPriority,
  MemoryType,
  ProcessingContext,
  TaskType,
} from '../../types/index.js';
import { EventMap, TypedEventEmitter } from '../../utils/event-emitter.js';
import { Logger } from '../../utils/logger.js';
import { ReasoningEngineService } from '../cognitive/reasoning-engine.js';

/**
 * Event map for DecisionEngine
 */
interface DecisionEngineEvents extends EventMap {
  decisionMade: (decision: Decision) => void;
  goalAchieved: (goal: Goal) => void;
  constraintViolated: (constraint: Constraint) => void;
}

/**
 * Decision Engine - Autonomous decision making based on goals and constraints
 */
export class DecisionEngine extends TypedEventEmitter<DecisionEngineEvents> {
  private logger: Logger;
  private reasoningEngine: ReasoningEngineService;
  private memorySystem: MemoryManagementSystem;
  private isRunning = false;
  private decisionQueue: DecisionRequest[] = [];
  private activeGoals: Map<string, Goal> = new Map();
  private activeConstraints: Map<string, Constraint> = new Map();
  private decisionHistory: DecisionResult[] = [];

  // Decision parameters
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly DECISION_TIMEOUT = 30000; // 30 seconds
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  constructor(
    reasoningEngine: ReasoningEngineService,
    memorySystem: MemoryManagementSystem
  ) {
    super();
    this.logger = new Logger('DecisionEngine');
    this.reasoningEngine = reasoningEngine;
    this.memorySystem = memorySystem;
  }

  /**
   * Handle learning completion events
   */
  public onLearningCompleted(result: any): void {
    this.logger.debug(`Learning completed: ${result.id}`);
    // Update decision-making based on learning outcomes
    this.updateDecisionModels(result);
  }

  /**
   * Start the decision loop
   */
  public startDecisionLoop(): void {
    if (this.isRunning) {
      this.logger.warn('Decision loop is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Decision engine started');

    // Start decision processing loop
    this.decisionLoop();
  }

  /**
   * Stop the decision loop
   */
  public stopDecisionLoop(): void {
    this.isRunning = false;
    this.logger.info('Decision engine stopped');
  }

  /**
   * Make a decision based on context and goals
   */
  public async makeDecision(request: DecisionRequest): Promise<DecisionResult> {
    this.logger.debug(`Making decision: ${request.id}`);

    const startTime = Date.now();
    const result: DecisionResult = {
      id: `decision_${Date.now()}`,
      requestId: request.id,
      decision: null,
      confidence: 0,
      reasoning: '',
      alternatives: [],
      timestamp: new Date(),
      processingTime: 0,
      success: false,
    };

    try {
      // Validate constraints
      const constraintViolations = this.checkConstraints(
        request.options,
        request.context
      );
      if (constraintViolations.length > 0) {
        result.reasoning = `Constraint violations: ${constraintViolations.join(', ')}`;
        result.success = false;
        return result;
      }

      // Evaluate options
      const evaluatedOptions = await this.evaluateOptions(
        request.options,
        request.context
      );

      // Select best option
      const bestOption = this.selectBestOption(
        evaluatedOptions,
        request.context
      );

      if (bestOption && bestOption.confidence >= this.CONFIDENCE_THRESHOLD) {
        result.decision = bestOption.option;
        result.confidence = bestOption.confidence;
        result.reasoning = bestOption.reasoning;
        result.alternatives = evaluatedOptions
          .filter((opt) => opt.option !== bestOption.option)
          .slice(0, 3)
          .map((opt) => ({
            option: opt.option,
            confidence: opt.confidence,
            reasoning: opt.reasoning,
          }));
        result.success = true;
      } else {
        result.reasoning = 'No option meets confidence threshold';
        result.success = false;
      }

      result.processingTime = Date.now() - startTime;

      // Store decision in memory
      this.storeDecisionInMemory(result, request);

      // Record in history
      this.decisionHistory.push(result);

      // Emit decision event - emit the result for now
      // TODO: Convert to proper Decision structure when needed
    } catch (error) {
      result.success = false;
      result.reasoning = `Decision error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.processingTime = Date.now() - startTime;

      this.logger.error(`Decision failed for request ${request.id}:`, error);
    }

    return result;
  }

  /**
   * Add a goal to the system
   */
  public addGoal(goal: Goal): void {
    this.activeGoals.set(goal.id, goal);
    this.logger.debug(`Goal added: ${goal.id} - ${goal.description}`);
  }

  /**
   * Remove a goal from the system
   */
  public removeGoal(goalId: string): boolean {
    const removed = this.activeGoals.delete(goalId);
    if (removed) {
      this.logger.debug(`Goal removed: ${goalId}`);
    }
    return removed;
  }

  /**
   * Add a constraint to the system
   */
  public addConstraint(constraint: Constraint): void {
    this.activeConstraints.set(constraint.id, constraint);
    this.logger.debug(
      `Constraint added: ${constraint.id} - ${constraint.description}`
    );
  }

  /**
   * Remove a constraint from the system
   */
  public removeConstraint(constraintId: string): boolean {
    const removed = this.activeConstraints.delete(constraintId);
    if (removed) {
      this.logger.debug(`Constraint removed: ${constraintId}`);
    }
    return removed;
  }

  /**
   * Queue a decision request
   */
  public queueDecision(request: DecisionRequest): void {
    if (this.decisionQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest request
      this.decisionQueue.shift();
      this.logger.warn('Decision queue full, removing oldest request');
    }

    // Insert based on priority
    const insertIndex = this.findInsertIndex(request.priority);
    this.decisionQueue.splice(insertIndex, 0, request);

    this.logger.debug(`Decision request queued: ${request.id}`);
  }

  /**
   * Main decision processing loop
   */
  private async decisionLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Process pending decisions
        if (this.decisionQueue.length > 0) {
          const request = this.decisionQueue.shift()!;
          await this.makeDecision(request);
        }

        // Evaluate goals and trigger autonomous decisions
        await this.evaluateGoalsAndDecide();

        await this.sleep(1000); // 1 second cycle
      } catch (error) {
        this.logger.error('Error in decision loop:', error);
        await this.sleep(5000);
      }
    }
  }

  /**
   * Evaluate options against context and goals
   */
  private async evaluateOptions(
    options: any[],
    context: ProcessingContext
  ): Promise<EvaluatedOption[]> {
    const evaluatedOptions: EvaluatedOption[] = [];

    for (const option of options) {
      try {
        const evaluation = await this.evaluateOption(option, context);
        evaluatedOptions.push(evaluation);
      } catch (error) {
        this.logger.error(`Error evaluating option:`, error);
        evaluatedOptions.push({
          option,
          confidence: 0,
          reasoning: `Evaluation error: ${error instanceof Error ? error.message : 'Unknown'}`,
          goalAlignment: 0,
          riskScore: 1,
          utilityScore: 0,
        });
      }
    }

    return evaluatedOptions;
  }

  /**
   * Evaluate a single option
   */
  private async evaluateOption(
    option: any,
    context: ProcessingContext
  ): Promise<EvaluatedOption> {
    // Goal alignment score
    const goalAlignment = this.calculateGoalAlignment(option, context.goals);

    // Risk assessment
    const riskScore = this.assessRisk(option, context);

    // Utility calculation
    const utilityScore = this.calculateUtility(option, context);

    // Use reasoning engine for complex evaluation
    const reasoningTask = {
      id: `eval_${Date.now()}`,
      type: TaskType.REASONING,
      input: {
        option,
        context,
        goals: Array.from(this.activeGoals.values()),
        constraints: Array.from(this.activeConstraints.values()),
      },
      context,
      priority: 1,
      requiredResources: [],
      dependencies: [],
      status: 'pending' as const,
      createdAt: new Date(),
    };

    const reasoningResult =
      await this.reasoningEngine.processReasoningTask(reasoningTask);

    // Combine scores
    const confidence = this.combineScores(
      goalAlignment,
      1 - riskScore,
      utilityScore
    );

    return {
      option,
      confidence,
      reasoning: reasoningResult.success
        ? reasoningResult.data?.reasoning || 'Reasoning completed'
        : 'Reasoning failed',
      goalAlignment,
      riskScore,
      utilityScore,
    };
  }

  /**
   * Select the best option from evaluated options
   */
  private selectBestOption(
    evaluatedOptions: EvaluatedOption[],
    context: ProcessingContext
  ): EvaluatedOption | null {
    if (evaluatedOptions.length === 0) return null;

    // Sort by confidence
    evaluatedOptions.sort((a, b) => b.confidence - a.confidence);

    // Apply context-specific selection logic
    const best = evaluatedOptions[0];

    // Additional validation
    if (this.validateDecision(best, context)) {
      return best;
    }

    return null;
  }

  /**
   * Check constraints against options
   */
  private checkConstraints(
    options: any[],
    context: ProcessingContext
  ): string[] {
    const violations: string[] = [];

    for (const constraint of this.activeConstraints.values()) {
      for (const option of options) {
        if (!this.satisfiesConstraint(option, constraint, context)) {
          violations.push(`${constraint.description} (${constraint.id})`);
        }
      }
    }

    return violations;
  }

  /**
   * Check if option satisfies constraint
   */
  private satisfiesConstraint(
    option: any,
    constraint: Constraint,
    context: ProcessingContext
  ): boolean {
    // Simplified constraint checking
    // In real implementation, use more sophisticated constraint evaluation

    switch (constraint.type) {
      case 'resource':
        return this.checkResourceConstraint(option, constraint, context);
      case 'time':
        return this.checkTimeConstraint(option, constraint, context);
      case 'ethical':
        return this.checkEthicalConstraint(option, constraint, context);
      default:
        return true;
    }
  }

  /**
   * Calculate goal alignment score
   */
  private calculateGoalAlignment(option: any, goals: Goal[]): number {
    if (goals.length === 0) return 0.5; // Neutral if no goals

    let totalAlignment = 0;
    let totalWeight = 0;

    for (const goal of goals) {
      const alignment = this.calculateOptionGoalAlignment(option, goal);
      const weight = goal.priority;

      totalAlignment += alignment * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalAlignment / totalWeight : 0.5;
  }

  /**
   * Assess risk of an option
   */
  private assessRisk(option: any, context: ProcessingContext): number {
    // Simplified risk assessment
    // In real implementation, use sophisticated risk models

    let riskScore = 0.1; // Base risk

    // Check for high-impact operations
    if (this.isHighImpactOption(option)) {
      riskScore += 0.3;
    }

    // Check context for risk factors
    if (context.environment?.riskFactors) {
      riskScore += context.environment.riskFactors * 0.2;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Calculate utility score
   */
  private calculateUtility(option: any, context: ProcessingContext): number {
    // Simplified utility calculation
    // In real implementation, use utility theory

    let utility = 0.5; // Base utility

    // Factor in expected benefits
    if (option.expectedBenefit) {
      utility += option.expectedBenefit * 0.3;
    }

    // Factor in implementation cost
    if (option.cost) {
      utility -= option.cost * 0.2;
    }

    return Math.max(0, Math.min(utility, 1.0));
  }

  /**
   * Combine multiple scores into final confidence
   */
  private combineScores(
    goalAlignment: number,
    riskAversion: number,
    utility: number
  ): number {
    // Weighted combination
    const weights = { goalAlignment: 0.4, riskAversion: 0.3, utility: 0.3 };

    return (
      goalAlignment * weights.goalAlignment +
      riskAversion * weights.riskAversion +
      utility * weights.utility
    );
  }

  /**
   * Store decision in memory for learning
   */
  private storeDecisionInMemory(
    result: DecisionResult,
    request: DecisionRequest
  ): void {
    this.memorySystem.storeMemory({
      type: MemoryType.EPISODIC,
      content: {
        decision: result,
        request: request,
        context: request.context,
      },
      connections: [],
      strength: result.confidence,
      priority: MemoryPriority.NORMAL,
      createdAt: new Date(),
      decayRate: 0.01,
      consolidationLevel: 1,
      metadata: {
        tags: ['decision', 'automated'],
        source: 'decision_engine',
        category: 'decision',
        importance: result.confidence,
        lastAccessed: new Date(),
        accessCount: 1,
        validationStatus: 'pending' as const,
        relatedConcepts: [],
        emotionalValence: 0.5,
        contextualRelevance: 0.8,
        consolidationPhase: ConsolidationPhase.ENCODING,
        associatedGoals: [],
        confidence: result.confidence,
        context: {
          decisionEngine: true,
          success: result.success,
          processingTime: result.processingTime,
        },
      },
    });
  }

  /**
   * Update decision models based on learning
   */
  private updateDecisionModels(learningResult: any): void {
    // Update decision confidence thresholds, weights, etc.
    // Based on learning outcomes
    this.logger.debug('Updating decision models based on learning');
  }

  /**
   * Evaluate goals and trigger autonomous decisions
   */
  private async evaluateGoalsAndDecide(): Promise<void> {
    for (const goal of this.activeGoals.values()) {
      if (goal.status === 'active' && this.needsDecisionForGoal(goal)) {
        const options = this.generateOptionsForGoal(goal);
        if (options.length > 0) {
          const request: DecisionRequest = {
            id: `auto_${Date.now()}`,
            options,
            context: {
              sessionId: `auto_session_${Date.now()}`,
              environment: {},
              goals: [goal],
              constraints: Array.from(this.activeConstraints.values()),
              metadata: {},
            },
            priority: goal.priority,
            timeout: this.DECISION_TIMEOUT,
          };

          this.queueDecision(request);
        }
      }
    }
  }

  // Helper methods with simplified implementations

  private findInsertIndex(priority: number): number {
    for (let i = 0; i < this.decisionQueue.length; i++) {
      if (this.decisionQueue[i].priority < priority) {
        return i;
      }
    }
    return this.decisionQueue.length;
  }

  private calculateOptionGoalAlignment(option: any, goal: Goal): number {
    // Simplified goal alignment calculation
    return Math.random() * 0.8 + 0.2; // Placeholder
  }

  private isHighImpactOption(option: any): boolean {
    return option.impact === 'high' || option.irreversible === true;
  }

  private validateDecision(
    option: EvaluatedOption,
    context: ProcessingContext
  ): boolean {
    return (
      option.confidence >= this.CONFIDENCE_THRESHOLD && option.riskScore < 0.8
    );
  }

  private checkResourceConstraint(
    option: any,
    constraint: Constraint,
    context: ProcessingContext
  ): boolean {
    return true; // Placeholder
  }

  private checkTimeConstraint(
    option: any,
    constraint: Constraint,
    context: ProcessingContext
  ): boolean {
    return true; // Placeholder
  }

  private checkEthicalConstraint(
    option: any,
    constraint: Constraint,
    context: ProcessingContext
  ): boolean {
    return true; // Placeholder
  }

  private needsDecisionForGoal(goal: Goal): boolean {
    // Check if goal requires a decision
    return goal.deadline ? goal.deadline.getTime() > Date.now() : true;
  }

  private generateOptionsForGoal(goal: Goal): any[] {
    // Generate possible options for achieving the goal
    return []; // Placeholder
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get decision statistics
   */
  public getDecisionStats(): DecisionStats {
    const recentDecisions = this.decisionHistory.slice(-100);

    return {
      totalDecisions: this.decisionHistory.length,
      queueSize: this.decisionQueue.length,
      successRate:
        recentDecisions.filter((d) => d.success).length /
        Math.max(recentDecisions.length, 1),
      averageConfidence:
        recentDecisions.reduce((sum, d) => sum + d.confidence, 0) /
        Math.max(recentDecisions.length, 1),
      averageProcessingTime:
        recentDecisions.reduce((sum, d) => sum + d.processingTime, 0) /
        Math.max(recentDecisions.length, 1),
      activeGoals: this.activeGoals.size,
      activeConstraints: this.activeConstraints.size,
    };
  }

  /**
   * Get recent decisions
   */
  public getRecentDecisions(limit = 10): DecisionResult[] {
    return this.decisionHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check if decision engine is running
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

interface DecisionRequest {
  id: string;
  options: any[];
  context: ProcessingContext;
  priority: number;
  timeout?: number;
}

interface DecisionResult {
  id: string;
  requestId: string;
  decision: any;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    option: any;
    confidence: number;
    reasoning: string;
  }>;
  timestamp: Date;
  processingTime: number;
  success: boolean;
}

interface EvaluatedOption {
  option: any;
  confidence: number;
  reasoning: string;
  goalAlignment: number;
  riskScore: number;
  utilityScore: number;
}

interface DecisionStats {
  totalDecisions: number;
  queueSize: number;
  successRate: number;
  averageConfidence: number;
  averageProcessingTime: number;
  activeGoals: number;
  activeConstraints: number;
}
