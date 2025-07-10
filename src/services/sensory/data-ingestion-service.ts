import {
  APIResponse,
  DataModalityInput,
  ModalityType,
  MultiModalData,
  ProcessedDataModality,
  ProcessingStage,
} from '../../types/index.js';
import { EventMap, TypedEventEmitter } from '../../utils/event-emitter';
import { Logger } from '../../utils/logger.js';

/**
 * Event map for DataIngestionService
 */
interface DataIngestionEvents extends EventMap {
  streamStarted: (data: { streamId: string; config: any }) => void;
  streamStopped: (data: { streamId: string; stats: any }) => void;
  dataProcessed: (data: {
    taskId: string;
    result: any;
    processingTime: number;
  }) => void;
  processingError: (data: { taskId: string; error: any }) => void;
}

/**
 * Data Ingestion Service - Multi-modal data acquisition
 * Handles text, image, audio, video, sensor, and structured data input
 */
export class DataIngestionService extends TypedEventEmitter<DataIngestionEvents> {
  private logger: Logger;
  private ingestionQueue: Map<string, IngestionTask> = new Map();
  private activeStreams: Map<string, DataStream> = new Map();
  private processingRates: Map<ModalityType, number> = new Map();

  // Ingestion parameters
  private readonly MAX_QUEUE_SIZE = 10000;
  private readonly BATCH_SIZE = 100;
  private readonly PROCESSING_INTERVAL = 1000; // 1 second

  constructor() {
    super();
    this.logger = new Logger('DataIngestionService');
    this.initializeProcessingRates();
    this.startProcessingLoop();
  }

  /**
   * Initialize processing rates for different modalities
   */
  private initializeProcessingRates(): void {
    this.processingRates.set(ModalityType.TEXT, 1000); // 1000 items/sec
    this.processingRates.set(ModalityType.IMAGE, 10); // 10 images/sec
    this.processingRates.set(ModalityType.AUDIO, 100); // 100 audio chunks/sec
    this.processingRates.set(ModalityType.VIDEO, 5); // 5 video frames/sec
    this.processingRates.set(ModalityType.SENSOR, 500); // 500 sensor readings/sec
    this.processingRates.set(ModalityType.STRUCTURED, 200); // 200 records/sec
  }

  /**
   * Ingest multi-modal data
   */
  public async ingestData(data: MultiModalData): Promise<APIResponse<string>> {
    try {
      const taskId = `ingestion_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      if (this.ingestionQueue.size >= this.MAX_QUEUE_SIZE) {
        return {
          success: false,
          error: {
            code: 'QUEUE_FULL',
            message: 'Ingestion queue is full, please try again later',
            timestamp: new Date(),
          },
        };
      }

      const task: IngestionTask = {
        id: taskId,
        data,
        status: IngestionStatus.QUEUED,
        createdAt: new Date(),
        modalities: data.modalities,
        priority: this.calculatePriority(data),
        estimatedProcessingTime: this.estimateProcessingTime(data),
      };

      this.ingestionQueue.set(taskId, task);
      this.logger.info(`Data ingestion task queued: ${taskId}`);

      this.emit('dataQueued', { taskId, modalities: data.modalities });

      return {
        success: true,
        data: taskId,
        metadata: {
          timestamp: new Date().toISOString(),
          queuePosition: this.ingestionQueue.size,
          estimatedProcessingTime: task.estimatedProcessingTime,
          requestId: `req_${Date.now()}`,
          processingTime: 0,
          version: '1.0.0',
        },
      };
    } catch (error) {
      this.logger.error('Data ingestion failed:', error);
      return {
        success: false,
        error: {
          code: 'INGESTION_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown ingestion error',
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Start continuous data stream
   */
  public async startDataStream(
    streamId: string,
    config: DataStreamConfig
  ): Promise<APIResponse<void>> {
    try {
      if (this.activeStreams.has(streamId)) {
        return {
          success: false,
          error: {
            code: 'STREAM_EXISTS',
            message: `Stream ${streamId} is already active`,
            timestamp: new Date(),
          },
        };
      }

      const stream: DataStream = {
        id: streamId,
        config,
        status: StreamStatus.ACTIVE,
        startTime: new Date(),
        processedCount: 0,
        errorCount: 0,
        lastActivity: new Date(),
      };

      this.activeStreams.set(streamId, stream);
      this.logger.info(`Data stream started: ${streamId}`);

      this.emit('streamStarted', { streamId, config });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to start stream ${streamId}:`, error);
      return {
        success: false,
        error: {
          code: 'STREAM_START_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown stream error',
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Stop data stream
   */
  public async stopDataStream(streamId: string): Promise<APIResponse<void>> {
    try {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        return {
          success: false,
          error: {
            code: 'STREAM_NOT_FOUND',
            message: `Stream ${streamId} not found`,
            timestamp: new Date(),
          },
        };
      }

      stream.status = StreamStatus.STOPPED;
      stream.endTime = new Date();
      this.activeStreams.delete(streamId);

      this.logger.info(`Data stream stopped: ${streamId}`);
      this.emit('streamStopped', {
        streamId,
        stats: this.getStreamStats(stream),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to stop stream ${streamId}:`, error);
      return {
        success: false,
        error: {
          code: 'STREAM_STOP_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown stream error',
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Start processing loop
   */
  private startProcessingLoop(): void {
    setInterval(() => {
      this.processBatch();
    }, this.PROCESSING_INTERVAL);
  }

  /**
   * Process a batch of ingestion tasks
   */
  private async processBatch(): Promise<void> {
    const tasks = Array.from(this.ingestionQueue.values())
      .filter((task) => task.status === IngestionStatus.QUEUED)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.BATCH_SIZE);

    for (const task of tasks) {
      await this.processTask(task);
    }
  }

  /**
   * Process individual ingestion task
   */
  private async processTask(task: IngestionTask): Promise<void> {
    try {
      task.status = IngestionStatus.PROCESSING;
      task.processingStartTime = new Date();

      const processedData = await this.processMultiModalData(task.data);

      task.status = IngestionStatus.COMPLETED;
      task.completedAt = new Date();
      task.result = processedData;

      this.emit('dataProcessed', {
        taskId: task.id,
        result: processedData,
        processingTime: Date.now() - task.processingStartTime!.getTime(),
      });

      // Remove completed task from queue
      this.ingestionQueue.delete(task.id);

      this.logger.debug(`Ingestion task completed: ${task.id}`);
    } catch (error) {
      task.status = IngestionStatus.FAILED;
      task.error =
        error instanceof Error ? error.message : 'Unknown processing error';

      this.logger.error(`Ingestion task failed: ${task.id}`, error);
      this.emit('processingError', { taskId: task.id, error: task.error });
    }
  }

  /**
   * Process multi-modal data
   */
  private async processMultiModalData(
    data: MultiModalData
  ): Promise<ProcessedMultiModalData> {
    const processedModalities: ProcessedDataModality[] = [];

    for (const modality of data.modalities) {
      const processed = await this.processModalityData(modality);
      processedModalities.push(processed);
    }

    return {
      id: `processed_${Date.now()}`,
      originalData: data,
      processedModalities,
      processedAt: new Date(),
      stage: ProcessingStage.PREPROCESSED,
      metadata: {
        totalSize: this.calculateTotalSize(processedModalities),
        quality: this.assessDataQuality(processedModalities),
        confidence: this.calculateConfidence(processedModalities),
      },
    };
  }

  /**
   * Process specific modality data
   */
  private async processModalityData(
    modality: DataModalityInput
  ): Promise<ProcessedDataModality> {
    const startTime = Date.now();

    // Simulate processing based on modality type
    let processed: any;
    switch (modality.type) {
      case ModalityType.TEXT:
        processed = await this.processTextData(modality.data);
        break;
      case ModalityType.IMAGE:
        processed = await this.processImageData(modality.data);
        break;
      case ModalityType.AUDIO:
        processed = await this.processAudioData(modality.data);
        break;
      case ModalityType.VIDEO:
        processed = await this.processVideoData(modality.data);
        break;
      case ModalityType.SENSOR:
        processed = await this.processSensorData(modality.data);
        break;
      case ModalityType.STRUCTURED:
        processed = await this.processStructuredData(modality.data);
        break;
      default:
        throw new Error(`Unknown modality type: ${modality.type}`);
    }

    return {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: modality.type,
      data: processed,
      quality: 0.8,
      timestamp: new Date(),
      metadata: {
        processingMethod: this.getProcessingMethod(modality.type),
        qualityScore: 0.9,
        processingTime: Date.now() - startTime,
        confidence: 0.8,
      },
      original: {
        data: modality.data,
        size: this.calculateDataSize(modality.data),
      },
    };
  }

  /**
   * Process text data
   */
  private async processTextData(content: any): Promise<any> {
    // Simulate text processing
    await this.sleep(50);
    return {
      text: content.text || content,
      tokens: content.text ? content.text.split(' ').length : 0,
      language: 'detected_language',
      sentiment: 'neutral',
      entities: [],
      keywords: [],
    };
  }

  /**
   * Process image data
   */
  private async processImageData(content: any): Promise<any> {
    // Simulate image processing
    await this.sleep(200);
    return {
      dimensions: content.dimensions || { width: 800, height: 600 },
      format: content.format || 'jpeg',
      objects: [],
      features: [],
      colorPalette: [],
    };
  }

  /**
   * Process audio data
   */
  private async processAudioData(content: any): Promise<any> {
    // Simulate audio processing
    await this.sleep(100);
    return {
      duration: content.duration || 10,
      sampleRate: content.sampleRate || 44100,
      transcription: '',
      features: [],
      emotions: [],
    };
  }

  /**
   * Process video data
   */
  private async processVideoData(content: any): Promise<any> {
    // Simulate video processing
    await this.sleep(500);
    return {
      duration: content.duration || 30,
      frameRate: content.frameRate || 30,
      resolution: content.resolution || '1920x1080',
      frames: [],
      scenes: [],
      objects: [],
    };
  }

  /**
   * Process sensor data
   */
  private async processSensorData(content: any): Promise<any> {
    // Simulate sensor data processing
    await this.sleep(10);
    return {
      sensorType: content.type || 'unknown',
      readings: content.readings || [],
      timestamp: new Date(),
      normalized: true,
      anomalies: [],
    };
  }

  /**
   * Process structured data
   */
  private async processStructuredData(content: any): Promise<any> {
    // Simulate structured data processing
    await this.sleep(25);
    return {
      schema: content.schema || 'inferred',
      records: content.records || content,
      validated: true,
      transformed: true,
    };
  }

  /**
   * Calculate priority based on data characteristics
   */
  private calculatePriority(data: MultiModalData): number {
    let priority = 1;

    // Increase priority for real-time data
    if (data.metadata?.realTime) priority += 2;

    // Increase priority for critical data
    if (data.metadata?.critical) priority += 3;

    // Increase priority based on modality count
    priority += Math.min(data.modalities.length, 3);

    return priority;
  }

  /**
   * Estimate processing time for data
   */
  private estimateProcessingTime(data: MultiModalData): number {
    let totalTime = 0;

    for (const modality of data.modalities) {
      const rate = this.processingRates.get(modality.type as ModalityType) || 1;
      const size = this.getModalitySize(modality);
      totalTime += (size / rate) * 1000; // Convert to milliseconds
    }

    return totalTime;
  }

  /**
   * Get modality data size
   */
  private getModalitySize(modality: ProcessedDataModality): number {
    // Estimate size based on modality type
    switch (modality.type) {
      case ModalityType.TEXT:
        return modality.data?.text?.length || 100;
      case ModalityType.IMAGE:
        return 1000; // Assume 1KB per image
      case ModalityType.AUDIO:
        return 5000; // Assume 5KB per audio chunk
      case ModalityType.VIDEO:
        return 50000; // Assume 50KB per video frame
      case ModalityType.SENSOR:
        return 100; // Assume 100 bytes per sensor reading
      case ModalityType.STRUCTURED:
        return 500; // Assume 500 bytes per record
      default:
        return 1000;
    }
  }

  /**
   * Get processing method for modality type
   */
  private getProcessingMethod(type: ModalityType): string {
    const methods = {
      [ModalityType.TEXT]: 'nlp_pipeline',
      [ModalityType.TEXTUAL]: 'nlp_pipeline',
      [ModalityType.IMAGE]: 'computer_vision',
      [ModalityType.VISUAL]: 'computer_vision',
      [ModalityType.AUDIO]: 'audio_analysis',
      [ModalityType.AUDITORY]: 'audio_analysis',
      [ModalityType.VIDEO]: 'video_analysis',
      [ModalityType.SENSOR]: 'signal_processing',
      [ModalityType.SENSORY]: 'signal_processing',
      [ModalityType.STRUCTURED]: 'data_validation',
      [ModalityType.TEMPORAL]: 'time_series_analysis',
      [ModalityType.SPATIAL]: 'spatial_analysis',
    };
    return methods[type] || 'generic';
  }

  /**
   * Calculate total size of processed data
   */
  private calculateTotalSize(modalities: ProcessedDataModality[]): number {
    return modalities.reduce((total, modality) => {
      return total + (modality.original?.data?.size || 1000);
    }, 0);
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(modalities: ProcessedDataModality[]): number {
    const avgQuality =
      modalities.reduce((sum, modality) => {
        return sum + (modality.metadata?.qualityScore || 0.5);
      }, 0) / modalities.length;

    return avgQuality;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(modalities: ProcessedDataModality[]): number {
    const avgConfidence =
      modalities.reduce((sum, modality) => {
        return sum + (modality.quality || 0.8);
      }, 0) / modalities.length;

    return avgConfidence;
  }

  /**
   * Get stream statistics
   */
  private getStreamStats(stream: DataStream): StreamStats {
    const duration = stream.endTime
      ? stream.endTime.getTime() - stream.startTime.getTime()
      : Date.now() - stream.startTime.getTime();

    return {
      duration,
      processedCount: stream.processedCount,
      errorCount: stream.errorCount,
      averageRate: stream.processedCount / (duration / 1000),
      errorRate: stream.errorCount / Math.max(stream.processedCount, 1),
    };
  }

  /**
   * Get ingestion statistics
   */
  public getIngestionStats(): IngestionStats {
    const queueSize = this.ingestionQueue.size;
    const activeStreams = this.activeStreams.size;

    const queuedTasks = Array.from(this.ingestionQueue.values()).filter(
      (task) => task.status === IngestionStatus.QUEUED
    ).length;

    const processingTasks = Array.from(this.ingestionQueue.values()).filter(
      (task) => task.status === IngestionStatus.PROCESSING
    ).length;

    return {
      queueSize,
      queuedTasks,
      processingTasks,
      activeStreams,
      totalProcessed: 0, // Would track in real implementation
      averageProcessingTime: 0, // Would calculate in real implementation
    };
  }

  /**
   * Calculate the size of data
   */
  private calculateDataSize(data: any): number {
    if (typeof data === 'string') {
      return data.length;
    }
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data).length;
    }
    return 1000; // Default size
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      (globalThis as any).setTimeout(resolve, ms);
    });
  }
}

// Types and interfaces
enum IngestionStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

enum StreamStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

interface IngestionTask {
  id: string;
  data: MultiModalData;
  status: IngestionStatus;
  createdAt: Date;
  processingStartTime?: Date;
  completedAt?: Date;
  modalities: DataModalityInput[];
  priority: number;
  estimatedProcessingTime: number;
  result?: ProcessedMultiModalData;
  error?: string;
}

interface DataStreamConfig {
  modalityTypes: ModalityType[];
  batchSize: number;
  interval: number;
  source: string;
  compression?: boolean;
  preprocessing?: boolean;
}

interface DataStream {
  id: string;
  config: DataStreamConfig;
  status: StreamStatus;
  startTime: Date;
  endTime?: Date;
  processedCount: number;
  errorCount: number;
  lastActivity: Date;
}

interface ProcessedMultiModalData {
  id: string;
  originalData: MultiModalData;
  processedModalities: ProcessedDataModality[];
  processedAt: Date;
  stage: ProcessingStage;
  metadata: {
    totalSize: number;
    quality: number;
    confidence: number;
  };
}

interface StreamStats {
  duration: number;
  processedCount: number;
  errorCount: number;
  averageRate: number;
  errorRate: number;
}

interface IngestionStats {
  queueSize: number;
  queuedTasks: number;
  processingTasks: number;
  activeStreams: number;
  totalProcessed: number;
  averageProcessingTime: number;
}
