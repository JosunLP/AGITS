/**
 * Knowledge Management Service
 * Simplified service for knowledge operations
 */

import { DataPersistenceLayer } from '../../infrastructure/data-persistence-layer.js';
import { KnowledgeItem } from '../../types/knowledge.interface.js';
import { Logger } from '../../utils/logger.js';

export class KnowledgeManagementService {
  private readonly logger: Logger;
  private readonly dataPersistence: DataPersistenceLayer;

  constructor(dataPersistence: DataPersistenceLayer) {
    this.logger = new Logger('KnowledgeManagementService');
    this.dataPersistence = dataPersistence;
  }

  /**
   * Add knowledge to the system
   */
  async addKnowledge(knowledge: KnowledgeItem): Promise<string> {
    try {
      const knowledgeId = await this.dataPersistence.storeKnowledge(knowledge);
      this.logger.debug(`Knowledge stored with ID: ${knowledgeId}`);
      return knowledgeId;
    } catch (error) {
      this.logger.error('Failed to add knowledge:', error);
      throw error;
    }
  }

  /**
   * Search knowledge
   */
  async searchKnowledge(
    query: string,
    limit?: number
  ): Promise<KnowledgeItem[]> {
    try {
      const results = await this.dataPersistence.searchKnowledge(query);
      return limit ? results.slice(0, limit) : results;
    } catch (error) {
      this.logger.error('Failed to search knowledge:', error);
      throw error;
    }
  }

  /**
   * Get knowledge by ID
   */
  async getKnowledge(id: string): Promise<KnowledgeItem | null> {
    try {
      return await this.dataPersistence.retrieveKnowledge(id);
    } catch (error) {
      this.logger.error('Failed to get knowledge:', error);
      throw error;
    }
  }

  /**
   * Update knowledge
   */
  async updateKnowledge(
    id: string,
    updates: Partial<KnowledgeItem>
  ): Promise<void> {
    try {
      // Basic implementation until DataPersistenceLayer has updateKnowledge
      const existing = await this.dataPersistence.retrieveKnowledge(id);
      if (!existing) {
        throw new Error(`Knowledge item with id ${id} not found`);
      }

      const updated = { ...existing, ...updates };
      await this.dataPersistence.storeKnowledge(updated);

      this.logger.debug(`Knowledge updated: ${id}`);
    } catch (error) {
      this.logger.error('Failed to update knowledge:', error);
      throw error;
    }
  }

  /**
   * Delete knowledge
   */
  async deleteKnowledge(id: string): Promise<void> {
    try {
      // Basic implementation - log for now
      this.logger.debug(`Knowledge deletion requested: ${id}`);
      // TODO: Implement when DataPersistenceLayer supports it
    } catch (error) {
      this.logger.error('Failed to delete knowledge:', error);
      throw error;
    }
  }
}
