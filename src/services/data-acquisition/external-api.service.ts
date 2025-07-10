/**
 * External API Integration Service - Sammelt Wissen aus vertrauenswürdigen API-Quellen
 * Implementiert Rate Limiting, Caching und Qualitätsbewertung
 */

import { EventEmitter } from 'events';
import { IExternalApiService } from '../../types/data-acquisition.interface.js';
import {
  ApiResponse,
  ApiSource,
  SearchQuery,
} from '../../types/data-acquisition.type.js';
import { Logger } from '../../utils/logger.js';

export class ExternalApiService
  extends EventEmitter
  implements IExternalApiService
{
  private logger: Logger;
  private apiSources: Map<string, ApiSource> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> =
    new Map();
  private cache: Map<string, { data: any; expiry: Date }> = new Map();

  // Service configuration
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly CACHE_DURATION = 1800000; // 30 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  // Statistics
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;

  constructor() {
    super();
    this.logger = new Logger('ExternalApiService');
    this.initializeApiSources();
    this.startCacheCleanup();
  }

  /**
   * Initialize trusted API sources
   */
  private initializeApiSources(): void {
    const sources: ApiSource[] = [
      {
        id: 'wikipedia_api',
        name: 'Wikipedia API',
        baseUrl: 'https://en.wikipedia.org/api/rest_v1',
        credibilityScore: 0.85,
        rateLimit: 100,
        categories: ['general', 'encyclopedia', 'facts'],
        endpoints: {
          search: '/page/summary/{title}',
          details: '/page/html/{title}',
        },
        responseFormat: 'json',
        authentication: 'none',
        successRate: 0.95,
      },
      {
        id: 'arxiv_api',
        name: 'arXiv API',
        baseUrl: 'http://export.arxiv.org/api',
        credibilityScore: 0.95,
        rateLimit: 30,
        categories: ['research', 'science', 'academic'],
        endpoints: {
          search:
            '/query?search_query={query}&start=0&max_results={maxResults}',
        },
        responseFormat: 'xml',
        authentication: 'none',
        successRate: 0.98,
      },
      {
        id: 'openweather_api',
        name: 'OpenWeatherMap API',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY || '',
        credibilityScore: 0.9,
        rateLimit: 60,
        categories: ['weather', 'environment', 'real-time'],
        endpoints: {
          search: '/weather?q={query}&appid={apiKey}&units=metric',
        },
        responseFormat: 'json',
        authentication: 'apikey',
        successRate: 0.92,
      },
    ];

    sources.forEach((source) => {
      this.apiSources.set(source.id, source);
      this.rateLimiters.set(source.id, {
        requests: 0,
        resetTime: Date.now() + 60000,
      });
    });

    this.logger.info(`Initialized ${sources.length} API sources`);
  }

  /**
   * Query external API (Interface method)
   */
  async queryApi(
    sourceId: string,
    query: string,
    options?: Record<string, any>
  ): Promise<ApiResponse | null> {
    const source = this.apiSources.get(sourceId);
    if (!source) {
      this.logger.warn(`API source not found: ${sourceId}`);
      return null;
    }

    try {
      this.totalRequests++;

      // Check rate limit
      if (!this.checkRateLimit(sourceId)) {
        this.logger.warn(`Rate limit exceeded for API: ${source.name}`);
        return null;
      }

      // Check cache first
      const cacheKey = `${sourceId}:${query}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && cachedResult.expiry > new Date()) {
        return this.createApiResponse(source, query, cachedResult.data, true);
      }

      // Mock API call for demonstration
      const mockData = await this.mockApiCall(source, query, options);

      // Cache the result
      this.cache.set(cacheKey, {
        data: mockData,
        expiry: new Date(Date.now() + this.CACHE_DURATION),
      });

      // Update rate limiter
      this.updateRateLimit(sourceId);
      this.successfulRequests++;

      return this.createApiResponse(source, query, mockData, false);
    } catch (error) {
      this.failedRequests++;
      this.logger.error(`Error querying API ${sourceId}:`, error);
      return null;
    }
  }

  /**
   * Search across multiple APIs (Interface method)
   */
  async searchApis(query: SearchQuery): Promise<ApiResponse[]> {
    const results: ApiResponse[] = [];
    const maxResults = query.maxResults || 10;

    // Get relevant sources based on query categories
    const relevantSources = this.filterSourcesByQuery(query);

    for (const source of relevantSources) {
      if (results.length >= maxResults) break;

      try {
        const queryString = query.keywords.join(' ');
        const apiResponse = await this.queryApi(source.id, queryString);
        if (apiResponse) {
          results.push(apiResponse);
        }
      } catch (error) {
        this.logger.error(`Error querying API ${source.id}:`, error);
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * Add new API source (Interface method)
   */
  addApiSource(source: ApiSource): void {
    this.apiSources.set(source.id, source);
    this.rateLimiters.set(source.id, {
      requests: 0,
      resetTime: Date.now() + 60000,
    });
    this.logger.info(`Added new API source: ${source.name}`);
  }

  /**
   * Remove API source (Interface method)
   */
  removeApiSource(sourceId: string): void {
    const removed = this.apiSources.delete(sourceId);
    if (removed) {
      this.rateLimiters.delete(sourceId);
      this.logger.info(`Removed API source: ${sourceId}`);
    }
  }

  /**
   * Get API source by ID (Interface method)
   */
  getApiSource(sourceId: string): ApiSource | undefined {
    return this.apiSources.get(sourceId);
  }

  /**
   * List all API sources (Interface method)
   */
  listApiSources(): ApiSource[] {
    return Array.from(this.apiSources.values());
  }

  /**
   * Test API connectivity (Interface method)
   */
  async testApiConnection(sourceId: string): Promise<boolean> {
    const source = this.apiSources.get(sourceId);
    if (!source) return false;

    try {
      // Mock connectivity test
      await this.sleep(100);
      return Math.random() > 0.1; // 90% success rate for demo
    } catch {
      return false;
    }
  }

  /**
   * Get API statistics (Interface method)
   */
  getStats(): any {
    const sources = Array.from(this.apiSources.values());

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate:
        this.totalRequests > 0
          ? this.successfulRequests / this.totalRequests
          : 0,
      activeSources: sources.filter((s) => s.isActive !== false).length,
      totalSources: sources.length,
      averageCredibility:
        sources.reduce((sum, s) => sum + s.credibilityScore, 0) /
        sources.length,
      cacheSize: this.cache.size,
      categories: [...new Set(sources.flatMap((s) => s.categories))],
    };
  }

  /**
   * Process API response (Interface method)
   */
  processApiResponse(response: any, source: ApiSource): ApiResponse {
    return {
      source,
      endpoint: source.endpoints.search || '',
      query: '',
      data: response,
      statusCode: 200,
      headers: {},
      timestamp: new Date(),
      processingTime: 0,
      credibilityScore: source.credibilityScore,
      qualityScore: this.assessResponseQuality(response),
    };
  }

  // Private helper methods

  private createApiResponse(
    source: ApiSource,
    query: string,
    data: any,
    cached: boolean
  ): ApiResponse {
    return {
      source,
      endpoint: source.endpoints.search || '',
      query,
      data,
      statusCode: 200,
      headers: {},
      timestamp: new Date(),
      processingTime: cached ? 0 : Math.random() * 1000,
      credibilityScore: source.credibilityScore,
      qualityScore: this.assessResponseQuality(data),
      cached,
      success: true,
    };
  }

  private async mockApiCall(
    source: ApiSource,
    query: string,
    options?: Record<string, any>
  ): Promise<any> {
    // Simulate API delay
    await this.sleep(Math.random() * 500 + 100);

    // Generate mock response based on source type
    switch (source.id) {
      case 'wikipedia_api':
        return {
          title: `${query} - Wikipedia`,
          extract: `This is a mock Wikipedia article about ${query}. Wikipedia is a free online encyclopedia with content contributed by volunteers worldwide.`,
          pageUrl: `https://en.wikipedia.org/wiki/${query.replace(/\\s+/g, '_')}`,
        };

      case 'arxiv_api':
        return {
          feed: {
            entry: [
              {
                title: `Research paper on ${query}`,
                summary: `This is a mock research paper abstract about ${query}. The study investigates various aspects and methodologies related to the topic.`,
                id: `http://arxiv.org/abs/2023.${Math.floor(Math.random() * 10000)}`,
                published: new Date().toISOString(),
              },
            ],
          },
        };

      case 'openweather_api':
        return {
          name: query,
          main: {
            temp: Math.random() * 30 + 5,
            humidity: Math.random() * 100,
          },
          weather: [
            {
              main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
              description: 'Mock weather data',
            },
          ],
        };

      default:
        return {
          query,
          results: [`Mock result 1 for ${query}`, `Mock result 2 for ${query}`],
          timestamp: new Date().toISOString(),
        };
    }
  }

  private filterSourcesByQuery(query: SearchQuery): ApiSource[] {
    const sources = Array.from(this.apiSources.values());

    if (!query.categories || query.categories.length === 0) {
      return sources;
    }

    return sources.filter((source) =>
      query.categories!.some((cat) => source.categories.includes(cat))
    );
  }

  private checkRateLimit(sourceId: string): boolean {
    const limiter = this.rateLimiters.get(sourceId);
    const source = this.apiSources.get(sourceId);

    if (!limiter || !source) return false;

    const now = Date.now();
    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + 60000;
    }

    return limiter.requests < source.rateLimit;
  }

  private updateRateLimit(sourceId: string): void {
    const limiter = this.rateLimiters.get(sourceId);
    if (limiter) {
      limiter.requests++;
    }
  }

  private assessResponseQuality(data: any): number {
    if (!data) return 0;

    let score = 0.5;

    // Check for content richness
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 100) score += 0.2;
    if (dataStr.length > 500) score += 0.2;

    // Check for structured data
    if (typeof data === 'object' && Object.keys(data).length > 1) score += 0.1;

    return Math.min(score, 1.0);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiry < now) {
          this.cache.delete(key);
        }
      }
    }, 300000); // Clean every 5 minutes
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
