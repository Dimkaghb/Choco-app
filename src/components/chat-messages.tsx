'use client';

import type { Message } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { useEffect, useRef } from 'react';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 h-full overflow-hidden" ref={scrollAreaRef}>
      <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-full">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <ChatMessage
            message={{
              id: 'loading',
              role: 'ai',
              content: '...',
              timestamp: new Date(),
            }}
            isLoading
          />
        )}
        {/* Spacer to ensure proper scrolling */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  );
}
