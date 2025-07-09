import {
  AutonomousProcessScheduler,
  AutonomousTaskType,
  TaskPriority,
} from '../src/core/autonomous-scheduler';

describe('AutonomousProcessScheduler', () => {
  let scheduler: AutonomousProcessScheduler;

  beforeEach(() => {
    scheduler = new AutonomousProcessScheduler();
  });

  afterEach(() => {
    scheduler.stop();
  });

  describe('initialization', () => {
    test('should create scheduler with default configuration', () => {
      expect(scheduler).toBeDefined();
    });

    test('should start and stop scheduler', () => {
      scheduler.start();
      // Scheduler should be running after start

      scheduler.stop();
      // Scheduler should be stopped after stop
    });
  });

  describe('task management', () => {
    test('should add autonomous tasks', () => {
      const taskId = scheduler.addTask({
        type: AutonomousTaskType.MEMORY_CONSOLIDATION,
        priority: TaskPriority.HIGH,
        intervalMs: 60000,
        maxExecutionTime: 30000,
        enabled: true,
        nextExecution: new Date(Date.now() + 60000),
        metadata: { test: true },
      });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    test('should remove autonomous tasks', () => {
      const taskId = scheduler.addTask({
        type: AutonomousTaskType.LEARNING_CYCLE,
        priority: TaskPriority.NORMAL,
        intervalMs: 120000,
        maxExecutionTime: 60000,
        enabled: true,
        nextExecution: new Date(Date.now() + 120000),
        metadata: {},
      });

      const removed = scheduler.removeTask(taskId);
      expect(removed).toBe(true);
    });

    test('should return false when removing non-existent task', () => {
      const removed = scheduler.removeTask('non-existent-task');
      expect(removed).toBe(false);
    });
  });

  describe('service integration', () => {
    test('should accept system services', () => {
      const mockServices = {
        memoryManagement: {},
        learningOrchestrator: {},
        knowledgeManagement: {},
      };

      scheduler.setServices(mockServices);
      // Should not throw error
      expect(scheduler).toBeDefined();
    });
  });
});
