import { EventEmitter } from 'events';
import { ProcessingContext } from '../../types/index.js';
import { Logger } from '../../utils/logger.js';

/**
 * Natural Language Processing Service - Handles text understanding and generation
 */
export class NaturalLanguageProcessor extends EventEmitter {
  private logger: Logger;
  private conversationHistory: ConversationTurn[] = [];
  private languageModels: Map<string, LanguageModel> = new Map();
  private processingQueue: NLPRequest[] = [];

  // NLP parameters
  private readonly MAX_CONVERSATION_HISTORY = 50;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

  constructor() {
    super();
    this.logger = new Logger('NaturalLanguageProcessor');
    this.initializeLanguageModels();
  }

  /**
   * Initialize language models
   */
  private initializeLanguageModels(): void {
    // Register available language models
    this.languageModels.set('comprehension', {
      id: 'comprehension',
      name: 'Text Comprehension Model',
      type: ModelType.COMPREHENSION,
      capabilities: [
        'intent_detection',
        'entity_extraction',
        'sentiment_analysis',
      ],
      confidence: 0.85,
    });

    this.languageModels.set('generation', {
      id: 'generation',
      name: 'Text Generation Model',
      type: ModelType.GENERATION,
      capabilities: ['text_generation', 'summarization', 'translation'],
      confidence: 0.8,
    });

    this.languageModels.set('reasoning', {
      id: 'reasoning',
      name: 'Language Reasoning Model',
      type: ModelType.REASONING,
      capabilities: ['logical_reasoning', 'question_answering', 'inference'],
      confidence: 0.75,
    });

    this.logger.info(`Initialized ${this.languageModels.size} language models`);
  }

  /**
   * Process natural language input
   */
  public async processText(
    text: string,
    context: ProcessingContext,
    options?: NLPOptions
  ): Promise<NLPResult> {
    this.logger.debug(`Processing text: ${text.substring(0, 100)}...`);

    const request: NLPRequest = {
      id: `nlp_${Date.now()}`,
      text,
      context,
      options: options || {},
      timestamp: new Date(),
    };

    const result: NLPResult = {
      id: `result_${Date.now()}`,
      requestId: request.id,
      originalText: text,
      understanding: null,
      response: null,
      confidence: 0,
      timestamp: new Date(),
      processingTime: 0,
      success: false,
    };

    const startTime = Date.now();

    try {
      // Understand the input
      const understanding = await this.understandText(text, context);
      result.understanding = understanding;

      // Generate appropriate response
      const response = await this.generateResponse(understanding, context);
      result.response = response;

      result.confidence = Math.min(
        understanding.confidence,
        response.confidence
      );
      result.success = result.confidence >= this.DEFAULT_CONFIDENCE_THRESHOLD;

      // Store in conversation history
      this.addToConversationHistory({
        id: `turn_${Date.now()}`,
        userInput: text,
        understanding,
        response: response.text,
        context,
        timestamp: new Date(),
      });
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`NLP processing failed:`, error);
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Understand text input
   */
  private async understandText(
    text: string,
    context: ProcessingContext
  ): Promise<TextUnderstanding> {
    const understanding: TextUnderstanding = {
      intent: await this.detectIntent(text, context),
      entities: await this.extractEntities(text, context),
      sentiment: await this.analyzeSentiment(text),
      topics: await this.extractTopics(text),
      confidence: 0,
    };

    // Calculate overall understanding confidence
    understanding.confidence =
      this.calculateUnderstandingConfidence(understanding);

    return understanding;
  }

  /**
   * Detect intent from text
   */
  private async detectIntent(
    text: string,
    context: ProcessingContext
  ): Promise<Intent> {
    // Simplified intent detection
    const lowercaseText = text.toLowerCase();

    let intentType = IntentType.UNKNOWN;
    let confidence = 0.5;

    if (
      lowercaseText.includes('question') ||
      lowercaseText.includes('what') ||
      lowercaseText.includes('how') ||
      lowercaseText.includes('?')
    ) {
      intentType = IntentType.QUESTION;
      confidence = 0.8;
    } else if (
      lowercaseText.includes('please') ||
      lowercaseText.includes('can you') ||
      lowercaseText.includes('do this')
    ) {
      intentType = IntentType.REQUEST;
      confidence = 0.7;
    } else if (
      lowercaseText.includes('hello') ||
      lowercaseText.includes('hi') ||
      lowercaseText.includes('greet')
    ) {
      intentType = IntentType.GREETING;
      confidence = 0.9;
    } else if (
      lowercaseText.includes('learn') ||
      lowercaseText.includes('teach') ||
      lowercaseText.includes('explain')
    ) {
      intentType = IntentType.LEARNING;
      confidence = 0.75;
    }

    return {
      type: intentType,
      confidence,
      parameters: this.extractIntentParameters(text, intentType),
    };
  }

  /**
   * Extract entities from text
   */
  private async extractEntities(
    text: string,
    context: ProcessingContext
  ): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Simple entity extraction patterns
    const patterns = [
      { type: EntityType.PERSON, regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g },
      { type: EntityType.NUMBER, regex: /\b\d+\b/g },
      { type: EntityType.DATE, regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g },
      {
        type: EntityType.EMAIL,
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      },
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          entities.push({
            type: pattern.type,
            value: match,
            confidence: 0.8,
            position: text.indexOf(match),
          });
        }
      }
    }

    return entities;
  }

  /**
   * Analyze sentiment of text
   */
  private async analyzeSentiment(text: string): Promise<Sentiment> {
    // Simplified sentiment analysis
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'happy',
      'love',
      'like',
      'amazing',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'hate',
      'dislike',
      'awful',
      'horrible',
      'sad',
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    }

    let polarity = SentimentPolarity.NEUTRAL;
    let confidence = 0.5;

    if (positiveScore > negativeScore) {
      polarity = SentimentPolarity.POSITIVE;
      confidence = Math.min(0.9, 0.5 + (positiveScore - negativeScore) * 0.1);
    } else if (negativeScore > positiveScore) {
      polarity = SentimentPolarity.NEGATIVE;
      confidence = Math.min(0.9, 0.5 + (negativeScore - positiveScore) * 0.1);
    }

    return {
      polarity,
      confidence,
      score: (positiveScore - negativeScore) / Math.max(words.length, 1),
    };
  }

  /**
   * Extract topics from text
   */
  private async extractTopics(text: string): Promise<Topic[]> {
    // Simplified topic extraction
    const topicKeywords = {
      technology: [
        'computer',
        'software',
        'programming',
        'ai',
        'machine learning',
      ],
      science: ['research', 'experiment', 'hypothesis', 'data', 'analysis'],
      business: ['company', 'market', 'sales', 'profit', 'strategy'],
      health: ['medical', 'doctor', 'patient', 'treatment', 'disease'],
    };

    const topics: Topic[] = [];
    const lowercaseText = text.toLowerCase();

    for (const [topicName, keywords] of Object.entries(topicKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowercaseText.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0) {
        topics.push({
          name: topicName,
          confidence: Math.min(0.9, score * 0.2),
          keywords: keywords.filter((kw) => lowercaseText.includes(kw)),
        });
      }
    }

    return topics.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate response based on understanding
   */
  private async generateResponse(
    understanding: TextUnderstanding,
    context: ProcessingContext
  ): Promise<GeneratedResponse> {
    const response: GeneratedResponse = {
      text: '',
      confidence: 0,
      responseType: ResponseType.INFORMATIVE,
      metadata: {},
    };

    try {
      switch (understanding.intent.type) {
        case IntentType.GREETING:
          response.text = this.generateGreeting(context);
          response.responseType = ResponseType.SOCIAL;
          response.confidence = 0.9;
          break;

        case IntentType.QUESTION:
          response.text = await this.generateAnswer(understanding, context);
          response.responseType = ResponseType.INFORMATIVE;
          response.confidence = 0.7;
          break;

        case IntentType.REQUEST:
          response.text = await this.generateRequestResponse(
            understanding,
            context
          );
          response.responseType = ResponseType.ACTIONABLE;
          response.confidence = 0.6;
          break;

        case IntentType.LEARNING:
          response.text = await this.generateLearningResponse(
            understanding,
            context
          );
          response.responseType = ResponseType.EDUCATIONAL;
          response.confidence = 0.8;
          break;

        default:
          response.text = this.generateDefaultResponse(understanding, context);
          response.responseType = ResponseType.CLARIFICATION;
          response.confidence = 0.4;
      }
    } catch (error) {
      response.text =
        'I apologize, but I encountered an error while processing your request.';
      response.confidence = 0.1;
      response.responseType = ResponseType.ERROR;
      this.logger.error('Response generation failed:', error);
    }

    return response;
  }

  /**
   * Generate greeting response
   */
  private generateGreeting(context: ProcessingContext): string {
    const greetings = [
      'Hello! How can I assist you today?',
      'Hi there! What can I help you with?',
      "Greetings! I'm here to help.",
      'Hello! What would you like to know?',
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Generate answer to question
   */
  private async generateAnswer(
    understanding: TextUnderstanding,
    context: ProcessingContext
  ): Promise<string> {
    // Simple question answering
    const topics = understanding.topics;

    if (topics.length > 0) {
      const primaryTopic = topics[0];
      return `Based on your question about ${primaryTopic.name}, I can provide information on this topic. However, I would need more specific details to give you a comprehensive answer.`;
    }

    return 'I understand you have a question. Could you please provide more specific details so I can give you a better answer?';
  }

  /**
   * Generate response to request
   */
  private async generateRequestResponse(
    understanding: TextUnderstanding,
    context: ProcessingContext
  ): Promise<string> {
    return "I understand your request. I'll do my best to help you with that. Let me process what you need and get back to you.";
  }

  /**
   * Generate learning-oriented response
   */
  private async generateLearningResponse(
    understanding: TextUnderstanding,
    context: ProcessingContext
  ): Promise<string> {
    const topics = understanding.topics;

    if (topics.length > 0) {
      const primaryTopic = topics[0];
      return `I'd be happy to help you learn about ${primaryTopic.name}. This is an interesting topic with many aspects to explore. What specific area would you like to focus on?`;
    }

    return "I'm always eager to help with learning! What topic or subject are you interested in exploring?";
  }

  /**
   * Generate default response for unknown intents
   */
  private generateDefaultResponse(
    understanding: TextUnderstanding,
    context: ProcessingContext
  ): string {
    return "I'm not entirely sure I understand what you're looking for. Could you please rephrase your request or provide more details?";
  }

  /**
   * Calculate overall understanding confidence
   */
  private calculateUnderstandingConfidence(
    understanding: TextUnderstanding
  ): number {
    const weights = {
      intent: 0.4,
      entities: 0.2,
      sentiment: 0.2,
      topics: 0.2,
    };

    let totalConfidence = understanding.intent.confidence * weights.intent;
    totalConfidence += understanding.sentiment.confidence * weights.sentiment;

    if (understanding.entities.length > 0) {
      const avgEntityConfidence =
        understanding.entities.reduce((sum, e) => sum + e.confidence, 0) /
        understanding.entities.length;
      totalConfidence += avgEntityConfidence * weights.entities;
    }

    if (understanding.topics.length > 0) {
      const avgTopicConfidence =
        understanding.topics.reduce((sum, t) => sum + t.confidence, 0) /
        understanding.topics.length;
      totalConfidence += avgTopicConfidence * weights.topics;
    }

    return Math.min(totalConfidence, 1.0);
  }

  /**
   * Extract parameters from intent
   */
  private extractIntentParameters(
    text: string,
    intentType: IntentType
  ): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (intentType) {
      case IntentType.QUESTION:
        parameters.questionType = this.classifyQuestion(text);
        break;
      case IntentType.REQUEST:
        parameters.urgency = this.assessUrgency(text);
        break;
    }

    return parameters;
  }

  /**
   * Classify question type
   */
  private classifyQuestion(text: string): string {
    const lowercaseText = text.toLowerCase();

    if (lowercaseText.includes('what')) return 'what';
    if (lowercaseText.includes('how')) return 'how';
    if (lowercaseText.includes('why')) return 'why';
    if (lowercaseText.includes('when')) return 'when';
    if (lowercaseText.includes('where')) return 'where';
    if (lowercaseText.includes('who')) return 'who';

    return 'general';
  }

  /**
   * Assess urgency of request
   */
  private assessUrgency(text: string): string {
    const lowercaseText = text.toLowerCase();

    if (
      lowercaseText.includes('urgent') ||
      lowercaseText.includes('asap') ||
      lowercaseText.includes('immediately')
    ) {
      return 'high';
    }
    if (lowercaseText.includes('soon') || lowercaseText.includes('quickly')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Add turn to conversation history
   */
  private addToConversationHistory(turn: ConversationTurn): void {
    this.conversationHistory.push(turn);

    // Keep only recent history
    if (this.conversationHistory.length > this.MAX_CONVERSATION_HISTORY) {
      this.conversationHistory = this.conversationHistory.slice(
        -this.MAX_CONVERSATION_HISTORY
      );
    }
  }

  /**
   * Get conversation history
   */
  public getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  public clearConversationHistory(): void {
    this.conversationHistory = [];
    this.logger.info('Conversation history cleared');
  }

  /**
   * Get NLP statistics
   */
  public getNLPStats(): NLPStats {
    const recentTurns = this.conversationHistory.slice(-20);

    return {
      conversationTurns: this.conversationHistory.length,
      queueSize: this.processingQueue.length,
      averageConfidence:
        recentTurns.reduce(
          (sum, turn) => sum + (turn.understanding?.confidence || 0),
          0
        ) / Math.max(recentTurns.length, 1),
      intentDistribution: this.calculateIntentDistribution(recentTurns),
      topicDistribution: this.calculateTopicDistribution(recentTurns),
    };
  }

  private calculateIntentDistribution(
    turns: ConversationTurn[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const turn of turns) {
      if (turn.understanding?.intent) {
        const intent = turn.understanding.intent.type;
        distribution[intent] = (distribution[intent] || 0) + 1;
      }
    }

    return distribution;
  }

  private calculateTopicDistribution(
    turns: ConversationTurn[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const turn of turns) {
      if (turn.understanding?.topics) {
        for (const topic of turn.understanding.topics) {
          distribution[topic.name] = (distribution[topic.name] || 0) + 1;
        }
      }
    }

    return distribution;
  }
}

// Enums and interfaces
enum ModelType {
  COMPREHENSION = 'comprehension',
  GENERATION = 'generation',
  REASONING = 'reasoning',
}

enum IntentType {
  GREETING = 'greeting',
  QUESTION = 'question',
  REQUEST = 'request',
  LEARNING = 'learning',
  COMPLAINT = 'complaint',
  COMPLIMENT = 'compliment',
  UNKNOWN = 'unknown',
}

enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  TIME = 'time',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
}

enum SentimentPolarity {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

enum ResponseType {
  INFORMATIVE = 'informative',
  ACTIONABLE = 'actionable',
  SOCIAL = 'social',
  EDUCATIONAL = 'educational',
  CLARIFICATION = 'clarification',
  ERROR = 'error',
}

interface LanguageModel {
  id: string;
  name: string;
  type: ModelType;
  capabilities: string[];
  confidence: number;
}

interface NLPRequest {
  id: string;
  text: string;
  context: ProcessingContext;
  options: NLPOptions;
  timestamp: Date;
}

interface NLPOptions {
  includeEntities?: boolean;
  includeSentiment?: boolean;
  includeTopics?: boolean;
  confidenceThreshold?: number;
}

interface NLPResult {
  id: string;
  requestId: string;
  originalText: string;
  understanding: TextUnderstanding | null;
  response: GeneratedResponse | null;
  confidence: number;
  timestamp: Date;
  processingTime: number;
  success: boolean;
  error?: string;
}

interface TextUnderstanding {
  intent: Intent;
  entities: Entity[];
  sentiment: Sentiment;
  topics: Topic[];
  confidence: number;
}

interface Intent {
  type: IntentType;
  confidence: number;
  parameters: Record<string, any>;
}

interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  position: number;
}

interface Sentiment {
  polarity: SentimentPolarity;
  confidence: number;
  score: number;
}

interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
}

interface GeneratedResponse {
  text: string;
  confidence: number;
  responseType: ResponseType;
  metadata: Record<string, any>;
}

interface ConversationTurn {
  id: string;
  userInput: string;
  understanding: TextUnderstanding | null;
  response: string;
  context: ProcessingContext;
  timestamp: Date;
}

interface NLPStats {
  conversationTurns: number;
  queueSize: number;
  averageConfidence: number;
  intentDistribution: Record<string, number>;
  topicDistribution: Record<string, number>;
}
