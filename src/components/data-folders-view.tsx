'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Folder, FileText, BarChart3, Upload, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { backendService } from '@/lib/backend-service';

interface DataFolder {
  id: string;
  name: string;
  type: 'documents' | 'reports' | 'analytics';
  itemCount: number;
  lastModified: Date;
  fileIds?: string[];
}

interface DataFoldersViewProps {
  onFolderSelect?: (folderId: string) => void;
}

interface KnowledgeBaseFile {
  id: string;
  filename: string;
  size: number;
  created_at: string;
  content_type?: string;
}

const folderIcons = {
  documents: FileText,
  reports: BarChart3,
  analytics: Folder,
};



export function DataFoldersView({ onFolderSelect }: DataFoldersViewProps) {
  const [folders, setFolders] = useState<DataFolder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DataFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<DataFolder['type']>('documents');
  const [editFolderName, setEditFolderName] = useState('');
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<KnowledgeBaseFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [editSelectedFiles, setEditSelectedFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const { user, token } = useAuth();

  const loadFolders = async () => {
    if (!token) return;
    
    try {
      const foldersData = await backendService.getFolders(token);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
      setFolders([]);
    }
  };

  const loadKnowledgeBaseFiles = async () => {
    console.log('🔍 Starting loadKnowledgeBaseFiles...');
    console.log('👤 User exists:', !!user);
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token value:', token);
    
    if (!token) {
      console.log('❌ No token found, returning early');
      return;
    }
    
    setIsLoadingFiles(true);
    try {
      console.log('📡 Making API call to listUserFiles...');
      // Load files with pagination parameters like in chat-sidebar
      const response = await backendService.listUserFiles(token, undefined, 1, 100);
      console.log('📥 API Response received:', response);
      
      if (response.files && Array.isArray(response.files)) {
        console.log('📁 Total files received:', response.files.length);
        console.log('📋 Sample file structure:', response.files[0]);
        console.log('📋 All files:', response.files.map(f => ({ filename: f.filename, tags: f.tags })));
        
        // Filter files tagged as knowledge-base
        const kbFiles = response.files.filter((file: any) => {
          const hasKnowledgeBaseTag = file.tags && file.tags.includes('knowledge-base');
          console.log(`📄 File ${file.filename}: tags=${JSON.stringify(file.tags)}, hasKnowledgeBaseTag=${hasKnowledgeBaseTag}`);
          return hasKnowledgeBaseTag;
        });
        
        console.log('🏷️ Knowledge base files found:', kbFiles.length);
        
        // Временно показать все файлы для отладки
        if (kbFiles.length === 0) {
          console.log('⚠️ No knowledge-base files found, showing all files for debugging');
          const allFiles: KnowledgeBaseFile[] = response.files.map((file: any) => {
            const mappedFile = {
              id: file._id || file.id,
              filename: file.filename,
              size: file.file_size || file.size || 0,
              created_at: file.created_at || file.upload_date,
              content_type: file.content_type
            };
            console.log('🔄 Mapped file (all files):', mappedFile);
            return mappedFile;
          });
          setKnowledgeBaseFiles(allFiles);
          return;
        }
        
        const files: KnowledgeBaseFile[] = kbFiles.map((file: any) => {
          const mappedFile = {
            id: file._id || file.id,
            filename: file.filename,
            size: file.file_size || file.size || 0,
            created_at: file.created_at || file.upload_date,
            content_type: file.content_type
          };
          console.log('🔄 Mapped file:', mappedFile);
          return mappedFile;
        });
        
        console.log('✅ Setting knowledge base files:', files);
        setKnowledgeBaseFiles(files);
      } else {
        console.log('❌ No files array in response or response.files is not an array');
        setKnowledgeBaseFiles([]);
      }
    } catch (error) {
      console.error('❌ Failed to load knowledge base files:', error);
      setKnowledgeBaseFiles([]);
    } finally {
      setIsLoadingFiles(false);
      console.log('🏁 loadKnowledgeBaseFiles completed');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const newFolder = await backendService.createFolder(
        {
          name: newFolderName.trim(),
          type: newFolderType,
          fileIds: selectedFiles
        },
        token
      );
      
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setSelectedFiles([]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleEditFolder = (folder: DataFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditSelectedFiles(folder.fileIds || []);
    setIsEditDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;
    
    try {
      const updatedFolder = await backendService.updateFolder(
        editingFolder.id,
        {
          name: editFolderName.trim(),
          fileIds: editSelectedFiles
        },
        token
      );
      
      setFolders(prev => prev.map(folder => 
        folder.id === editingFolder.id ? updatedFolder : folder
      ));
      
      setEditingFolder(null);
      setEditFolderName('');
      setEditSelectedFiles([]);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating folder:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleEditFileSelection = (fileId: string, checked: boolean) => {
    setEditSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  };

  const handleFileSelection = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  };

  useEffect(() => {
    if (token) {
      loadFolders();
    }
  }, [token]);

  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      loadKnowledgeBaseFiles();
    }
  }, [isCreateDialogOpen, isEditDialogOpen, user?.token]);
  


  if (folders.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ваши <span className="text-gradient">папки с данными</span>
          </h2>
          <p className="text-gray-400 text-lg">У вас пока нет папок. Создайте первую папку для начала работы</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="button-gradient px-8 py-4 text-lg font-medium">
              <Plus className="mr-2 h-5 w-5" />
              Создать папку
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-glass">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Создать новую папку</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div>
                <Label htmlFor="folder-name" className="text-gray-300 font-medium">Название папки</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Введите название папки"
                  className="input-glass text-white placeholder-gray-400 mt-2"
                />
              </div>
              
              <div>
                <Label className="text-gray-300 font-medium">Файлы из базы знаний</Label>
                <div className="mt-3 max-h-60 overflow-y-auto checkbox-container rounded-lg">
                  {isLoadingFiles ? (
                    <div className="p-6 text-center text-gray-400">
                      <div className="loading-shimmer h-4 w-32 mx-auto mb-2 rounded"></div>
                      <p>Загрузка файлов...</p>
                    </div>
                  ) : knowledgeBaseFiles.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <Upload className="mx-auto h-10 w-10 mb-3 text-gray-500" />
                      <p className="font-medium">Загрузите файлы в базу знаний</p>
                      <p className="text-sm text-gray-500 mt-1">Файлы будут доступны для добавления в папки</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-gray-400 mb-3 font-medium">Доступные файлы в базе знаний:</p>
                      {knowledgeBaseFiles.map((file) => (
                        <div key={file.id} className="file-item flex items-center space-x-3 p-3 rounded-lg">
                          <Checkbox
                            id={file.id}
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                            className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate font-medium">{file.filename}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-400 font-medium">
                        Выбрано файлов: {selectedFiles.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="button-secondary"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="button-gradient font-medium"
                >
                  Создать
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Ваши <span className="text-gradient">папки с данными</span>
        </h2>
        <p className="text-gray-400 text-lg">Управляйте своими данными и документами</p>
      </div>

      <div className="flex justify-center mb-8">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="button-gradient font-medium">
              <Plus className="mr-2 h-4 w-4" />
              Создать папку
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-glass">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Создать новую папку</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div>
                <Label htmlFor="folder-name-2" className="text-gray-300 font-medium">Название папки</Label>
                <Input
                  id="folder-name-2"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Введите название папки"
                  className="input-glass text-white placeholder-gray-400 mt-2"
                />
              </div>
              
              <div>
                <Label className="text-gray-300 font-medium">Файлы из базы знаний</Label>
                <div className="mt-3 max-h-60 overflow-y-auto checkbox-container rounded-lg">
                  {isLoadingFiles ? (
                    <div className="p-6 text-center text-gray-400">
                      <div className="loading-shimmer h-4 w-32 mx-auto mb-2 rounded"></div>
                      <p>Загрузка файлов...</p>
                    </div>
                  ) : knowledgeBaseFiles.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <Upload className="mx-auto h-10 w-10 mb-3 text-gray-500" />
                      <p className="font-medium">Загрузите файлы в базу знаний</p>
                      <p className="text-sm text-gray-500 mt-1">Файлы будут доступны для добавления в папки</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-gray-400 mb-3 font-medium">Доступные файлы в базе знаний:</p>
                      {knowledgeBaseFiles.map((file) => (
                        <div key={file.id} className="file-item flex items-center space-x-3 p-3 rounded-lg">
                          <Checkbox
                            id={`file-2-${file.id}`}
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                            className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate font-medium">{file.filename}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-400 font-medium">
                        Выбрано файлов: {selectedFiles.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="button-secondary"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="button-gradient font-medium"
                >
                  Создать
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dialog-glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold flex items-center">
              <Edit2 className="mr-2 h-5 w-5" />
              Редактировать папку
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="edit-folder-name" className="text-gray-300 font-medium">Название папки</Label>
              <Input
                id="edit-folder-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Введите название папки"
                className="input-glass text-white placeholder-gray-400 mt-2"
              />
            </div>
            
            <div>
              <Label className="text-gray-300 font-medium">Файлы из базы знаний</Label>
              <div className="mt-3 max-h-60 overflow-y-auto checkbox-container rounded-lg">
                {isLoadingFiles ? (
                  <div className="p-6 text-center text-gray-400">
                    <div className="loading-shimmer h-4 w-32 mx-auto mb-2 rounded"></div>
                    <p>Загрузка файлов...</p>
                  </div>
                ) : knowledgeBaseFiles.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <Upload className="mx-auto h-10 w-10 mb-3 text-gray-500" />
                    <p className="font-medium">Загрузите файлы в базу знаний</p>
                    <p className="text-sm text-gray-500 mt-1">Файлы будут доступны для добавления в папки</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-gray-400 mb-3 font-medium">Доступные файлы в базе знаний:</p>
                    {knowledgeBaseFiles.map((file) => (
                      <div key={file.id} className="file-item flex items-center space-x-3 p-3 rounded-lg">
                        <Checkbox
                          id={`edit-file-${file.id}`}
                          checked={editSelectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => handleEditFileSelection(file.id, checked as boolean)}
                          className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate font-medium">{file.filename}</p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {editSelectedFiles.length > 0 && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-400 font-medium">
                      Выбрано файлов: {editSelectedFiles.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="button-secondary"
              >
                <X className="mr-2 h-4 w-4" />
                Отмена
              </Button>
              <Button
                onClick={handleSaveFolder}
                disabled={!editFolderName.trim()}
                className="button-gradient font-medium"
              >
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => {
          const IconComponent = folderIcons[folder.type];
          
          return (
            <div
              key={folder.id}
              className="folder-card group cursor-pointer"
              onClick={() => handleEditFolder(folder)}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <IconComponent className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg group-hover:text-blue-100 transition-colors">{folder.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {folder.itemCount} {folder.itemCount === 1 ? 'элемент' : 'элементов'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Тип: {folder.type === 'documents' ? 'Документы' : folder.type === 'reports' ? 'Отчеты' : 'Аналитика'}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}