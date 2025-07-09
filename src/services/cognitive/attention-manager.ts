import { ChemicalSignalingSystem } from '../../core/chemical-signaling.js';
import {
  NeurotransmitterMessage,
  NeurotransmitterType,
} from '../../types/index.js';
import { EventMap, TypedEventEmitter } from '../../utils/event-emitter';
import { Logger } from '../../utils/logger.js';

/**
 * Event map for AttentionManager
 */
interface AttentionManagerEvents extends EventMap {
  attentionShifted: (target: AttentionTarget) => void;
  focusChanged: (event: FocusEvent) => void;
  overloadDetected: (severity: number) => void;
}

/**
 * Attention Manager - Controls focus and resource allocation
 */
export class AttentionManager extends TypedEventEmitter<AttentionManagerEvents> {
  private logger: Logger;
  private chemicalSignaling: ChemicalSignalingSystem;
  private isMonitoring = false;
  private attentionTargets: Map<string, AttentionTarget> = new Map();
  private focusHistory: FocusEvent[] = [];

  // Attention parameters
  private readonly MAX_CONCURRENT_TARGETS = 5;
  private readonly ATTENTION_DECAY_RATE = 0.05;
  private readonly NOVELTY_BOOST = 1.5;

  constructor(chemicalSignaling: ChemicalSignalingSystem) {
    super();
    this.logger = new Logger('AttentionManager');
    this.chemicalSignaling = chemicalSignaling;
  }

  /**
   * Start attention monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('Attention monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Attention manager started monitoring');

    // Start attention update loop
    this.attentionLoop();
  }

  /**
   * Stop attention monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.logger.info('Attention manager stopped monitoring');
  }

  /**
   * Handle neurotransmitter messages from chemical signaling system
   */
  public onNeurotransmitterMessage(message: NeurotransmitterMessage): void {
    this.logger.debug(`Received neurotransmitter message: ${message.type}`);

    // Process different neurotransmitter types
    switch (message.type) {
      case NeurotransmitterType.DOPAMINE:
        this.handleDopamineSignal(message);
        break;
      case NeurotransmitterType.SEROTONIN:
        this.handleSerotoninSignal(message);
        break;
      case NeurotransmitterType.NOREPINEPHRINE:
        this.handleNorepinephrineSignal(message);
        break;
      case NeurotransmitterType.ACETYLCHOLINE:
        this.handleAcetylcholineSignal(message);
        break;
      case NeurotransmitterType.GABA:
        this.handleGabaSignal(message);
        break;
      default:
        this.logger.warn(`Unknown neurotransmitter type: ${message.type}`);
    }
  }

  /**
   * Handle dopamine signals (reward/motivation)
   */
  private handleDopamineSignal(message: NeurotransmitterMessage): void {
    // Increase attention to reward-related targets
    this.adjustAttentionWeights('reward', 1.2);
  }

  /**
   * Handle serotonin signals (mood/risk assessment)
   */
  private handleSerotoninSignal(message: NeurotransmitterMessage): void {
    // Modulate risk assessment attention
    this.adjustAttentionWeights('risk', 0.9);
  }

  /**
   * Handle norepinephrine signals (stress/urgency)
   */
  private handleNorepinephrineSignal(message: NeurotransmitterMessage): void {
    // Increase overall attention and focus
    this.boostGlobalAttention(1.5);
  }

  /**
   * Handle acetylcholine signals (learning/plasticity)
   */
  private handleAcetylcholineSignal(message: NeurotransmitterMessage): void {
    // Enhance attention to learning targets
    this.adjustAttentionWeights('learning', 1.3);
  }

  /**
   * Handle GABA signals (inhibition/calming)
   */
  private handleGabaSignal(message: NeurotransmitterMessage): void {
    // Reduce overall attention intensity
    this.dampGlobalAttention(0.8);
  }

  /**
   * Adjust attention weights for specific categories
   */
  private adjustAttentionWeights(category: string, factor: number): void {
    for (const [targetId, target] of this.attentionTargets.entries()) {
      if (target.category === category) {
        target.weight *= factor;
        target.weight = Math.min(target.weight, 1.0); // Cap at 1.0
      }
    }
  }

  /**
   * Boost global attention levels
   */
  private boostGlobalAttention(factor: number): void {
    for (const [targetId, target] of this.attentionTargets.entries()) {
      target.weight *= factor;
      target.weight = Math.min(target.weight, 1.0); // Cap at 1.0
    }
  }

  /**
   * Dampen global attention levels
   */
  private dampGlobalAttention(factor: number): void {
    for (const [targetId, target] of this.attentionTargets.entries()) {
      target.weight *= factor;
      target.weight = Math.max(target.weight, 0.1); // Floor at 0.1
    }
  }

  /**
   * Add attention target
   */
  public addAttentionTarget(
    id: string,
    type: AttentionType,
    priority: number,
    metadata?: Record<string, any>
  ): void {
    // Remove least important target if at capacity
    if (this.attentionTargets.size >= this.MAX_CONCURRENT_TARGETS) {
      this.removeLeastImportantTarget();
    }

    const target: AttentionTarget = {
      id,
      type,
      priority,
      intensity: this.calculateInitialIntensity(type, priority),
      weight: 1.0,
      category: metadata?.category || 'general',
      lastUpdate: new Date(),
      metadata: metadata || {},
      focusTime: 0,
    };

    this.attentionTargets.set(id, target);
    this.logger.debug(`Attention target added: ${id} (${type})`);

    // Record focus event
    this.recordFocusEvent({
      id: `focus_${Date.now()}`,
      targetId: id,
      eventType: 'target_added',
      timestamp: new Date(),
      intensity: target.intensity,
      metadata: { type, priority },
    });
  }

  /**
   * Remove attention target
   */
  public removeAttentionTarget(id: string): boolean {
    const target = this.attentionTargets.get(id);
    if (!target) return false;

    this.attentionTargets.delete(id);
    this.logger.debug(`Attention target removed: ${id}`);

    // Record focus event
    this.recordFocusEvent({
      id: `focus_${Date.now()}`,
      targetId: id,
      eventType: 'target_removed',
      timestamp: new Date(),
      intensity: 0,
      metadata: { focusTime: target.focusTime },
    });

    return true;
  }

  /**
   * Update attention intensity for a target
   */
  public updateAttentionIntensity(id: string, deltaIntensity: number): void {
    const target = this.attentionTargets.get(id);
    if (!target) return;

    target.intensity = Math.max(
      0,
      Math.min(1, target.intensity + deltaIntensity)
    );
    target.lastUpdate = new Date();

    this.logger.debug(
      `Attention intensity updated for ${id}: ${target.intensity}`
    );
  }

  /**
   * Get current attention targets
   */
  public getAttentionTargets(): AttentionTarget[] {
    return Array.from(this.attentionTargets.values()).sort(
      (a, b) => b.intensity - a.intensity
    );
  }

  /**
   * Get primary focus target
   */
  public getPrimaryFocus(): AttentionTarget | null {
    const targets = this.getAttentionTargets();
    return targets.length > 0 ? targets[0] : null;
  }

  /**
   * Check if target has attention
   */
  public hasAttention(targetId: string): boolean {
    const target = this.attentionTargets.get(targetId);
    return target ? target.intensity > 0.1 : false;
  }

  /**
   * Main attention loop
   */
  private async attentionLoop(): Promise<void> {
    while (this.isMonitoring) {
      try {
        this.updateAttentionStates();
        this.applyAttentionDecay();
        this.processAttentionShifts();

        await this.sleep(100); // 100ms update cycle
      } catch (error) {
        this.logger.error('Error in attention loop:', error);
        await this.sleep(1000);
      }
    }
  }

  /**
   * Update attention states based on current conditions
   */
  private updateAttentionStates(): void {
    const now = new Date();

    for (const [id, target] of this.attentionTargets.entries()) {
      // Update focus time
      const deltaTime = now.getTime() - target.lastUpdate.getTime();
      target.focusTime += deltaTime;
      target.lastUpdate = now;

      // Apply novelty detection
      if (this.isNovelTarget(target)) {
        target.intensity = Math.min(1, target.intensity * this.NOVELTY_BOOST);
      }

      // Apply fatigue for long-focused targets
      if (target.focusTime > 30000) {
        // 30 seconds
        target.intensity *= 0.95; // Gradual fatigue
      }
    }
  }

  /**
   * Apply natural attention decay
   */
  private applyAttentionDecay(): void {
    for (const [id, target] of this.attentionTargets.entries()) {
      target.intensity = Math.max(
        0,
        target.intensity - this.ATTENTION_DECAY_RATE
      );

      // Remove targets with very low intensity
      if (target.intensity < 0.01) {
        this.removeAttentionTarget(id);
      }
    }
  }

  /**
   * Process attention shifts and conflicts
   */
  private processAttentionShifts(): void {
    const targets = this.getAttentionTargets();

    // Detect attention conflicts
    const highPriorityTargets = targets.filter((t) => t.intensity > 0.7);
    if (highPriorityTargets.length > 1) {
      this.resolveAttentionConflict(highPriorityTargets);
    }

    // Emit attention state updates
    this.emit('attentionUpdate', {
      primaryFocus: this.getPrimaryFocus(),
      targets: targets.slice(0, 3), // Top 3 targets
      timestamp: new Date(),
    });
  }

  /**
   * Resolve attention conflicts between high-priority targets
   */
  private resolveAttentionConflict(
    conflictingTargets: AttentionTarget[]
  ): void {
    this.logger.debug(
      `Resolving attention conflict between ${conflictingTargets.length} targets`
    );

    // Find target with highest combined priority and novelty
    let winner = conflictingTargets[0];
    let maxScore = this.calculateAttentionScore(winner);

    for (let i = 1; i < conflictingTargets.length; i++) {
      const score = this.calculateAttentionScore(conflictingTargets[i]);
      if (score > maxScore) {
        maxScore = score;
        winner = conflictingTargets[i];
      }
    }

    // Boost winner and reduce others
    for (const target of conflictingTargets) {
      if (target.id === winner.id) {
        target.intensity = Math.min(1, target.intensity + 0.1);
      } else {
        target.intensity *= 0.8;
      }
    }

    this.recordFocusEvent({
      id: `focus_${Date.now()}`,
      targetId: winner.id,
      eventType: 'conflict_resolved',
      timestamp: new Date(),
      intensity: winner.intensity,
      metadata: { conflictingTargets: conflictingTargets.length },
    });
  }

  /**
   * Calculate attention score for conflict resolution
   */
  private calculateAttentionScore(target: AttentionTarget): number {
    let score = target.priority * target.intensity;

    // Novelty bonus
    if (this.isNovelTarget(target)) {
      score *= 1.2;
    }

    // Recency bonus
    const timeSinceUpdate = Date.now() - target.lastUpdate.getTime();
    if (timeSinceUpdate < 1000) {
      // Recent update
      score *= 1.1;
    }

    return score;
  }

  /**
   * Check if target is novel (new or significantly changed)
   */
  private isNovelTarget(target: AttentionTarget): boolean {
    // Simple novelty detection - in real implementation, use more sophisticated methods
    return target.focusTime < 5000; // Less than 5 seconds of focus
  }

  /**
   * Boost attention for a target
   */
  private boostAttention(targetId: string, amount: number): void {
    this.updateAttentionIntensity(targetId, amount);
  }

  /**
   * Enhance focus for a target
   */
  private enhanceFocus(targetId: string, amount: number): void {
    const target = this.attentionTargets.get(targetId);
    if (target) {
      target.intensity = Math.min(1, target.intensity + amount);
      // Reduce interference from other targets
      for (const [id, otherTarget] of this.attentionTargets.entries()) {
        if (id !== targetId) {
          otherTarget.intensity *= 0.9;
        }
      }
    }
  }

  /**
   * Reinforce attention target based on positive feedback
   */
  private reinforceTarget(targetId: string, amount: number): void {
    const target = this.attentionTargets.get(targetId);
    if (target) {
      target.priority = Math.min(1, target.priority + amount);
      this.updateAttentionIntensity(targetId, amount * 0.5);
    }
  }

  /**
   * Calculate initial intensity for new target
   */
  private calculateInitialIntensity(
    type: AttentionType,
    priority: number
  ): number {
    let intensity = priority * 0.5; // Base intensity from priority

    // Type-specific modifiers
    switch (type) {
      case AttentionType.URGENT:
        intensity *= 1.5;
        break;
      case AttentionType.NOVEL:
        intensity *= 1.3;
        break;
      case AttentionType.ERROR:
        intensity *= 1.8;
        break;
      case AttentionType.ROUTINE:
        intensity *= 0.8;
        break;
    }

    return Math.min(1, intensity);
  }

  /**
   * Remove least important target to make room for new one
   */
  private removeLeastImportantTarget(): void {
    let minScore = Infinity;
    let targetToRemove = '';

    for (const [id, target] of this.attentionTargets.entries()) {
      const score = this.calculateAttentionScore(target);
      if (score < minScore) {
        minScore = score;
        targetToRemove = id;
      }
    }

    if (targetToRemove) {
      this.removeAttentionTarget(targetToRemove);
      this.logger.debug(`Removed least important target: ${targetToRemove}`);
    }
  }

  /**
   * Record focus event for analysis
   */
  private recordFocusEvent(event: FocusEvent): void {
    this.focusHistory.push(event);

    // Keep only recent history
    if (this.focusHistory.length > 1000) {
      this.focusHistory = this.focusHistory.slice(-500);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      (globalThis as any).setTimeout(resolve, ms);
    });
  }

  /**
   * Get attention statistics
   */
  public getAttentionStats(): AttentionStats {
    const targets = Array.from(this.attentionTargets.values());
    const recentEvents = this.focusHistory.slice(-100);

    return {
      activeTargets: targets.length,
      primaryFocusId: this.getPrimaryFocus()?.id || null,
      averageIntensity:
        targets.reduce((sum, t) => sum + t.intensity, 0) /
        Math.max(targets.length, 1),
      totalFocusTime: targets.reduce((sum, t) => sum + t.focusTime, 0),
      attentionShifts: recentEvents.filter(
        (e) => e.eventType === 'conflict_resolved'
      ).length,
      targetsByType: this.groupTargetsByType(targets),
    };
  }

  private groupTargetsByType(
    targets: AttentionTarget[]
  ): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const target of targets) {
      grouped[target.type] = (grouped[target.type] || 0) + 1;
    }
    return grouped;
  }
}

enum AttentionType {
  ROUTINE = 'routine',
  NOVEL = 'novel',
  URGENT = 'urgent',
  ERROR = 'error',
  SOCIAL = 'social',
  LEARNING = 'learning',
}

interface AttentionTarget {
  id: string;
  type: AttentionType;
  priority: number;
  intensity: number;
  weight: number;
  category: string;
  lastUpdate: Date;
  focusTime: number;
  metadata: Record<string, any>;
}

interface FocusEvent {
  id: string;
  targetId: string;
  eventType:
    | 'target_added'
    | 'target_removed'
    | 'intensity_changed'
    | 'conflict_resolved';
  timestamp: Date;
  intensity: number;
  metadata: Record<string, any>;
}

interface AttentionStats {
  activeTargets: number;
  primaryFocusId: string | null;
  averageIntensity: number;
  totalFocusTime: number;
  attentionShifts: number;
  targetsByType: Record<string, number>;
}
