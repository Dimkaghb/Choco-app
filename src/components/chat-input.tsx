'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';

interface ChatInputProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
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

    if (!prompt.trim() && !imagePreview) return;

    await onSubmit(formData);
    formRef.current?.reset();
    clearImage();
  };

  return (
    <div className="p-4 border-t border-border bg-background">
      <form ref={formRef} onSubmit={handleSubmit} className="relative">
        {imagePreview && (
          <div className="relative mb-2 w-32 h-24 rounded-md overflow-hidden border">
            <Image src={imagePreview} alt="Image preview" fill className="object-cover" data-ai-hint="image preview" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Textarea
          name="prompt"
          placeholder="Ask EchoAI..."
          className="pr-28 min-h-[48px] resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          disabled={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <input
            type="file"
            name="image"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
