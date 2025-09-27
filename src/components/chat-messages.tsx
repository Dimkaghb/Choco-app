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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1 h-full overflow-hidden" ref={scrollAreaRef}>
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 md:p-3 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isLoading={isLoading && index === messages.length - 1}
          />
        ))}
      </div>
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
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} className="h-1" />
    </ScrollArea>
  );
}
