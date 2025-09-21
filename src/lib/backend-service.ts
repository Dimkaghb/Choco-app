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

export interface FileUploadRequest {
  filename: string;
  file_type: string;
  file_size: number;
  chat_id?: string;
  description?: string;
  tags?: string[];
}

export interface FileUploadResponse {
  upload_url: string;
  file_key: string;
  file_id: string;
  expires_in: number;
}

export interface FileMetadata {
  id: string;
  filename: string;
  file_key: string;
  file_type: string;
  file_size: number;
  user_id: string;
  chat_id?: string;
  description?: string;
  tags: string[];
  download_url: string;
  created_at: string;
  updated_at: string;
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
   * Create upload URL for file storage with metadata
   */
  async createUploadUrl(request: FileUploadRequest, authToken: string): Promise<FileUploadResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/files/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during upload URL creation');
    }
  }

  /**
   * Upload file to S3 using presigned URL
   */
  async uploadFileToS3(uploadUrl: string, file: File, contentType: string): Promise<void> {
    try {
      console.log('Uploading file to S3:', {
        filename: file.name,
        size: file.size,
        type: contentType,
        uploadUrl: uploadUrl.substring(0, 100) + '...'
      });
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error('S3 upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`S3 upload failed: HTTP ${response.status} - ${response.statusText}`);
      }
      
      console.log('S3 upload successful for:', file.name);
    } catch (error) {
      console.error('Error during S3 upload:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during S3 upload');
    }
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string, authToken: string): Promise<FileMetadata> {
    try {
      const response = await fetch(`${this.config.baseUrl}/files/metadata/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while getting file metadata');
    }
  }

  /**
   * List user files with optional chat filtering
   */
  async listUserFiles(authToken: string, chatId?: string, page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });
      
      if (chatId) {
        params.append('chat_id', chatId);
      }

      const response = await fetch(`${this.config.baseUrl}/files/list?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while listing files');
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/files/delete/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while deleting file');
    }
  }

  /**
   * Upload file through backend proxy to avoid CORS issues
   */
  async uploadFileProxy(file: File, authToken: string, chatId?: string, description?: string, tags?: string[]): Promise<FileMetadata> {
    try {
      console.log('Starting proxy file upload for:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      if (chatId) formData.append('chat_id', chatId);
      if (description) formData.append('description', description);
      if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));
      
      const response = await fetch(`${this.config.baseUrl}/files/proxy-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      const fileMetadata = await response.json();
      console.log('Proxy upload completed successfully:', fileMetadata.filename);
      return fileMetadata;
    } catch (error) {
      console.error('Error in proxy file upload:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during proxy file upload');
    }
  }

  /**
   * Complete file upload process: create upload URL, upload to S3, and return file metadata
   * Falls back to proxy upload if direct S3 upload fails
   */
  async uploadFile(file: File, authToken: string, chatId?: string, description?: string, tags?: string[]): Promise<FileMetadata> {
    try {
      console.log('Starting complete file upload process for:', file.name);
      
      // Try proxy upload first to avoid CORS issues
      console.log('Attempting proxy upload...');
      return await this.uploadFileProxy(file, authToken, chatId, description, tags);
      
    } catch (proxyError) {
      console.warn('Proxy upload failed, trying direct S3 upload:', proxyError);
      
      try {
        // Step 1: Create upload URL and metadata
        const uploadRequest: FileUploadRequest = {
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          chat_id: chatId,
          description,
          tags
        };

        console.log('Step 1: Creating upload URL and metadata...');
        const uploadResponse = await this.createUploadUrl(uploadRequest, authToken);
        console.log('Upload URL created successfully:', {
          file_id: uploadResponse.file_id,
          file_key: uploadResponse.file_key
        });

        // Step 2: Upload file to S3
        console.log('Step 2: Uploading file to S3...');
        await this.uploadFileToS3(uploadResponse.upload_url, file, file.type);
        console.log('File uploaded to S3 successfully');

        // Step 3: Get file metadata with download URL
        console.log('Step 3: Getting file metadata...');
        const fileMetadata = await this.getFileMetadata(uploadResponse.file_id, authToken);
        console.log('File metadata retrieved successfully:', fileMetadata.filename);

        return fileMetadata;
      } catch (directError) {
        console.error('Both proxy and direct upload failed');
        console.error('Proxy error:', proxyError);
        console.error('Direct error:', directError);
        throw new Error(`File upload failed. Proxy error: ${proxyError instanceof Error ? proxyError.message : 'Unknown'}. Direct error: ${directError instanceof Error ? directError.message : 'Unknown'}`);
      }
    }
  }

  /**
   * Get file content by file ID
   */
  async getFileContent(fileId: string, authToken: string): Promise<{content: string, filename: string, content_type: string}> {
    try {
      const response = await fetch(`${this.config.baseUrl}/files/content/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while getting file content');
    }
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