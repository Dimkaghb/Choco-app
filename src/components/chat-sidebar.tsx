'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, MessageSquare, Trash2, Edit2, MoreHorizontal, LogOut, User, Files, Database, FileText } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { backendService } from "@/lib/backend-service";

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onShowDataFolders: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, onShowDataFolders }: ChatSidebarProps) {
  const { user, logout, token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesStats, setFilesStats] = useState({ totalFiles: 0, totalSize: 0 });



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
        // Диспатчим событие для обновления сайдбара
        window.dispatchEvent(new CustomEvent('chatCreated', { detail: newChat }));
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

  const loadAllUserFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast.error('Токен авторизации не найден');
        return;
      }

      // Load all files without chat filter
      const response = await backendService.listUserFiles(token, undefined, 1, 100);
      
      setUserFiles(response.files || []);
      
      // Calculate statistics
      const totalFiles = response.files?.length || 0;
      const totalSize = response.files?.reduce((sum: number, file: any) => sum + (file.file_size || 0), 0) || 0;
      setFilesStats({ totalFiles, totalSize });
      
    } catch (error) {
      console.error('Error loading user files:', error);
      toast.error('Ошибка при загрузке файлов');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleShowAllFiles = () => {
    setIsFilesModalOpen(true);
    loadAllUserFiles();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Токен авторизации не найден');
        return;
      }

      await backendService.deleteFile(fileId, token);
      toast.success('Файл удален');
      
      // Reload files
      loadAllUserFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Ошибка при удалении файла');
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
    <div className="flex flex-col h-full w-64 min-w-64 max-w-64 p-3 bg-background/50 border-r border-border">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <h1 className="text-lg font-bold font-headline truncate flex-1 mr-2">Freedom AI Analysis</h1>
        <Button variant="ghost" size="icon" onClick={handleCreateChat} className="flex-shrink-0">
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
      
      {/* Knowledge Base Section */}
      <div className="mt-3 mb-3">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 h-9 text-sm"
          onClick={onShowDataFolders}
        >
          <Database className="w-4 h-4" />
          База знаний
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
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
                <div className="flex items-center space-x-2 flex-1 min-w-0 overflow-hidden pr-2">
                  <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden max-w-[160px]">
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
                        className="h-5 text-xs w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate w-full" title={chat.title}>{chat.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
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
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
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
          {filteredChats.length} {filteredChats.length === 1 ? 'чат' : 'чатов'}
        </p>
        
        {/* User info and logout */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate" title={user?.email || 'Пользователь'}>
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
              <DropdownMenuItem onClick={handleShowAllFiles}>
                <Files className="w-3 h-3 mr-2" />
                Мои файлы
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Всего файлов: ${filesStats.totalFiles}\nОбщий размер: ${formatFileSize(filesStats.totalSize)}`)}>                <Database className="w-3 h-3 mr-2" />                Статистика данных              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-3 h-3 mr-2" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Files Modal */}
      <Dialog open={isFilesModalOpen} onOpenChange={setIsFilesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Files className="w-5 h-5" />
              Мои файлы
              <span className="text-sm text-muted-foreground ml-2">
                ({filesStats.totalFiles} файлов, {formatFileSize(filesStats.totalSize)})
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full">

            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Загрузка файлов...</span>
              </div>
            ) : userFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Files className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>У вас пока нет загруженных файлов</p>
                <Button 
                  onClick={loadAllUserFiles} 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                >
                  🔄 Обновить список
                </Button>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {userFiles.map((file, index) => (
                    <div key={`${file._id || 'file'}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Files className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.file_size || 0)}</span>
                            <span>{new Date(file.created_at).toLocaleDateString('ru-RU')}</span>
                            {file.chat_id && (
                              <span className="px-2 py-1 bg-primary/10 rounded text-primary">
                                Чат: {file.chat_id.slice(-8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {file.download_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.download_url, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file._id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      

    </div>
  );
}
