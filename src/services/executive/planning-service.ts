import { Constraint, Goal, ProcessingContext } from '../../types/index.js';
import { Logger } from '../../utils/logger.js';
import { EventEmitter } from '../../utils/node-polyfill.js';
import { DecisionEngine } from './decision-engine.js';

/**
 * Planning Service - Hierarchical task planning with backtracking
 */
export class PlanningService extends EventEmitter {
  private logger: Logger;
  private decisionEngine: DecisionEngine;
  private activePlans: Map<string, Plan> = new Map();
  private planningQueue: PlanningRequest[] = [];
  private planHistory: PlanExecution[] = [];

  constructor(decisionEngine: DecisionEngine) {
    super();
    this.logger = new Logger('PlanningService');
    this.decisionEngine = decisionEngine;
  }

  /**
   * Handle decision events
   */
  public onDecisionMade(decision: any): void {
    this.logger.debug(`Decision made: ${decision.id}`);
    // Update active plans based on decisions
    this.updatePlansWithDecision(decision);
  }

  /**
   * Create a plan for achieving a goal
   */
  public async createPlan(request: PlanningRequest): Promise<Plan> {
    this.logger.info(
      `Creating plan for goal: ${request.goal?.description || request.goal || 'undefined goal'}`
    );

    if (!request.goal) {
      throw new Error('Goal is required for plan creation');
    }

    const plan: Plan = {
      id: `plan_${Date.now()}`,
      goal: request.goal,
      context: request.context,
      tasks: [],
      status: PlanStatus.CREATED,
      createdAt: new Date(),
      estimatedDuration: 0,
      priority: request.goal.priority,
    };

    try {
      // Decompose goal into tasks
      const tasks = await this.decomposeGoal(request.goal, request.context);
      plan.tasks = tasks;
      plan.estimatedDuration = this.estimatePlanDuration(tasks);
      plan.status = PlanStatus.READY;

      this.activePlans.set(plan.id, plan);
      this.logger.info(`Plan created: ${plan.id} with ${tasks.length} tasks`);
    } catch (error) {
      plan.status = PlanStatus.FAILED;
      plan.error = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Plan creation failed: ${error}`);
    }

    return plan;
  }

  /**
   * Execute a plan
   */
  public async executePlan(planId: string): Promise<PlanExecution> {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    this.logger.info(`Executing plan: ${planId}`);

    const execution: PlanExecution = {
      id: `exec_${Date.now()}`,
      planId,
      startTime: new Date(),
      status: ExecutionStatus.RUNNING,
      completedTasks: [],
      failedTasks: [],
      progress: 0,
    };

    plan.status = PlanStatus.EXECUTING;
    plan.execution = execution;

    try {
      await this.executeTaskSequence(plan, execution);

      if (execution.failedTasks.length === 0) {
        execution.status = ExecutionStatus.COMPLETED;
        plan.status = PlanStatus.COMPLETED;
      } else {
        execution.status = ExecutionStatus.PARTIAL;
        plan.status = PlanStatus.PARTIAL;
      }
    } catch (error) {
      execution.status = ExecutionStatus.FAILED;
      plan.status = PlanStatus.FAILED;
      execution.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Plan execution failed: ${error}`);
    }

    execution.endTime = new Date();
    execution.duration =
      execution.endTime.getTime() - execution.startTime.getTime();

    this.planHistory.push(execution);
    this.emit('planCompleted', { plan, execution });

    return execution;
  }

  /**
   * Decompose goal into executable tasks
   */
  private async decomposeGoal(
    goal: Goal,
    context: ProcessingContext
  ): Promise<Task[]> {
    const tasks: Task[] = [];

    // Simple goal decomposition - in real implementation, use more sophisticated planning
    switch (goal.type) {
      case 'immediate':
        tasks.push(...this.createImmediateTasks(goal, context));
        break;
      case 'short_term':
        tasks.push(...this.createShortTermTasks(goal, context));
        break;
      case 'long_term':
        tasks.push(...this.createLongTermTasks(goal, context));
        break;
      default:
        tasks.push(this.createGenericTask(goal, context));
    }

    // Add dependencies between tasks
    this.establishTaskDependencies(tasks);

    return tasks;
  }

  /**
   * Execute task sequence with dependency handling
   */
  private async executeTaskSequence(
    plan: Plan,
    execution: PlanExecution
  ): Promise<void> {
    const remainingTasks = [...plan.tasks];
    const readyTasks: Task[] = [];

    while (remainingTasks.length > 0 || readyTasks.length > 0) {
      // Find tasks ready for execution (no pending dependencies)
      const newReadyTasks = remainingTasks.filter((task) =>
        this.areTaskDependenciesSatisfied(task, execution.completedTasks)
      );

      // Move ready tasks to execution queue
      for (const task of newReadyTasks) {
        const index = remainingTasks.indexOf(task);
        remainingTasks.splice(index, 1);
        readyTasks.push(task);
      }

      // Execute ready tasks
      if (readyTasks.length > 0) {
        const task = readyTasks.shift()!;
        await this.executeTask(task, execution, plan.context);
      }

      // Update progress
      execution.progress =
        (execution.completedTasks.length + execution.failedTasks.length) /
        plan.tasks.length;
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: Task,
    execution: PlanExecution,
    context: ProcessingContext
  ): Promise<void> {
    this.logger.debug(`Executing task: ${task.id} - ${task.description}`);

    const taskExecution: TaskExecution = {
      taskId: task.id,
      startTime: new Date(),
      status: 'running',
    };

    try {
      // Simulate task execution
      await this.performTaskAction(task, context);

      taskExecution.status = 'completed';
      taskExecution.endTime = new Date();
      taskExecution.duration =
        taskExecution.endTime.getTime() - taskExecution.startTime.getTime();

      execution.completedTasks.push(taskExecution);
      this.logger.debug(`Task completed: ${task.id}`);
    } catch (error) {
      taskExecution.status = 'failed';
      taskExecution.endTime = new Date();
      taskExecution.error =
        error instanceof Error ? error.message : 'Unknown error';

      execution.failedTasks.push(taskExecution);
      this.logger.error(`Task failed: ${task.id} - ${taskExecution.error}`);

      // Handle task failure
      await this.handleTaskFailure(task, execution, context);
    }
  }

  /**
   * Handle task failure with replanning
   */
  private async handleTaskFailure(
    task: Task,
    execution: PlanExecution,
    context: ProcessingContext
  ): Promise<void> {
    if (task.retryCount < task.maxRetries) {
      // Retry the task
      task.retryCount++;
      this.logger.info(
        `Retrying task: ${task.id} (attempt ${task.retryCount})`
      );

      // Add task back to execution queue with delay
      setTimeout(() => {
        this.executeTask(task, execution, context);
      }, task.retryDelay || 1000);
    } else if (task.alternatives && task.alternatives.length > 0) {
      // Try alternative approach
      const alternative = task.alternatives.shift()!;
      this.logger.info(`Trying alternative for task: ${task.id}`);
      await this.executeTask(alternative, execution, context);
    } else {
      // Task completely failed - may need replanning
      this.logger.warn(`Task failed permanently: ${task.id}`);
    }
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areTaskDependenciesSatisfied(
    task: Task,
    completedTasks: TaskExecution[]
  ): boolean {
    const completedTaskIds = completedTasks.map((exec) => exec.taskId);
    return task.dependencies.every((depId) => completedTaskIds.includes(depId));
  }

  /**
   * Perform the actual task action
   */
  private async performTaskAction(
    task: Task,
    context: ProcessingContext
  ): Promise<void> {
    // Simulate task execution time
    await this.sleep(task.estimatedDuration || 1000);

    // In real implementation, this would:
    // - Call appropriate services
    // - Execute commands
    // - Make API calls
    // - Update system state
    // etc.

    this.logger.debug(`Task action performed: ${task.action}`);
  }

  /**
   * Create immediate tasks
   */
  private createImmediateTasks(goal: Goal, context: ProcessingContext): Task[] {
    return [
      {
        id: `task_immediate_${Date.now()}`,
        description: `Complete immediate goal: ${goal.description}`,
        action: 'execute_immediate',
        dependencies: [],
        estimatedDuration: 5000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 2,
        retryDelay: 1000,
      },
    ];
  }

  /**
   * Create short-term tasks
   */
  private createShortTermTasks(goal: Goal, context: ProcessingContext): Task[] {
    return [
      {
        id: `task_analyze_${Date.now()}`,
        description: 'Analyze requirements',
        action: 'analyze',
        dependencies: [],
        estimatedDuration: 3000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 2,
      },
      {
        id: `task_plan_${Date.now()}`,
        description: 'Create detailed plan',
        action: 'plan',
        dependencies: [`task_analyze_${Date.now()}`],
        estimatedDuration: 5000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 2,
      },
      {
        id: `task_execute_${Date.now()}`,
        description: 'Execute plan',
        action: 'execute',
        dependencies: [`task_plan_${Date.now()}`],
        estimatedDuration: 10000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 1,
      },
    ];
  }

  /**
   * Create long-term tasks
   */
  private createLongTermTasks(goal: Goal, context: ProcessingContext): Task[] {
    return [
      {
        id: `task_research_${Date.now()}`,
        description: 'Research and gather information',
        action: 'research',
        dependencies: [],
        estimatedDuration: 15000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 3,
      },
      {
        id: `task_strategy_${Date.now()}`,
        description: 'Develop strategy',
        action: 'strategize',
        dependencies: [`task_research_${Date.now()}`],
        estimatedDuration: 10000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 2,
      },
      {
        id: `task_implement_${Date.now()}`,
        description: 'Implement solution',
        action: 'implement',
        dependencies: [`task_strategy_${Date.now()}`],
        estimatedDuration: 30000,
        priority: goal.priority,
        retryCount: 0,
        maxRetries: 1,
      },
    ];
  }

  /**
   * Create generic task for unknown goal types
   */
  private createGenericTask(goal: Goal, context: ProcessingContext): Task {
    return {
      id: `task_generic_${Date.now()}`,
      description: `Complete goal: ${goal.description}`,
      action: 'generic_execution',
      dependencies: [],
      estimatedDuration: 10000,
      priority: goal.priority,
      retryCount: 0,
      maxRetries: 2,
    };
  }

  /**
   * Establish dependencies between tasks
   */
  private establishTaskDependencies(tasks: Task[]): void {
    // Simple dependency establishment - can be enhanced
    for (let i = 1; i < tasks.length; i++) {
      if (tasks[i].dependencies.length === 0) {
        tasks[i].dependencies.push(tasks[i - 1].id);
      }
    }
  }

  /**
   * Estimate total plan duration
   */
  private estimatePlanDuration(tasks: Task[]): number {
    // Simple estimation - sum of all task durations
    // In real implementation, consider parallelism and dependencies
    return tasks.reduce(
      (total, task) => total + (task.estimatedDuration || 0),
      0
    );
  }

  /**
   * Update plans with decision results
   */
  private updatePlansWithDecision(decision: any): void {
    // Update relevant plans based on decision outcomes
    for (const plan of this.activePlans.values()) {
      if (
        plan.status === PlanStatus.EXECUTING ||
        plan.status === PlanStatus.READY
      ) {
        // Check if decision affects this plan
        this.adaptPlanToDecision(plan, decision);
      }
    }
  }

  /**
   * Adapt plan based on decision
   */
  private adaptPlanToDecision(plan: Plan, decision: any): void {
    // Simplified plan adaptation
    this.logger.debug(`Adapting plan ${plan.id} to decision ${decision.id}`);
    // In real implementation, modify tasks, priorities, etc.
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get planning statistics
   */
  public getPlanningStats(): PlanningStats {
    const activePlansArray = Array.from(this.activePlans.values());
    const recentExecutions = this.planHistory.slice(-50);

    return {
      activePlans: activePlansArray.length,
      queueSize: this.planningQueue.length,
      completedPlans: recentExecutions.filter(
        (e) => e.status === ExecutionStatus.COMPLETED
      ).length,
      failedPlans: recentExecutions.filter(
        (e) => e.status === ExecutionStatus.FAILED
      ).length,
      averageExecutionTime:
        this.calculateAverageExecutionTime(recentExecutions),
      plansByStatus: this.groupPlansByStatus(activePlansArray),
    };
  }

  private calculateAverageExecutionTime(executions: PlanExecution[]): number {
    const completedExecutions = executions.filter(
      (e) => e.duration !== undefined
    );
    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce(
      (sum, e) => sum + (e.duration || 0),
      0
    );
    return totalTime / completedExecutions.length;
  }

  private groupPlansByStatus(plans: Plan[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const plan of plans) {
      grouped[plan.status] = (grouped[plan.status] || 0) + 1;
    }
    return grouped;
  }
}

enum PlanStatus {
  CREATED = 'created',
  READY = 'ready',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

interface PlanningRequest {
  goal: Goal;
  context: ProcessingContext;
  constraints?: Constraint[];
  deadline?: Date;
}

interface Plan {
  id: string;
  goal: Goal;
  context: ProcessingContext;
  tasks: Task[];
  status: PlanStatus;
  createdAt: Date;
  estimatedDuration: number;
  priority: number;
  execution?: PlanExecution;
  error?: string;
}

interface Task {
  id: string;
  description: string;
  action: string;
  dependencies: string[];
  estimatedDuration?: number;
  priority: number;
  retryCount: number;
  maxRetries: number;
  retryDelay?: number;
  alternatives?: Task[];
}

interface PlanExecution {
  id: string;
  planId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: ExecutionStatus;
  completedTasks: TaskExecution[];
  failedTasks: TaskExecution[];
  progress: number;
  error?: string;
}

interface TaskExecution {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

interface PlanningStats {
  activePlans: number;
  queueSize: number;
  completedPlans: number;
  failedPlans: number;
  averageExecutionTime: number;
  plansByStatus: Record<string, number>;
}
