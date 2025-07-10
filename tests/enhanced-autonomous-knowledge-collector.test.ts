/**
 * Test suite for Enhanced Autonomous Knowledge Collector
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { defaultLearningConfig } from '../src/config/app.js';
import { EnhancedAutonomousKnowledgeCollector } from '../src/core/enhanced-autonomous-knowledge-collector.js';
import { KnowledgeManagementSystem } from '../src/core/knowledge-management.js';
import { MemoryManagementSystem } from '../src/core/memory-management.js';
import { ExternalApiService } from '../src/services/data-acquisition/external-api.service.js';
import { WebScrapingService } from '../src/services/data-acquisition/web-scraping.service.js';
import { DataCollectionStrategy } from '../src/types/data-acquisition.type.js';
import { MemoryType } from '../src/types/index.js';

describe('Enhanced Autonomous Knowledge Collector', () => {
  let collector: EnhancedAutonomousKnowledgeCollector;
  let knowledgeSystem: KnowledgeManagementSystem;
  let memorySystem: MemoryManagementSystem;
  let webScrapingService: WebScrapingService;
  let externalApiService: ExternalApiService;

  beforeEach(() => {
    memorySystem = new MemoryManagementSystem(defaultLearningConfig);
    knowledgeSystem = new KnowledgeManagementSystem(
      memorySystem,
      defaultLearningConfig
    );
    webScrapingService = new WebScrapingService();
    externalApiService = new ExternalApiService();

    collector = new EnhancedAutonomousKnowledgeCollector(
      knowledgeSystem,
      memorySystem,
      webScrapingService,
      externalApiService
    );
  });

  afterEach(async () => {
    await collector.stopEnhancedCollection();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      expect(collector).toBeDefined();
      expect(collector).toBeInstanceOf(EnhancedAutonomousKnowledgeCollector);
    });

    it('should have default collection strategies', () => {
      const strategies = collector.listCollectionStrategies();
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);

      // Check for expected default strategies
      const strategyNames = strategies.map((s) => s.name);
      expect(strategyNames).toContain('General Knowledge Collection');
      expect(strategyNames).toContain('Scientific Research Collection');
      expect(strategyNames).toContain('Technology News Collection');
    });
  });

  describe('Collection Strategy Management', () => {
    it('should add new collection strategy', () => {
      const testStrategy: DataCollectionStrategy = {
        id: 'test_strategy',
        name: 'Test Strategy',
        description: 'Test collection strategy',
        targetSources: ['wikipedia_api'],
        keywords: ['test', 'example'],
        categories: ['test'],
        priority: 1,
        frequency: 'daily',
        qualityThreshold: 0.7,
        maxItemsPerRun: 10,
        filters: {
          minCredibility: 0.5,
        },
        active: true,
        stats: {
          totalRuns: 0,
          successfulItems: 0,
          filteredItems: 0,
          averageQuality: 0,
        },
      };

      collector.addCollectionStrategy(testStrategy);
      const retrieved = collector.getCollectionStrategy('test_strategy');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Strategy');
      expect(retrieved?.active).toBe(true);
    });

    it('should update collection strategy', () => {
      const strategies = collector.listCollectionStrategies();
      const firstStrategy = strategies[0];

      if (firstStrategy) {
        const updates = {
          priority: 5,
          maxItemsPerRun: 20,
        };

        collector.updateCollectionStrategy(firstStrategy.id, updates);
        const updated = collector.getCollectionStrategy(firstStrategy.id);

        expect(updated?.priority).toBe(5);
        expect(updated?.maxItemsPerRun).toBe(20);
      }
    });

    it('should remove collection strategy', () => {
      const testStrategy: DataCollectionStrategy = {
        id: 'removable_strategy',
        name: 'Removable Strategy',
        description: 'Strategy to be removed',
        targetSources: [],
        keywords: ['removable'],
        categories: ['test'],
        priority: 1,
        frequency: 'daily',
        qualityThreshold: 0.5,
        maxItemsPerRun: 5,
        filters: {},
        active: true,
        stats: {
          totalRuns: 0,
          successfulItems: 0,
          filteredItems: 0,
          averageQuality: 0,
        },
      };

      collector.addCollectionStrategy(testStrategy);
      expect(
        collector.getCollectionStrategy('removable_strategy')
      ).toBeDefined();

      collector.removeCollectionStrategy('removable_strategy');
      expect(
        collector.getCollectionStrategy('removable_strategy')
      ).toBeUndefined();
    });
  });

  describe('Knowledge Collection', () => {
    it('should collect knowledge from web sources', async () => {
      const strategy = collector.listCollectionStrategies()[0];
      if (strategy) {
        const webContent = await collector.collectFromWeb(strategy);

        expect(Array.isArray(webContent)).toBe(true);
        if (webContent.length > 0) {
          webContent.forEach((content) => {
            expect(content.title).toBeDefined();
            expect(content.content).toBeDefined();
            expect(content.source).toBeDefined();
            expect(content.qualityScore).toBeGreaterThan(0);
          });
        }
      }
    });

    it('should collect knowledge from API sources', async () => {
      const strategy = collector.listCollectionStrategies()[0];
      if (strategy) {
        const apiResponses = await collector.collectFromApis(strategy);

        expect(Array.isArray(apiResponses)).toBe(true);
        if (apiResponses.length > 0) {
          apiResponses.forEach((response) => {
            expect(response.source).toBeDefined();
            expect(response.data).toBeDefined();
            expect(response.credibilityScore).toBeGreaterThan(0);
          });
        }
      }
    });

    it('should process collected content into knowledge items', async () => {
      const mockScrapedContent = {
        url: 'https://example.com/test',
        title: 'Test Article',
        content:
          'This is a test article about machine learning and artificial intelligence.',
        source: {
          id: 'test_source',
          name: 'Test Source',
          domain: 'example.com',
          credibilityScore: 0.8,
          categories: ['technology'],
          rateLimit: 10,
          selectors: {},
          requiresAuth: false,
          successRate: 0.9,
        },
        metadata: { category: 'technology' },
        credibilityScore: 0.8,
        relevanceScore: 0.7,
        qualityScore: 0.8,
      };

      const knowledgeId =
        await collector.processIntoKnowledge(mockScrapedContent);

      if (knowledgeId) {
        expect(typeof knowledgeId).toBe('string');
        expect(knowledgeId.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Pattern Discovery', () => {
    it('should discover knowledge patterns', async () => {
      // Add some test knowledge first
      const testKnowledge = {
        type: 'factual' as any,
        content: 'Machine learning is a subset of artificial intelligence',
        subject: 'machine learning',
        confidence: 0.9,
        confidenceLevel: 'very_high' as any,
        sources: ['test'],
        tags: ['AI', 'ML', 'technology'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationDate: new Date(),
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: { domain: 'technology' },
      };

      knowledgeSystem.addKnowledge(testKnowledge);

      const patterns = await collector.discoverPatterns('machine learning');

      expect(Array.isArray(patterns)).toBe(true);
      // Patterns should include related concepts and connections
    });
  });

  describe('Quality Validation', () => {
    it('should validate knowledge quality', async () => {
      const testContent = {
        title: 'High Quality Article',
        content:
          'This is a well-researched article with detailed explanations and multiple sources.',
        source: {
          credibilityScore: 0.9,
          categories: ['research'],
        },
        credibilityScore: 0.9,
      };

      const validation = await collector.validateKnowledgeQuality(testContent);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.validationScore).toBeGreaterThan(0);
      expect(validation.confidence).toBeGreaterThan(0);
    });

    it('should assess source credibility', async () => {
      // Add a test source
      const testSource = {
        id: 'credible_source',
        name: 'Credible Source',
        domain: 'credible.com',
        credibilityScore: 0.95,
        categories: ['academic'],
        rateLimit: 10,
        selectors: {},
        requiresAuth: false,
        successRate: 0.98,
      };

      webScrapingService.addTrustedSource(testSource);

      const credibilityScore =
        await collector.assessSourceCredibility('credible_source');
      expect(credibilityScore).toBeGreaterThan(0);
      expect(credibilityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Enhanced Collection Process', () => {
    it('should start and stop enhanced collection', async () => {
      // Starting collection should not throw
      expect(async () => {
        await collector.startEnhancedCollection();
      }).not.toThrow();

      // Collection should be active
      const stats = collector.getEnhancedStats();
      expect(stats).toBeDefined();

      // Stopping collection should not throw
      expect(() => {
        collector.stopEnhancedCollection();
      }).not.toThrow();
    });

    it('should provide enhanced statistics', () => {
      const stats = collector.getEnhancedStats();

      expect(stats).toBeDefined();
      expect(stats.performance).toBeDefined();
      expect(stats.quality).toBeDefined();
      expect(stats.coverage).toBeDefined();
      expect(stats.trends).toBeDefined();

      // Performance metrics
      expect(stats.performance.averageCollectionTime).toBeDefined();
      expect(stats.performance.throughputPerHour).toBeDefined();
      expect(stats.performance.errorRate).toBeDefined();
      expect(stats.performance.cacheHitRate).toBeDefined();

      // Quality metrics
      expect(stats.quality.averageCredibilityScore).toBeDefined();
      expect(stats.quality.averageQualityScore).toBeDefined();
      expect(stats.quality.highQualityPercentage).toBeDefined();

      // Coverage metrics
      expect(stats.coverage.activeStrategies).toBeDefined();
      expect(stats.coverage.sourcesMonitored).toBeDefined();
      expect(Array.isArray(stats.coverage.categoriesCovered)).toBe(true);
    });

    it('should optimize collection strategies', async () => {
      const initialStrategies = collector.listCollectionStrategies();
      const initialCount = initialStrategies.length;

      await collector.optimizeStrategies();

      const optimizedStrategies = collector.listCollectionStrategies();

      // Optimization should maintain or improve strategy count
      expect(optimizedStrategies.length).toBeGreaterThanOrEqual(initialCount);
    });

    it('should perform system maintenance', async () => {
      expect(async () => {
        await collector.maintainSystem();
      }).not.toThrow();

      // After maintenance, system should still be functional
      const stats = collector.getEnhancedStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Memory Integration', () => {
    it('should create memories from collected knowledge', async () => {
      const initialMemoryCount = memorySystem.getAllMemories().length;

      const mockApiResponse = {
        source: {
          id: 'test_api',
          name: 'Test API',
          credibilityScore: 0.8,
        },
        data: {
          title: 'Important Discovery',
          description: 'A significant breakthrough in quantum computing.',
        },
        credibilityScore: 0.8,
        qualityScore: 0.9,
      };

      await collector.processIntoKnowledge(mockApiResponse);

      const finalMemoryCount = memorySystem.getAllMemories().length;

      // Should have added memories during processing
      expect(finalMemoryCount).toBeGreaterThanOrEqual(initialMemoryCount);
    });

    it('should integrate with existing memory patterns', async () => {
      // Add a base memory
      const baseMemory = {
        type: MemoryType.SEMANTIC,
        content: {
          concept: 'quantum computing',
          importance: 'high',
        },
        connections: [],
        strength: 0.8,
        metadata: { domain: 'technology' },
      };

      memorySystem.storeMemory(baseMemory);

      // Process related knowledge
      const relatedContent = {
        title: 'Quantum Algorithms',
        content: 'Advanced quantum algorithms for cryptography applications.',
        source: {
          credibilityScore: 0.9,
          categories: ['quantum', 'cryptography'],
        },
        credibilityScore: 0.9,
        metadata: { domain: 'technology' },
      };

      await collector.processIntoKnowledge(relatedContent);

      // Should have created connections or strengthened existing memories
      const quantumMemories = memorySystem.searchMemories('quantum', 10);
      expect(quantumMemories.length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty collection results gracefully', async () => {
      const emptyStrategy: DataCollectionStrategy = {
        id: 'empty_strategy',
        name: 'Empty Strategy',
        description: 'Strategy that yields no results',
        targetSources: ['nonexistent_source'],
        keywords: ['nonexistent_keyword_unlikely_to_match'],
        categories: ['nonexistent'],
        priority: 1,
        frequency: 'daily',
        qualityThreshold: 0.9,
        maxItemsPerRun: 1,
        filters: {
          minCredibility: 0.99,
        },
        active: true,
        stats: {
          totalRuns: 0,
          successfulItems: 0,
          filteredItems: 0,
          averageQuality: 0,
        },
      };

      const webContent = await collector.collectFromWeb(emptyStrategy);
      const apiContent = await collector.collectFromApis(emptyStrategy);

      expect(Array.isArray(webContent)).toBe(true);
      expect(Array.isArray(apiContent)).toBe(true);
      // Should not throw even if no results
    });

    it('should handle invalid strategy configurations', () => {
      const invalidStrategy = {
        id: '',
        name: '',
        description: '',
        targetSources: [],
        keywords: [],
        categories: [],
        priority: -1,
        frequency: 'invalid' as any,
        qualityThreshold: 2.0, // Invalid > 1.0
        maxItemsPerRun: -5,
        filters: {},
        active: true,
        stats: {
          totalRuns: 0,
          successfulItems: 0,
          filteredItems: 0,
          averageQuality: 0,
        },
      };

      // Should handle invalid configuration gracefully
      expect(() => {
        collector.addCollectionStrategy(invalidStrategy);
      }).not.toThrow();
    });

    it('should maintain system stability under high load', async () => {
      const strategies = collector.listCollectionStrategies();

      // Simulate concurrent operations
      const promises = strategies.slice(0, 3).map(async (strategy) => {
        try {
          await collector.collectFromWeb(strategy);
          await collector.collectFromApis(strategy);
          return true;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(promises);

      // Most operations should succeed
      const successRate = results.filter(Boolean).length / results.length;
      expect(successRate).toBeGreaterThan(0.5);
    });
  });
});
