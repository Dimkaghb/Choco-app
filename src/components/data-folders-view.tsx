'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Folder, FileText, BarChart3, Upload, Edit2, Save, X, Database, Trash2, Files } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { backendService } from '@/lib/backend-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

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
  documents: Folder,
  reports: Folder,
  analytics: Folder,
};



export function DataFoldersView({ onFolderSelect }: DataFoldersViewProps) {
  const { token } = useAuth();
  const [folders, setFolders] = useState<DataFolder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'documents' | 'reports' | 'analytics'>('documents');
  const [editingFolder, setEditingFolder] = useState<DataFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [allKnowledgeBaseFiles, setAllKnowledgeBaseFiles] = useState<KnowledgeBaseFile[]>([]);
  const [isLoadingAllFiles, setIsLoadingAllFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [editSelectedFiles, setEditSelectedFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const { user } = useAuth();

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKnowledgeBaseFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !token) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload file using S3 flow
        const uploadedFile = await backendService.uploadFile(
          file, 
          token, 
          undefined, // no chat_id for knowledge base
          'Knowledge base document', // description
          ['knowledge-base'] // tags
        );
        return uploadedFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Add uploaded files to knowledge base list
      setKnowledgeBaseFiles(prev => [...prev, ...uploadedFiles]);
      
      toast.success(`Загружено ${uploadedFiles.length} файл(ов) в базу знаний`);
      
      // Clear the input
      event.target.value = '';
      
    } catch (error) {
      console.error('Error uploading files to knowledge base:', error);
      toast.error('Ошибка при загрузке файлов в базу знаний');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteKnowledgeBaseFile = async (fileId: string) => {
    if (!token) return;
    
    try {
      await backendService.deleteFile(fileId, token);
      setKnowledgeBaseFiles(prev => prev.filter(file => file.id !== fileId));
      toast.success('Документ удален из базы знаний');
    } catch (error) {
      console.error('Error deleting knowledge base file:', error);
      toast.error('Ошибка при удалении документа');
    }
  };

  const loadKnowledgeBaseFiles = async () => {
    if (!token) return;
    
    setIsLoadingAllFiles(true);
    try {
      // Load files tagged as knowledge-base
      const response = await backendService.listUserFiles(token, undefined, 1, 100);
      const kbFiles = response.files.filter((file: any) => 
        file.tags && file.tags.includes('knowledge-base')
      );
      setKnowledgeBaseFiles(kbFiles);
      setAllKnowledgeBaseFiles(kbFiles);
    } catch (error) {
      console.error('Error loading knowledge base files:', error);
    } finally {
      setIsLoadingAllFiles(false);
    }
  };

  const loadAllKnowledgeBaseFiles = async () => {
    await loadKnowledgeBaseFiles();
  };

  const loadKnowledgeBaseFilesForFolders = async () => {
    if (!token) return;
    
    setIsLoadingFiles(true);
    try {
      const response = await backendService.listUserFiles(token, undefined, 1, 100);
      
      if (response.files && Array.isArray(response.files)) {
        // Показать только файлы с description "Knowledge base document"
        const knowledgeBaseFiles: KnowledgeBaseFile[] = response.files
          .filter((file: any) => file.description === "Knowledge base document")
          .map((file: any) => ({
            id: file._id || file.id,
            filename: file.filename,
            size: file.file_size || file.size || 0,
            created_at: file.created_at || file.upload_date,
            content_type: file.content_type
          }));
        setKnowledgeBaseFiles(knowledgeBaseFiles);
      } else {
        setKnowledgeBaseFiles([]);
      }
    } catch (error) {
      console.error('Failed to load knowledge base files:', error);
      setKnowledgeBaseFiles([]);
    } finally {
      setIsLoadingFiles(false);
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

  const handleDeleteFolder = async () => {
    if (!editingFolder || !token) return;
    
    try {
      await backendService.deleteFolder(editingFolder.id, token);
      
      setFolders(prev => prev.filter(folder => folder.id !== editingFolder.id));
      
      setEditingFolder(null);
      setEditFolderName('');
      setEditSelectedFiles([]);
      setIsEditDialogOpen(false);
      
      toast.success('Папка удалена успешно');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Ошибка при удалении папки');
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
      loadAllKnowledgeBaseFiles();
    }
  }, [token]);

  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      loadKnowledgeBaseFilesForFolders();
    }
  }, [isCreateDialogOpen, isEditDialogOpen, user?.token]);

  useEffect(() => {
    loadKnowledgeBaseFiles();
  }, [token]);
  


  if (folders.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ваши <span className="text-gradient">папки с данными</span>
          </h2>
          <p className="text-gray-400 text-lg">У вас пока нет папок. Создайте первую папку для начала работы</p>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
          <Button
            onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
            className="button-gradient flex items-center space-x-2"
          >
            <Database className="h-5 w-5" />
            <span>Загрузить документы</span>
          </Button>
        </div>

        {showKnowledgeBase && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
            <div className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-3">
                <div className="text-sm text-gray-300">
                  Загрузите документы для улучшения ответов ИИ
                </div>
                <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json,.xml,.html,.rtf,.odt"
                    className="hidden"
                    id="knowledge-base-upload-empty"
                    onChange={handleKnowledgeBaseFileUpload}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="knowledge-base-upload-empty"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="text-gray-400">
                      {isUploading ? 'Загрузка файлов...' : 'Перетащите файлы сюда или нажмите для выбора'}
                    </div>
                  </label>
                  <Button 
                    variant="outline" 
                    type="button" 
                    disabled={isUploading}
                    onClick={() => document.getElementById('knowledge-base-upload-empty')?.click()}
                  >
                    {isUploading ? 'Загружается...' : 'Выбрать файлы'}
                  </Button>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h3 className="font-medium text-white">Загруженные документы</h3>
                <div className="border border-gray-600/50 rounded-lg">
                  <ScrollArea className="h-48">
                    <div className="p-4">
                      {knowledgeBaseFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Files className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Документы не найдены</p>
                          <p className="text-sm mt-1">Загрузите документы для создания базы знаний</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {knowledgeBaseFiles.map((file, index) => (
                            <div key={`kb-empty-${file.id || index}`} className="flex items-center justify-between p-3 border border-gray-600/50 rounded-lg hover:bg-gray-700/30">
                              <div className="flex items-center space-x-3">
                                <Files className="w-5 h-5 text-blue-400" />
                                <div>
                                  <p className="font-medium text-white">{file.filename}</p>
                                  <p className="text-sm text-gray-400">
                                    {formatFileSize(file.file_size || 0)} • {new Date(file.created_at).toLocaleDateString('ru-RU')}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKnowledgeBaseFile(file.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                title="Удалить документ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        )}

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
    <div className="p-6 max-h-screen overflow-y-auto">
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
                <Label htmlFor="folder-name-main" className="text-gray-300 font-medium">Название папки</Label>
                <Input
                  id="folder-name-main"
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
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleDeleteFolder}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border-red-400/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить папку
              </Button>
              <div className="flex space-x-3">
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
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => folders.length > 0 ? setIsUploadModalOpen(true) : setShowKnowledgeBase(!showKnowledgeBase)}
            className="button-gradient flex items-center space-x-2"
          >
            <Database className="h-5 w-5" />
            <span>Загрузить документы</span>
          </Button>
        </div>
        
        {folders.length === 0 && showKnowledgeBase && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-3">
                <div className="text-sm text-gray-300">
                  Загрузите документы для улучшения ответов ИИ
                </div>
                <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json,.xml,.html,.rtf,.odt"
                    className="hidden"
                    id="knowledge-base-upload"
                    onChange={handleKnowledgeBaseFileUpload}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="knowledge-base-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="text-gray-400">
                      {isUploading ? 'Загрузка файлов...' : 'Перетащите файлы сюда или нажмите для выбора'}
                    </div>
                  </label>
                  <Button 
                    variant="outline" 
                    type="button" 
                    disabled={isUploading}
                    onClick={() => document.getElementById('knowledge-base-upload')?.click()}
                  >
                    {isUploading ? 'Загружается...' : 'Выбрать файлы'}
                  </Button>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h3 className="font-medium text-white">Загруженные документы</h3>
                <div className="border border-gray-600/50 rounded-lg">
                  <ScrollArea className="h-48">
                    <div className="p-4">
                      {knowledgeBaseFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Files className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Документы не найдены</p>
                          <p className="text-sm mt-1">Загрузите документы для создания базы знаний</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {knowledgeBaseFiles.map((file, index) => (
                            <div key={`kb-${file.id || index}`} className="flex items-center justify-between p-3 border border-gray-600/50 rounded-lg hover:bg-gray-700/30">
                              <div className="flex items-center space-x-3">
                                <Files className="w-5 h-5 text-blue-400" />
                                <div>
                                  <p className="font-medium text-white">{file.filename}</p>
                                  <p className="text-sm text-gray-400">
                                    {formatFileSize(file.file_size || 0)} • {new Date(file.created_at).toLocaleDateString('ru-RU')}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKnowledgeBaseFile(file.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                title="Удалить документ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Upload Documents Modal - only when folders exist */}
      <Dialog open={isUploadModalOpen && folders.length > 0} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Загрузить документы
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Загрузите документы для улучшения ответов ИИ
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json,.xml,.html,.rtf,.odt"
                  className="hidden"
                  id="knowledge-base-upload-modal"
                  onChange={handleKnowledgeBaseFileUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="knowledge-base-upload-modal"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div className="text-muted-foreground">
                    {isUploading ? 'Загрузка файлов...' : 'Перетащите файлы сюда или нажмите для выбора'}
                  </div>
                </label>
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={isUploading}
                  onClick={() => document.getElementById('knowledge-base-upload-modal')?.click()}
                  className="mt-4"
                >
                  {isUploading ? 'Загружается...' : 'Выбрать файлы'}
                </Button>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-3">
              <h3 className="font-medium">Загруженные документы</h3>
              <div className="border rounded-lg">
                <ScrollArea className="h-64">
                  <div className="p-4">
                    {knowledgeBaseFiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Files className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Документы не найдены</p>
                        <p className="text-sm mt-1">Загрузите документы для создания базы знаний</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {knowledgeBaseFiles.map((file, index) => (
                          <div key={`kb-${file.id || index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <Files className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-medium">{file.filename}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(file.file_size || 0)} • {new Date(file.created_at).toLocaleDateString('ru-RU')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteKnowledgeBaseFile(file.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Удалить документ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => {
          const IconComponent = folderIcons[folder.type];
          
          return (
            <Card
              key={folder.id}
              className="folder-card group cursor-pointer"
              onClick={() => handleEditFolder(folder)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
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
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                     Папка
                   </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}