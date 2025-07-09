import { AGITSPlatform } from '../src/index';

describe('AGITS Platform Integration', () => {
  let platform: AGITSPlatform;

  beforeEach(() => {
    platform = new AGITSPlatform();
  });

  afterEach(async () => {
    if (platform) {
      await platform.stop();
    }
  });

  describe('platform initialization', () => {
    test('should create platform instance', () => {
      expect(platform).toBeDefined();
    });

    test('should get service registry', () => {
      const serviceRegistry = platform.getServiceRegistry();
      expect(serviceRegistry).toBeDefined();
    });

    test('should get metrics', () => {
      const metrics = platform.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('health monitoring', () => {
    test('should provide health status', async () => {
      const healthStatus = await platform.getHealthStatus();
      expect(healthStatus).toBeDefined();
      // Health status should be an object with system information
      expect(typeof healthStatus).toBe('object');
    });
  });

  describe('graceful shutdown', () => {
    test('should shutdown gracefully', async () => {
      await platform.stop();
      // Should complete without errors
      expect(platform).toBeDefined();
    });
  });
});
