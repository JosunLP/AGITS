/**
 * Database Configuration for AGITS Platform
 * Manages connections to MongoDB, Neo4j, Redis, and other data stores
 */
export interface DatabaseConfig {
  mongodb: {
    uri: string;
    database: string;
    collections: {
      memories: string;
      knowledge: string;
      learningExperiences: string;
      patterns: string;
      metrics: string;
      webScrapedContent: string;
      knowledgeSources: string;
      webCache: string;
    };
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
      retryWrites: boolean;
    };
  };

  neo4j: {
    uri: string;
    username: string;
    password: string;
    database: string;
    options: {
      maxConnectionPoolSize: number;
      connectionAcquisitionTimeout: number;
      maxTransactionRetryTime: number;
    };
  };

  redis: {
    host: string;
    port: number;
    password?: string;
    database: number;
    keyPrefix: string;
    options: {
      retryDelayOnFailover: number;
      maxRetriesPerRequest: number;
      lazyConnect: boolean;
    };
  };

  pinecone?: {
    apiKey: string;
    environment: string;
    indexName: string;
    dimension: number;
    metric: 'cosine' | 'euclidean' | 'dotproduct';
  };
}

export const defaultDatabaseConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'agits',
    collections: {
      memories: 'memories',
      knowledge: 'knowledge',
      learningExperiences: 'learning_experiences',
      patterns: 'patterns',
      metrics: 'metrics',
      webScrapedContent: 'web_scraped_content',
      knowledgeSources: 'knowledge_sources',
      webCache: 'web_cache',
    },
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    },
  },

  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
    options: {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 60000,
      maxTransactionRetryTime: 30000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    database: parseInt(process.env.REDIS_DATABASE || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'agits:',
    options: {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    },
  },

  pinecone: process.env.PINECONE_API_KEY
    ? {
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp-free',
        indexName: process.env.PINECONE_INDEX_NAME || 'agits-knowledge',
        dimension: parseInt(process.env.PINECONE_DIMENSION || '1536'),
        metric: (process.env.PINECONE_METRIC as any) || 'cosine',
      }
    : undefined,
};
