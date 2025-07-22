import Redis from 'ioredis';
import { Collection, Db, MongoClient } from 'mongodb';
import * as neo4j from 'neo4j-driver';
import { DatabaseConfig } from '../config/database.js';
import { KnowledgeItem, MemoryNode } from '../types/index.js';
import { Logger } from '../utils/logger.js';

/**
 * Web-scraped content storage interface
 */
interface WebScrapedContent {
  id: string;
  url: string;
  domain: string;
  title: string;
  content: string;
  author?: string;
  publishDate?: Date;
  scrapedAt: Date;
  credibilityScore: number;
  qualityScore: number;
  relevanceScore: number;
  sourceId: string;
  sourceName: string;
  tags: string[];
  language: string;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Knowledge source tracking
 */
interface KnowledgeSource {
  id: string;
  name: string;
  domain: string;
  credibilityScore: number;
  successRate: number;
  totalRequests: number;
  lastAccessed: Date;
  categories: string[];
  rateLimit: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Data Persistence Layer - Manages all database operations for AGITS
 * Provides unified interface for MongoDB, Neo4j, and Redis operations
 */
export class DataPersistenceLayer {
  private logger = new Logger('DataPersistenceLayer');
  private mongoClient: MongoClient | null = null;
  private mongodb: Db | null = null;
  private redis: Redis | null = null;
  private neo4jDriver: neo4j.Driver | null = null;
  private config: DatabaseConfig;

  // Collections
  private memoriesCollection: Collection<MemoryNode> | null = null;
  private knowledgeCollection: Collection<KnowledgeItem> | null = null;
  private learningExperiencesCollection: Collection | null = null;
  private patternsCollection: Collection | null = null;
  private metricsCollection: Collection | null = null;
  // New web-related collections
  private webScrapedContentCollection: Collection<WebScrapedContent> | null =
    null;
  private knowledgeSourcesCollection: Collection<KnowledgeSource> | null = null;
  private webCacheCollection: Collection | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize all database connections
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing database connections...');

    try {
      await Promise.all([
        this.initializeMongoDB(),
        this.initializeRedis(),
        this.initializeNeo4j(),
      ]);

      await this.createIndexes();
      this.logger.info('All database connections initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database connections:', error);
      throw error;
    }
  }

  /**
   * Initialize MongoDB connection
   */
  private async initializeMongoDB(): Promise<void> {
    try {
      this.mongoClient = new MongoClient(
        this.config.mongodb.uri,
        this.config.mongodb.options
      );
      await this.mongoClient.connect();

      this.mongodb = this.mongoClient.db(this.config.mongodb.database);

      // Initialize collections
      this.memoriesCollection = this.mongodb.collection(
        this.config.mongodb.collections.memories
      );
      this.knowledgeCollection = this.mongodb.collection(
        this.config.mongodb.collections.knowledge
      );
      this.learningExperiencesCollection = this.mongodb.collection(
        this.config.mongodb.collections.learningExperiences
      );
      this.patternsCollection = this.mongodb.collection(
        this.config.mongodb.collections.patterns
      );
      this.metricsCollection = this.mongodb.collection(
        this.config.mongodb.collections.metrics
      );
      this.webScrapedContentCollection = this.mongodb.collection(
        this.config.mongodb.collections.webScrapedContent
      );
      this.knowledgeSourcesCollection = this.mongodb.collection(
        this.config.mongodb.collections.knowledgeSources
      );
      this.webCacheCollection = this.mongodb.collection(
        this.config.mongodb.collections.webCache
      );

      this.logger.info('MongoDB connection established');
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        ...(this.config.redis.password && {
          password: this.config.redis.password,
        }),
        db: this.config.redis.database,
        keyPrefix: this.config.redis.keyPrefix,
        ...this.config.redis.options,
      });

      // Test connection
      await this.redis.ping();
      this.logger.info('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Initialize Neo4j connection
   */
  private async initializeNeo4j(): Promise<void> {
    try {
      this.neo4jDriver = neo4j.driver(
        this.config.neo4j.uri,
        neo4j.auth.basic(
          this.config.neo4j.username,
          this.config.neo4j.password
        ),
        this.config.neo4j.options
      );

      // Test connection
      const session = this.neo4jDriver.session({
        database: this.config.neo4j.database,
      });
      await session.run('RETURN 1');
      await session.close();

      this.logger.info('Neo4j connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for optimal performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.memoriesCollection || !this.knowledgeCollection) return;

    try {
      // Memory indexes
      await this.memoriesCollection.createIndex({ id: 1 }, { unique: true });
      await this.memoriesCollection.createIndex({ type: 1 });
      await this.memoriesCollection.createIndex({ lastAccessed: -1 });
      await this.memoriesCollection.createIndex({ strength: -1 });
      await this.memoriesCollection.createIndex({ 'metadata.tags': 1 });

      // Knowledge indexes
      await this.knowledgeCollection.createIndex({ id: 1 }, { unique: true });
      await this.knowledgeCollection.createIndex({ type: 1 });
      await this.knowledgeCollection.createIndex({ confidence: -1 });
      await this.knowledgeCollection.createIndex({ lastAccessed: -1 });
      await this.knowledgeCollection.createIndex({ subject: 'text' });

      // Web-scraped content indexes
      await this.webScrapedContentCollection?.createIndex(
        { id: 1 },
        { unique: true }
      );
      await this.webScrapedContentCollection?.createIndex({ url: 1 });
      await this.webScrapedContentCollection?.createIndex({ domain: 1 });
      await this.webScrapedContentCollection?.createIndex({ scrapedAt: -1 });

      // Knowledge sources indexes
      await this.knowledgeSourcesCollection?.createIndex(
        { id: 1 },
        { unique: true }
      );
      await this.knowledgeSourcesCollection?.createIndex({ domain: 1 });
      await this.knowledgeSourcesCollection?.createIndex({ lastAccessed: -1 });

      this.logger.info('Database indexes created successfully');
    } catch (error) {
      this.logger.error('Failed to create indexes:', error);
    }
  }

  // Memory Operations

  /**
   * Store memory in MongoDB
   */
  async storeMemory(memory: MemoryNode): Promise<void> {
    if (!this.memoriesCollection) throw new Error('MongoDB not initialized');

    try {
      await this.memoriesCollection.replaceOne({ id: memory.id }, memory, {
        upsert: true,
      });

      // Cache in Redis for fast access
      if (this.redis) {
        await this.redis.setex(
          `memory:${memory.id}`,
          3600, // 1 hour TTL
          JSON.stringify(memory)
        );
      }
    } catch (error) {
      this.logger.error(`Failed to store memory ${memory.id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve memory by ID
   */
  async retrieveMemory(memoryId: string): Promise<MemoryNode | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(`memory:${memoryId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Fall back to MongoDB
      if (!this.memoriesCollection) throw new Error('MongoDB not initialized');

      const memory = await this.memoriesCollection.findOne({ id: memoryId });

      if (memory && this.redis) {
        // Cache for future access
        await this.redis.setex(
          `memory:${memoryId}`,
          3600,
          JSON.stringify(memory)
        );
      }

      return memory;
    } catch (error) {
      this.logger.error(`Failed to retrieve memory ${memoryId}:`, error);
      return null;
    }
  }

  /**
   * Search memories with filters
   */
  async searchMemories(filters: any, limit = 100): Promise<MemoryNode[]> {
    if (!this.memoriesCollection) throw new Error('MongoDB not initialized');

    try {
      return await this.memoriesCollection
        .find(filters)
        .sort({ lastAccessed: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      return [];
    }
  }

  /**
   * Delete memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    try {
      if (this.memoriesCollection) {
        await this.memoriesCollection.deleteOne({ id: memoryId });
      }

      if (this.redis) {
        await this.redis.del(`memory:${memoryId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete memory ${memoryId}:`, error);
      throw error;
    }
  }

  // Knowledge Operations

  /**
   * Store knowledge item
   */
  async storeKnowledge(knowledge: KnowledgeItem): Promise<void> {
    if (!this.knowledgeCollection) throw new Error('MongoDB not initialized');

    try {
      await this.knowledgeCollection.replaceOne(
        { id: knowledge.id },
        knowledge,
        { upsert: true }
      );

      // Store in Neo4j for relationship mapping
      if (this.neo4jDriver) {
        await this.storeKnowledgeRelationships(knowledge);
      }
    } catch (error) {
      this.logger.error(`Failed to store knowledge ${knowledge.id}:`, error);
      throw error;
    }
  }

  /**
   * Store knowledge relationships in Neo4j
   */
  private async storeKnowledgeRelationships(
    knowledge: KnowledgeItem
  ): Promise<void> {
    if (!this.neo4jDriver) return;

    const session = this.neo4jDriver.session({
      database: this.config.neo4j.database,
    });

    try {
      // Create or update knowledge node
      await session.run(
        `
        MERGE (k:Knowledge {id: $id})
        SET k.type = $type,
            k.subject = $subject,
            k.confidence = $confidence,
            k.lastAccessed = $lastAccessed
      `,
        {
          id: knowledge.id,
          type: knowledge.type,
          subject: knowledge.subject,
          confidence: knowledge.confidence,
          lastAccessed:
            knowledge.lastAccessed?.toISOString() || new Date().toISOString(),
        }
      );

      // Create relationships
      for (const relationship of knowledge.relationships || []) {
        await session.run(
          `
          MATCH (a:Knowledge {id: $sourceId}), (b:Knowledge {id: $targetId})
          MERGE (a)-[r:RELATES_TO {type: $type, strength: $strength}]->(b)
        `,
          {
            sourceId: knowledge.id,
            targetId: relationship.targetId,
            type: relationship.type,
            strength: relationship.strength,
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Retrieve knowledge by ID
   */
  async retrieveKnowledge(knowledgeId: string): Promise<KnowledgeItem | null> {
    if (!this.knowledgeCollection) throw new Error('MongoDB not initialized');

    try {
      return await this.knowledgeCollection.findOne({ id: knowledgeId });
    } catch (error) {
      this.logger.error(`Failed to retrieve knowledge ${knowledgeId}:`, error);
      return null;
    }
  }

  /**
   * Search knowledge with text query
   */
  async searchKnowledge(
    query: string,
    filters: any = {},
    limit = 50
  ): Promise<KnowledgeItem[]> {
    if (!this.knowledgeCollection) throw new Error('MongoDB not initialized');

    try {
      const searchFilter = {
        ...filters,
        $text: { $search: query },
      };

      return await this.knowledgeCollection
        .find(searchFilter)
        .sort({ confidence: -1, lastAccessed: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      this.logger.error('Failed to search knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge relationships from Neo4j
   */
  async getKnowledgeRelationships(
    knowledgeId: string,
    depth = 2
  ): Promise<any[]> {
    if (!this.neo4jDriver) return [];

    const session = this.neo4jDriver.session({
      database: this.config.neo4j.database,
    });

    try {
      const result = await session.run(
        `
        MATCH (start:Knowledge {id: $id})-[r*1..${depth}]-(connected:Knowledge)
        RETURN start, r, connected
        LIMIT 100
      `,
        { id: knowledgeId }
      );

      return result.records.map((record: any) => ({
        start: record.get('start').properties,
        relationships: record.get('r'),
        connected: record.get('connected').properties,
      }));
    } finally {
      await session.close();
    }
  }

  // Cache Operations

  /**
   * Set cache value
   */
  async setCacheValue(key: string, value: any, ttl = 3600): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Failed to set cache value ${key}:`, error);
    }
  }

  /**
   * Get cache value
   */
  async getCacheValue<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache value ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async deleteCacheValue(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache value ${key}:`, error);
    }
  }

  // Cleanup and shutdown

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    this.logger.info('Closing database connections...');

    const closePromises = [];

    if (this.mongoClient) {
      closePromises.push(this.mongoClient.close());
    }

    if (this.redis) {
      closePromises.push(this.redis.quit());
    }

    if (this.neo4jDriver) {
      closePromises.push(this.neo4jDriver.close());
    }

    try {
      await Promise.all(closePromises);
      this.logger.info('All database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
    }
  }

  // Health checks

  /**
   * Check health of all database connections
   */
  async healthCheck(): Promise<{
    mongodb: boolean;
    redis: boolean;
    neo4j: boolean;
  }> {
    const health = {
      mongodb: false,
      redis: false,
      neo4j: false,
    };

    try {
      if (this.mongodb) {
        await this.mongodb.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      this.logger.warn('MongoDB health check failed:', error);
    }

    try {
      if (this.redis) {
        await this.redis.ping();
        health.redis = true;
      }
    } catch (error) {
      this.logger.warn('Redis health check failed:', error);
    }

    try {
      if (this.neo4jDriver) {
        const session = this.neo4jDriver.session({
          database: this.config.neo4j.database,
        });
        await session.run('RETURN 1');
        await session.close();
        health.neo4j = true;
      }
    } catch (error) {
      this.logger.warn('Neo4j health check failed:', error);
    }

    return health;
  }

  /**
   * Store web scraped content
   */
  async storeWebScrapedContent(content: WebScrapedContent): Promise<string> {
    if (!this.webScrapedContentCollection) {
      throw new Error('Web scraped content collection not initialized');
    }

    try {
      const result = await this.webScrapedContentCollection.insertOne({
        ...content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.logger.debug(`Stored web scraped content: ${content.id}`);
      return result.insertedId.toString();
    } catch (error) {
      this.logger.error('Failed to store web scraped content:', error);
      throw error;
    }
  }

  /**
   * Get web scraped content by URL
   */
  async getWebScrapedContentByUrl(
    url: string
  ): Promise<WebScrapedContent | null> {
    if (!this.webScrapedContentCollection) {
      throw new Error('Web scraped content collection not initialized');
    }

    try {
      const content = await this.webScrapedContentCollection.findOne({ url });
      return content as WebScrapedContent | null;
    } catch (error) {
      this.logger.error('Failed to get web scraped content by URL:', error);
      throw error;
    }
  }

  /**
   * Search web scraped content
   */
  async searchWebScrapedContent(query: {
    keywords?: string[];
    domains?: string[];
    sources?: string[];
    minCredibility?: number;
    dateRange?: { from: Date; to: Date };
    limit?: number;
  }): Promise<WebScrapedContent[]> {
    if (!this.webScrapedContentCollection) {
      throw new Error('Web scraped content collection not initialized');
    }

    try {
      const filter: any = {};

      if (query.keywords && query.keywords.length > 0) {
        filter.$text = { $search: query.keywords.join(' ') };
      }

      if (query.domains && query.domains.length > 0) {
        filter.domain = { $in: query.domains };
      }

      if (query.sources && query.sources.length > 0) {
        filter.sourceId = { $in: query.sources };
      }

      if (query.minCredibility !== undefined) {
        filter.credibilityScore = { $gte: query.minCredibility };
      }

      if (query.dateRange) {
        filter.scrapedAt = {
          $gte: query.dateRange.from,
          $lte: query.dateRange.to,
        };
      }

      const cursor = this.webScrapedContentCollection
        .find(filter)
        .sort({ scrapedAt: -1 });

      if (query.limit) {
        cursor.limit(query.limit);
      }

      return (await cursor.toArray()) as WebScrapedContent[];
    } catch (error) {
      this.logger.error('Failed to search web scraped content:', error);
      throw error;
    }
  }

  /**
   * Store or update knowledge source
   */
  async storeKnowledgeSource(source: KnowledgeSource): Promise<void> {
    if (!this.knowledgeSourcesCollection) {
      throw new Error('Knowledge sources collection not initialized');
    }

    try {
      await this.knowledgeSourcesCollection.replaceOne(
        { id: source.id },
        { ...source, updatedAt: new Date() },
        { upsert: true }
      );

      this.logger.debug(`Stored/updated knowledge source: ${source.id}`);
    } catch (error) {
      this.logger.error('Failed to store knowledge source:', error);
      throw error;
    }
  }

  /**
   * Get all active knowledge sources
   */
  async getActiveKnowledgeSources(): Promise<KnowledgeSource[]> {
    if (!this.knowledgeSourcesCollection) {
      throw new Error('Knowledge sources collection not initialized');
    }

    try {
      return (await this.knowledgeSourcesCollection
        .find({ isActive: true })
        .sort({ credibilityScore: -1 })
        .toArray()) as KnowledgeSource[];
    } catch (error) {
      this.logger.error('Failed to get active knowledge sources:', error);
      throw error;
    }
  }

  /**
   * Update knowledge source statistics
   */
  async updateKnowledgeSourceStats(
    sourceId: string,
    stats: {
      successRate?: number;
      totalRequests?: number;
      lastAccessed?: Date;
      credibilityScore?: number;
    }
  ): Promise<void> {
    if (!this.knowledgeSourcesCollection) {
      throw new Error('Knowledge sources collection not initialized');
    }

    try {
      const updateDoc: any = { updatedAt: new Date() };

      if (stats.successRate !== undefined)
        updateDoc.successRate = stats.successRate;
      if (stats.totalRequests !== undefined)
        updateDoc.totalRequests = stats.totalRequests;
      if (stats.lastAccessed !== undefined)
        updateDoc.lastAccessed = stats.lastAccessed;
      if (stats.credibilityScore !== undefined)
        updateDoc.credibilityScore = stats.credibilityScore;

      await this.knowledgeSourcesCollection.updateOne(
        { id: sourceId },
        { $set: updateDoc }
      );

      this.logger.debug(`Updated knowledge source stats: ${sourceId}`);
    } catch (error) {
      this.logger.error('Failed to update knowledge source stats:', error);
      throw error;
    }
  }

  /**
   * Cache web content with TTL
   */
  async cacheWebContent(
    key: string,
    content: any,
    ttlSeconds: number = 3600
  ): Promise<void> {
    if (!this.redis) {
      this.logger.warn('Redis not available for web content caching');
      return;
    }

    try {
      const cacheKey = `webcache:${key}`;
      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(content));
      this.logger.debug(`Cached web content with key: ${cacheKey}`);
    } catch (error) {
      this.logger.error('Failed to cache web content:', error);
    }
  }

  /**
   * Get cached web content
   */
  async getCachedWebContent(key: string): Promise<any | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const cacheKey = `webcache:${key}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        this.logger.debug(`Retrieved cached web content: ${cacheKey}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get cached web content:', error);
      return null;
    }
  }

  /**
   * Store web scraping session data
   */
  async storeWebScrapingSession(
    sessionId: string,
    data: {
      query: any;
      results: number;
      sources: string[];
      startTime: Date;
      endTime: Date;
      errors?: string[];
    }
  ): Promise<void> {
    if (!this.webCacheCollection) {
      throw new Error('Web cache collection not initialized');
    }

    try {
      await this.webCacheCollection.insertOne({
        sessionId,
        type: 'scraping_session',
        ...data,
        createdAt: new Date(),
      });

      this.logger.debug(`Stored web scraping session: ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to store web scraping session:', error);
      throw error;
    }
  }

  /**
   * Get web scraping statistics
   */
  async getWebScrapingStats(): Promise<{
    totalScrapedContent: number;
    contentBySource: Array<{ sourceId: string; count: number }>;
    contentByDomain: Array<{ domain: string; count: number }>;
    avgCredibilityScore: number;
    recentSessions: number;
  }> {
    if (!this.webScrapedContentCollection || !this.webCacheCollection) {
      throw new Error('Web collections not initialized');
    }

    try {
      const [
        totalContent,
        contentBySource,
        contentByDomain,
        avgCredibility,
        recentSessions,
      ] = await Promise.all([
        this.webScrapedContentCollection.countDocuments(),
        this.webScrapedContentCollection
          .aggregate([
            { $group: { _id: '$sourceId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray(),
        this.webScrapedContentCollection
          .aggregate([
            { $group: { _id: '$domain', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray(),
        this.webScrapedContentCollection
          .aggregate([
            { $group: { _id: null, avg: { $avg: '$credibilityScore' } } },
          ])
          .toArray(),
        this.webCacheCollection.countDocuments({
          type: 'scraping_session',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      ]);

      return {
        totalScrapedContent: totalContent,
        contentBySource: contentBySource.map((item: any) => ({
          sourceId: item._id,
          count: item.count,
        })),
        contentByDomain: contentByDomain.map((item: any) => ({
          domain: item._id,
          count: item.count,
        })),
        avgCredibilityScore:
          avgCredibility.length > 0 ? avgCredibility[0].avg : 0,
        recentSessions,
      };
    } catch (error) {
      this.logger.error('Failed to get web scraping stats:', error);
      throw error;
    }
  }

  /**
   * Store learning progress
   */
  async storeLearningProgress(progress: any): Promise<void> {
    try {
      if (!this.mongodb) {
        throw new Error('MongoDB not connected');
      }
      await this.mongodb.collection('learning_progress').insertOne({
        ...progress,
        createdAt: new Date(),
      });
      this.logger.debug(`Stored learning progress: ${progress.id}`);
    } catch (error) {
      this.logger.error('Error storing learning progress:', error);
      throw error;
    }
  }

  /**
   * Store quality feedback
   */
  async storeFeedback(feedback: any): Promise<void> {
    try {
      if (!this.mongodb) {
        throw new Error('MongoDB not connected');
      }
      await this.mongodb.collection('quality_feedback').insertOne({
        ...feedback,
        createdAt: new Date(),
      });
      this.logger.debug(`Stored feedback: ${feedback.knowledgeId}`);
    } catch (error) {
      this.logger.error('Error storing feedback:', error);
      throw error;
    }
  }
}
