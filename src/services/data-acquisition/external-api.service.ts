import { Logger } from '../../utils/logger.js';

export interface ExternalApiRequest {
  url: string;
  method?: string;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ExternalApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class ExternalApiService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ExternalApiService');
  }

  async makeRequest(request: ExternalApiRequest): Promise<ExternalApiResponse> {
    try {
      // Simple implementation using fetch
      const response = await fetch(request.url, {
        method: request.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(request.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      this.logger.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
