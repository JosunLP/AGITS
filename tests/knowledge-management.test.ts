import { defaultLearningConfig } from '../src/config/app.js';
import {
  ConfidenceLevel,
  KnowledgeManagementSystem,
  KnowledgeType,
} from '../src/core/knowledge-management';
import { MemoryManagementSystem } from '../src/core/memory-management';
import { KnowledgeSourceType, KnowledgeStatus } from '../src/types/index.js';

describe('KnowledgeManagementSystem', () => {
  let knowledgeSystem: KnowledgeManagementSystem;
  let memorySystem: MemoryManagementSystem;

  beforeEach(() => {
    // Create a mock memory system
    memorySystem = {
      on: jest.fn(),
      emit: jest.fn(),
      getMemoriesByType: jest.fn().mockReturnValue([]),
      searchMemories: jest.fn().mockReturnValue([]),
    } as any;

    knowledgeSystem = new KnowledgeManagementSystem(
      memorySystem,
      defaultLearningConfig
    );
  });

  describe('knowledge storage', () => {
    test('should add knowledge to knowledge base', async () => {
      // Create a simple knowledge item that matches the interface requirements
      const testKnowledge = {
        type: KnowledgeType.FACTUAL,
        content: 'Test knowledge content',
        subject: 'testing',
        confidence: 0.8,
        source: KnowledgeSourceType.USER_INTERACTION,
        tags: ['test', 'example'],
        status: KnowledgeStatus.VALIDATED,
        relationships: [],
        validation: {
          isVerified: true,
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: ['test-evidence'],
        },
        metadata: {
          domain: 'test',
          complexity: 0.5,
          importance: 0.8,
          frequency: 1,
          context: {},
          lastReviewed: new Date(),
          source: 'test',
          tags: [],
          version: 1,
          changeHistory: [],
          derivedFrom: [],
          relatedConcepts: [],
          applications: [],
          limitations: [],
          assumptions: [],
        },
      };

      const knowledgeId = await knowledgeSystem.addKnowledge(testKnowledge);
      expect(knowledgeId).toBeDefined();
      expect(typeof knowledgeId).toBe('string');
      expect(knowledgeId).toMatch(/^knowledge_/);
    });
  });

  describe('knowledge querying', () => {
    test('should query knowledge by type', () => {
      const factualKnowledge = {
        type: KnowledgeType.FACTUAL,
        content: 'This is a fact',
        subject: 'facts',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.VERY_HIGH,
        sources: ['source1'],
        tags: ['fact'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: ['evidence1'],
        },
        metadata: {},
      };

      const proceduralKnowledge = {
        type: KnowledgeType.PROCEDURAL,
        content: 'This is how to do something',
        subject: 'procedures',
        confidence: 0.8,
        confidenceLevel: ConfidenceLevel.HIGH,
        sources: ['source2'],
        tags: ['procedure'],
        relationships: [],
        verification: {
          isVerified: false,
          verificationScore: 0.6,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {},
      };

      knowledgeSystem.addKnowledge(factualKnowledge);
      knowledgeSystem.addKnowledge(proceduralKnowledge);

      const factualResults = knowledgeSystem.queryKnowledge({
        types: [KnowledgeType.FACTUAL],
      });

      expect(factualResults.length).toBe(1);
      expect(factualResults[0].type).toBe(KnowledgeType.FACTUAL);
      expect(factualResults[0].content).toBe('This is a fact');
    });

    test('should query knowledge by confidence range', () => {
      const highConfidenceKnowledge = {
        type: KnowledgeType.CONCEPTUAL,
        content: 'High confidence concept',
        subject: 'concepts',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.VERY_HIGH,
        sources: ['reliable-source'],
        tags: ['concept'],
        relationships: [],
        verification: {
          isVerified: true,
          verificationScore: 0.9,
          contradictions: [],
          supportingEvidence: ['strong-evidence'],
        },
        metadata: {},
      };

      const lowConfidenceKnowledge = {
        type: KnowledgeType.CONCEPTUAL,
        content: 'Low confidence concept',
        subject: 'concepts',
        confidence: 0.3,
        confidenceLevel: ConfidenceLevel.LOW,
        sources: ['weak-source'],
        tags: ['concept'],
        relationships: [],
        verification: {
          isVerified: false,
          verificationScore: 0.3,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {},
      };

      knowledgeSystem.addKnowledge(highConfidenceKnowledge);
      knowledgeSystem.addKnowledge(lowConfidenceKnowledge);

      const highConfidenceResults = knowledgeSystem.queryKnowledge({
        confidenceMin: 0.8,
      });

      expect(highConfidenceResults.length).toBe(1);
      expect(highConfidenceResults[0].confidence).toBeGreaterThanOrEqual(0.8);
      expect(highConfidenceResults[0].content).toBe('High confidence concept');
    });

    test('should perform text search', () => {
      const searchableKnowledge = {
        type: KnowledgeType.EXPERIENTIAL,
        content: 'JavaScript programming language experience',
        subject: 'programming',
        confidence: 0.7,
        confidenceLevel: ConfidenceLevel.HIGH,
        sources: ['experience'],
        tags: ['javascript', 'programming'],
        relationships: [],
        verification: {
          isVerified: false,
          verificationScore: 0.6,
          contradictions: [],
          supportingEvidence: [],
        },
        metadata: {},
      };

      knowledgeSystem.addKnowledge(searchableKnowledge);

      const searchResults = knowledgeSystem.queryKnowledge({
        textSearch: 'JavaScript',
      });

      expect(searchResults.length).toBe(1);
      expect(searchResults[0].content).toContain('JavaScript');
    });
  });
});
