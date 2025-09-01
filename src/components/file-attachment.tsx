'use client';

import { FileAttachment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X, File, Image as ImageIcon, Video, Music, FileText, Archive } from 'lucide-react';
import Image from 'next/image';

interface FileAttachmentProps {
  attachment: FileAttachment;
  onRemove?: (id: string) => void;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('text') || type.includes('document')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileAttachmentComponent({ 
  attachment, 
  onRemove, 
  isEditable = false,
  size = 'md'
}: FileAttachmentProps) {
  const IconComponent = getFileIcon(attachment.type);
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  if (attachment.isImage && attachment.url) {
    return (
      <div className={`relative ${sizeClasses[size]} rounded-md overflow-hidden border bg-muted`}>
        <Image 
          src={attachment.url} 
          alt={attachment.name} 
          fill={true}
          className="object-cover" 
        />
        {isEditable && onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => onRemove(attachment.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
          {attachment.name}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} rounded-md border bg-muted p-2 flex flex-col items-center justify-center`}>
      {isEditable && onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6"
          onClick={() => onRemove(attachment.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <IconComponent className={`${iconSizes[size]} text-muted-foreground mb-1`} />
      
      <div className="text-center">
        <div className="text-xs font-medium truncate max-w-full px-1" title={attachment.name}>
          {attachment.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </div>
      </div>
    </div>
  );
}

interface FileAttachmentListProps {
  attachments: FileAttachment[];
  onRemove?: (id: string) => void;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

export function FileAttachmentList({ 
  attachments, 
  onRemove, 
  isEditable = false,
  size = 'md',
  maxDisplay
}: FileAttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const displayAttachments = maxDisplay ? attachments.slice(0, maxDisplay) : attachments;
  const remainingCount = maxDisplay && attachments.length > maxDisplay 
    ? attachments.length - maxDisplay 
    : 0;

  return (
    <div className="flex flex-wrap gap-2">
      {displayAttachments.map((attachment) => (
        <FileAttachmentComponent
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
          isEditable={isEditable}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <div className={`${sizeClasses[size]} rounded-md border bg-muted flex items-center justify-center`}>
          <div className="text-center text-sm text-muted-foreground">
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
}
