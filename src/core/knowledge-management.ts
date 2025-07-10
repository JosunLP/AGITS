import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';
import { MemoryManagementSystem } from './memory-management.js';

/**
 * Knowledge types
 */
export enum KnowledgeType {
  FACTUAL = 'factual',
  PROCEDURAL = 'procedural',
  CONCEPTUAL = 'conceptual',
  METACOGNITIVE = 'metacognitive',
  EXPERIENTIAL = 'experiential',
  CONTEXTUAL = 'contextual',
}

/**
 * Knowledge confidence levels
 */
export enum ConfidenceLevel {
  VERY_LOW = 'very_low', // 0-20%
  LOW = 'low', // 20-40%
  MEDIUM = 'medium', // 40-60%
  HIGH = 'high', // 60-80%
  VERY_HIGH = 'very_high', // 80-100%
}

/**
 * Knowledge item interface
 */
interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  content: any;
  subject: string;
  description?: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  sources: string[];
  tags: string[];
  relationships: KnowledgeRelationship[];
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessed: Date;
  verification: VerificationInfo;
  metadata: Record<string, any>;
}

/**
 * Knowledge relationship types
 */
export enum RelationshipType {
  IS_A = 'is_a',
  PART_OF = 'part_of',
  CAUSES = 'causes',
  ENABLES = 'enables',
  REQUIRES = 'requires',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  SIMILAR_TO = 'similar_to',
  DERIVED_FROM = 'derived_from',
}

/**
 * Knowledge relationship interface
 */
interface KnowledgeRelationship {
  targetId: string;
  type: RelationshipType;
  strength: number;
  confidence: number;
  context?: string;
  evidence?: string[];
  createdAt: Date;
}

/**
 * Verification information
 */
interface VerificationInfo {
  isVerified: boolean;
  verificationMethod?: string;
  verifiedBy?: string;
  verificationDate?: Date;
  verificationScore: number;
  contradictions: string[];
  supportingEvidence: string[];
}

/**
 * Knowledge query interface
 */
interface KnowledgeQuery {
  subjects?: string[];
  types?: KnowledgeType[];
  tags?: string[];
  confidenceMin?: number;
  confidenceMax?: number;
  dateRange?: { start: Date; end: Date };
  limit?: number;
  includeRelated?: boolean;
  textSearch?: string;
}

/**
 * Knowledge extraction result
 */
interface ExtractionResult {
  extractedItems: KnowledgeItem[];
  patterns: Pattern[];
  insights: Insight[];
  confidence: number;
  processingTime: number;
}

/**
 * Pattern interface
 */
interface Pattern {
  id: string;
  type: string;
  description: string;
  frequency: number;
  confidence: number;
  examples: any[];
  metadata: Record<string, any>;
}

/**
 * Insight interface
 */
interface Insight {
  id: string;
  type: string;
  description: string;
  significance: number;
  evidence: string[];
  implications: string[];
  actionable: boolean;
  metadata: Record<string, any>;
}

/**
 * Knowledge statistics
 */
interface KnowledgeStats {
  totalItems: number;
  byType: Record<string, number>;
  byConfidenceLevel: Record<string, number>;
  averageConfidence: number;
  totalRelationships: number;
  verificationRate: number;
  recentlyUpdated: number;
  topSubjects: Array<{ subject: string; count: number }>;
  networkDensity: number;
}

/**
 * Knowledge Management System - Manages the extraction, storage, and retrieval of knowledge
 * Implements semantic knowledge graphs, confidence tracking, and automated knowledge discovery
 */
export class KnowledgeManagementSystem extends EventEmitter {
  private logger: Logger;
  private memorySystem: MemoryManagementSystem;
  private knowledgeBase: Map<string, KnowledgeItem> = new Map();
  private subjectIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private relationshipGraph: Map<string, Set<KnowledgeRelationship>> =
    new Map();

  // Knowledge processing parameters
  private readonly CONFIDENCE_THRESHOLD = 0.3;
  private readonly RELATIONSHIP_STRENGTH_THRESHOLD = 0.5;
  private readonly VERIFICATION_THRESHOLD = 0.7;
  private readonly MAX_RELATIONSHIPS_PER_ITEM = 20;

  constructor(memorySystem: MemoryManagementSystem) {
    super();
    this.logger = new Logger('KnowledgeManagementSystem');
    this.memorySystem = memorySystem;
    this.setupMemoryListeners();
  }

  /**
   * Add knowledge item to the knowledge base
   */
  public addKnowledge(
    item: Omit<
      KnowledgeItem,
      'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'
    >
  ): string {
    const knowledgeId = `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const knowledgeItem: KnowledgeItem = {
      id: knowledgeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
      ...item,
      confidenceLevel: this.calculateConfidenceLevel(item.confidence),
    };

    this.knowledgeBase.set(knowledgeId, knowledgeItem);
    this.updateIndices(knowledgeItem);
    this.updateRelationshipGraph(knowledgeItem);

    this.logger.debug(`Knowledge added: ${knowledgeId} (${item.type})`);
    this.emit('knowledgeAdded', knowledgeItem);

    return knowledgeId;
  }

  /**
   * Query knowledge base
   */
  public queryKnowledge(query: KnowledgeQuery): KnowledgeItem[] {
    let results: KnowledgeItem[] = Array.from(this.knowledgeBase.values());

    // Filter by subjects
    if (query.subjects && query.subjects.length > 0) {
      const subjectMatches = new Set<string>();
      query.subjects.forEach((subject) => {
        const items = this.subjectIndex.get(subject.toLowerCase());
        if (items) {
          items.forEach((id) => subjectMatches.add(id));
        }
      });
      results = results.filter((item) => subjectMatches.has(item.id));
    }

    // Filter by types
    if (query.types && query.types.length > 0) {
      results = results.filter((item) => query.types!.includes(item.type));
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter((item) =>
        query.tags!.some((tag) => item.tags.includes(tag))
      );
    }

    // Filter by confidence
    if (query.confidenceMin !== undefined) {
      results = results.filter(
        (item) => item.confidence >= query.confidenceMin!
      );
    }
    if (query.confidenceMax !== undefined) {
      results = results.filter(
        (item) => item.confidence <= query.confidenceMax!
      );
    }

    // Filter by date range
    if (query.dateRange) {
      results = results.filter(
        (item) =>
          item.createdAt >= query.dateRange!.start &&
          item.createdAt <= query.dateRange!.end
      );
    }

    // Text search
    if (query.textSearch) {
      const searchTerm = query.textSearch.toLowerCase();
      results = results.filter(
        (item) =>
          item.subject.toLowerCase().includes(searchTerm) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm)) ||
          JSON.stringify(item.content).toLowerCase().includes(searchTerm)
      );
    }

    // Include related items if requested
    if (query.includeRelated) {
      const relatedIds = new Set<string>();
      results.forEach((item) => {
        item.relationships.forEach((rel) => relatedIds.add(rel.targetId));
      });

      relatedIds.forEach((id) => {
        const relatedItem = this.knowledgeBase.get(id);
        if (relatedItem && !results.find((r) => r.id === id)) {
          results.push(relatedItem);
        }
      });
    }

    // Sort by relevance (confidence, access count, recency)
    results.sort((a, b) => {
      const scoreA =
        a.confidence * 0.5 +
        (a.accessCount / 100) * 0.3 +
        this.getRecencyScore(a) * 0.2;
      const scoreB =
        b.confidence * 0.5 +
        (b.accessCount / 100) * 0.3 +
        this.getRecencyScore(b) * 0.2;
      return scoreB - scoreA;
    });

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    // Update access statistics
    results.forEach((item) => {
      item.accessCount++;
      item.lastAccessed = new Date();
    });

    return results;
  }

  /**
   * Extract knowledge from memory system
   */
  public async extractKnowledgeFromMemories(
    memoryIds?: string[]
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const extractedItems: KnowledgeItem[] = [];
    const patterns: Pattern[] = [];
    const insights: Insight[] = [];

    try {
      // Get memories to analyze
      const memories = memoryIds
        ? memoryIds.map((id) => ({ id })) // Placeholder for specific memory retrieval
        : this.memorySystem.searchMemories('', undefined, 100);

      // Extract factual knowledge
      for (const memory of memories) {
        if (memory && (memory as any).content) {
          const extracted = this.extractFactualKnowledge(memory);
          if (extracted) {
            const knowledgeId = this.addKnowledge(extracted);
            const knowledgeItem = this.knowledgeBase.get(knowledgeId)!;
            extractedItems.push(knowledgeItem);
          }
        }
      }

      // Discover patterns
      patterns.push(...this.discoverPatterns(memories));

      // Generate insights
      insights.push(...this.generateInsights(extractedItems, patterns));

      // Calculate overall confidence
      const confidence =
        extractedItems.length > 0
          ? extractedItems.reduce((sum, item) => sum + item.confidence, 0) /
            extractedItems.length
          : 0;

      const result: ExtractionResult = {
        extractedItems,
        patterns,
        insights,
        confidence,
        processingTime: Date.now() - startTime,
      };

      this.logger.info(
        `Knowledge extraction completed: ${extractedItems.length} items, ${patterns.length} patterns, ${insights.length} insights`
      );
      this.emit('knowledgeExtracted', result);

      return result;
    } catch (error) {
      this.logger.error('Knowledge extraction failed:', error);
      throw error;
    }
  }

  /**
   * Verify knowledge item against other sources
   */
  public async verifyKnowledge(knowledgeId: string): Promise<VerificationInfo> {
    const item = this.knowledgeBase.get(knowledgeId);
    if (!item) {
      throw new Error(`Knowledge item not found: ${knowledgeId}`);
    }

    // Find supporting and contradicting evidence
    const supportingEvidence: string[] = [];
    const contradictions: string[] = [];

    // Check against related knowledge
    for (const relationship of item.relationships) {
      const relatedItem = this.knowledgeBase.get(relationship.targetId);
      if (relatedItem) {
        if (
          relationship.type === RelationshipType.SUPPORTS &&
          relationship.confidence > 0.7
        ) {
          supportingEvidence.push(relatedItem.id);
        } else if (
          relationship.type === RelationshipType.CONTRADICTS &&
          relationship.confidence > 0.7
        ) {
          contradictions.push(relatedItem.id);
        }
      }
    }

    // Calculate verification score
    const verificationScore = this.calculateVerificationScore(
      supportingEvidence.length,
      contradictions.length,
      item.confidence,
      item.sources.length
    );

    const verification: VerificationInfo = {
      isVerified: verificationScore >= this.VERIFICATION_THRESHOLD,
      verificationMethod: 'cross_reference',
      verifiedBy: 'system',
      verificationDate: new Date(),
      verificationScore,
      contradictions,
      supportingEvidence,
    };

    // Update the knowledge item
    item.verification = verification;
    item.updatedAt = new Date();

    this.emit('knowledgeVerified', { knowledgeId, verification });

    return verification;
  }

  /**
   * Get knowledge statistics
   */
  public getKnowledgeStats(): KnowledgeStats {
    const items = Array.from(this.knowledgeBase.values());

    return {
      totalItems: items.length,
      byType: this.groupByType(items),
      byConfidenceLevel: this.groupByConfidenceLevel(items),
      averageConfidence:
        items.reduce((sum, item) => sum + item.confidence, 0) /
        Math.max(items.length, 1),
      totalRelationships: items.reduce(
        (sum, item) => sum + item.relationships.length,
        0
      ),
      verificationRate:
        items.filter((item) => item.verification.isVerified).length /
        Math.max(items.length, 1),
      recentlyUpdated: items.filter(
        (item) => Date.now() - item.updatedAt.getTime() < 24 * 60 * 60 * 1000
      ).length,
      topSubjects: this.getTopSubjects(items, 10),
      networkDensity: this.calculateNetworkDensity(),
    };
  }

  /**
   * Setup memory system event listeners
   */
  private setupMemoryListeners(): void {
    this.memorySystem.on('memoryStored', (memory) => {
      this.onMemoryStored(memory);
    });

    this.memorySystem.on('memoryConsolidated', (memory) => {
      this.onMemoryConsolidated(memory);
    });
  }

  /**
   * Handle new memory storage
   */
  private onMemoryStored(memory: any): void {
    // Extract knowledge from newly stored memory
    if (memory.strength > this.CONFIDENCE_THRESHOLD) {
      const extracted = this.extractFactualKnowledge(memory);
      if (extracted) {
        this.addKnowledge(extracted);
      }
    }
  }

  /**
   * Handle memory consolidation
   */
  private onMemoryConsolidated(memory: any): void {
    // Update related knowledge when memories are consolidated
    this.updateKnowledgeFromMemory(memory);
  }

  /**
   * Extract factual knowledge from memory
   */
  private extractFactualKnowledge(
    memory: any
  ): Omit<
    KnowledgeItem,
    'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'
  > | null {
    if (!memory || !memory.content) return null;

    try {
      // Determine knowledge type based on memory content
      const type = this.determineKnowledgeType(memory);
      const subject = this.extractSubject(memory);
      const content = this.extractContent(memory);

      if (!subject || !content) return null;

      return {
        type,
        content,
        subject,
        description: this.generateDescription(memory),
        confidence: memory.strength || 0.5,
        confidenceLevel: this.calculateConfidenceLevel(memory.strength || 0.5),
        sources: [memory.id],
        tags: this.extractTags(memory),
        relationships: [],
        verification: {
          isVerified: false,
          verificationScore: 0,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {
          memoryId: memory.id,
          memoryType: memory.type,
          extractedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to extract knowledge from memory:', error);
      return null;
    }
  }

  /**
   * Determine knowledge type from memory
   */
  private determineKnowledgeType(memory: any): KnowledgeType {
    if (memory.type === 'EPISODIC') {
      return KnowledgeType.EXPERIENTIAL;
    } else if (memory.type === 'SEMANTIC') {
      return KnowledgeType.FACTUAL;
    } else if (memory.content?.procedure || memory.content?.steps) {
      return KnowledgeType.PROCEDURAL;
    } else if (memory.content?.concept || memory.content?.definition) {
      return KnowledgeType.CONCEPTUAL;
    } else {
      return KnowledgeType.CONTEXTUAL;
    }
  }

  /**
   * Extract subject from memory
   */
  private extractSubject(memory: any): string {
    if (memory.content?.subject) return memory.content.subject;
    if (memory.content?.topic) return memory.content.topic;
    if (memory.content?.title) return memory.content.title;

    // Try to extract from content
    const content = JSON.stringify(memory.content);
    const words = content.split(/\s+/).slice(0, 3);
    return (
      words
        .join(' ')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim() || 'unknown'
    );
  }

  /**
   * Extract content from memory
   */
  private extractContent(memory: any): any {
    return memory.content;
  }

  /**
   * Generate description from memory
   */
  private generateDescription(memory: any): string {
    if (memory.content?.description) return memory.content.description;
    if (memory.content?.summary) return memory.content.summary;

    const content = JSON.stringify(memory.content);
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  /**
   * Extract tags from memory
   */
  private extractTags(memory: any): string[] {
    const tags: string[] = [];

    if (memory.metadata?.tags) {
      tags.push(...memory.metadata.tags);
    }

    if (memory.type) {
      tags.push(memory.type.toLowerCase());
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Discover patterns in memories
   */
  private discoverPatterns(memories: any[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Simple pattern discovery - can be enhanced with ML
    const typeFrequency: Record<string, number> = {};
    const subjectFrequency: Record<string, number> = {};

    memories.forEach((memory) => {
      if (memory.type) {
        typeFrequency[memory.type] = (typeFrequency[memory.type] || 0) + 1;
      }

      const subject = this.extractSubject(memory);
      if (subject) {
        subjectFrequency[subject] = (subjectFrequency[subject] || 0) + 1;
      }
    });

    // Generate patterns from frequencies
    Object.entries(typeFrequency).forEach(([type, frequency]) => {
      if (frequency > 2) {
        patterns.push({
          id: `pattern_type_${type}`,
          type: 'memory_type_frequency',
          description: `Frequent memory type: ${type}`,
          frequency,
          confidence: Math.min(frequency / memories.length, 1),
          examples: memories.filter((m) => m.type === type).slice(0, 3),
          metadata: { type },
        });
      }
    });

    return patterns;
  }

  /**
   * Generate insights from extracted knowledge and patterns
   */
  private generateInsights(
    items: KnowledgeItem[],
    patterns: Pattern[]
  ): Insight[] {
    const insights: Insight[] = [];

    // Knowledge distribution insight
    if (items.length > 0) {
      const typeDistribution = this.groupByType(items);
      const dominantType = Object.entries(typeDistribution).sort(
        ([, a], [, b]) => b - a
      )[0];

      if (dominantType && dominantType[1] > items.length * 0.5) {
        insights.push({
          id: `insight_dominant_type_${Date.now()}`,
          type: 'knowledge_distribution',
          description: `Knowledge base is dominated by ${dominantType[0]} knowledge (${dominantType[1]}/${items.length} items)`,
          significance: dominantType[1] / items.length,
          evidence: [`Type distribution analysis of ${items.length} items`],
          implications: [
            'Consider diversifying knowledge acquisition',
            'May indicate specialization in specific domain',
          ],
          actionable: true,
          metadata: {
            dominantType: dominantType[0],
            ratio: dominantType[1] / items.length,
          },
        });
      }
    }

    // Confidence insight
    const averageConfidence =
      items.reduce((sum, item) => sum + item.confidence, 0) /
      Math.max(items.length, 1);
    if (averageConfidence < 0.6) {
      insights.push({
        id: `insight_low_confidence_${Date.now()}`,
        type: 'confidence_analysis',
        description: `Average knowledge confidence is low (${(averageConfidence * 100).toFixed(1)}%)`,
        significance: 1 - averageConfidence,
        evidence: [`Confidence analysis of ${items.length} knowledge items`],
        implications: [
          'Knowledge requires verification',
          'May need additional sources',
          'Consider confidence improvement strategies',
        ],
        actionable: true,
        metadata: { averageConfidence },
      });
    }

    return insights;
  }

  /**
   * Update knowledge from memory changes
   */
  private updateKnowledgeFromMemory(memory: any): void {
    // Find knowledge items related to this memory
    const relatedItems = Array.from(this.knowledgeBase.values()).filter(
      (item) => item.metadata?.memoryId === memory.id
    );

    relatedItems.forEach((item) => {
      // Update confidence if memory strength changed
      if (memory.strength && memory.strength !== item.confidence) {
        item.confidence = memory.strength;
        item.confidenceLevel = this.calculateConfidenceLevel(memory.strength);
        item.updatedAt = new Date();
      }
    });
  }

  /**
   * Calculate confidence level from numeric confidence
   */
  private calculateConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence < 0.2) return ConfidenceLevel.VERY_LOW;
    if (confidence < 0.4) return ConfidenceLevel.LOW;
    if (confidence < 0.6) return ConfidenceLevel.MEDIUM;
    if (confidence < 0.8) return ConfidenceLevel.HIGH;
    return ConfidenceLevel.VERY_HIGH;
  }

  /**
   * Calculate verification score
   */
  private calculateVerificationScore(
    supportingCount: number,
    contradictionCount: number,
    confidence: number,
    sourceCount: number
  ): number {
    const supportScore = Math.min(supportingCount * 0.2, 0.4);
    const contradictionPenalty = contradictionCount * 0.3;
    const confidenceScore = confidence * 0.3;
    const sourceScore = Math.min(sourceCount * 0.1, 0.3);

    return Math.max(
      0,
      supportScore + confidenceScore + sourceScore - contradictionPenalty
    );
  }

  /**
   * Update indices for fast searching
   */
  private updateIndices(item: KnowledgeItem): void {
    // Subject index
    const subjectKey = item.subject.toLowerCase();
    if (!this.subjectIndex.has(subjectKey)) {
      this.subjectIndex.set(subjectKey, new Set());
    }
    this.subjectIndex.get(subjectKey)!.add(item.id);

    // Tag index
    item.tags.forEach((tag) => {
      const tagKey = tag.toLowerCase();
      if (!this.tagIndex.has(tagKey)) {
        this.tagIndex.set(tagKey, new Set());
      }
      this.tagIndex.get(tagKey)!.add(item.id);
    });
  }

  /**
   * Update relationship graph
   */
  private updateRelationshipGraph(item: KnowledgeItem): void {
    if (!this.relationshipGraph.has(item.id)) {
      this.relationshipGraph.set(item.id, new Set());
    }

    const relationships = this.relationshipGraph.get(item.id)!;
    item.relationships.forEach((rel) => relationships.add(rel));
  }

  /**
   * Helper methods
   */
  private getRecencyScore(item: KnowledgeItem): number {
    const ageMs = Date.now() - item.updatedAt.getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    return Math.max(0, 1 - ageDays / 30); // Decay over 30 days
  }

  private groupByType(items: KnowledgeItem[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      grouped[item.type] = (grouped[item.type] || 0) + 1;
    });
    return grouped;
  }

  private groupByConfidenceLevel(
    items: KnowledgeItem[]
  ): Record<string, number> {
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      grouped[item.confidenceLevel] = (grouped[item.confidenceLevel] || 0) + 1;
    });
    return grouped;
  }

  private getTopSubjects(
    items: KnowledgeItem[],
    limit: number
  ): Array<{ subject: string; count: number }> {
    const subjectCounts: Record<string, number> = {};
    items.forEach((item) => {
      subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
    });

    return Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private calculateNetworkDensity(): number {
    const totalItems = this.knowledgeBase.size;
    if (totalItems < 2) return 0;

    const maxPossibleRelationships = totalItems * (totalItems - 1);
    const actualRelationships = Array.from(this.knowledgeBase.values()).reduce(
      (sum, item) => sum + item.relationships.length,
      0
    );

    return actualRelationships / maxPossibleRelationships;
  }

  /**
   * Get knowledge item by ID
   */
  public getKnowledge(id: string): KnowledgeItem | null {
    const knowledge = this.knowledgeBase.get(id);
    if (knowledge) {
      knowledge.accessCount++;
      knowledge.lastAccessed = new Date();
      return knowledge;
    }
    return null;
  }

  /**
   * Remove knowledge item
   */
  public removeKnowledge(id: string): boolean {
    const exists = this.knowledgeBase.has(id);
    if (exists) {
      this.knowledgeBase.delete(id);
      this.logger.info(`Knowledge item removed: ${id}`);
      this.emit('knowledgeRemoved', { id });
    }
    return exists;
  }
}
