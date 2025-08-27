'use client';

import { useState } from 'react';
import { sendMessageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/lib/types';
import { ChatSidebar } from './chat-sidebar';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (formData: FormData) => {
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;

    let imagePreviewUrl: string | undefined = undefined;
    if (imageFile && imageFile.size > 0) {
      imagePreviewUrl = URL.createObjectURL(imageFile);
    }
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      image: imagePreviewUrl,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const result = await sendMessageAction(formData);

    setIsLoading(false);
    
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (result.failure) {
      const errorMsg = result.failure.server || result.failure.prompt || result.failure.image;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg || 'An unknown error occurred.',
      });
      // Optionally remove the user's message if submission failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      return;
    }

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: result.response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex md:w-80 lg:w-96 h-full">
        <ChatSidebar />
      </aside>
      <main className="flex flex-1 flex-col h-full">
        <ChatHeader />
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
