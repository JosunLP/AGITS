/**
 * Test suite for Data Acquisition Services
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { ExternalApiService } from '../src/services/data-acquisition/external-api.service.js';
import { WebScrapingService } from '../src/services/data-acquisition/web-scraping.service.js';
import {
  ApiSource,
  ScrapedContent,
  SearchQuery,
  TrustedSource,
} from '../src/types/data-acquisition.type.js';

describe('Data Acquisition Services', () => {
  let webScrapingService: WebScrapingService;
  let externalApiService: ExternalApiService;

  beforeEach(() => {
    webScrapingService = new WebScrapingService();
    externalApiService = new ExternalApiService();
  });

  afterEach(() => {
    // Cleanup
    webScrapingService.clearCache();
    webScrapingService.stopMonitoring();
  });

  describe('WebScrapingService', () => {
    describe('Trusted Source Management', () => {
      it('should add and retrieve trusted sources', () => {
        const testSource: TrustedSource = {
          id: 'test_source',
          name: 'Test Source',
          domain: 'test.com',
          credibilityScore: 0.8,
          categories: ['test'],
          rateLimit: 10,
          selectors: {
            title: 'h1',
            content: '.content',
          },
          requiresAuth: false,
          successRate: 0.9,
        };

        webScrapingService.addTrustedSource(testSource);
        const retrieved = webScrapingService.getTrustedSource('test_source');

        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Test Source');
        expect(retrieved?.credibilityScore).toBe(0.8);
      });

      it('should list all trusted sources', () => {
        const initialSources = webScrapingService.listTrustedSources();
        const initialCount = initialSources.length;

        const testSource: TrustedSource = {
          id: 'test_source_2',
          name: 'Test Source 2',
          domain: 'test2.com',
          credibilityScore: 0.7,
          categories: ['test'],
          rateLimit: 5,
          selectors: {},
          requiresAuth: false,
          successRate: 0.8,
        };

        webScrapingService.addTrustedSource(testSource);
        const updatedSources = webScrapingService.listTrustedSources();

        expect(updatedSources.length).toBe(initialCount + 1);
        expect(updatedSources.some((s) => s.id === 'test_source_2')).toBe(true);
      });

      it('should remove trusted sources', () => {
        const testSource: TrustedSource = {
          id: 'removable_source',
          name: 'Removable Source',
          domain: 'removable.com',
          credibilityScore: 0.6,
          categories: ['test'],
          rateLimit: 1,
          selectors: {},
          requiresAuth: false,
          successRate: 0.5,
        };

        webScrapingService.addTrustedSource(testSource);
        expect(
          webScrapingService.getTrustedSource('removable_source')
        ).toBeDefined();

        webScrapingService.removeTrustedSource('removable_source');
        expect(
          webScrapingService.getTrustedSource('removable_source')
        ).toBeUndefined();
      });
    });

    describe('Content Scraping', () => {
      it('should scrape content from URL', async () => {
        const testUrl = 'https://example.com/test-article';
        const scrapedContent = await webScrapingService.scrapeUrl(testUrl);

        expect(scrapedContent).toBeDefined();
        if (scrapedContent) {
          expect(scrapedContent.url).toBe(testUrl);
          expect(scrapedContent.title).toBeDefined();
          expect(scrapedContent.content).toBeDefined();
          expect(scrapedContent.source).toBeDefined();
          expect(scrapedContent.credibilityScore).toBeGreaterThan(0);
        }
      });

      it('should search content across sources', async () => {
        const searchQuery: SearchQuery = {
          keywords: ['artificial intelligence', 'machine learning'],
          categories: ['science', 'technology'],
          maxResults: 5,
        };

        const results = await webScrapingService.searchContent(searchQuery);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(5);

        results.forEach((result) => {
          expect(result.title).toBeDefined();
          expect(result.content).toBeDefined();
          expect(result.source).toBeDefined();
          expect(result.qualityScore).toBeGreaterThan(0);
        });
      });
    });

    describe('Quality Assessment', () => {
      it('should assess content quality', () => {
        const testContent =
          'This is a well-structured article about artificial intelligence. It contains multiple paragraphs with detailed explanations and examples.';
        const qualityAssessment =
          webScrapingService.assessContentQuality(testContent);

        expect(qualityAssessment).toBeDefined();
        expect(qualityAssessment.overallScore).toBeGreaterThan(0);
        expect(qualityAssessment.overallScore).toBeLessThanOrEqual(1);
        expect(qualityAssessment.readabilityScore).toBeDefined();
        expect(qualityAssessment.informationDensity).toBeDefined();
        expect(qualityAssessment.structureScore).toBeDefined();
        expect(qualityAssessment.recommendations).toBeDefined();
        expect(Array.isArray(qualityAssessment.recommendations)).toBe(true);
      });

      it('should validate scraped content', () => {
        const mockContent: ScrapedContent = {
          url: 'https://test.com/article',
          title: 'Test Article',
          content:
            'This is a test article with sufficient content for validation.',
          source: {
            id: 'test',
            name: 'Test',
            domain: 'test.com',
            credibilityScore: 0.8,
            categories: ['test'],
            rateLimit: 10,
            selectors: {},
            requiresAuth: false,
            successRate: 0.9,
          },
          metadata: { test: true },
          credibilityScore: 0.8,
          relevanceScore: 0.7,
          qualityScore: 0.8,
        };

        const validation = webScrapingService.validateContent(mockContent);

        expect(validation).toBeDefined();
        expect(validation.isValid).toBe(true);
        expect(validation.validationScore).toBeGreaterThan(0);
        expect(validation.confidence).toBeGreaterThan(0);
        expect(Array.isArray(validation.issues)).toBe(true);
        expect(Array.isArray(validation.suggestions)).toBe(true);
      });
    });

    describe('Statistics and Monitoring', () => {
      it('should provide scraping statistics', () => {
        const stats = webScrapingService.getStats();

        expect(stats).toBeDefined();
        expect(stats.totalRequests).toBeDefined();
        expect(stats.successfulRequests).toBeDefined();
        expect(stats.failedRequests).toBeDefined();
        expect(stats.cachedResponses).toBeDefined();
        expect(stats.qualityDistribution).toBeDefined();
        expect(stats.sourceStatistics).toBeDefined();
      });

      it('should start and stop monitoring', () => {
        expect(() => {
          webScrapingService.startMonitoring();
          webScrapingService.stopMonitoring();
        }).not.toThrow();
      });

      it('should clear cache', () => {
        expect(() => {
          webScrapingService.clearCache();
        }).not.toThrow();
      });
    });
  });

  describe('ExternalApiService', () => {
    describe('API Source Management', () => {
      it('should add and retrieve API sources', () => {
        const testApiSource: ApiSource = {
          id: 'test_api',
          name: 'Test API',
          baseUrl: 'https://api.test.com',
          credibilityScore: 0.9,
          categories: ['test'],
          rateLimit: 100,
          endpoints: {
            search: '/search?q={query}',
          },
          responseFormat: 'json',
          authentication: 'none',
          successRate: 0.95,
        };

        externalApiService.addApiSource(testApiSource);
        const retrieved = externalApiService.getApiSource('test_api');

        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Test API');
        expect(retrieved?.credibilityScore).toBe(0.9);
      });

      it('should list all API sources', () => {
        const sources = externalApiService.listApiSources();

        expect(Array.isArray(sources)).toBe(true);
        expect(sources.length).toBeGreaterThan(0);

        sources.forEach((source) => {
          expect(source.id).toBeDefined();
          expect(source.name).toBeDefined();
          expect(source.baseUrl).toBeDefined();
          expect(source.credibilityScore).toBeGreaterThan(0);
        });
      });

      it('should remove API sources', () => {
        const testApiSource: ApiSource = {
          id: 'removable_api',
          name: 'Removable API',
          baseUrl: 'https://api.removable.com',
          credibilityScore: 0.6,
          categories: ['test'],
          rateLimit: 10,
          endpoints: {
            search: '/search',
          },
          responseFormat: 'json',
          authentication: 'none',
          successRate: 0.8,
        };

        externalApiService.addApiSource(testApiSource);
        expect(externalApiService.getApiSource('removable_api')).toBeDefined();

        externalApiService.removeApiSource('removable_api');
        expect(
          externalApiService.getApiSource('removable_api')
        ).toBeUndefined();
      });
    });

    describe('API Querying', () => {
      it('should query single API', async () => {
        const result = await externalApiService.queryApi(
          'wikipedia_api',
          'artificial intelligence'
        );

        expect(result).toBeDefined();
        if (result) {
          expect(result.source).toBeDefined();
          expect(result.query).toBe('artificial intelligence');
          expect(result.data).toBeDefined();
          expect(result.statusCode).toBe(200);
          expect(result.credibilityScore).toBeGreaterThan(0);
        }
      });

      it('should search across multiple APIs', async () => {
        const searchQuery: SearchQuery = {
          keywords: ['weather', 'climate'],
          categories: ['weather', 'environment'],
          maxResults: 3,
        };

        const results = await externalApiService.searchApis(searchQuery);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(3);

        results.forEach((result) => {
          expect(result.source).toBeDefined();
          expect(result.data).toBeDefined();
          expect(result.timestamp).toBeDefined();
          expect(result.credibilityScore).toBeGreaterThan(0);
        });
      });

      it('should handle invalid API source', async () => {
        const result = await externalApiService.queryApi(
          'invalid_api',
          'test query'
        );
        expect(result).toBeNull();
      });
    });

    describe('API Testing and Statistics', () => {
      it('should test API connectivity', async () => {
        const isConnected =
          await externalApiService.testApiConnection('wikipedia_api');
        expect(typeof isConnected).toBe('boolean');
      });

      it('should provide API statistics', () => {
        const stats = externalApiService.getStats();

        expect(stats).toBeDefined();
        expect(stats.totalRequests).toBeDefined();
        expect(stats.successfulRequests).toBeDefined();
        expect(stats.failedRequests).toBeDefined();
        expect(stats.successRate).toBeDefined();
        expect(stats.activeSources).toBeDefined();
        expect(stats.totalSources).toBeDefined();
        expect(stats.averageCredibility).toBeDefined();
        expect(stats.cacheSize).toBeDefined();
        expect(Array.isArray(stats.categories)).toBe(true);
      });

      it('should process API responses', () => {
        const mockApiSource: ApiSource = {
          id: 'mock_api',
          name: 'Mock API',
          baseUrl: 'https://api.mock.com',
          credibilityScore: 0.8,
          categories: ['test'],
          rateLimit: 50,
          endpoints: { search: '/search' },
          responseFormat: 'json',
          authentication: 'none',
          successRate: 0.9,
        };

        const mockResponse = {
          data: ['result1', 'result2'],
          status: 'success',
        };

        const processedResponse = externalApiService.processApiResponse(
          mockResponse,
          mockApiSource
        );

        expect(processedResponse).toBeDefined();
        expect(processedResponse.source).toBe(mockApiSource);
        expect(processedResponse.data).toBe(mockResponse);
        expect(processedResponse.credibilityScore).toBe(0.8);
        expect(processedResponse.qualityScore).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together for comprehensive data acquisition', async () => {
      // Test web scraping
      const webQuery: SearchQuery = {
        keywords: ['machine learning'],
        categories: ['science'],
        maxResults: 2,
      };

      const webResults = await webScrapingService.searchContent(webQuery);
      expect(webResults.length).toBeGreaterThan(0);

      // Test API querying
      const apiResults = await externalApiService.searchApis(webQuery);
      expect(apiResults.length).toBeGreaterThan(0);

      // Verify both provide quality content
      webResults.forEach((result) => {
        expect(result.qualityScore).toBeGreaterThan(0.5);
      });

      apiResults.forEach((result) => {
        expect(result.credibilityScore).toBeGreaterThan(0.5);
      });
    });

    it('should handle rate limiting gracefully', async () => {
      const queries = Array.from({ length: 5 }, (_, i) => `test query ${i}`);

      const results = await Promise.all(
        queries.map((query) =>
          externalApiService.queryApi('wikipedia_api', query)
        )
      );

      // All results should be defined (rate limiting should not completely block)
      expect(results.every((result) => result !== null)).toBe(true);
    });

    it('should maintain quality standards across both services', () => {
      const webStats = webScrapingService.getStats();
      const apiStats = externalApiService.getStats();

      // Both services should provide quality metrics
      expect(webStats.qualityDistribution).toBeDefined();
      expect(apiStats.averageCredibility).toBeGreaterThan(0);

      // Success rates should be reasonable
      if (apiStats.totalRequests > 0) {
        expect(apiStats.successRate).toBeGreaterThan(0.5);
      }
    });
  });
});
