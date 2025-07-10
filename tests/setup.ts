// Test setup file
import { jest } from '@jest/globals';

// Global test configuration
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();
});
