'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FileAttachment } from '@/lib/types';
import { backendService } from '@/lib/backend-service';

export interface ProcessedDocument extends FileAttachment {
  chatId: string;
  processedContent?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  processedData?: any;
  timestamp: Date;
  source: 'chat' | 'sidebar';
}

interface DocumentContextType {
  documents: ProcessedDocument[];
  currentChatDocuments: ProcessedDocument[];
  uploadDocument: (file: File, chatId: string, source: 'chat' | 'sidebar') => Promise<ProcessedDocument>;
  removeDocument: (documentId: string) => void;
  setCurrentChatId: (chatId: string) => void;
  currentChatId: string | null;
  isProcessing: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const uploadDocument = async (file: File, chatId: string, source: 'chat' | 'sidebar'): Promise<ProcessedDocument> => {
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
      source
    };

    // Add document to state immediately
    setDocuments(prev => [...prev, newDocument]);

    // Process file if it's a data file
    const isDataFile = [
      '.csv', '.xlsx', '.xls', '.json', '.txt', '.log'
    ].some(ext => file.name.toLowerCase().endsWith(ext)) ||
    [
      'text/csv', 'application/json', 'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ].includes(file.type);

    if (isDataFile) {
      setIsProcessing(true);
      
      // Update status to processing
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, processingStatus: 'processing' as const }
          : doc
      ));

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
      } catch (error) {
        console.error('File processing failed:', error);
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, processingStatus: 'error' as const }
            : doc
        ));
      } finally {
        setIsProcessing(false);
      }
    } else {
      // For non-data files, mark as completed immediately
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, processingStatus: 'completed' as const }
          : doc
      ));
    }

    return newDocument;
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
    isProcessing
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