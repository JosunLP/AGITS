/**
 * Knowledge-related types and enums
 */

export enum KnowledgeType {
  FACTUAL = 'factual',
  PROCEDURAL = 'procedural',
  CONCEPTUAL = 'conceptual',
  METACOGNITIVE = 'metacognitive',
  EXPERIENTIAL = 'experiential',
  CONTEXTUAL = 'contextual',
  DECLARATIVE = 'declarative',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
}

export enum KnowledgeSourceType {
  MEMORY_CONSOLIDATION = 'memory_consolidation',
  PATTERN_DISCOVERY = 'pattern_discovery',
  CROSS_REFERENCE = 'cross_reference',
  SENSOR_DATA = 'sensor_data',
  EXTERNAL_API = 'external_api',
  USER_INTERACTION = 'user_interaction',
  SYSTEM_OBSERVATION = 'system_observation',
  INFERENCE = 'inference',
  REASONING = 'reasoning',
}

export enum CollectionStrategy {
  CONTINUOUS = 'continuous',
  SCHEDULED = 'scheduled',
  EVENT_DRIVEN = 'event_driven',
  THRESHOLD_BASED = 'threshold_based',
  ON_DEMAND = 'on_demand',
}

export enum KnowledgeStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  DISPUTED = 'disputed',
  DEPRECATED = 'deprecated',
  MERGED = 'merged',
  SUPERSEDED = 'superseded',
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low', // 0-20%
  LOW = 'low', // 20-40%
  MEDIUM = 'medium', // 40-60%
  HIGH = 'high', // 60-80%
  VERY_HIGH = 'very_high', // 80-100%
}

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
  DEPENDS_ON = 'depends_on',
  PRECEDES = 'precedes',
  FOLLOWS = 'follows',
}

export enum ValidationMethod {
  AUTOMATIC = 'automatic',
  PEER_REVIEW = 'peer_review',
  EXPERT_VALIDATION = 'expert_validation',
  CONSENSUS = 'consensus',
  EMPIRICAL_TEST = 'empirical_test',
  LOGICAL_VERIFICATION = 'logical_verification',
}
