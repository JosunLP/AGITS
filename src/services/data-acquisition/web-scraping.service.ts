/**
 * Web Scraping Service - Sammelt Wissen aus vertrauenswürdigen Internet-Quellen
 * Implementiert intelligente Datenextraktion mit Qualitätsbewertung
 */

import { IWebScrapingService } from '../../types/data-acquisition.interface.js';
import {
  ContentValidation,
  QualityAssessment,
  ScrapedContent,
  ScrapingStats,
  SearchQuery,
  TrustedSource,
} from '../../types/data-acquisition.type.js';
import {
  ConfidenceLevel,
  KnowledgeItem,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeType,
  ValidationMethod,
} from '../../types/index.js';
import { Logger } from '../../utils/logger.js';
import { EventEmitter } from '../../utils/node-polyfill.js';

export class WebScrapingService
  extends EventEmitter
  implements IWebScrapingService
{
  private logger: Logger;
  private trustedSources: Map<string, TrustedSource> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> =
    new Map();
  private cache: Map<string, { content: ScrapedContent; expiry: Date }> =
    new Map();

  // Service configuration
  private readonly USER_AGENT = 'AGITS-Bot/1.0 (Educational Research)';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private readonly MAX_CONTENT_LENGTH = 100000; // 100KB
  private readonly CONTENT_QUALITY_THRESHOLD = 0.6;

  constructor() {
    super();
    this.logger = new Logger('WebScrapingService');
    this.initializeTrustedSources();
    this.startCacheCleanup();
  }

  /**
   * Initialize trusted sources for knowledge collection
   */
  private initializeTrustedSources(): void {
    const sources: TrustedSource[] = [
      {
        id: 'wikipedia',
        name: 'Wikipedia',
        domain: 'wikipedia.org',
        credibilityScore: 0.85,
        categories: ['general', 'science', 'history', 'technology'],
        rateLimit: 10,
        selectors: {
          title: 'h1.firstHeading',
          content: '#mw-content-text .mw-parser-output p',
          metadata: '.infobox',
        },
        requiresAuth: false,
        successRate: 0.95,
      },
      {
        id: 'arxiv',
        name: 'arXiv',
        domain: 'arxiv.org',
        credibilityScore: 0.95,
        categories: ['science', 'technology', 'research'],
        rateLimit: 5,
        selectors: {
          title: 'h1.title',
          content: '.abstract-full',
          author: '.authors',
          date: '.submission-history',
        },
        requiresAuth: false,
        successRate: 0.98,
      },
      {
        id: 'scholar_google',
        name: 'Google Scholar',
        domain: 'scholar.google.com',
        credibilityScore: 0.9,
        categories: ['academic', 'research', 'science'],
        rateLimit: 3,
        selectors: {
          title: 'h3.gs_rt a',
          content: '.gs_rs',
          author: '.gs_a',
        },
        requiresAuth: false,
        successRate: 0.88,
      },
      {
        id: 'reuters',
        name: 'Reuters',
        domain: 'reuters.com',
        credibilityScore: 0.88,
        categories: ['news', 'business', 'technology'],
        rateLimit: 8,
        selectors: {
          title: 'h1[data-testid="Heading"]',
          content: '[data-testid="paragraph"]',
          author: '[data-testid="AuthorByline"]',
          date: 'time',
        },
        requiresAuth: false,
        successRate: 0.92,
      },
      {
        id: 'nature',
        name: 'Nature',
        domain: 'nature.com',
        credibilityScore: 0.96,
        categories: ['science', 'research', 'academic'],
        rateLimit: 3,
        selectors: {
          title: 'h1.c-article-title',
          content: '.c-article-body p',
          author: '.c-article-author-list',
          date: 'time',
        },
        requiresAuth: false,
        successRate: 0.94,
      },
      {
        id: 'mit_news',
        name: 'MIT News',
        domain: 'news.mit.edu',
        credibilityScore: 0.93,
        categories: ['technology', 'research', 'innovation'],
        rateLimit: 5,
        selectors: {
          title: 'h1.page-title',
          content: '.news-article-body p',
          author: '.news-article-author',
          date: '.news-article-date',
        },
        requiresAuth: false,
        successRate: 0.91,
      },
    ];

    sources.forEach((source) => {
      this.trustedSources.set(source.id, source);
      this.rateLimiters.set(source.id, {
        requests: 0,
        resetTime: Date.now() + 60000,
      });
    });

    this.logger.info(
      `Initialized ${sources.length} trusted sources for web scraping`
    );
  }

  /**
   * Search and collect knowledge from web sources
   */
  public async searchAndCollect(query: SearchQuery): Promise<KnowledgeItem[]> {
    this.logger.info(`Starting web search for: ${query.keywords.join(', ')}`);

    const relevantSources = this.filterSourcesByQuery(query);
    const results: KnowledgeItem[] = [];

    for (const source of relevantSources) {
      try {
        if (!this.checkRateLimit(source.id)) {
          this.logger.warn(`Rate limit exceeded for source: ${source.name}`);
          continue;
        }

        const scrapedContent = await this.scrapeFromSource(source, query);

        if (scrapedContent.length > 0) {
          const knowledgeItems = await this.convertToKnowledgeItems(
            scrapedContent,
            query
          );
          results.push(...knowledgeItems);
        }

        // Update rate limiter
        this.updateRateLimit(source.id);

        // Respect rate limits
        await this.sleep(Math.max(60000 / source.rateLimit, 1000));
      } catch (error) {
        this.logger.error(`Error scraping from ${source.name}:`, error);
        this.updateSourceSuccessRate(source.id, false);
      }
    }

    this.logger.info(
      `Web search completed. Found ${results.length} knowledge items`
    );
    this.emit('searchCompleted', { query, results: results.length });

    return results;
  }

  /**
   * Scrape content from specific source
   */
  private async scrapeFromSource(
    source: TrustedSource,
    query: SearchQuery
  ): Promise<ScrapedContent[]> {
    // Check cache first
    const cacheKey = `${source.id}_${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > new Date()) {
      this.logger.debug(`Using cached content for ${source.name}`);
      return [cached.content];
    }

    // Simulate web scraping (in real implementation, use libraries like Puppeteer or Cheerio)
    const results: ScrapedContent[] = [];

    try {
      // This would be actual web scraping logic
      const mockContent = await this.simulateWebScraping(source, query);
      for (const content of mockContent) {
        const qualityScore = this.assessContentQualityLegacy(content);

        if (qualityScore >= this.CONTENT_QUALITY_THRESHOLD) {
          const scrapedContent: ScrapedContent = {
            url: content.url || '',
            title: content.title || '',
            content: content.content || '',
            author: content.author || '',
            publishDate: content.publishDate || new Date(),
            lastModified: content.lastModified || new Date(),
            metadata: content.metadata || {},
            source,
            credibilityScore: source.credibilityScore,
            qualityScore,
            relevanceScore: this.calculateRelevanceScore(content, query),
          };

          results.push(scrapedContent);

          // Cache the result
          this.cache.set(cacheKey, {
            content: scrapedContent,
            expiry: new Date(Date.now() + this.CACHE_DURATION),
          });
        }
      }

      this.updateSourceSuccessRate(source.id, true);
    } catch (error) {
      this.logger.error(`Failed to scrape ${source.name}:`, error);
      this.updateSourceSuccessRate(source.id, false);
      throw error;
    }

    return results;
  }

  /**
   * Simulate web scraping (replace with actual implementation)
   */
  private async simulateWebScraping(
    source: TrustedSource,
    query: SearchQuery
  ): Promise<Partial<ScrapedContent>[]> {
    // In a real implementation, this would use actual web scraping
    const simulatedResults: Partial<ScrapedContent>[] = [];

    for (let i = 0; i < Math.min(query.maxResults || 5, 10); i++) {
      const keywords = query.keywords.join(' ');

      simulatedResults.push({
        url: `https://${source.domain}/article-${i + 1}`,
        title: `${keywords} - Research Article ${i + 1}`,
        content: this.generateMockContent(keywords, source.categories[0]),
        author: `Researcher ${i + 1}`,
        publishDate: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ),
        metadata: {
          category: source.categories[0],
          sourceType: 'web_scraping',
          scrapingDate: new Date(),
          language: query.language || 'en',
        },
      });
    }

    return simulatedResults;
  }

  /**
   * Generate mock content for simulation
   */
  private generateMockContent(keywords: string, category: string): string {
    const templates = {
      science: [
        `Recent research in ${keywords} has shown significant advances in understanding the underlying mechanisms.`,
        `The study of ${keywords} continues to evolve with new discoveries in ${category}.`,
        `Experimental results demonstrate that ${keywords} plays a crucial role in modern ${category}.`,
      ],
      technology: [
        `The latest developments in ${keywords} technology are revolutionizing the field.`,
        `Implementation of ${keywords} systems shows promising results for future applications.`,
        `Industry experts predict that ${keywords} will significantly impact technological advancement.`,
      ],
      general: [
        `Understanding ${keywords} is essential for comprehending complex systems.`,
        `The relationship between ${keywords} and other factors remains an active area of research.`,
        `Evidence suggests that ${keywords} influences various aspects of the domain.`,
      ],
    };

    const categoryTemplates =
      templates[category as keyof typeof templates] || templates.general;
    const selectedTemplate =
      categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    return (
      selectedTemplate +
      ` This comprehensive analysis provides insights into the current state of research and potential future directions. The findings contribute to our understanding of the broader implications and applications in related fields.`
    );
  }

  /**
   * Convert scraped content to knowledge items
   */
  private async convertToKnowledgeItems(
    contents: ScrapedContent[],
    query: SearchQuery
  ): Promise<KnowledgeItem[]> {
    const knowledgeItems: KnowledgeItem[] = [];

    for (const content of contents) {
      const knowledgeItem: KnowledgeItem = {
        id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.determineKnowledgeType(content),
        source: KnowledgeSourceType.EXTERNAL_API,
        content: {
          title: content.title,
          text: content.content,
          url: content.url,
          author: content.author,
          publishDate: content.publishDate,
          extractedAt: new Date(),
        },
        subject: this.extractSubject(content),
        description: `Web-sourced knowledge about ${query.keywords.join(', ')}`,
        confidence: this.calculateConfidence(content),
        confidenceLevel: this.getConfidenceLevel(content.credibilityScore),
        sources: [content.source.name],
        tags: [
          ...query.keywords,
          content.source.domain,
          ...content.source.categories,
        ],
        status: KnowledgeStatus.PENDING,
        relationships: [],
        validation: {
          isVerified: false,
          verificationMethod: ValidationMethod.AUTOMATIC,
          verificationScore: content.credibilityScore,
          contradictions: [],
          supportingEvidence: [content.url],
        },
        verification: {
          isVerified: false,
          verificationMethod: 'web_scraping',
        },
        metadata: {
          domain: content.source.categories[0],
          complexity: this.assessComplexity(content.content),
          importance: content.relevanceScore,
          frequency: 1,
          context: {
            searchQuery: query,
            sourceCredibility: content.credibilityScore,
            qualityScore: content.qualityScore,
          },
          derivedFrom: [],
          relatedConcepts: query.keywords,
          applications: [`research_${content.source.categories[0]}`],
          limitations: ['web_source_dependency', 'temporal_relevance'],
          assumptions: ['source_credibility', 'content_accuracy'],
          webSource: {
            domain: content.source.domain,
            scrapedAt: new Date(),
            credibilityScore: content.source.credibilityScore,
            rateLimit: content.source.rateLimit,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      knowledgeItems.push(knowledgeItem);
    }

    return knowledgeItems;
  }

  /**
   * Filter sources based on query criteria
   */
  private filterSourcesByQuery(query: SearchQuery): TrustedSource[] {
    return Array.from(this.trustedSources.values())
      .filter((source) => {
        // Check credibility threshold
        if (
          query.minCredibility &&
          source.credibilityScore < query.minCredibility
        ) {
          return false;
        }

        // Check category match
        if (query.categories && query.categories.length > 0) {
          const hasMatchingCategory = query.categories.some((cat) =>
            source.categories.includes(cat)
          );
          if (!hasMatchingCategory) {
            return false;
          }
        }

        // Check excluded domains
        if (
          query.excludeDomains &&
          query.excludeDomains.includes(source.domain)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.credibilityScore - a.credibilityScore); // Sort by credibility
  }

  /**
   * Check rate limit for source
   */
  private checkRateLimit(sourceId: string): boolean {
    const limiter = this.rateLimiters.get(sourceId);
    if (!limiter) return true;

    const now = Date.now();

    // Reset counter if minute has passed
    if (now >= limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + 60000;
    }

    const source = this.trustedSources.get(sourceId);
    return limiter.requests < (source?.rateLimit || 10);
  }

  /**
   * Update rate limit counter
   */
  private updateRateLimit(sourceId: string): void {
    const limiter = this.rateLimiters.get(sourceId);
    if (limiter) {
      limiter.requests++;
    }
  }

  /**
   * Update source success rate
   */
  private updateSourceSuccessRate(sourceId: string, success: boolean): void {
    const source = this.trustedSources.get(sourceId);
    if (source) {
      const weight = 0.1; // Learning rate for success rate
      source.successRate = success
        ? source.successRate + weight * (1 - source.successRate)
        : source.successRate * (1 - weight);

      source.lastAccessed = new Date();
    }
  }

  /**
   * Assess content quality
   */
  /**
   * Assess content quality
   */
  assessContentQuality(
    content: string,
    metadata?: Record<string, any>
  ): QualityAssessment {
    const readabilityScore = this.calculateReadabilityScore(content);
    const informationDensity = this.calculateInformationDensity(content);
    const structureScore = this.calculateStructureScore(content);
    const relevanceScore = metadata?.relevanceScore || 0.5;

    const overallScore =
      (readabilityScore +
        informationDensity +
        structureScore +
        relevanceScore) /
      4;

    return {
      readabilityScore,
      informationDensity,
      structureScore,
      relevanceScore,
      overallScore,
      recommendations: this.generateQualityRecommendations(overallScore),
    };
  }

  /**
   * Private method for legacy quality assessment
   */
  private assessContentQualityLegacy(content: Partial<ScrapedContent>): number {
    let score = 0.5; // Base score

    // Content length
    if (content.content && content.content.length > 100) score += 0.2;
    if (content.content && content.content.length > 500) score += 0.1;

    // Has title
    if (content.title) score += 0.1;

    // Has author
    if (content.author) score += 0.1;

    // Has publish date
    if (content.publishDate) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    content: Partial<ScrapedContent>,
    query: SearchQuery
  ): number {
    if (!content.content || !content.title) return 0.5;

    const text = (content.title + ' ' + content.content).toLowerCase();
    const keywords = query.keywords.map((k) => k.toLowerCase());

    let matches = 0;
    let totalKeywords = keywords.length;

    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        matches++;
      }
    });

    return totalKeywords > 0 ? matches / totalKeywords : 0.5;
  }

  /**
   * Determine knowledge type from content
   */
  private determineKnowledgeType(content: ScrapedContent): KnowledgeType {
    const categories = content.source.categories;

    if (categories.includes('research') || categories.includes('academic')) {
      return KnowledgeType.FACTUAL;
    }
    if (categories.includes('technology')) {
      return KnowledgeType.PROCEDURAL;
    }
    if (categories.includes('science')) {
      return KnowledgeType.CONCEPTUAL;
    }

    return KnowledgeType.FACTUAL; // Default
  }

  /**
   * Extract subject from content
   */
  private extractSubject(content: ScrapedContent): string {
    if (content.title) {
      // Extract main subject from title
      const words = content.title.split(' ');
      return words.slice(0, 3).join(' '); // Take first 3 words
    }
    return content.source.categories[0] || 'General Knowledge';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(content: ScrapedContent): number {
    return (
      (content.credibilityScore +
        content.qualityScore +
        content.relevanceScore) /
      3
    );
  }

  /**
   * Get confidence level from score
   */
  private getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.8) return ConfidenceLevel.VERY_HIGH;
    if (score >= 0.6) return ConfidenceLevel.HIGH;
    if (score >= 0.4) return ConfidenceLevel.MEDIUM;
    if (score >= 0.2) return ConfidenceLevel.LOW;
    return ConfidenceLevel.VERY_LOW;
  }

  /**
   * Assess content complexity
   */
  private assessComplexity(content: string): number {
    if (!content) return 0.3;

    // Simple complexity assessment based on length and vocabulary
    const words = content.split(' ');
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = content.split(/[.!?]+/).length;
    const avgSentenceLength = words.length / sentences;

    let complexity = 0.3;

    if (avgWordLength > 5) complexity += 0.2;
    if (avgSentenceLength > 15) complexity += 0.2;
    if (content.length > 1000) complexity += 0.2;
    if (/\b(research|analysis|methodology|hypothesis)\b/i.test(content))
      complexity += 0.1;

    return Math.min(complexity, 1.0);
  }

  /**
   * Start cache cleanup routine
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [key, cached] of this.cache.entries()) {
        if (cached.expiry <= now) {
          this.cache.delete(key);
        }
      }
    }, 300000); // Clean every 5 minutes
  }

  /**
   * Get trusted sources statistics
   */
  public getTrustedSourcesStats(): any {
    const sources = Array.from(this.trustedSources.values());

    return {
      totalSources: sources.length,
      avgCredibility:
        sources.reduce((sum, s) => sum + s.credibilityScore, 0) /
        sources.length,
      avgSuccessRate:
        sources.reduce((sum, s) => sum + s.successRate, 0) / sources.length,
      categories: [...new Set(sources.flatMap((s) => s.categories))],
      rateLimits: Object.fromEntries(
        Array.from(this.rateLimiters.entries()).map(([id, limiter]) => [
          id,
          { requests: limiter.requests, resetTime: limiter.resetTime },
        ])
      ),
      cacheSize: this.cache.size,
    };
  }

  /**
   * Add new trusted source
   */
  public addTrustedSource(source: TrustedSource): void {
    this.trustedSources.set(source.id, source);
    this.rateLimiters.set(source.id, {
      requests: 0,
      resetTime: Date.now() + 60000,
    });
    this.logger.info(`Added new trusted source: ${source.name}`);
  }

  /**
   * Remove trusted source
   */
  public removeTrustedSource(sourceId: string): boolean {
    const removed = this.trustedSources.delete(sourceId);
    if (removed) {
      this.rateLimiters.delete(sourceId);
      this.logger.info(`Removed trusted source: ${sourceId}`);
    }
    return removed;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Utility method for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(content: string): number {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    // Simple readability heuristic
    if (avgWordsPerSentence < 15) return 0.9;
    if (avgWordsPerSentence < 25) return 0.7;
    return 0.5;
  }

  /**
   * Calculate information density
   */
  private calculateInformationDensity(content: string): number {
    const contentLength = content.length;
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;

    if (contentLength === 0) return 0;
    return Math.min(uniqueWords / (contentLength / 100), 1.0);
  }

  /**
   * Calculate structure score
   */
  private calculateStructureScore(content: string): number {
    let score = 0.5;

    // Check for headings
    if (content.includes('#') || /<h[1-6]>/i.test(content)) score += 0.2;

    // Check for lists
    if (content.includes('- ') || /<[uo]l>/i.test(content)) score += 0.2;

    // Check for paragraphs
    if (content.split('\n\n').length > 1) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Generate quality recommendations
   */
  private generateQualityRecommendations(score: number): string[] {
    const recommendations: string[] = [];

    if (score < 0.6) {
      recommendations.push('Improve content structure and readability');
    }
    if (score < 0.5) {
      recommendations.push('Verify source credibility');
    }
    if (score < 0.4) {
      recommendations.push('Consider filtering out low-quality content');
    }

    return recommendations;
  }

  /**
   * Validate content according to interface
   */
  validateContent(content: ScrapedContent): ContentValidation {
    const qualityAssessment = this.assessContentQuality(
      content.content,
      content.metadata
    );

    return {
      isValid: qualityAssessment.overallScore >= this.CONTENT_QUALITY_THRESHOLD,
      validationScore: qualityAssessment.overallScore,
      issues: [],
      suggestions: qualityAssessment.recommendations,
      confidence: qualityAssessment.overallScore,
    };
  }

  /**
   * Get trusted source by ID
   */
  getTrustedSource(sourceId: string): TrustedSource | undefined {
    return this.trustedSources.get(sourceId);
  }

  /**
   * List all trusted sources
   */
  listTrustedSources(): TrustedSource[] {
    return Array.from(this.trustedSources.values());
  }

  /**
   * Scrape content from a specific URL (Interface method)
   */
  async scrapeUrl(
    url: string,
    sourceId?: string
  ): Promise<ScrapedContent | null> {
    // Use existing private method with mock implementation
    const source = sourceId
      ? this.trustedSources.get(sourceId)
      : this.getDefaultSource();
    if (!source) return null;

    // This would normally make a real HTTP request
    const mockContent: ScrapedContent = {
      url,
      title: `Mock title for ${url}`,
      content: `Mock content extracted from ${url}`,
      source,
      metadata: { extracted: new Date() },
      credibilityScore: source.credibilityScore,
      relevanceScore: 0.7,
      qualityScore: 0.8,
    };

    return mockContent;
  }

  /**
   * Search for content across trusted sources (Interface method)
   */
  async searchContent(query: SearchQuery): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    const maxResults = query.maxResults || 10;

    // Mock search implementation
    for (const [sourceId, source] of this.trustedSources) {
      if (results.length >= maxResults) break;

      // Check if source matches query categories
      if (
        query.categories &&
        !query.categories.some((cat) => source.categories.includes(cat))
      ) {
        continue;
      }

      // Mock content generation based on query
      const mockContent: ScrapedContent = {
        url: `https://${source.domain}/search?q=${query.keywords.join('+')}`,
        title: `Search result from ${source.name}: ${query.keywords.join(' ')}`,
        content: this.generateMockContent(
          query.keywords.join(' '),
          source.categories[0] || 'general'
        ),
        source,
        metadata: {
          searchQuery: query.keywords.join(' '),
          searchTime: new Date(),
          categories: source.categories,
        },
        credibilityScore: source.credibilityScore,
        relevanceScore: Math.random() * 0.5 + 0.5, // Random between 0.5-1.0
        qualityScore: Math.random() * 0.3 + 0.7, // Random between 0.7-1.0
      };

      results.push(mockContent);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Get scraping statistics (Interface method)
   */
  getStats(): ScrapingStats {
    const sources = Array.from(this.trustedSources.values());

    return {
      totalRequests: this.totalRequests || 0,
      successfulRequests: this.successfulRequests || 0,
      failedRequests: this.failedRequests || 0,
      averageResponseTime: this.averageResponseTime || 0,
      cachedResponses: this.cache.size,
      rateLimitHits: this.rateLimitHits || 0,
      qualityDistribution: {
        high: this.qualityStats?.high || 0,
        medium: this.qualityStats?.medium || 0,
        low: this.qualityStats?.low || 0,
      },
      sourceStatistics: sources.reduce(
        (acc, source) => {
          acc[source.id] = {
            requests: 0,
            successes: 0,
            averageQuality: source.credibilityScore,
            lastAccess: source.lastAccessed || new Date(),
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    };
  }

  /**
   * Start continuous monitoring (Interface method)
   */
  startMonitoring(): void {
    this.monitoringActive = true;
    this.logger.info('Web scraping monitoring started');
  }

  /**
   * Stop continuous monitoring (Interface method)
   */
  stopMonitoring(): void {
    this.monitoringActive = false;
    this.logger.info('Web scraping monitoring stopped');
  }

  /**
   * Get default source for URL scraping
   */
  private getDefaultSource(): TrustedSource {
    return {
      id: 'default',
      name: 'Default Source',
      domain: 'web',
      credibilityScore: 0.5,
      categories: ['general'],
      rateLimit: 10,
      selectors: {},
      requiresAuth: false,
      successRate: 0.8,
    };
  }

  /**
   * Scrape content from URL with selectors
   */
  public async scrape(
    url: string,
    selectors?: Record<string, string>,
    options?: {
      useCache?: boolean;
      priority?: number;
      timeout?: number;
    }
  ): Promise<ScrapedContent> {
    const source = this.findSourceByDomain(url);
    if (!source) {
      throw new Error(`URL not from trusted source: ${url}`);
    }

    // Check cache first
    if (options?.useCache !== false) {
      const cached = this.getFromCache(url);
      if (cached) {
        return cached;
      }
    }

    // Check rate limiting
    if (!this.checkRateLimit(source.id)) {
      throw new Error(`Rate limit exceeded for source: ${source.name}`);
    }

    try {
      const content = await this.scrapeUrl(url, source.id);
      if (!content) {
        throw new Error(`Failed to scrape content from ${url}`);
      }

      this.updateRateLimit(source.id);

      // Cache result
      if (options?.useCache !== false) {
        this.setCache(url, content);
      }

      this.emit('contentScraped', { url, content, source: source.id });
      return content;
    } catch (error) {
      this.logger.error(`Scraping failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Find source by domain
   */
  private findSourceByDomain(url: string): TrustedSource | undefined {
    try {
      const domain = new URL(url).hostname;
      return Array.from(this.trustedSources.values()).find((source) =>
        domain.includes(source.domain)
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Get content from cache
   */
  private getFromCache(url: string): ScrapedContent | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    if (Date.now() > entry.expiry.getTime()) {
      this.cache.delete(url);
      return null;
    }

    return entry.content;
  }

  /**
   * Set content in cache
   */
  private setCache(url: string, content: ScrapedContent): void {
    this.cache.set(url, {
      content,
      expiry: new Date(Date.now() + this.CACHE_DURATION),
    });
  }

  // Add missing properties for stats
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private averageResponseTime = 0;
  private rateLimitHits = 0;
  private qualityStats = { high: 0, medium: 0, low: 0 };
  private monitoringActive = false;
}
