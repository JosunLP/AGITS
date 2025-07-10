/**
 * Data Acquisition Types
 * Typen und Interfaces für Datensammlung und -verarbeitung
 */

/**
 * Trusted web sources configuration
 */
export interface TrustedSource {
  id: string;
  name: string;
  domain: string;
  credibilityScore: number; // 0.0 - 1.0
  categories: string[];
  rateLimit: number; // requests per minute
  selectors: {
    title?: string;
    content?: string;
    author?: string;
    date?: string;
    metadata?: string;
  };
  apiKey?: string;
  requiresAuth: boolean;
  lastAccessed?: Date;
  successRate: number;
}

/**
 * Scraped content structure
 */
export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishDate?: Date;
  lastModified?: Date;
  source: TrustedSource;
  metadata: Record<string, any>;
  credibilityScore: number;
  relevanceScore: number;
  qualityScore: number;
}

/**
 * Search query configuration
 */
export interface SearchQuery {
  keywords: string[];
  categories?: string[];
  maxResults?: number;
  minCredibility?: number;
  timeRange?: {
    from?: Date;
    to?: Date;
  };
  language?: string;
  excludeDomains?: string[];
}

/**
 * Content quality assessment result
 */
export interface QualityAssessment {
  readabilityScore: number;
  informationDensity: number;
  structureScore: number;
  relevanceScore: number;
  overallScore: number;
  recommendations: string[];
}

/**
 * Scraping statistics
 */
export interface ScrapingStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cachedResponses: number;
  rateLimitHits: number;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  sourceStatistics: Record<
    string,
    {
      requests: number;
      successes: number;
      averageQuality: number;
      lastAccess: Date;
    }
  >;
}

/**
 * External API source configuration
 */
export interface ApiSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  credibilityScore: number;
  categories: string[];
  rateLimit: number;
  endpoints: {
    search?: string;
    content?: string;
    metadata?: string;
    details?: string; // Added for compatibility
  };
  headers?: Record<string, string>; // Made optional
  requestFormat?: 'json' | 'xml' | 'text';
  responseFormat: 'json' | 'xml' | 'text';
  authentication:
    | {
        type: 'none' | 'apikey' | 'oauth' | 'bearer';
        headerName?: string;
        tokenPrefix?: string;
      }
    | string; // Allow string for backward compatibility
  isActive?: boolean; // Made optional
  successRate: number;
  lastAccessed?: Date;
}

/**
 * API response structure
 */
export interface ApiResponse {
  source: ApiSource;
  endpoint: string;
  query: string;
  data: any;
  statusCode: number;
  headers: Record<string, string>;
  timestamp: Date;
  processingTime: number;
  credibilityScore: number;
  qualityScore: number;
  success?: boolean; // Added for compatibility
  requestTime?: number; // Added for compatibility
  cached?: boolean; // Added for compatibility
  error?: string; // Added for compatibility
}

/**
 * Cache entry structure
 */
export interface CacheEntry {
  key: string;
  content: ScrapedContent | ApiResponse;
  expiry: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimiter {
  requests: number;
  resetTime: number;
  maxRequests: number;
  windowMs: number;
}

/**
 * Knowledge source metadata
 */
export interface KnowledgeSourceMetadata {
  sourceId: string;
  sourceName: string;
  sourceType: 'web' | 'api' | 'database' | 'file';
  credibilityScore: number;
  collectionDate: Date;
  lastVerified?: Date;
  verificationMethod?: string;
  language: string;
  categories: string[];
  tags: string[];
  processingFlags: {
    needsReview: boolean;
    hasConflicts: boolean;
    isAuthoritative: boolean;
    requiresUpdate: boolean;
  };
}

/**
 * Data collection strategy
 */
export interface DataCollectionStrategy {
  id: string;
  name: string;
  description: string;
  targetSources: string[];
  keywords: string[];
  categories: string[];
  priority: number;
  frequency: 'continuous' | 'hourly' | 'daily' | 'weekly';
  qualityThreshold: number;
  maxItemsPerRun: number;
  filters: {
    minCredibility?: number;
    requiredCategories?: string[];
    excludePatterns?: string[];
    languageFilter?: string;
  };
  active: boolean;
  lastRun?: Date;
  nextRun?: Date;
  stats: {
    totalRuns: number;
    successfulItems: number;
    filteredItems: number;
    averageQuality: number;
  };
}

/**
 * Web content validation result
 */
export interface ContentValidation {
  isValid: boolean;
  validationScore: number;
  issues: ValidationIssue[];
  suggestions: string[];
  confidence: number;
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  type: 'content' | 'structure' | 'credibility' | 'relevance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * Content extraction configuration
 */
export interface ExtractionConfig {
  selectors: {
    title: string[];
    content: string[];
    author?: string[];
    date?: string[];
    metadata?: string[];
  };
  filters: {
    minContentLength: number;
    maxContentLength: number;
    excludeSelectors: string[];
    requiredElements: string[];
  };
  preprocessing: {
    removeHTML: boolean;
    normalizeWhitespace: boolean;
    extractMetadata: boolean;
    detectLanguage: boolean;
  };
}

/**
 * Enhanced collection metrics
 */
export interface EnhancedCollectionMetrics {
  performance: {
    averageCollectionTime: number;
    throughputPerHour: number;
    errorRate: number;
    cacheHitRate: number;
  };
  quality: {
    averageCredibilityScore: number;
    averageQualityScore: number;
    highQualityPercentage: number;
    duplicateDetectionRate: number;
  };
  coverage: {
    activeStrategies: number;
    sourcesMonitored: number;
    categoriesCovered: string[];
    languageDistribution: Record<string, number>;
  };
  trends: {
    collectionGrowthRate: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    sourceReliabilityTrend: Record<
      string,
      'improving' | 'stable' | 'declining'
    >;
    popularCategories: Array<{ category: string; count: number }>;
  };
}
