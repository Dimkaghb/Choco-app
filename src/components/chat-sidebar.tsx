'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, MessageSquare, Trash2, Edit2, MoreHorizontal, LogOut, User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Chat, ChatCreate } from "@/lib/types";
import { chatService } from "@/lib/chat-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const userChats = await chatService.getUserChats();
      setChats(userChats.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast.error('Не удалось загрузить чаты');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    
    // Listen for new chat creation events
    const handleChatCreated = (event: CustomEvent) => {
      const newChat = event.detail;
      if (newChat && newChat.id && newChat.title) {
        setChats(prev => [newChat, ...prev]);
      }
    };
    
    window.addEventListener('chatCreated', handleChatCreated as EventListener);
    
    return () => {
      window.removeEventListener('chatCreated', handleChatCreated as EventListener);
    };
  }, [loadChats]);

  const handleCreateChat = async () => {
    try {
      const newChatData: ChatCreate = {
        title: `Новый чат ${new Date().toLocaleDateString()}`
      };
      const newChat = await chatService.createChat(newChatData);
      
      if (newChat && newChat.id) {
        setChats(prev => [newChat, ...prev]);
        onChatSelect(newChat.id);
        onNewChat();
        toast.success('Новый чат создан');
      } else {
        console.error('Chat created but no ID returned:', newChat);
        toast.error('Чат создан, но произошла ошибка с ID');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Не удалось создать чат');
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        onNewChat();
      }
      toast.success('Чат удален');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Не удалось удалить чат');
    }
  };

  const handleEditChat = async (chatId: string, newTitle: string) => {
    try {
      const updatedChat = await chatService.updateChat(chatId, { title: newTitle });
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      setEditingChatId(null);
      toast.success('Название чата обновлено');
    } catch (error) {
      console.error('Failed to update chat:', error);
      toast.error('Не удалось обновить название чата');
    }
  };

  const startEditing = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const filteredChats = chats.filter(chat =>
    chat && chat.id && chat.title && chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="flex flex-col h-full p-3 bg-background/50 border-r border-border">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <h1 className="text-lg font-bold font-headline">Freedom AI Analysis</h1>
        <Button variant="ghost" size="icon" onClick={handleCreateChat}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Поиск чатов..." 
          className="pl-10" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <ScrollArea className="flex-1 mt-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-6">
            {searchQuery ? 'Чаты не найдены' : 'Нет недавних чатов'}
          </p>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                  currentChatId === chat.id && "bg-muted"
                )}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingChatId === chat.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleEditChat(chat.id, editTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditChat(chat.id, editTitle);
                          } else if (e.key === 'Escape') {
                            setEditingChatId(null);
                          }
                        }}
                        className="h-5 text-xs"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(chat.updated_at.toString())}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => startEditing(chat, e)}>
                      <Edit2 className="w-3 h-3 mr-2" />
                      Переименовать
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="pt-3 border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          {chats.length} {chats.length === 1 ? 'чат' : 'чатов'}
        </p>
        
        {/* User info and logout */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {user?.email || 'Пользователь'}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-3 h-3 mr-2" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
