import { LearningConfig } from '../config/app.js';
import { DataPersistenceLayer } from '../infrastructure/data-persistence-layer.js';
import {
  ConnectionType,
  LearningExperience,
  MemoryConnection,
  MemoryNode,
  MemoryType,
} from '../types/index.js';
import { EventMap, TypedEventEmitter } from '../utils/event-emitter.js';
import { Logger } from '../utils/logger.js';

/**
 * Event map for MemoryManagementSystem
 */
interface MemoryEvents extends EventMap {
  memoryStored: (memory: MemoryNode) => void;
  memoryConsolidated: (memory: MemoryNode) => void;
  memoryDecayed: (memoryId: string) => void;
  connectionStrengthened: (connection: MemoryConnection) => void;
  memoryPruned: (memoryId: string) => void;
  memoryUpdated: (memory: MemoryNode) => void;
}

/**
 * Hierarchical Temporal Memory System - Implements biological memory patterns
 * with episodic and semantic memory, synaptic plasticity, and memory consolidation
 */
export class MemoryManagementSystem extends TypedEventEmitter<MemoryEvents> {
  private logger = new Logger('MemoryManagementSystem');
  private memoryNodes: Map<string, MemoryNode> = new Map();
  private episodicMemory: Map<string, MemoryNode> = new Map();
  private semanticMemory: Map<string, MemoryNode> = new Map();
  private workingMemory: Map<string, MemoryNode> = new Map();
  private proceduralMemory: Map<string, MemoryNode> = new Map();

  private synapticStrengths: Map<string, number> = new Map();
  private accessPatterns: Map<string, AccessPattern> = new Map();
  private consolidationQueue: MemoryNode[] = [];

  // Configuration
  private config: LearningConfig;
  private persistenceLayer: DataPersistenceLayer | null;

  // Maintenance intervals
  private consolidationInterval: NodeJS.Timeout | null = null;
  private decayInterval: NodeJS.Timeout | null = null;
  private pruningInterval: NodeJS.Timeout | null = null;

  constructor(config: LearningConfig, persistenceLayer?: DataPersistenceLayer) {
    super();
    this.config = config;
    this.persistenceLayer = persistenceLayer || null;
    this.startMemoryMaintenance();

    if (persistenceLayer) {
      this.loadMemoriesFromPersistence();
    }
  }

  /**
   * Load memories from persistence layer
   */
  private async loadMemoriesFromPersistence(): Promise<void> {
    if (!this.persistenceLayer) return;

    try {
      this.logger.info('Loading memories from persistence...');

      // Load all memories
      const memories = await this.persistenceLayer.searchMemories({}, 10000);

      for (const memory of memories) {
        this.memoryNodes.set(memory.id, memory);

        // Route to appropriate memory store
        switch (memory.type) {
          case MemoryType.EPISODIC:
            this.episodicMemory.set(memory.id, memory);
            break;
          case MemoryType.SEMANTIC:
            this.semanticMemory.set(memory.id, memory);
            break;
          case MemoryType.WORKING:
            this.workingMemory.set(memory.id, memory);
            break;
          case MemoryType.PROCEDURAL:
            this.proceduralMemory.set(memory.id, memory);
            break;
        }

        // Initialize access pattern
        this.accessPatterns.set(memory.id, {
          nodeId: memory.id,
          accessTimes: [memory.lastAccessed],
          strengthHistory: [memory.strength],
          associatedNodes: [],
        });
      }

      this.logger.info(`Loaded ${memories.length} memories from persistence`);
    } catch (error) {
      this.logger.error('Failed to load memories from persistence:', error);
    }
  }

  /**
   * Store a new memory with persistence
   */
  public async storeMemory(
    memory: Omit<MemoryNode, 'id' | 'lastAccessed' | 'accessCount'>
  ): Promise<string> {
    const memoryNode: MemoryNode = {
      ...memory,
      id: this.generateMemoryId(),
      lastAccessed: new Date(),
      accessCount: 1,
    };

    this.memoryNodes.set(memoryNode.id, memoryNode);

    // Route to appropriate memory store
    switch (memoryNode.type) {
      case MemoryType.EPISODIC:
        this.episodicMemory.set(memoryNode.id, memoryNode);
        break;
      case MemoryType.SEMANTIC:
        this.semanticMemory.set(memoryNode.id, memoryNode);
        break;
      case MemoryType.WORKING:
        this.workingMemory.set(memoryNode.id, memoryNode);
        break;
      case MemoryType.PROCEDURAL:
        this.proceduralMemory.set(memoryNode.id, memoryNode);
        break;
    }

    // Initialize access pattern
    this.accessPatterns.set(memoryNode.id, {
      nodeId: memoryNode.id,
      accessTimes: [new Date()],
      strengthHistory: [memoryNode.strength],
      associatedNodes: [],
    });

    // Persist to database
    if (this.persistenceLayer) {
      try {
        await this.persistenceLayer.storeMemory(memoryNode);
      } catch (error) {
        this.logger.error(`Failed to persist memory ${memoryNode.id}:`, error);
      }
    }

    this.emit('memoryStored', memoryNode);
    return memoryNode.id;
  }

  /**
   * Retrieve memory by ID
   */
  public retrieveMemory(memoryId: string): MemoryNode | null {
    const memory = this.memoryNodes.get(memoryId);
    if (!memory) return null;

    // Update access information
    memory.lastAccessed = new Date();
    memory.accessCount++;

    // Update access pattern
    const pattern = this.accessPatterns.get(memoryId);
    if (pattern) {
      pattern.accessTimes.push(new Date());
      pattern.strengthHistory.push(memory.strength);
    }

    // Strengthen memory through use (Hebbian learning)
    this.strengthenMemory(memoryId);

    // Check for consolidation eligibility
    if (
      memory.accessCount >= this.config.consolidationThreshold &&
      memory.type === MemoryType.EPISODIC
    ) {
      this.addToConsolidationQueue(memory);
    }

    this.emit('memoryRetrieved', memory);
    return memory;
  }

  /**
   * Search memories by content similarity
   */
  public searchMemories(
    query: any,
    memoryType?: MemoryType,
    limit: number = 10
  ): MemoryNode[] {
    let searchSpace: Map<string, MemoryNode>;

    switch (memoryType) {
      case MemoryType.EPISODIC:
        searchSpace = this.episodicMemory;
        break;
      case MemoryType.SEMANTIC:
        searchSpace = this.semanticMemory;
        break;
      case MemoryType.WORKING:
        searchSpace = this.workingMemory;
        break;
      case MemoryType.PROCEDURAL:
        searchSpace = this.proceduralMemory;
        break;
      default:
        searchSpace = this.memoryNodes;
    }

    const similarities: Array<{ memory: MemoryNode; similarity: number }> = [];

    for (const memory of searchSpace.values()) {
      const similarity = this.calculateSimilarity(query, memory.content);
      if (similarity > 0.1) {
        // Minimum similarity threshold
        similarities.push({ memory, similarity });
      }
    }

    // Sort by similarity and access strength
    similarities.sort((a, b) => {
      const scoreA = a.similarity * a.memory.strength;
      const scoreB = b.similarity * b.memory.strength;
      return scoreB - scoreA;
    });

    return similarities.slice(0, limit).map((item) => item.memory);
  }

  /**
   * Create connection between memories
   */
  public createConnection(
    sourceId: string,
    targetId: string,
    connectionType: ConnectionType,
    weight: number = 0.5
  ): void {
    const sourceMemory = this.memoryNodes.get(sourceId);
    if (!sourceMemory) return;

    const existingConnection = sourceMemory.connections.find(
      (conn) => conn.targetId === targetId && conn.type === connectionType
    );

    if (existingConnection) {
      // Strengthen existing connection
      existingConnection.weight = Math.min(
        existingConnection.weight + weight * 0.1,
        1.0
      );
    } else {
      // Create new connection
      sourceMemory.connections.push({
        targetId,
        weight,
        type: connectionType,
      });
    }

    // Update synaptic strength
    const synapseKey = `${sourceId}->${targetId}`;
    this.synapticStrengths.set(synapseKey, weight);

    // Update access patterns
    const pattern = this.accessPatterns.get(sourceId);
    if (pattern && !pattern.associatedNodes.includes(targetId)) {
      pattern.associatedNodes.push(targetId);
    }

    this.emit('connectionCreated', {
      sourceId,
      targetId,
      connectionType,
      weight,
    });
  }

  /**
   * Implement learning from experience
   */
  public async learnFromExperience(
    experience: LearningExperience
  ): Promise<void> {
    // Create memory for the experience
    const memoryId = await this.storeMemory({
      type: MemoryType.EPISODIC,
      content: {
        experience: experience.input,
        outcome: experience.actualOutput,
        reward: experience.reward,
        confidence: experience.confidence,
        context: experience.context,
      },
      connections: [],
      strength: experience.confidence,
      metadata: {
        learningType: experience.type,
        timestamp: experience.timestamp,
        reward: experience.reward,
      },
    });

    // Find related memories
    const relatedMemories = this.searchMemories(
      experience.input,
      MemoryType.SEMANTIC,
      5
    );

    // Create associations
    for (const relatedMemory of relatedMemories) {
      this.createConnection(
        memoryId,
        relatedMemory.id,
        ConnectionType.ASSOCIATIVE,
        experience.confidence * 0.5
      );
    }

    // Adjust learning based on reward
    if (experience.reward > 0) {
      // Positive reinforcement - strengthen related pathways
      this.reinforcePositivePath(memoryId, experience.reward);
    } else {
      // Negative experience - weaken related pathways
      this.weakenNegativePath(memoryId, Math.abs(experience.reward));
    }

    this.emit('experienceLearned', experience);
  }

  /**
   * Consolidate memories (episodic to semantic transfer)
   */
  private async performMemoryConsolidation(): Promise<void> {
    if (this.consolidationQueue.length === 0) return;

    const memory = this.consolidationQueue.shift()!;

    // Extract semantic patterns from episodic memory
    const semanticContent = this.extractSemanticPatterns(memory);

    if (semanticContent) {
      // Create or update semantic memory
      const existingSemantic = this.findSemanticMemory(semanticContent);

      if (existingSemantic) {
        // Strengthen existing semantic memory
        existingSemantic.strength = Math.min(
          existingSemantic.strength + 0.1,
          1.0
        );
        existingSemantic.accessCount++;

        // Update in persistence
        if (this.persistenceLayer) {
          try {
            await this.persistenceLayer.storeMemory(existingSemantic);
          } catch (error) {
            this.logger.error(
              `Failed to persist updated memory ${existingSemantic.id}:`,
              error
            );
          }
        }
      } else {
        // Create new semantic memory
        await this.storeMemory({
          type: MemoryType.SEMANTIC,
          content: semanticContent,
          connections: [],
          strength: memory.strength * 0.8, // Slight degradation during transfer
          metadata: {
            sourceEpisodic: memory.id,
            consolidated: true,
            consolidationDate: new Date(),
          },
        });
      }
    }

    this.emit('memoryConsolidated', memory);
  }

  /**
   * Prune weak connections and memories
   */
  private performSynapticPruning(): void {
    // Prune weak connections
    for (const memory of this.memoryNodes.values()) {
      memory.connections = memory.connections.filter(
        (conn) => conn.weight > this.config.pruningThreshold
      );
    }

    // Remove unused memories from working memory
    const cutoffTime = Date.now() - 5 * 60 * 1000; // 5 minutes
    const toRemove: string[] = [];

    for (const [id, memory] of this.workingMemory.entries()) {
      if (
        memory.lastAccessed.getTime() < cutoffTime &&
        memory.accessCount < 2
      ) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.workingMemory.delete(id);
      this.memoryNodes.delete(id);
      this.accessPatterns.delete(id);
    }

    this.emit('synapticPruning', {
      removedConnections: 0,
      removedMemories: toRemove.length,
    });
  }

  /**
   * Apply synaptic decay over time
   */
  private applySynapticDecay(): void {
    for (const memory of this.memoryNodes.values()) {
      // Decay strength if not recently accessed
      const timeSinceAccess = Date.now() - memory.lastAccessed.getTime();
      const decayFactor = Math.exp(
        (-this.config.decayRate * timeSinceAccess) / 1000
      );

      memory.strength *= decayFactor;

      // Decay connection weights
      if (memory.connections && Array.isArray(memory.connections)) {
        for (const connection of memory.connections) {
          connection.weight *= decayFactor;
        }
      }
    }
  }

  /**
   * Start background memory maintenance
   */
  private startMemoryMaintenance(): void {
    // Memory consolidation
    this.consolidationInterval = setInterval(async () => {
      await this.performMemoryConsolidation();
    }, this.config.memoryConsolidationInterval);

    // Synaptic pruning
    this.pruningInterval = setInterval(() => {
      this.performSynapticPruning();
    }, this.config.synapticPruningInterval);

    // Synaptic decay
    this.decayInterval = setInterval(() => {
      this.applySynapticDecay();
    }, this.config.synapticDecayInterval);
  }

  /**
   * Stop memory maintenance processes
   */
  public stopMemoryMaintenance(): void {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }
    if (this.pruningInterval) {
      clearInterval(this.pruningInterval);
      this.pruningInterval = null;
    }
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }

  /**
   * Strengthen memory through Hebbian learning
   */
  private strengthenMemory(memoryId: string): void {
    const memory = this.memoryNodes.get(memoryId);
    if (!memory) return;

    memory.strength = Math.min(
      memory.strength + this.config.hebbianLearningRate,
      1.0
    );

    // Strengthen connected memories
    for (const connection of memory.connections) {
      const targetMemory = this.memoryNodes.get(connection.targetId);
      if (targetMemory) {
        targetMemory.strength = Math.min(
          targetMemory.strength +
            this.config.hebbianLearningRate * connection.weight,
          1.0
        );
      }
    }
  }

  /**
   * Calculate similarity between two contents
   */
  private calculateSimilarity(content1: any, content2: any): number {
    // Simple similarity calculation - in real implementation, use embeddings
    const str1 = JSON.stringify(content1).toLowerCase();
    const str2 = JSON.stringify(content2).toLowerCase();

    const words1 = str1.split(/\W+/);
    const words2 = str2.split(/\W+/);

    const intersection = words1.filter((word) => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * Extract semantic patterns from episodic memory
   */
  private extractSemanticPatterns(memory: MemoryNode): any {
    // Simplified pattern extraction
    if (memory.content && typeof memory.content === 'object') {
      const patterns: Record<string, any> = {};

      // Extract general patterns, removing specific temporal/contextual details
      for (const [key, value] of Object.entries(memory.content)) {
        if (!['timestamp', 'sessionId', 'userId'].includes(key)) {
          patterns[key] = value;
        }
      }

      return patterns;
    }

    return null;
  }

  /**
   * Find existing semantic memory with similar content
   */
  private findSemanticMemory(content: any): MemoryNode | null {
    for (const memory of this.semanticMemory.values()) {
      if (this.calculateSimilarity(content, memory.content) > 0.8) {
        return memory;
      }
    }
    return null;
  }

  /**
   * Add memory to consolidation queue
   */
  private addToConsolidationQueue(memory: MemoryNode): void {
    if (!this.consolidationQueue.includes(memory)) {
      this.consolidationQueue.push(memory);
    }
  }

  /**
   * Reinforce positive learning path
   */
  private reinforcePositivePath(memoryId: string, reward: number): void {
    const memory = this.memoryNodes.get(memoryId);
    if (!memory) return;

    const reinforcement = reward * 0.1;
    memory.strength = Math.min(memory.strength + reinforcement, 1.0);

    // Propagate reinforcement to connected memories
    for (const connection of memory.connections) {
      const targetMemory = this.memoryNodes.get(connection.targetId);
      if (targetMemory) {
        targetMemory.strength = Math.min(
          targetMemory.strength + reinforcement * connection.weight,
          1.0
        );
      }
    }
  }

  /**
   * Weaken negative learning path
   */
  private weakenNegativePath(memoryId: string, penalty: number): void {
    const memory = this.memoryNodes.get(memoryId);
    if (!memory) return;

    const weakening = penalty * 0.05;
    memory.strength = Math.max(memory.strength - weakening, 0.1);

    // Propagate weakening to connected memories
    for (const connection of memory.connections) {
      connection.weight = Math.max(connection.weight - weakening, 0.1);
    }
  }

  /**
   * Generate unique memory ID
   */
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get memory system statistics
   */
  public getMemoryStats(): MemorySystemStats {
    return {
      totalMemories: this.memoryNodes.size,
      episodicCount: this.episodicMemory.size,
      semanticCount: this.semanticMemory.size,
      workingCount: this.workingMemory.size,
      proceduralCount: this.proceduralMemory.size,
      consolidationQueueSize: this.consolidationQueue.length,
      averageStrength: this.calculateAverageStrength(),
      connectionCount: this.getTotalConnections(),
    };
  }

  private calculateAverageStrength(): number {
    if (this.memoryNodes.size === 0) return 0;

    let totalStrength = 0;
    for (const memory of this.memoryNodes.values()) {
      totalStrength += memory.strength;
    }

    return totalStrength / this.memoryNodes.size;
  }

  private getTotalConnections(): number {
    let total = 0;
    for (const memory of this.memoryNodes.values()) {
      total += memory.connections.length;
    }
    return total;
  }
}

interface AccessPattern {
  nodeId: string;
  accessTimes: Date[];
  strengthHistory: number[];
  associatedNodes: string[];
}

interface MemorySystemStats {
  totalMemories: number;
  episodicCount: number;
  semanticCount: number;
  workingCount: number;
  proceduralCount: number;
  consolidationQueueSize: number;
  averageStrength: number;
  connectionCount: number;
}
