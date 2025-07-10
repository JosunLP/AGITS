import { DataPersistenceLayer } from '../../infrastructure/data-persistence-layer.js';
import {
  APIResponse,
  CognitiveTask,
  ProcessingContext,
  TaskType,
} from '../../types/index.js';
import { EventMap, TypedEventEmitter } from '../../utils/event-emitter.js';
import { Logger } from '../../utils/logger.js';

/**
 * Reasoning types - Extended for comprehensive reasoning capabilities
 */
export enum ReasoningType {
  DEDUCTIVE = 'deductive',
  INDUCTIVE = 'inductive',
  ABDUCTIVE = 'abductive',
  ANALOGICAL = 'analogical',
  CAUSAL = 'causal',
  TEMPORAL = 'temporal',
  SPATIAL = 'spatial',
  PROBABILISTIC = 'probabilistic',
  CHAIN_OF_THOUGHT = 'chain_of_thought',
}

/**
 * Certainty levels for reasoning conclusions
 */
export enum CertaintyLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  ABSOLUTE = 'absolute',
}

/**
 * Reasoning Chain Step - For Chain-of-Thought reasoning
 */
interface ReasoningStep {
  id: string;
  type: ReasoningType;
  premise: string;
  conclusion: string;
  confidence: number;
  evidence: string[];
  timestamp: Date;
  reasoning_path: string;
  dependencies: string[];
  step_number: number;
}

/**
 * Chain of Thought Result
 */
interface ChainOfThoughtResult {
  id: string;
  query: string;
  reasoning_chain: ReasoningStep[];
  final_conclusion: string;
  overall_confidence: number;
  certainty_level: CertaintyLevel;
  execution_time: number;
  total_steps: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Knowledge Rule for reasoning
 */
interface KnowledgeRule {
  id: string;
  name: string;
  type: ReasoningType;
  premises: string[];
  conclusion: string;
  confidence: number;
  domain: string;
  conditions: string[];
  evidence: string[];
  created_at: Date;
  usage_count: number;
}

/**
 * Reasoning Task
 */
interface ReasoningTask {
  id: string;
  type: ReasoningType;
  query: string;
  context: ProcessingContext;
  premises: string[];
  goal: string;
  constraints: string[];
  started_at: Date;
  max_depth: number;
  confidence_threshold: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Inference Chain
 */
interface InferenceChain {
  id: string;
  steps: ReasoningStep[];
  premises: string[];
  conclusion: string;
  confidence: number;
  reasoning_type: ReasoningType;
  created_at: Date;
  depth: number;
}

/**
 * Reasoning Result
 */
interface ReasoningResult {
  id: string;
  task_id: string;
  type: ReasoningType;
  query: string;
  conclusion: string;
  confidence: number;
  certainty_level: CertaintyLevel;
  reasoning_steps: ReasoningStep[];
  evidence: string[];
  counterarguments: string[];
  execution_time: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Event map for ReasoningEngineService
 */
interface ReasoningEngineEvents extends EventMap {
  memoryConsolidated: (memory: any) => void;
  reasoningCompleted: (result: ReasoningResult) => void;
  inferenceChainUpdated: (chain: InferenceChain) => void;
  chainOfThoughtCompleted: (result: ChainOfThoughtResult) => void;
  reasoningTaskStarted: (task: ReasoningTask) => void;
  confidenceUpdated: (taskId: string, confidence: number) => void;
}

/**
 * Enhanced Reasoning Engine Service - Implements comprehensive reasoning capabilities
 * Supports Chain-of-Thought reasoning, multi-type reasoning, and confidence tracking
 */
export class ReasoningEngineService extends TypedEventEmitter<ReasoningEngineEvents> {
  private logger: Logger;
  private reasoningTasks: Map<string, ReasoningTask> = new Map();
  private knowledgeBase: Map<string, KnowledgeRule> = new Map();
  private inferenceChains: Map<string, InferenceChain> = new Map();
  private reasoningHistory: Map<string, ReasoningResult> = new Map();
  private persistenceLayer: DataPersistenceLayer | null = null;

  private readonly maxReasoningDepth = 15;
  private readonly confidenceThreshold = 0.7;
  private readonly maxChainLength = 20;

  constructor(persistenceLayer?: DataPersistenceLayer) {
    super();
    this.logger = new Logger('ReasoningEngineService');
    this.persistenceLayer = persistenceLayer || null;
    this.initializeKnowledgeBase();

    if (this.persistenceLayer) {
      this.loadReasoningHistory();
    }
  }

  /**
   * Process a reasoning task with enhanced capabilities
   */
  public async processReasoningTask(
    task: CognitiveTask
  ): Promise<APIResponse<ReasoningResult>> {
    try {
      if (task.type !== TaskType.REASONING) {
        return {
          success: false,
          error: {
            code: 'INVALID_TASK_TYPE',
            message: 'Task must be of type REASONING',
            timestamp: new Date(),
          },
        };
      }

      const startTime = Date.now();
      const reasoningTask: ReasoningTask = {
        id: this.generateTaskId(),
        type: ReasoningType.DEDUCTIVE, // Default, can be overridden
        query: task.input.query || task.input.text || '',
        context: task.context,
        premises: task.input.premises || [],
        goal: task.input.goal || 'General reasoning',
        constraints: task.input.constraints || [],
        started_at: new Date(),
        max_depth: task.input.maxDepth || this.maxReasoningDepth,
        confidence_threshold:
          task.input.confidenceThreshold || this.confidenceThreshold,
        status: 'processing',
      };

      this.reasoningTasks.set(reasoningTask.id, reasoningTask);
      this.emit('reasoningTaskStarted', reasoningTask);

      let result: ReasoningResult;

      // Determine reasoning type and process accordingly
      const reasoningType = this.determineReasoningType(
        reasoningTask.query,
        reasoningTask.context
      );

      switch (reasoningType) {
        case ReasoningType.CHAIN_OF_THOUGHT:
          result = await this.performChainOfThoughtReasoning(reasoningTask);
          break;
        case ReasoningType.DEDUCTIVE:
          result = await this.performDeductiveReasoning(reasoningTask);
          break;
        case ReasoningType.INDUCTIVE:
          result = await this.performInductiveReasoning(reasoningTask);
          break;
        case ReasoningType.ABDUCTIVE:
          result = await this.performAbductiveReasoning(reasoningTask);
          break;
        case ReasoningType.ANALOGICAL:
          result = await this.performAnalogicalReasoning(reasoningTask);
          break;
        case ReasoningType.CAUSAL:
          result = await this.performCausalReasoning(reasoningTask);
          break;
        default:
          result = await this.performDeductiveReasoning(reasoningTask);
      }

      result.execution_time = Date.now() - startTime;
      reasoningTask.status = 'completed';

      // Store result
      this.reasoningHistory.set(result.id, result);
      if (this.persistenceLayer) {
        await this.persistReasoningResult(result);
      }

      this.emit('reasoningCompleted', result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error processing reasoning task:', error);
      return {
        success: false,
        error: {
          code: 'REASONING_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown reasoning error',
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Perform Chain-of-Thought reasoning - step by step logical progression
   */
  private async performChainOfThoughtReasoning(
    task: ReasoningTask
  ): Promise<ReasoningResult> {
    const reasoning_steps: ReasoningStep[] = [];
    let current_premise = task.query;
    let step_number = 1;
    let overall_confidence = 1.0;

    while (step_number <= this.maxChainLength) {
      const step = await this.performSingleReasoningStep(
        current_premise,
        task,
        step_number,
        ReasoningType.CHAIN_OF_THOUGHT
      );

      if (!step) break;

      reasoning_steps.push(step);
      current_premise = step.conclusion;
      overall_confidence *= step.confidence;

      // Check if we've reached a satisfactory conclusion
      if (step.confidence < 0.5 || this.isConclusive(step.conclusion)) {
        break;
      }

      step_number++;
    }

    const final_conclusion =
      reasoning_steps[reasoning_steps.length - 1]?.conclusion ||
      'No conclusion reached';

    return {
      id: this.generateResultId(),
      task_id: task.id,
      type: ReasoningType.CHAIN_OF_THOUGHT,
      query: task.query,
      conclusion: final_conclusion,
      confidence: overall_confidence,
      certainty_level: this.calculateCertaintyLevel(overall_confidence),
      reasoning_steps,
      evidence: reasoning_steps.flatMap((step) => step.evidence),
      counterarguments: [],
      execution_time: 0, // Will be set by caller
      timestamp: new Date(),
      metadata: {
        total_steps: reasoning_steps.length,
        reasoning_type: 'chain_of_thought',
        depth: reasoning_steps.length,
      },
    };
  }

  /**
   * Perform a single reasoning step
   */
  private async performSingleReasoningStep(
    premise: string,
    task: ReasoningTask,
    step_number: number,
    type: ReasoningType
  ): Promise<ReasoningStep | null> {
    // Find applicable knowledge rules
    const applicableRules = this.findApplicableRules(premise, type);

    if (applicableRules.length === 0) {
      return null;
    }

    // Select best rule based on confidence and relevance
    const bestRule = applicableRules.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    bestRule.usage_count++;

    const step: ReasoningStep = {
      id: this.generateStepId(),
      type,
      premise,
      conclusion: this.applyRule(premise, bestRule),
      confidence: bestRule.confidence,
      evidence: bestRule.evidence,
      timestamp: new Date(),
      reasoning_path: `Applied rule: ${bestRule.name}`,
      dependencies: [bestRule.id],
      step_number,
    };

    return step;
  }

  /**
   * Perform deductive reasoning
   */
  private async performDeductiveReasoning(
    task: ReasoningTask
  ): Promise<ReasoningResult> {
    const reasoning_steps: ReasoningStep[] = [];

    // Apply deductive rules to premises
    for (const premise of task.premises) {
      const rules = this.findApplicableRules(premise, ReasoningType.DEDUCTIVE);

      for (const rule of rules) {
        if (reasoning_steps.length >= task.max_depth) break;

        const step = await this.performSingleReasoningStep(
          premise,
          task,
          reasoning_steps.length + 1,
          ReasoningType.DEDUCTIVE
        );

        if (step) {
          reasoning_steps.push(step);
        }
      }
    }

    const confidence =
      reasoning_steps.length > 0
        ? reasoning_steps.reduce((sum, step) => sum + step.confidence, 0) /
          reasoning_steps.length
        : 0.5;

    return {
      id: this.generateResultId(),
      task_id: task.id,
      type: ReasoningType.DEDUCTIVE,
      query: task.query,
      conclusion:
        reasoning_steps[reasoning_steps.length - 1]?.conclusion ||
        'No conclusion reached',
      confidence,
      certainty_level: this.calculateCertaintyLevel(confidence),
      reasoning_steps,
      evidence: reasoning_steps.flatMap((step) => step.evidence),
      counterarguments: [],
      execution_time: 0,
      timestamp: new Date(),
      metadata: {
        reasoning_type: 'deductive',
        premises_processed: task.premises.length,
      },
    };
  }

  /**
   * Perform inductive reasoning
   */
  private async performInductiveReasoning(
    task: ReasoningTask
  ): Promise<ReasoningResult> {
    // Analyze patterns in premises to form general conclusions
    const patterns = this.identifyPatterns(task.premises);
    const reasoning_steps: ReasoningStep[] = [];

    for (const pattern of patterns) {
      const step: ReasoningStep = {
        id: this.generateStepId(),
        type: ReasoningType.INDUCTIVE,
        premise: pattern.evidence.join(', '),
        conclusion: pattern.generalization,
        confidence: pattern.confidence,
        evidence: pattern.evidence,
        timestamp: new Date(),
        reasoning_path: `Pattern identified: ${pattern.type}`,
        dependencies: [],
        step_number: reasoning_steps.length + 1,
      };

      reasoning_steps.push(step);
    }

    const confidence =
      patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
        : 0.3; // Lower default confidence for inductive reasoning

    return {
      id: this.generateResultId(),
      task_id: task.id,
      type: ReasoningType.INDUCTIVE,
      query: task.query,
      conclusion: patterns[0]?.generalization || 'No pattern identified',
      confidence,
      certainty_level: this.calculateCertaintyLevel(confidence),
      reasoning_steps,
      evidence: reasoning_steps.flatMap((step) => step.evidence),
      counterarguments: [],
      execution_time: 0,
      timestamp: new Date(),
      metadata: {
        reasoning_type: 'inductive',
        patterns_found: patterns.length,
      },
    };
  }

  /**
   * Perform abductive reasoning - find best explanation
   */
  private async performAbductiveReasoning(
    task: ReasoningTask
  ): Promise<ReasoningResult> {
    const observations = task.premises;
    const possible_explanations = this.generateExplanations(observations);

    // Evaluate explanations
    const evaluated_explanations = possible_explanations.map((explanation) => ({
      explanation,
      likelihood: this.calculateExplanationLikelihood(
        explanation,
        observations
      ),
      simplicity: this.calculateSimplicity(explanation),
      coherence: this.calculateCoherence(explanation, this.knowledgeBase),
    }));

    // Select best explanation
    const best_explanation = evaluated_explanations.reduce((best, current) => {
      const best_score =
        best.likelihood * 0.5 + best.simplicity * 0.3 + best.coherence * 0.2;
      const current_score =
        current.likelihood * 0.5 +
        current.simplicity * 0.3 +
        current.coherence * 0.2;
      return current_score > best_score ? current : best;
    });

    const reasoning_step: ReasoningStep = {
      id: this.generateStepId(),
      type: ReasoningType.ABDUCTIVE,
      premise: observations.join(', '),
      conclusion: best_explanation.explanation,
      confidence: best_explanation.likelihood,
      evidence: observations,
      timestamp: new Date(),
      reasoning_path:
        'Best explanation selection based on likelihood, simplicity, and coherence',
      dependencies: [],
      step_number: 1,
    };

    return {
      id: this.generateResultId(),
      task_id: task.id,
      type: ReasoningType.ABDUCTIVE,
      query: task.query,
      conclusion: best_explanation.explanation,
      confidence: best_explanation.likelihood,
      certainty_level: this.calculateCertaintyLevel(
        best_explanation.likelihood
      ),
      reasoning_steps: [reasoning_step],
      evidence: observations,
      counterarguments: evaluated_explanations
        .filter((e) => e !== best_explanation)
        .map((e) => e.explanation)
        .slice(0, 3), // Top 3 alternative explanations
      execution_time: 0,
      timestamp: new Date(),
      metadata: {
        reasoning_type: 'abductive',
        explanations_considered: evaluated_explanations.length,
      },
    };
  }

  /**
   * Perform analogical reasoning
   */
  private async performAnalogicalReasoning(
    task: ReasoningTask
  ): Promise<ReasoningResult> {
    const source_domain = this.extractDomain(task.query);
    const analogous_cases = this.findAnalogiousCases(
      source_domain,
      task.premises
    );

    const reasoning_steps: ReasoningStep[] = [];

    for (const case_info of analogous_cases) {
      const step: ReasoningStep = {
        id: this.generateStepId(),
        type: ReasoningType.ANALOGICAL,
        premise: task.query,
        conclusion: this.transferAnalogy(case_info, task.query),
        confidence: case_info.similarity,
        evidence: case_info.evidence,
        timestamp: new Date(),
        reasoning_path: `Analogy from ${case_info.domain}`,
        dependencies: [],
        step_number: reasoning_steps.length + 1,
      };

      reasoning_steps.push(step);
    }

    const confidence =
      analogous_cases.length > 0
        ? analogous_cases.reduce((sum, c) => sum + c.similarity, 0) /
          analogous_cases.length
        : 0.4;

    return {
      id: this.generateResultId(),
      task_id: task.id,
      type: ReasoningType.ANALOGICAL,
      query: task.query,
      conclusion: reasoning_steps[0]?.conclusion || 'No analogous cases found',
      confidence,
      certainty_level: this.calculateCertaintyLevel(confidence),
      reasoning_steps,
      evidence: reasoning_steps.flatMap((step) => step.evidence),
      counterarguments: [],
      execution_time: 0,
      timestamp: new Date(),
      metadata: {
        reasoning_type: 'analogical',
        analogous_cases: analogous_cases.length,
      },
    };
  }

  /**
   * Perform causal reasoning
   */
  private async performCausalReasoning(
    task: ReasoningTask
  ): Promise<ReasoningResult> {
    const causal_chains = this.identifyCausalChains(task.premises);
    const reasoning_steps: ReasoningStep[] = [];

    for (const chain of causal_chains) {
      const step: ReasoningStep = {
        id: this.generateStepId(),
        type: ReasoningType.CAUSAL,
        premise: chain.cause,
        conclusion: chain.effect,
        confidence: chain.strength,
        evidence: chain.evidence,
        timestamp: new Date(),
        reasoning_path: `Causal relationship: ${chain.cause} → ${chain.effect}`,
        dependencies: [],
        step_number: reasoning_steps.length + 1,
      };

      reasoning_steps.push(step);
    }

    const confidence =
      causal_chains.length > 0
        ? causal_chains.reduce((sum, c) => sum + c.strength, 0) /
          causal_chains.length
        : 0.5;

    return {
      id: this.generateResultId(),
      task_id: task.id,
      type: ReasoningType.CAUSAL,
      query: task.query,
      conclusion: this.synthesizeCausalConclusion(causal_chains),
      confidence,
      certainty_level: this.calculateCertaintyLevel(confidence),
      reasoning_steps,
      evidence: reasoning_steps.flatMap((step) => step.evidence),
      counterarguments: [],
      execution_time: 0,
      timestamp: new Date(),
      metadata: {
        reasoning_type: 'causal',
        causal_chains: causal_chains.length,
      },
    };
  }

  /**
   * Initialize knowledge base with basic reasoning rules
   */
  private initializeKnowledgeBase(): void {
    const basic_rules: KnowledgeRule[] = [
      {
        id: 'rule_1',
        name: 'Modus Ponens',
        type: ReasoningType.DEDUCTIVE,
        premises: ['If P then Q', 'P'],
        conclusion: 'Q',
        confidence: 0.95,
        domain: 'logic',
        conditions: ['premise_match'],
        evidence: ['logical_validity'],
        created_at: new Date(),
        usage_count: 0,
      },
      {
        id: 'rule_2',
        name: 'Causal Inference',
        type: ReasoningType.CAUSAL,
        premises: ['Event A precedes Event B', 'A correlates with B'],
        conclusion: 'A may cause B',
        confidence: 0.7,
        domain: 'causality',
        conditions: ['temporal_precedence', 'correlation'],
        evidence: ['statistical_evidence'],
        created_at: new Date(),
        usage_count: 0,
      },
      {
        id: 'rule_3',
        name: 'Pattern Generalization',
        type: ReasoningType.INDUCTIVE,
        premises: ['Multiple instances of pattern P'],
        conclusion: 'Pattern P is generally true',
        confidence: 0.8,
        domain: 'patterns',
        conditions: ['sufficient_instances'],
        evidence: ['pattern_frequency'],
        created_at: new Date(),
        usage_count: 0,
      },
    ];

    basic_rules.forEach((rule) => {
      this.knowledgeBase.set(rule.id, rule);
    });

    this.logger.info(
      `Initialized knowledge base with ${basic_rules.length} rules`
    );
  }

  /**
   * Load reasoning history from persistence layer
   */
  private async loadReasoningHistory(): Promise<void> {
    if (!this.persistenceLayer) return;

    try {
      // Implementation would load from database
      this.logger.info('Reasoning history loaded from persistence layer');
    } catch (error) {
      this.logger.error('Error loading reasoning history:', error);
    }
  }

  /**
   * Persist reasoning result
   */
  private async persistReasoningResult(result: ReasoningResult): Promise<void> {
    if (!this.persistenceLayer) return;

    try {
      // Implementation would save to database
      this.logger.debug(`Persisted reasoning result: ${result.id}`);
    } catch (error) {
      this.logger.error('Error persisting reasoning result:', error);
    }
  }

  // Helper methods
  private determineReasoningType(
    query: string,
    context: ProcessingContext
  ): ReasoningType {
    if (query.includes('step by step') || query.includes('explain how')) {
      return ReasoningType.CHAIN_OF_THOUGHT;
    }
    if (query.includes('cause') || query.includes('because')) {
      return ReasoningType.CAUSAL;
    }
    if (query.includes('similar to') || query.includes('like')) {
      return ReasoningType.ANALOGICAL;
    }
    if (query.includes('pattern') || query.includes('generally')) {
      return ReasoningType.INDUCTIVE;
    }
    if (query.includes('best explanation') || query.includes('why')) {
      return ReasoningType.ABDUCTIVE;
    }
    return ReasoningType.DEDUCTIVE;
  }

  private findApplicableRules(
    premise: string,
    type: ReasoningType
  ): KnowledgeRule[] {
    return Array.from(this.knowledgeBase.values())
      .filter((rule) => rule.type === type)
      .filter((rule) => this.ruleApplies(rule, premise))
      .sort((a, b) => b.confidence - a.confidence);
  }

  private ruleApplies(rule: KnowledgeRule, premise: string): boolean {
    // Simple keyword matching - could be enhanced with NLP
    return rule.premises.some(
      (p) =>
        premise.toLowerCase().includes(p.toLowerCase()) ||
        p.toLowerCase().includes(premise.toLowerCase())
    );
  }

  private applyRule(premise: string, rule: KnowledgeRule): string {
    return `${rule.conclusion} (based on: ${premise})`;
  }

  private isConclusive(conclusion: string): boolean {
    const conclusive_words = [
      'therefore',
      'thus',
      'consequently',
      'hence',
      'finally',
    ];
    return conclusive_words.some((word) =>
      conclusion.toLowerCase().includes(word)
    );
  }

  private calculateCertaintyLevel(confidence: number): CertaintyLevel {
    if (confidence >= 0.95) return CertaintyLevel.ABSOLUTE;
    if (confidence >= 0.8) return CertaintyLevel.VERY_HIGH;
    if (confidence >= 0.6) return CertaintyLevel.HIGH;
    if (confidence >= 0.4) return CertaintyLevel.MODERATE;
    if (confidence >= 0.2) return CertaintyLevel.LOW;
    return CertaintyLevel.VERY_LOW;
  }

  private identifyPatterns(premises: string[]): Array<{
    type: string;
    evidence: string[];
    generalization: string;
    confidence: number;
  }> {
    // Simplified pattern identification
    const patterns = [];

    if (premises.length >= 3) {
      patterns.push({
        type: 'frequency',
        evidence: premises,
        generalization: 'Common pattern observed across multiple instances',
        confidence: Math.min(0.8, premises.length * 0.2),
      });
    }

    return patterns;
  }

  private generateExplanations(observations: string[]): string[] {
    // Generate possible explanations for observations
    return [
      'Direct causal relationship',
      'Indirect causal chain',
      'Correlation without causation',
      'Random coincidence',
      'Common underlying factor',
    ];
  }

  private calculateExplanationLikelihood(
    explanation: string,
    observations: string[]
  ): number {
    // Simplified likelihood calculation
    return Math.random() * 0.5 + 0.3; // Placeholder
  }

  private calculateSimplicity(explanation: string): number {
    // Simpler explanations get higher scores
    return Math.max(0.1, 1.0 - explanation.length / 100);
  }

  private calculateCoherence(
    explanation: string,
    knowledgeBase: Map<string, KnowledgeRule>
  ): number {
    // Check coherence with existing knowledge
    return 0.7; // Placeholder
  }

  private extractDomain(query: string): string {
    // Extract domain from query
    return 'general'; // Placeholder
  }

  private findAnalogiousCases(
    domain: string,
    premises: string[]
  ): Array<{
    domain: string;
    similarity: number;
    evidence: string[];
  }> {
    // Find analogous cases
    return []; // Placeholder
  }

  private transferAnalogy(case_info: any, query: string): string {
    return `By analogy with ${case_info.domain}, we can conclude...`;
  }

  private identifyCausalChains(premises: string[]): Array<{
    cause: string;
    effect: string;
    strength: number;
    evidence: string[];
  }> {
    // Identify causal relationships
    return []; // Placeholder
  }

  private synthesizeCausalConclusion(chains: any[]): string {
    if (chains.length === 0) return 'No clear causal relationships identified';
    return `Primary causal factor: ${chains[0]?.cause || 'unknown'}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get reasoning statistics
   */
  public getReasoningStats(): {
    total_tasks: number;
    completed_tasks: number;
    average_confidence: number;
    reasoning_types: Record<string, number>;
    knowledge_base_size: number;
  } {
    const completed_results = Array.from(this.reasoningHistory.values());

    return {
      total_tasks: this.reasoningTasks.size,
      completed_tasks: completed_results.length,
      average_confidence:
        completed_results.length > 0
          ? completed_results.reduce((sum, r) => sum + r.confidence, 0) /
            completed_results.length
          : 0,
      reasoning_types: completed_results.reduce(
        (acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      knowledge_base_size: this.knowledgeBase.size,
    };
  }

  /**
   * Add new knowledge rule
   */
  public addKnowledgeRule(
    rule: Omit<KnowledgeRule, 'id' | 'created_at' | 'usage_count'>
  ): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const full_rule: KnowledgeRule = {
      ...rule,
      id,
      created_at: new Date(),
      usage_count: 0,
    };

    this.knowledgeBase.set(id, full_rule);
    this.logger.info(`Added new knowledge rule: ${rule.name}`);

    return id;
  }

  /**
   * Get reasoning history
   */
  public getReasoningHistory(limit?: number): ReasoningResult[] {
    const results = Array.from(this.reasoningHistory.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? results.slice(0, limit) : results;
  }
}
