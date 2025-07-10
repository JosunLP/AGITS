/**
 * Data Acquisition Interfaces
 * Interfaces für Datensammlung und externe APIs
 */

import {
  ApiResponse,
  ApiSource,
  ContentValidation,
  DataCollectionStrategy,
  QualityAssessment,
  ScrapedContent,
  SearchQuery,
  TrustedSource,
} from './data-acquisition.type.js';

/**
 * Interface für Web-Scraping Services
 */
export interface IWebScrapingService {
  /**
   * Scrape content from a specific URL
   */
  scrapeUrl(url: string, sourceId?: string): Promise<ScrapedContent | null>;

  /**
   * Search for content across trusted sources
   */
  searchContent(query: SearchQuery): Promise<ScrapedContent[]>;

  /**
   * Add new trusted source
   */
  addTrustedSource(source: TrustedSource): void;

  /**
   * Remove trusted source
   */
  removeTrustedSource(sourceId: string): void;

  /**
   * Get trusted source by ID
   */
  getTrustedSource(sourceId: string): TrustedSource | undefined;

  /**
   * List all trusted sources
   */
  listTrustedSources(): TrustedSource[];

  /**
   * Assess content quality
   */
  assessContentQuality(
    content: string,
    metadata?: Record<string, any>
  ): QualityAssessment;

  /**
   * Validate scraped content
   */
  validateContent(content: ScrapedContent): ContentValidation;

  /**
   * Get scraping statistics
   */
  getStats(): any;

  /**
   * Clear cache
   */
  clearCache(): void;

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void;

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void;
}

/**
 * Interface für External API Services
 */
export interface IExternalApiService {
  /**
   * Query external API
   */
  queryApi(
    sourceId: string,
    query: string,
    options?: Record<string, any>
  ): Promise<ApiResponse | null>;

  /**
   * Search across multiple APIs
   */
  searchApis(query: SearchQuery): Promise<ApiResponse[]>;

  /**
   * Add new API source
   */
  addApiSource(source: ApiSource): void;

  /**
   * Remove API source
   */
  removeApiSource(sourceId: string): void;

  /**
   * Get API source by ID
   */
  getApiSource(sourceId: string): ApiSource | undefined;

  /**
   * List all API sources
   */
  listApiSources(): ApiSource[];

  /**
   * Test API connectivity
   */
  testApiConnection(sourceId: string): Promise<boolean>;

  /**
   * Get API statistics
   */
  getStats(): any;

  /**
   * Process API response
   */
  processApiResponse(response: any, source: ApiSource): ApiResponse;
}

/**
 * Interface für erweiterte autonome Wissenssammlung
 */
export interface IEnhancedAutonomousKnowledgeCollector {
  /**
   * Start autonomous collection with enhanced strategies
   */
  startEnhancedCollection(): Promise<void>;

  /**
   * Stop enhanced collection
   */
  stopEnhancedCollection(): void;

  /**
   * Collect knowledge from web sources
   */
  collectFromWeb(strategy?: DataCollectionStrategy): Promise<ScrapedContent[]>;

  /**
   * Collect knowledge from API sources
   */
  collectFromApis(strategy?: DataCollectionStrategy): Promise<ApiResponse[]>;

  /**
   * Add collection strategy
   */
  addCollectionStrategy(strategy: DataCollectionStrategy): void;

  /**
   * Remove collection strategy
   */
  removeCollectionStrategy(strategyId: string): void;

  /**
   * Update collection strategy
   */
  updateCollectionStrategy(
    strategyId: string,
    updates: Partial<DataCollectionStrategy>
  ): void;

  /**
   * Get collection strategy
   */
  getCollectionStrategy(strategyId: string): DataCollectionStrategy | undefined;

  /**
   * List all collection strategies
   */
  listCollectionStrategies(): DataCollectionStrategy[];

  /**
   * Process collected content into knowledge items
   */
  processIntoKnowledge(
    content: ScrapedContent | ApiResponse
  ): Promise<string | null>;

  /**
   * Discover related knowledge patterns
   */
  discoverPatterns(topic: string): Promise<any[]>;

  /**
   * Get enhanced collection statistics
   */
  getEnhancedStats(): any;

  /**
   * Optimize collection strategies based on performance
   */
  optimizeStrategies(): Promise<void>;

  /**
   * Validate knowledge quality before storage
   */
  validateKnowledgeQuality(content: any): Promise<ContentValidation>;

  /**
   * Get credibility assessment for source
   */
  assessSourceCredibility(sourceId: string): Promise<number>;

  /**
   * Maintain and cleanup collection system
   */
  maintainSystem(): Promise<void>;
}

/**
 * Interface für Content Processor
 */
export interface IContentProcessor {
  /**
   * Process raw content into structured knowledge
   */
  processContent(content: string, metadata?: Record<string, any>): Promise<any>;

  /**
   * Extract entities from content
   */
  extractEntities(content: string): Promise<any[]>;

  /**
   * Detect content language
   */
  detectLanguage(content: string): Promise<string>;

  /**
   * Normalize content structure
   */
  normalizeContent(content: string): Promise<string>;

  /**
   * Extract keywords and topics
   */
  extractKeywords(content: string): Promise<string[]>;

  /**
   * Assess content readability
   */
  assessReadability(content: string): Promise<number>;

  /**
   * Check for duplicate content
   */
  checkDuplicates(content: string): Promise<boolean>;
}

/**
 * Interface für Quality Assessor
 */
export interface IQualityAssessor {
  /**
   * Comprehensive quality assessment
   */
  assessQuality(
    content: string,
    metadata?: Record<string, any>
  ): Promise<QualityAssessment>;

  /**
   * Assess information density
   */
  assessInformationDensity(content: string): Promise<number>;

  /**
   * Assess content structure
   */
  assessStructure(content: string): Promise<number>;

  /**
   * Assess content credibility
   */
  assessCredibility(content: string, source?: any): Promise<number>;

  /**
   * Assess content relevance
   */
  assessRelevance(content: string, context?: any): Promise<number>;

  /**
   * Generate quality report
   */
  generateQualityReport(assessment: QualityAssessment): string;
}

/**
 * Interface für Source Manager
 */
export interface ISourceManager {
  /**
   * Manage trusted sources
   */
  manageTrustedSources(): Promise<void>;

  /**
   * Update source credibility scores
   */
  updateCredibilityScores(): Promise<void>;

  /**
   * Monitor source health
   */
  monitorSourceHealth(): Promise<void>;

  /**
   * Discover new potential sources
   */
  discoverNewSources(domain: string): Promise<TrustedSource[]>;

  /**
   * Validate source reliability
   */
  validateSourceReliability(sourceId: string): Promise<boolean>;

  /**
   * Archive inactive sources
   */
  archiveInactiveSources(): Promise<string[]>;
}
