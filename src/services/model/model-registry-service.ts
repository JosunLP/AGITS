import { APIResponse } from '../../types/index.js';
import { EventMap, TypedEventEmitter } from '../../utils/event-emitter.js';
import { Logger } from '../../utils/logger.js';

interface ModelRegistryEvents extends EventMap {
  modelRegistered: (data: { modelName: string; version: number }) => void;
  deploymentStarted: (deployment: ModelDeployment) => void;
  deploymentCompleted: (deployment: ModelDeployment) => void;
  modelDeleted: (data: { modelName: string }) => void;
}

/**
 * Model Registry Service - MLflow-style model versioning and metadata management
 * Handles model lifecycle, versioning, and deployment management
 */
export class ModelRegistryService extends TypedEventEmitter<ModelRegistryEvents> {
  private logger: Logger;
  private models: Map<string, RegisteredModel> = new Map();
  private modelVersions: Map<string, ModelVersion[]> = new Map();
  private deployments: Map<string, ModelDeployment> = new Map();
  private experiments: Map<string, Experiment> = new Map();

  // Registry parameters
  private readonly MAX_VERSIONS_PER_MODEL = 50;
  private readonly MAX_MODELS = 1000;

  constructor() {
    super();
    this.logger = new Logger('ModelRegistryService');
    this.initializeDefaultModels();
  }

  /**
   * Initialize default AI models for the AGI system
   */
  private initializeDefaultModels(): void {
    // Reasoning models
    this.registerModel({
      name: 'reasoning-engine-v1',
      description: 'Primary reasoning and inference model',
      tags: ['reasoning', 'inference', 'cognitive'],
      metadata: {
        architecture: 'transformer',
        parameters: '7B',
        training_data: 'reasoning_corpus_v1',
      },
    });

    // Memory models
    this.registerModel({
      name: 'memory-management-v1',
      description: 'Hierarchical temporal memory model',
      tags: ['memory', 'htm', 'consolidation'],
      metadata: {
        architecture: 'htm',
        capacity: '1TB',
        retention_policy: 'adaptive',
      },
    });

    // Attention models
    this.registerModel({
      name: 'attention-manager-v1',
      description: 'Dynamic attention allocation model',
      tags: ['attention', 'focus', 'allocation'],
      metadata: {
        architecture: 'attention_net',
        max_targets: '100',
        update_frequency: '10ms',
      },
    });

    // Learning models
    this.registerModel({
      name: 'meta-learning-v1',
      description: 'Meta-learning and adaptive learning model',
      tags: ['learning', 'adaptation', 'meta'],
      metadata: {
        architecture: 'maml',
        adaptation_steps: '5',
        learning_rate: '0.001',
      },
    });

    // Pattern recognition models
    this.registerModel({
      name: 'pattern-recognition-v1',
      description: 'Multi-modal pattern recognition model',
      tags: ['pattern', 'recognition', 'multimodal'],
      metadata: {
        modalities: 'text,image,audio,video',
        accuracy: '92%',
        latency: '50ms',
      },
    });
  }

  /**
   * Register a new model
   */
  public async registerModel(
    modelInfo: ModelRegistrationRequest
  ): Promise<APIResponse<RegisteredModel>> {
    try {
      if (this.models.has(modelInfo.name)) {
        return {
          success: false,
          error: {
            code: 'MODEL_EXISTS',
            message: `Model ${modelInfo.name} already exists`,
          },
        };
      }

      if (this.models.size >= this.MAX_MODELS) {
        return {
          success: false,
          error: {
            code: 'REGISTRY_FULL',
            message: 'Model registry is full',
          },
        };
      }

      const model: RegisteredModel = {
        name: modelInfo.name,
        description: modelInfo.description,
        tags: modelInfo.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        latestVersion: null,
        status: ModelStatus.REGISTERED,
        metadata: modelInfo.metadata || {},
      };

      this.models.set(modelInfo.name, model);
      this.modelVersions.set(modelInfo.name, []);

      this.logger.info(`Model registered: ${modelInfo.name}`);
      this.emit('modelRegistered', { modelName: model.name, version: 1 });

      return {
        success: true,
        data: model,
      };
    } catch (error) {
      this.logger.error(`Failed to register model ${modelInfo.name}:`, error);
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown registration error',
        },
      };
    }
  }

  /**
   * Create a new version of an existing model
   */
  public async createModelVersion(
    modelName: string,
    versionInfo: ModelVersionRequest
  ): Promise<APIResponse<ModelVersion>> {
    try {
      const model = this.models.get(modelName);
      if (!model) {
        return {
          success: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model ${modelName} not found`,
          },
        };
      }

      const versions = this.modelVersions.get(modelName) || [];
      if (versions.length >= this.MAX_VERSIONS_PER_MODEL) {
        return {
          success: false,
          error: {
            code: 'VERSION_LIMIT_EXCEEDED',
            message: `Maximum versions exceeded for model ${modelName}`,
          },
        };
      }

      const version: ModelVersion = {
        modelName,
        version: versionInfo.version || `v${versions.length + 1}`,
        description: versionInfo.description,
        stage: ModelStage.DEVELOPMENT,
        source: versionInfo.source,
        tags: versionInfo.tags || [],
        createdAt: new Date(),
        metadata: versionInfo.metadata || {},
        metrics: versionInfo.metrics || {},
        artifacts: versionInfo.artifacts || [],
      };

      versions.push(version);
      this.modelVersions.set(modelName, versions);

      // Update model's latest version
      model.latestVersion = version.version;
      model.updatedAt = new Date();

      this.logger.info(
        `Model version created: ${modelName}:${version.version}`
      );
      this.emit('versionCreated', { model: modelName, version });

      return {
        success: true,
        data: version,
      };
    } catch (error) {
      this.logger.error(`Failed to create version for ${modelName}:`, error);
      return {
        success: false,
        error: {
          code: 'VERSION_CREATION_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown version creation error',
        },
      };
    }
  }

  /**
   * Transition model version to different stage
   */
  public async transitionModelStage(
    modelName: string,
    version: string,
    newStage: ModelStage,
    description?: string
  ): Promise<APIResponse<ModelVersion>> {
    try {
      const versions = this.modelVersions.get(modelName);
      if (!versions) {
        return {
          success: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model ${modelName} not found`,
          },
        };
      }

      const modelVersion = versions.find((v) => v.version === version);
      if (!modelVersion) {
        return {
          success: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: `Version ${version} not found for model ${modelName}`,
          },
        };
      }

      const previousStage = modelVersion.stage;
      modelVersion.stage = newStage;
      modelVersion.stageTransitions = modelVersion.stageTransitions || [];
      modelVersion.stageTransitions.push({
        fromStage: previousStage,
        toStage: newStage,
        timestamp: new Date(),
        description: description || `Transitioned to ${newStage}`,
      });

      this.logger.info(
        `Model stage transitioned: ${modelName}:${version} ${previousStage} -> ${newStage}`
      );
      this.emit('stageTransition', {
        model: modelName,
        version,
        fromStage: previousStage,
        toStage: newStage,
      });

      return {
        success: true,
        data: modelVersion,
      };
    } catch (error) {
      this.logger.error(
        `Failed to transition stage for ${modelName}:${version}:`,
        error
      );
      return {
        success: false,
        error: {
          code: 'STAGE_TRANSITION_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown stage transition error',
        },
      };
    }
  }

  /**
   * Deploy model version
   */
  public async deployModel(
    modelName: string,
    version: string,
    deploymentConfig: ModelDeploymentConfig
  ): Promise<APIResponse<ModelDeployment>> {
    try {
      const modelVersion = await this.getModelVersion(modelName, version);
      if (!modelVersion.success) {
        return {
          success: false,
          error: modelVersion.error,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: `deploy-${Date.now()}`,
            source: 'ModelRegistryService',
          },
        } as APIResponse<ModelDeployment>;
      }

      if (
        modelVersion.data!.stage !== ModelStage.PRODUCTION &&
        !deploymentConfig.allowNonProduction
      ) {
        return {
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: 'Only production stage models can be deployed',
          },
        };
      }

      const deploymentId = `${modelName}-${version}-${Date.now()}`;
      const deployment: ModelDeployment = {
        id: deploymentId,
        modelName,
        version,
        config: deploymentConfig,
        status: DeploymentStatus.DEPLOYING,
        createdAt: new Date(),
        endpoint: `${deploymentConfig.endpoint}/${deploymentId}`,
        instances: deploymentConfig.instances || 1,
        resources: deploymentConfig.resources || { cpu: '1', memory: '2Gi' },
        health: {
          status: 'initializing',
          lastCheck: new Date(),
          uptime: 0,
        },
      };

      this.deployments.set(deploymentId, deployment);

      // Simulate deployment process
      this.simulateDeployment(deployment);

      this.logger.info(`Model deployment started: ${deploymentId}`);
      this.emit('deploymentStarted', deployment);

      return {
        success: true,
        data: deployment,
      };
    } catch (error) {
      this.logger.error(`Failed to deploy ${modelName}:${version}:`, error);
      return {
        success: false,
        error: {
          code: 'DEPLOYMENT_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown deployment error',
        },
      };
    }
  }

  /**
   * Get model information
   */
  public getModel(modelName: string): APIResponse<RegisteredModel> {
    const model = this.models.get(modelName);
    if (!model) {
      return {
        success: false,
        error: {
          code: 'MODEL_NOT_FOUND',
          message: `Model ${modelName} not found`,
        },
      };
    }

    return {
      success: true,
      data: model,
    };
  }

  /**
   * Get model version information
   */
  public getModelVersion(
    modelName: string,
    version: string
  ): APIResponse<ModelVersion> {
    const versions = this.modelVersions.get(modelName);
    if (!versions) {
      return {
        success: false,
        error: {
          code: 'MODEL_NOT_FOUND',
          message: `Model ${modelName} not found`,
        },
      };
    }

    const modelVersion = versions.find((v) => v.version === version);
    if (!modelVersion) {
      return {
        success: false,
        error: {
          code: 'VERSION_NOT_FOUND',
          message: `Version ${version} not found for model ${modelName}`,
        },
      };
    }

    return {
      success: true,
      data: modelVersion,
    };
  }

  /**
   * List all models
   */
  public listModels(filter?: ModelFilter): APIResponse<RegisteredModel[]> {
    let models = Array.from(this.models.values());

    if (filter) {
      if (filter.tags) {
        models = models.filter((m) =>
          filter.tags!.some((tag) => m.tags.includes(tag))
        );
      }
      if (filter.status) {
        models = models.filter((m) => m.status === filter.status);
      }
      if (filter.namePattern) {
        const pattern = new RegExp(filter.namePattern, 'i');
        models = models.filter((m) => pattern.test(m.name));
      }
    }

    return {
      success: true,
      data: models,
    };
  }

  /**
   * List model versions
   */
  public listModelVersions(modelName: string): APIResponse<ModelVersion[]> {
    const versions = this.modelVersions.get(modelName);
    if (!versions) {
      return {
        success: false,
        error: {
          code: 'MODEL_NOT_FOUND',
          message: `Model ${modelName} not found`,
        },
      };
    }

    return {
      success: true,
      data: versions,
    };
  }

  /**
   * List deployments
   */
  public listDeployments(
    filter?: DeploymentFilter
  ): APIResponse<ModelDeployment[]> {
    let deployments = Array.from(this.deployments.values());

    if (filter) {
      if (filter.modelName) {
        deployments = deployments.filter(
          (d) => d.modelName === filter.modelName
        );
      }
      if (filter.status) {
        deployments = deployments.filter((d) => d.status === filter.status);
      }
    }

    return {
      success: true,
      data: deployments,
    };
  }

  /**
   * Delete model
   */
  public async deleteModel(modelName: string): Promise<APIResponse<void>> {
    try {
      const model = this.models.get(modelName);
      if (!model) {
        return {
          success: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model ${modelName} not found`,
          },
        };
      }

      // Check for active deployments
      const activeDeployments = Array.from(this.deployments.values()).filter(
        (d) =>
          d.modelName === modelName && d.status === DeploymentStatus.RUNNING
      );

      if (activeDeployments.length > 0) {
        return {
          success: false,
          error: {
            code: 'MODEL_IN_USE',
            message: `Model ${modelName} has active deployments`,
          },
        };
      }

      this.models.delete(modelName);
      this.modelVersions.delete(modelName);

      this.logger.info(`Model deleted: ${modelName}`);
      this.emit('modelDeleted', { modelName });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelName}:`, error);
      return {
        success: false,
        error: {
          code: 'DELETION_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown deletion error',
        },
      };
    }
  }

  /**
   * Simulate deployment process
   */
  private async simulateDeployment(deployment: ModelDeployment): Promise<void> {
    // Simulate deployment steps
    setTimeout(() => {
      deployment.status = DeploymentStatus.RUNNING;
      deployment.health.status = 'healthy';
      deployment.startedAt = new Date();

      this.logger.info(`Deployment completed: ${deployment.id}`);
      this.emit('deploymentCompleted', deployment);
    }, 3000); // 3 second deployment time
  }

  /**
   * Get registry statistics
   */
  public getRegistryStats(): RegistryStats {
    const totalModels = this.models.size;
    const totalVersions = Array.from(this.modelVersions.values()).reduce(
      (sum, versions) => sum + versions.length,
      0
    );
    const totalDeployments = this.deployments.size;

    const runningDeployments = Array.from(this.deployments.values()).filter(
      (d) => d.status === DeploymentStatus.RUNNING
    ).length;

    const stageDistribution = Array.from(this.modelVersions.values())
      .flat()
      .reduce(
        (dist, version) => {
          dist[version.stage] = (dist[version.stage] || 0) + 1;
          return dist;
        },
        {} as Record<ModelStage, number>
      );

    return {
      totalModels,
      totalVersions,
      totalDeployments,
      runningDeployments,
      stageDistribution,
      registrySize: totalModels / this.MAX_MODELS,
    };
  }
}

// Types and interfaces
enum ModelStatus {
  REGISTERED = 'registered',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

enum ModelStage {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  ARCHIVED = 'archived',
}

enum DeploymentStatus {
  DEPLOYING = 'deploying',
  RUNNING = 'running',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

interface RegisteredModel {
  name: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  latestVersion: string | null;
  status: ModelStatus;
  metadata: Record<string, any>;
}

interface ModelVersion {
  modelName: string;
  version: string;
  description: string;
  stage: ModelStage;
  source: string;
  tags: string[];
  createdAt: Date;
  metadata: Record<string, any>;
  metrics: Record<string, number>;
  artifacts: ModelArtifact[];
  stageTransitions?: StageTransition[];
}

interface ModelArtifact {
  name: string;
  path: string;
  size: number;
  type: string;
  checksum: string;
}

interface StageTransition {
  fromStage: ModelStage;
  toStage: ModelStage;
  timestamp: Date;
  description: string;
}

interface ModelDeployment {
  id: string;
  modelName: string;
  version: string;
  config: ModelDeploymentConfig;
  status: DeploymentStatus;
  createdAt: Date;
  startedAt?: Date;
  endpoint: string;
  instances: number;
  resources: ResourceRequirements;
  health: DeploymentHealth;
}

interface ModelDeploymentConfig {
  endpoint: string;
  instances?: number;
  resources?: ResourceRequirements;
  allowNonProduction?: boolean;
  scaling?: AutoScalingConfig;
}

interface ResourceRequirements {
  cpu: string;
  memory: string;
  gpu?: string;
}

interface AutoScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
}

interface DeploymentHealth {
  status: 'healthy' | 'unhealthy' | 'initializing';
  lastCheck: Date;
  uptime: number;
  errorRate?: number;
  responseTime?: number;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'failed';
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  artifacts: ModelArtifact[];
}

interface ModelRegistrationRequest {
  name: string;
  description: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ModelVersionRequest {
  version?: string;
  description: string;
  source: string;
  tags?: string[];
  metadata?: Record<string, any>;
  metrics?: Record<string, number>;
  artifacts?: ModelArtifact[];
}

interface ModelFilter {
  tags?: string[];
  status?: ModelStatus;
  namePattern?: string;
}

interface DeploymentFilter {
  modelName?: string;
  status?: DeploymentStatus;
}

interface RegistryStats {
  totalModels: number;
  totalVersions: number;
  totalDeployments: number;
  runningDeployments: number;
  stageDistribution: Record<ModelStage, number>;
  registrySize: number;
}
