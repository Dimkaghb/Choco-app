/**
 * Backend service for file processing and AI communication
 */

export interface BackendConfig {
  baseUrl: string;
  timeout: number;
}

export interface ProcessFileRequest {
  file: File;
  prompt: string;
  aiApiUrl?: string;
}

export interface ProcessFileResponse {
  success: boolean;
  data?: any;
  error?: string;
  file_info?: {
    filename: string;
    content_type: string;
    size: number;
    size_mb: number;
  };
  processed_data?: {
    type: string;
    [key: string]: any;
  };
}

class BackendService {
  private config: BackendConfig;

  constructor(config: BackendConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: 180000  // Increased to 3 minutes
  }) {
    this.config = config;
  }

  /**
   * Process a file through the backend and get AI response
   */
  async processFile(request: ProcessFileRequest): Promise<ProcessFileResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('prompt', request.prompt);
    
    if (request.aiApiUrl) {
      formData.append('ai_api_url', request.aiApiUrl);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/file-processing/process-file`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      const result: ProcessFileResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - file processing took too long');
        }
        throw error;
      }
      throw new Error('Unknown error occurred during file processing');
    }
  }

  /**
   * Check if the backend is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,  
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get backend information
   */
  async getInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/`, {
        method: 'GET',
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Update backend configuration
   */
  updateConfig(newConfig: Partial<BackendConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const backendService = new BackendService();

// Export class for custom instances
export { BackendService };