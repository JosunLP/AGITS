import {
  MessagePriority,
  NeurotransmitterMessage,
  NeurotransmitterType,
} from '../types/index.js';
import { EventMap, TypedEventEmitter } from '../utils/event-emitter';

/**
 * Event map for ChemicalSignalingSystem
 */
interface ChemicalSignalingEvents extends EventMap {
  message: (message: NeurotransmitterMessage) => void;
  pathwayActivated: (pathway: string) => void;
  thresholdExceeded: (service: string, level: number) => void;
}

/**
 * Chemical Signaling System - Implements neurotransmitter-based communication
 * between services, mimicking biological neural communication
 */
export class ChemicalSignalingSystem extends TypedEventEmitter<ChemicalSignalingEvents> {
  private messageQueue: Map<string, NeurotransmitterMessage[]> = new Map();
  private pathways: Map<string, NeurotransmitterPathway> = new Map();
  private receptionThresholds: Map<string, number> = new Map();
  private lastActivity: Map<string, Date> = new Map();

  constructor() {
    super();
    this.initializePathways();
    this.startReuptakeProcess();
  }

  /**
   * Initialize neurotransmitter pathways
   */
  private initializePathways(): void {
    // Dopamine pathway - reward and motivation
    this.pathways.set('dopamine', {
      type: NeurotransmitterType.DOPAMINE,
      degradationRate: 0.1,
      reuptakeRate: 0.05,
      diffusionRange: ['learning', 'planning', 'decision'],
      effects: {
        motivation: 1.5,
        learning_rate: 1.2,
        exploration: 1.3,
      },
    });

    // Serotonin pathway - mood and risk assessment
    this.pathways.set('serotonin', {
      type: NeurotransmitterType.SEROTONIN,
      degradationRate: 0.08,
      reuptakeRate: 0.06,
      diffusionRange: ['reasoning', 'decision', 'communication'],
      effects: {
        risk_tolerance: 0.7,
        confidence: 1.1,
        social_behavior: 1.4,
      },
    });

    // Norepinephrine pathway - attention and stress
    this.pathways.set('norepinephrine', {
      type: NeurotransmitterType.NOREPINEPHRINE,
      degradationRate: 0.12,
      reuptakeRate: 0.08,
      diffusionRange: ['attention', 'perception', 'executive'],
      effects: {
        attention: 1.6,
        response_time: 0.8,
        focus: 1.4,
      },
    });

    // Acetylcholine pathway - attention and learning
    this.pathways.set('acetylcholine', {
      type: NeurotransmitterType.ACETYLCHOLINE,
      degradationRate: 0.15,
      reuptakeRate: 0.1,
      diffusionRange: ['attention', 'memory', 'learning'],
      effects: {
        attention: 1.3,
        memory_formation: 1.5,
        plasticity: 1.2,
      },
    });
  }

  /**
   * Send a neurotransmitter message
   */
  public sendMessage(
    message: Omit<NeurotransmitterMessage, 'id' | 'timestamp'>
  ): string {
    const fullMessage: NeurotransmitterMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    };

    // Add to appropriate queue
    const queueKey = `${message.targetService}:${message.type}`;
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }

    const queue = this.messageQueue.get(queueKey)!;

    // Insert based on priority
    const insertIndex = this.findInsertIndex(queue, fullMessage.priority);
    queue.splice(insertIndex, 0, fullMessage);

    // Emit event for immediate processing
    this.emit('message', fullMessage);

    // Update pathway activity
    this.updatePathwayActivity(message.type);

    return fullMessage.id;
  }

  /**
   * Receive messages for a service
   */
  public receiveMessages(
    serviceId: string,
    messageType?: NeurotransmitterType
  ): NeurotransmitterMessage[] {
    const messages: NeurotransmitterMessage[] = [];

    for (const [queueKey, queue] of this.messageQueue.entries()) {
      const [targetService, type] = queueKey.split(':');

      if (
        targetService === serviceId &&
        (!messageType || type === messageType)
      ) {
        // Check reception threshold
        const threshold = this.receptionThresholds.get(serviceId) || 0;
        const availableMessages = queue.filter(
          (msg) => Date.now() - msg.timestamp.getTime() >= threshold
        );

        messages.push(...availableMessages);

        // Remove processed messages
        this.messageQueue.set(
          queueKey,
          queue.filter((msg) => !availableMessages.includes(msg))
        );
      }
    }

    return messages.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Set reception threshold for a service
   */
  public setReceptionThreshold(serviceId: string, threshold: number): void {
    this.receptionThresholds.set(serviceId, threshold);
  }

  /**
   * Get pathway effects for a service
   */
  public getPathwayEffects(serviceId: string): Record<string, number> {
    const effects: Record<string, number> = {};

    for (const [pathwayId, pathway] of this.pathways.entries()) {
      if (pathway.diffusionRange.some((range) => serviceId.includes(range))) {
        const activity = this.getPathwayActivity(pathway.type);

        for (const [effect, multiplier] of Object.entries(pathway.effects)) {
          effects[effect] =
            (effects[effect] || 1) * (1 + (multiplier - 1) * activity);
        }
      }
    }

    return effects;
  }

  /**
   * Start background reuptake process
   */
  private startReuptakeProcess(): void {
    setInterval(() => {
      this.performReuptake();
      this.degradeMessages();
    }, 1000); // Run every second
  }

  /**
   * Perform reuptake - clear old messages
   */
  private performReuptake(): void {
    const now = Date.now();

    for (const [queueKey, queue] of this.messageQueue.entries()) {
      const filteredQueue = queue.filter((msg) => {
        const age = now - msg.timestamp.getTime();
        return age < msg.ttl;
      });

      this.messageQueue.set(queueKey, filteredQueue);
    }
  }

  /**
   * Degrade pathway activity over time
   */
  private degradeMessages(): void {
    // Implement natural decay of neurotransmitter activity
    for (const [pathwayId, pathway] of this.pathways.entries()) {
      const lastActivity = this.lastActivity.get(pathwayId);
      if (lastActivity) {
        const timeSinceActivity = Date.now() - lastActivity.getTime();
        const decayFactor = Math.exp(
          (-pathway.degradationRate * timeSinceActivity) / 1000
        );

        // Apply decay to pathway strength
        this.pathways.set(pathwayId, {
          ...pathway,
          currentStrength: (pathway.currentStrength || 1) * decayFactor,
        });
      }
    }
  }

  /**
   * Update pathway activity
   */
  private updatePathwayActivity(type: NeurotransmitterType): void {
    this.lastActivity.set(type, new Date());

    const pathway = this.pathways.get(type);
    if (pathway) {
      this.pathways.set(type, {
        ...pathway,
        currentStrength: Math.min((pathway.currentStrength || 1) + 0.1, 2.0),
      });
    }
  }

  /**
   * Get current pathway activity level
   */
  private getPathwayActivity(type: NeurotransmitterType): number {
    const pathway = this.pathways.get(type);
    return pathway?.currentStrength || 1.0;
  }

  /**
   * Find insertion index for priority queue
   */
  private findInsertIndex(
    queue: NeurotransmitterMessage[],
    priority: MessagePriority
  ): number {
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].priority < priority) {
        return i;
      }
    }
    return queue.length;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get system statistics
   */
  public getSystemStats(): ChemicalSystemStats {
    const queueSizes: Record<string, number> = {};
    let totalMessages = 0;

    for (const [queueKey, queue] of this.messageQueue.entries()) {
      queueSizes[queueKey] = queue.length;
      totalMessages += queue.length;
    }

    const pathwayStats: Record<string, PathwayStats> = {};
    for (const [pathwayId, pathway] of this.pathways.entries()) {
      const lastActivity = this.lastActivity.get(pathwayId);
      pathwayStats[pathwayId] = {
        type: pathway.type,
        currentStrength: pathway.currentStrength || 1.0,
        messagesSent: 0, // TODO: Implement message counting
        ...(lastActivity && { lastActivity }),
      };
    }

    return {
      totalMessages,
      queueSizes,
      pathwayStats,
      receptionThresholds: Object.fromEntries(this.receptionThresholds),
    };
  }
}

interface NeurotransmitterPathway {
  type: NeurotransmitterType;
  degradationRate: number;
  reuptakeRate: number;
  diffusionRange: string[];
  effects: Record<string, number>;
  currentStrength?: number;
}

interface ChemicalSystemStats {
  totalMessages: number;
  queueSizes: Record<string, number>;
  pathwayStats: Record<string, PathwayStats>;
  receptionThresholds: Record<string, number>;
}

interface PathwayStats {
  type: NeurotransmitterType;
  currentStrength: number;
  lastActivity?: Date;
  messagesSent: number;
}
