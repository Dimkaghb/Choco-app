'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FileAttachment } from '@/lib/types';
import { backendService, FileMetadata } from '@/lib/backend-service';
import { useAuth } from '@/hooks/use-auth';

export interface ProcessedDocument extends FileAttachment {
  chatId: string;
  processedContent?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  processedData?: any;
  timestamp: Date;
  source: 'chat' | 'sidebar';
  fileMetadata?: FileMetadata;
  storedInDatabase?: boolean;
}

interface DocumentContextType {
  documents: ProcessedDocument[];
  currentChatDocuments: ProcessedDocument[];
  uploadDocument: (file: File, chatId: string, source: 'chat' | 'sidebar', authToken?: string) => Promise<ProcessedDocument>;
  removeDocument: (documentId: string) => void;
  setCurrentChatId: (chatId: string) => void;
  currentChatId: string | null;
  isProcessing: boolean;
  loadChatFiles: (chatId: string, authToken?: string) => Promise<void>;
  isLoadingChatFiles: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Helper function to determine if file content should be loaded
const shouldLoadFileContent = (filename: string, contentType?: string): boolean => {
  const textExtensions = ['.txt', '.csv', '.json', '.log', '.md', '.xml', '.html', '.css', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.h'];
  const textContentTypes = [
    'text/plain', 'text/csv', 'application/json', 'text/markdown',
    'text/xml', 'text/html', 'text/css', 'application/javascript',
    'text/javascript', 'application/xml'
  ];
  
  // Check by file extension
  const hasTextExtension = textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  
  // Check by content type
  const hasTextContentType = contentType && textContentTypes.includes(contentType);
  
  // Also include Excel files for processing
  const isExcelFile = filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls') ||
    contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    contentType === 'application/vnd.ms-excel';
  
  return hasTextExtension || hasTextContentType || isExcelFile;
};

// Helper function to load file content via backend API
const loadFileContent = async (fileId: string, authToken: string): Promise<string> => {
  try {
    const result = await backendService.getFileContent(fileId, authToken);
    
    // Backend now processes Excel files and returns structured data
    return result.content;
  } catch (error) {
    console.error('Error loading file content via backend:', error);
    throw error;
  }
};

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingChatFiles, setIsLoadingChatFiles] = useState(false);
  const { user, token } = useAuth();

  // Filter documents for current chat
  const currentChatDocuments = documents.filter(doc => doc.chatId === currentChatId);

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocuments = localStorage.getItem('chat-documents');
    if (savedDocuments) {
      try {
        const parsed = JSON.parse(savedDocuments);
        setDocuments(parsed.map((doc: any) => ({
          ...doc,
          timestamp: new Date(doc.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load documents from localStorage:', error);
      }
    }
  }, []);

  // Save documents to localStorage whenever documents change
  useEffect(() => {
    localStorage.setItem('chat-documents', JSON.stringify(documents));
  }, [documents]);

  // Load files from S3 when chat changes
  useEffect(() => {
    if (currentChatId && token) {
      loadChatFiles(currentChatId, token);
    } else if (currentChatId && !token) {
      // Clear documents if no auth token but chat is selected
      setDocuments(prev => prev.filter(doc => doc.chatId !== currentChatId));
    }
  }, [currentChatId, token]);

  // Function to load files for a specific chat from S3
  const loadChatFiles = async (chatId: string, authToken?: string): Promise<void> => {
    if (!authToken) {
      console.warn('No auth token provided for loading chat files');
      return;
    }

    console.log('Loading files for chat:', chatId);
    setIsLoadingChatFiles(true);
    try {
      // Get files for this chat from backend
      const response = await backendService.listUserFiles(authToken, chatId, 1, 100);
      console.log('Backend response for chat files:', response);
      
      if (response.files && response.files.length > 0) {
        // Convert backend files to ProcessedDocument format
        const chatFiles: ProcessedDocument[] = await Promise.all(
          response.files.map(async (fileMetadata: any) => {
            const doc: ProcessedDocument = {
              id: fileMetadata._id || fileMetadata.id || crypto.randomUUID(),
              name: fileMetadata.filename,
              type: fileMetadata.content_type || 'application/octet-stream',
              size: fileMetadata.file_size,
              url: fileMetadata.download_url,
              isImage: fileMetadata.content_type?.startsWith('image/') || false,
              chatId: fileMetadata.chat_id,
              processingStatus: 'completed' as const,
              timestamp: new Date(fileMetadata.created_at),
              source: (fileMetadata.tags?.includes('sidebar') ? 'sidebar' : 'chat') as 'chat' | 'sidebar',
              fileMetadata: fileMetadata,
              storedInDatabase: true
            };

            // Load content for text-based files
            if (shouldLoadFileContent(fileMetadata.filename, fileMetadata.content_type)) {
              try {
                const content = await loadFileContent(fileMetadata._id || fileMetadata.id, authToken);
                doc.content = content;
                console.log(`Loaded content for file: ${fileMetadata.filename}`);
              } catch (error) {
                console.error(`Failed to load content for file ${fileMetadata.filename}:`, error);
                doc.content = 'Content not available';
              }
            }

            return doc;
          })
        );
        
        console.log('Converted chat files:', chatFiles);

        // Remove existing documents for this chat and add new ones
        setDocuments(prev => {
          const otherChatDocs = prev.filter(doc => doc.chatId !== chatId);
          const newDocs = [...otherChatDocs, ...chatFiles];
          console.log('Updated documents:', newDocs);
          return newDocs;
        });
      } else {
        // No files for this chat, remove any existing ones
        setDocuments(prev => prev.filter(doc => doc.chatId !== chatId));
      }
    } catch (error) {
      console.error('Failed to load chat files from S3:', error);
      // Don't clear existing documents on error, just log it
    } finally {
      setIsLoadingChatFiles(false);
    }
  };

  const uploadDocument = async (file: File, chatId: string, source: 'chat' | 'sidebar', authToken?: string): Promise<ProcessedDocument> => {
    // Check if document with same name, size and chatId already exists
    const existingDoc = documents.find(doc => 
      doc.name === file.name && 
      doc.size === file.size && 
      doc.chatId === chatId
    );
    
    if (existingDoc) {
      console.log('Document already exists, returning existing document:', existingDoc.name);
      return existingDoc;
    }
    
    const documentId = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    
    const newDocument: ProcessedDocument = {
      id: documentId,
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      isImage: file.type.startsWith('image/'),
      chatId,
      processingStatus: 'pending',
      timestamp: new Date(),
      source,
      storedInDatabase: false
    };

    // Add document to state immediately
    setDocuments(prev => [...prev, newDocument]);

    setIsProcessing(true);
    
    // Update status to processing
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, processingStatus: 'processing' as const }
        : doc
    ));

    try {
      let fileMetadata: FileMetadata | undefined;
      
      // Step 1: Upload file to S3 and store metadata if auth token is provided
      if (authToken) {
        try {
          fileMetadata = await backendService.uploadFile(
            file, 
            authToken, 
            chatId, 
            `Uploaded from ${source}`,
            [source, file.type.split('/')[0]]
          );
          
          // Update document with file metadata and load content if applicable
          let content: string | undefined;
          if (shouldLoadFileContent(file.name, file.type)) {
            try {
              content = await loadFileContent(fileMetadata.id, token);
              console.log(`Loaded content for uploaded file: ${file.name}`);
            } catch (error) {
              console.error(`Failed to load content for uploaded file ${file.name}:`, error);
              content = 'Content not available';
            }
          }
          
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { 
                  ...doc, 
                  fileMetadata,
                  storedInDatabase: true,
                  url: fileMetadata.download_url, // Use S3 download URL
                  content: content
                }
              : doc
          ));
        } catch (uploadError) {
          console.warn('File upload to S3 failed, continuing with local processing:', uploadError);
          // Continue with local processing even if S3 upload fails
        }
      }

      // Step 2: Process file if it's a data file
      const isDataFile = [
        '.csv', '.xlsx', '.xls', '.json', '.txt', '.log'
      ].some(ext => file.name.toLowerCase().endsWith(ext)) ||
      [
        'text/csv', 'application/json', 'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ].includes(file.type);

      if (isDataFile) {
        try {
          const result = await backendService.processFile({
            file,
            prompt: `Process this file: ${file.name}`
          });

          if (result.success && result.processed_data) {
            // Update document with processed content
            setDocuments(prev => prev.map(doc => 
              doc.id === documentId 
                ? { 
                    ...doc, 
                    processingStatus: 'completed' as const,
                    processedContent: JSON.stringify(result.processed_data),
                    processedData: result.processed_data
                  }
                : doc
            ));
          } else {
            throw new Error(result.error || 'Processing failed');
          }
        } catch (processingError) {
          console.error('File processing failed:', processingError);
          // Mark as completed even if processing fails, since file is uploaded
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, processingStatus: 'completed' as const }
              : doc
          ));
        }
      } else {
        // For non-data files, mark as completed
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, processingStatus: 'completed' as const }
            : doc
        ));
      }
    } catch (error) {
      console.error('Document upload failed:', error);
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, processingStatus: 'error' as const }
          : doc
      ));
    } finally {
      setIsProcessing(false);
    }

    // Get the final document state
    const finalDocument = documents.find(doc => doc.id === documentId) || newDocument;
    return finalDocument;
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => {
      const doc = prev.find(d => d.id === documentId);
      if (doc?.url) {
        URL.revokeObjectURL(doc.url);
      }
      return prev.filter(d => d.id !== documentId);
    });
  };

  const value: DocumentContextType = {
    documents,
    currentChatDocuments,
    uploadDocument,
    removeDocument,
    setCurrentChatId,
    currentChatId,
    isProcessing,
    loadChatFiles,
    isLoadingChatFiles
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}