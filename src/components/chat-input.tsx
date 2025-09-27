'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { FileAttachment } from '@/lib/types';
import { FileAttachmentList } from './file-attachment';

interface ChatInputProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newAttachments: FileAttachment[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        const isImage = file.type.startsWith('image/');
        
        const attachment: FileAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url,
          isImage
        };
        
        newAttachments.push(attachment);
        
        // Maintain backward compatibility with image preview
        if (isImage && !imagePreview) {
          setImagePreview(url);
        }
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      const removedAttachment = prev.find(att => att.id === id);
      
      // Clean up object URL
      if (removedAttachment?.url) {
        URL.revokeObjectURL(removedAttachment.url);
      }
      
      // Update image preview if removed attachment was the preview
      if (removedAttachment?.url === imagePreview) {
        const nextImageAttachment = updated.find(att => att.isImage);
        setImagePreview(nextImageAttachment?.url || null);
      }
      
      return updated;
    });
  };

  const clearAllAttachments = () => {
    // Clean up all object URLs
    attachments.forEach(att => {
      if (att.url) {
        URL.revokeObjectURL(att.url);
      }
    });
    
    setAttachments([]);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get('prompt') as string;

    if (!prompt.trim() && attachments.length === 0) return;

    // Add all files to FormData with actual File objects from input
    const fileInput = fileInputRef.current;
    if (fileInput?.files) {
      for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]);
      }
    }

    await onSubmit(formData);
    formRef.current?.reset();
    clearAllAttachments();
  };

  return (
    <div className="p-1.5 sm:p-2 md:p-3 border-t border-border bg-background">
      <form ref={formRef} onSubmit={handleSubmit} className="relative">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                Прикрепленные файлы ({attachments.length})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllAttachments}
                className="text-xs h-6"
              >
                Очистить все
              </Button>
            </div>
            <FileAttachmentList
              attachments={attachments}
              onRemove={removeAttachment}
              isEditable={true}
              size="sm"
              maxDisplay={6}
            />
          </div>
        )}
        <Textarea
          name="prompt"
          placeholder="Спросите Freedom AI Analysis..."
          className="pr-12 sm:pr-16 md:pr-18 min-h-[30px] sm:min-h-[34px] resize-none text-xs sm:text-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          disabled={isLoading}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <input
            type="file"
            name="files"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileChange}
            disabled={isLoading}
          />
          {/* Hidden input for backward compatibility */}
          <input type="hidden" name="image" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Прикрепить файлы"
            className="h-6 w-6"
          >
            <Paperclip className="w-3 h-3" />
          </Button>
          <Button type="submit" size="icon" disabled={isLoading} className="h-6 w-6">
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </form>
    </div>
  );
}
