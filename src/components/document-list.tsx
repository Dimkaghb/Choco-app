'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { ProcessedDocument } from '@/contexts/document-context';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DocumentListProps {
  documents: ProcessedDocument[];
  onRemove?: (documentId: string) => void;
  showSource?: boolean;
  showProcessingStatus?: boolean;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentList({
  documents,
  onRemove,
  showSource = true,
  showProcessingStatus = true,
  isEditable = true,
  size = 'md'
}: DocumentListProps) {
  const getStatusIcon = (status: ProcessedDocument['processingStatus']) => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (status) {
      case 'processing':
        return <Loader2 className={`${iconSize} animate-spin text-primary`} />;
      case 'completed':
        return <CheckCircle className={`${iconSize} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconSize} text-red-500`} />;
      case 'pending':
      default:
        return <FileText className={`${iconSize} text-muted-foreground`} />;
    }
  };

  const getStatusText = (status: ProcessedDocument['processingStatus']) => {
    switch (status) {
      case 'processing':
        return 'Обработка...';
      case 'completed':
        return 'Обработан';
      case 'error':
        return 'Ошибка обработки';
      case 'pending':
      default:
        return 'Ожидает обработки';
    }
  };

  const getSourceText = (source: ProcessedDocument['source']) => {
    return source === 'sidebar' ? 'Загружен из боковой панели' : 'Загружен из чата';
  };

  const handleDownload = (doc: ProcessedDocument) => {
    if (doc.url) {
      const link = window.document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Нет загруженных документов
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const containerClass = size === 'sm' 
          ? 'p-2 text-xs' 
          : size === 'lg' 
          ? 'p-4 text-base' 
          : 'p-3 text-sm';
        
        const buttonSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
        const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

        return (
          <div 
            key={doc.id} 
            className={`flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${containerClass}`}
          >
            {/* Status Icon */}
            {showProcessingStatus && (
              <div className="flex-shrink-0">
                {getStatusIcon(doc.processingStatus)}
              </div>
            )}

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">{doc.name}</p>
                {doc.isImage && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                    IMG
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                
                {showProcessingStatus && (
                  <>
                    <span>•</span>
                    <span>{getStatusText(doc.processingStatus)}</span>
                  </>
                )}
                
                {showSource && (
                  <>
                    <span>•</span>
                    <span>{getSourceText(doc.source)}</span>
                  </>
                )}
                
                <span>•</span>
                <span>{formatDistanceToNow(doc.timestamp, { addSuffix: true, locale: ru })}</span>
              </div>
              
              {/* Processed Data Info */}
              {doc.processedData && (
                <div className="mt-1 text-xs text-green-400">
                  Данные обработаны и готовы для анализа
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Download Button */}
              {doc.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className={`${buttonSize} p-0 hover:bg-blue-500/20 hover:text-blue-400`}
                  title="Скачать файл"
                >
                  <Download className={iconSize} />
                </Button>
              )}
              
              {/* Remove Button */}
              {isEditable && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(doc.id)}
                  className={`${buttonSize} p-0 hover:bg-red-500/20 hover:text-red-400`}
                  title="Удалить документ"
                >
                  <X className={iconSize} />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}