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
  folder_id?: string;
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

export interface DataFolder {
  id: string;
  name: string;
  fileIds: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderRequest {
  name: string;
  fileIds: string[];
  type?: 'documents' | 'reports' | 'analytics';
}

export interface UpdateFolderRequest {
  name: string;
  fileIds: string[];
  type?: 'documents' | 'reports' | 'analytics';
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
    // Validate S3 URL
    if (!uploadUrl || !uploadUrl.startsWith('http')) {
      throw new Error('Invalid S3 upload URL provided');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Uploading file to S3 (attempt ${attempt}/${maxRetries}):`, {
          filename: file.name,
          size: file.size,
          type: contentType,
          uploadUrl: uploadUrl.substring(0, 100) + '...'
        });
        
        // Log detailed request information
        console.log('S3 Upload Request Details:', {
          method: 'PUT',
          contentType: contentType,
          fileType: file.type,
          fileSize: file.size,
          urlDomain: new URL(uploadUrl).hostname,
          urlProtocol: new URL(uploadUrl).protocol
        });
        
        // Shorter timeout for faster failure detection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Log response details
        console.log('S3 Upload Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          console.error('S3 upload failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            attempt,
            uploadUrl: uploadUrl.substring(0, 100) + '...',
            responseHeaders: Object.fromEntries(response.headers.entries())
          });
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`S3 upload failed: HTTP ${response.status} - ${response.statusText}. ${errorText}`);
          }
          
          throw new Error(`S3 upload failed: HTTP ${response.status} - ${response.statusText}`);
        }
        
        console.log('S3 upload successful for:', file.name);
        return; // Success, exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Enhanced error logging
        console.error(`S3 upload attempt ${attempt} failed:`, {
          error: lastError.message,
          errorName: lastError.name,
          errorStack: lastError.stack,
          filename: file.name,
          fileSize: file.size,
          contentType: contentType,
          uploadUrl: uploadUrl.substring(0, 100) + '...',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error(`File upload timed out after 30 seconds. Please try uploading a smaller file or check your internet connection.`);
          } else if (error.message.includes('Failed to fetch')) {
            lastError = new Error(`Network error: Unable to connect to file storage. Please check your internet connection and try again.`);
          }
        }
        
        // Don't retry on timeout or network errors on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // If all direct S3 attempts failed, try proxy upload as fallback
    console.log('Direct S3 upload failed, attempting proxy upload fallback...');
    throw lastError || new Error('S3 upload failed after all retry attempts');
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
   * Get multiple file metadata by IDs
   */
  async getMultipleFileMetadata(fileIds: string[], authToken: string): Promise<FileMetadata[]> {
    try {
      const promises = fileIds.map(fileId => this.getFileMetadata(fileId, authToken));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<FileMetadata> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error getting multiple file metadata:', error);
      return [];
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
   * Create a new data folder
   */
  async createFolder(request: CreateFolderRequest, authToken: string): Promise<DataFolder> {
    try {
      const response = await fetch(`${this.config.baseUrl}/folders/`, {
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
      throw new Error('Unknown error occurred while creating folder');
    }
  }

  /**
   * Update an existing data folder
   */
  async updateFolder(folderId: string, request: UpdateFolderRequest, authToken: string): Promise<DataFolder> {
    try {
      const response = await fetch(`${this.config.baseUrl}/folders/${folderId}`, {
        method: 'PUT',
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
      throw new Error('Unknown error occurred while updating folder');
    }
  }

  /**
   * Get all user folders
   */
  async getFolders(authToken: string): Promise<DataFolder[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/folders/`, {
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
      throw new Error('Unknown error occurred while getting folders');
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/folders/${folderId}`, {
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
      throw new Error('Unknown error occurred while deleting folder');
    }
  }

  /**
   * Upload file to a specific folder
   */
  async uploadFileToFolder(
    file: File, 
    folderId: string, 
    authToken: string, 
    description?: string, 
    tags?: string[]
  ): Promise<FileMetadata> {
    try {
      console.log('Starting folder file upload process for:', file.name, 'to folder:', folderId);
      
      // Try direct S3 upload first
      try {
        // Step 1: Create upload URL with folder_id
        const uploadRequest: FileUploadRequest = {
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          folder_id: folderId,
          description,
          tags
        };

        console.log('Step 1: Creating folder upload URL...');
        const response = await fetch(`${this.config.baseUrl}/folders/${folderId}/files/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(uploadRequest)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        const uploadResponse: FileUploadResponse = await response.json();
        console.log('Folder upload URL created successfully:', {
          file_id: uploadResponse.file_id,
          file_key: uploadResponse.file_key
        });

        // Step 2: Upload file to S3
        console.log('Step 2: Uploading file to S3...');
        await this.uploadFileToS3(uploadResponse.upload_url, file, file.type);
        console.log('File uploaded to S3 successfully');

        // Step 3: Complete the upload and add file to folder
        console.log('Step 3: Completing folder file upload...');
        const completeResponse = await fetch(
          `${this.config.baseUrl}/folders/${folderId}/files/${uploadResponse.file_id}/complete`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to complete upload: HTTP ${completeResponse.status}`);
        }

        // Step 4: Get file metadata
        console.log('Step 4: Getting file metadata...');
        const fileMetadata = await this.getFileMetadata(uploadResponse.file_id, authToken);
        console.log('Folder file upload completed successfully:', fileMetadata.filename);

        return fileMetadata;
        
      } catch (s3Error) {
        console.warn('Direct S3 upload failed, trying proxy upload fallback:', s3Error);
        
        // Fallback: Use proxy upload through backend
        return await this.uploadFileToFolderViaProxy(file, folderId, authToken, description, tags);
      }
    } catch (error) {
      console.error('Folder file upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload file to folder using proxy upload through backend (fallback method)
   */
  async uploadFileToFolderViaProxy(
    file: File, 
    folderId: string, 
    authToken: string, 
    description?: string, 
    tags?: string[]
  ): Promise<FileMetadata> {
    console.log('Using proxy upload for file:', file.name, 'to folder:', folderId);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);
    
    if (description) {
      formData.append('description', description);
    }
    
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    const response = await fetch(`${this.config.baseUrl}/folders/${folderId}/files/proxy-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
        // Don't set Content-Type header - let browser set it with boundary for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Proxy upload failed: HTTP ${response.status}: ${response.statusText}`);
    }

    const fileMetadata: FileMetadata = await response.json();
    console.log('Proxy upload completed successfully:', fileMetadata.filename);
    
    return fileMetadata;
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