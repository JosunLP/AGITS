import Redis from 'ioredis';
import { Collection, Db, MongoClient } from 'mongodb';
import * as neo4j from 'neo4j-driver';
import { DatabaseConfig } from '../config/database.js';
import { KnowledgeItem, MemoryNode } from '../types/index.js';
import { Logger } from '../utils/logger.js';

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
}
