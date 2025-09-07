'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat, Message } from '@/lib/types';

interface ChatStore {
  currentChat: Chat | null;
  chats: Chat[];
  setCurrentChat: (chat: Chat | null) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  clearChats: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentChat: null,
      chats: [],
      
      setCurrentChat: (chat) => {
        set({ currentChat: chat });
      },
      
      addChat: (chat) => {
        set((state) => ({
          chats: [...state.chats, chat],
          currentChat: chat
        }));
      },
      
      updateChat: (chatId, updates) => {
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.id === chatId ? { ...chat, ...updates } : chat
          ),
          currentChat: state.currentChat?.id === chatId 
            ? { ...state.currentChat, ...updates }
            : state.currentChat
        }));
      },
      
      removeChat: (chatId) => {
        set((state) => ({
          chats: state.chats.filter(chat => chat.id !== chatId),
          currentChat: state.currentChat?.id === chatId ? null : state.currentChat
        }));
      },
      
      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { ...chat, messages: [...(chat.messages || []), message] }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? { ...state.currentChat, messages: [...(state.currentChat.messages || []), message] }
            : state.currentChat
        }));
      },
      
      updateMessage: (chatId, messageId, updates) => {
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { 
                  ...chat, 
                  messages: (chat.messages || []).map(msg => 
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  )
                }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                messages: (state.currentChat.messages || []).map(msg => 
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              }
            : state.currentChat
        }));
      },
      
      removeMessage: (chatId, messageId) => {
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { 
                  ...chat, 
                  messages: (chat.messages || []).filter(msg => msg.id !== messageId)
                }
              : chat
          ),
          currentChat: state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                messages: (state.currentChat.messages || []).filter(msg => msg.id !== messageId)
              }
            : state.currentChat
        }));
      },
      
      clearChats: () => {
        set({ chats: [], currentChat: null });
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({ 
        chats: state.chats,
        currentChat: state.currentChat 
      })
    }
  )
);