'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Folder, FileText, BarChart3, Upload, Edit2, Save, X, Trash2, Files, ChevronDown, ChevronRight, Download, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { backendService } from '@/lib/backend-service';
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


  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderFiles, setFolderFiles] = useState<{[folderId: string]: any[]}>({});
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadFolderFiles = async (folderId: string, fileIds: string[]) => {
    if (!token || fileIds.length === 0) return;
    
    setLoadingFiles(prev => new Set([...prev, folderId]));
    
    try {
      const files = await backendService.getMultipleFileMetadata(fileIds, token);
      setFolderFiles(prev => ({ ...prev, [folderId]: files }));
    } catch (error) {
      console.error('Error loading folder files:', error);
      toast.error('Ошибка загрузки файлов папки');
    } finally {
      setLoadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    }
  };

  const toggleFolderExpansion = async (folder: DataFolder) => {
    const isExpanded = expandedFolders.has(folder.id);
    
    if (isExpanded) {
      // Collapse folder
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folder.id);
        return newSet;
      });
    } else {
      // Expand folder
      setExpandedFolders(prev => new Set([...prev, folder.id]));
      
      // Load files if not already loaded
      if (!folderFiles[folder.id] && folder.fileIds && folder.fileIds.length > 0) {
        await loadFolderFiles(folder.id, folder.fileIds);
      }
    }
  };











  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !token) return;
    
    try {
      // First upload files if any are selected
      const uploadedFileIds: string[] = [];
      
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const uploadedFile = await backendService.uploadFile(
            file,
            token,
            undefined, // no chat_id for folder files
            `File for folder: ${newFolderName.trim()}`,
            ['folder-file']
          );
          return uploadedFile.id;
        });
        
        const fileIds = await Promise.all(uploadPromises);
        uploadedFileIds.push(...fileIds);
      }
      
      // Create folder with uploaded file IDs
      const newFolder = await backendService.createFolder(
        {
          name: newFolderName.trim(),
          type: newFolderType,
          fileIds: uploadedFileIds
        },
        token
      );
      
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setSelectedFiles([]);
      setIsCreateDialogOpen(false);
      
      toast.success(`Папка "${newFolderName.trim()}" создана успешно`);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Ошибка при создании папки');
    }
  };

  const handleEditFolder = (folder: DataFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditSelectedFiles([]); // Reset to empty since we're using file input now
    setIsEditDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!editingFolder || !editFolderName.trim() || !token) return;
    
    try {
      setIsUploading(true);
      setUploadProgress({});
      
      // First upload new files if any are selected
      const uploadedFileIds: string[] = [];
      
      if (editSelectedFiles.length > 0) {
        toast.info(`Загружаем ${editSelectedFiles.length} файл(ов)...`);
        
        // Upload files sequentially to avoid overwhelming the server
        for (let i = 0; i < editSelectedFiles.length; i++) {
          const file = editSelectedFiles[i];
          const progressKey = `${file.name}-${i}`;
          
          try {
            setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
            
            // Use the new uploadFileToFolder method
            const uploadedFile = await backendService.uploadFileToFolder(
              file,
              editingFolder.id,
              token,
              `File for folder: ${editFolderName.trim()}`,
              ['folder-file']
            );
            
            uploadedFileIds.push(uploadedFile.id);
            setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
            
            toast.success(`Файл "${file.name}" загружен успешно`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
            toast.error(`Ошибка загрузки файла "${file.name}"`);
            setUploadProgress(prev => ({ ...prev, [progressKey]: -1 })); // -1 indicates error
          }
        }
      }
      
      // Update folder name if it was changed
      if (editFolderName.trim() !== editingFolder.name) {
        const currentFileIds = editingFolder.fileIds || [];
        const allFileIds = [...currentFileIds, ...uploadedFileIds];
        
        const updatedFolder = await backendService.updateFolder(
          editingFolder.id,
          {
            name: editFolderName.trim(),
            fileIds: allFileIds
          },
          token
        );
        
        setFolders(prev => prev.map(folder => 
          folder.id === editingFolder.id ? updatedFolder : folder
        ));
      } else {
        // Just reload folders to get updated file counts
        await loadFolders();
      }
      
      setEditingFolder(null);
      setEditFolderName('');
      setEditSelectedFiles([]);
      setUploadProgress({});
      setIsEditDialogOpen(false);
      
      const successMessage = uploadedFileIds.length > 0 
        ? `Папка "${editFolderName.trim()}" обновлена и ${uploadedFileIds.length} файл(ов) загружено`
        : `Папка "${editFolderName.trim()}" обновлена успешно`;
      
      toast.success(successMessage);
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Ошибка при обновлении папки');
    } finally {
      setIsUploading(false);
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



  const handleFileSelection = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (token) {
      loadFolders();

    }
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



        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="button-gradient px-8 py-4 text-lg font-medium">
              <Plus className="mr-2 h-5 w-5" />
              Создать папку
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-glass">
            <DialogHeader>
              <DialogTitle className="text-white text-sm font-semibold">Создать новую папку</DialogTitle>
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
                  autoComplete="off"
                />
              </div>
              
              <div>
                <Label className="text-gray-300 font-medium">Файлы для папки</Label>
                <div className="mt-3">
                  <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json,.xml,.html,.rtf,.odt"
                      className="hidden"
                      id="folder-files-input"
                      onChange={(e) => handleFileSelection(e.target.files)}
                    />
                    <label
                      htmlFor="folder-files-input"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <div className="text-gray-400">
                        Перетащите файлы сюда или нажмите для выбора
                      </div>
                    </label>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => document.getElementById('folder-files-input')?.click()}
                      className="mt-3"
                    >
                      Выбрать файлы
                    </Button>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-400 font-medium">Выбранные файлы:</p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-400" />
                              <div>
                                <p className="text-sm text-white font-medium">{file.name}</p>
                                <p className="text-xs text-gray-400">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedFile(index)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
        <h2 className="text-xl font-bold text-white mb-3">
          Ваши <span className="text-gradient">папки с данными</span>
        </h2>
        <p className="text-gray-400 text-sm">Управляйте своими данными и документами</p>  
      </div>

      <div className="flex justify-center mb-8">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="button-gradient font-medium">
              <Plus className="mr-2 h-3 w-3" />
              Создать папку
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-glass">
            <DialogHeader>
              <DialogTitle className="text-white text-s font-semibold">Создать новую папку</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div>
                <Label htmlFor="folder-name-main" className="text-gray-300 text-sm font-medium">Название папки</Label>
                <Input
                  id="folder-name-main"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Введите название папки"
                  className="input-glass text-white placeholder-gray-400 mt-2"
                  autoComplete="off"
                />
              </div>
              
              <div>
                <Label className="text-gray-300 text-sm font-medium">Файлы для папки</Label>
                <div className="mt-3">
                  <div className="border-2 border-dashed border-gray-600/50 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json,.xml,.html,.rtf,.odt"
                      className="hidden"
                      id="folder-files-input-main"
                      onChange={(e) => handleFileSelection(e.target.files)}
                    />
                    <label
                      htmlFor="folder-files-input-main"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <div className="text-gray-400 text-sm">
                        Перетащите файлы сюда или нажмите для выбора
                      </div>
                    </label>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => document.getElementById('folder-files-input-main')?.click()}
                      className="mt-3 text-sm"
                    >
                      Выбрать файлы
                    </Button>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-400 font-medium">Выбранные файлы:</p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-3 w-3 text-blue-400" />
                              <div>
                                <p className="text-sm text-white font-medium">{file.name}</p>
                                <p className="text-xs text-gray-400">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedFile(index)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
            <DialogTitle className="text-white text-sm font-semibold flex items-center">
              <Edit2 className="mr-2 h-4 w-4" />
              Редактировать папку
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="edit-folder-name" className="text-gray-300 text-sm font-medium">Название папки</Label>
              <Input
                id="edit-folder-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Введите название папки"
                className="input-glass text-white placeholder-gray-400 mt-2 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-folder-files" className="text-gray-300 text-sm font-medium">Файлы папки</Label>
              <div className="mt-3">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                  <Upload className="mx-auto h-10 w-10 mb-3 text-gray-500" />
                  <p className="text-gray-300 text-sm font-medium mb-2">Загрузите файлы в папку</p>
                  <p className="text-sm text-gray-500 mb-4">Файлы будут добавлены в эту папку</p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setEditSelectedFiles(files);
                    }}
                    className="hidden"
                    id="edit-file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-file-input')?.click()}
                    className="button-secondary"
                  >
                    <Files className="mr-2 h-3 w-3" />
                    Выбрать файлы
                  </Button>
                </div>
                
                {editSelectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400 font-medium">Выбранные файлы:</p>
                    {editSelectedFiles.map((file, index) => {
                      const progressKey = `${file.name}-${index}`;
                      const progress = uploadProgress[progressKey];
                      const isUploaded = progress === 100;
                      const hasError = progress === -1;
                      const isUploading = progress !== undefined && progress >= 0 && progress < 100;
                      
                      return (
                        <div key={index} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className={`h-4 w-4 ${
                                isUploaded ? 'text-green-400' : 
                                hasError ? 'text-red-400' : 
                                isUploading ? 'text-yellow-400' : 'text-blue-400'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm text-white font-medium">{file.name}</p>
                                <p className="text-xs text-gray-400">
                                  {(file.size / 1024).toFixed(1)} KB
                                  {isUploaded && <span className="ml-2 text-green-400">✓ Загружено</span>}
                                  {hasError && <span className="ml-2 text-red-400">✗ Ошибка</span>}
                                  {isUploading && <span className="ml-2 text-yellow-400">Загружается...</span>}
                                </p>
                              </div>
                            </div>
                            {!isUploading && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                  // Clear progress for this file
                                  setUploadProgress(prev => {
                                    const newProgress = { ...prev };
                                    delete newProgress[progressKey];
                                    return newProgress;
                                  });
                                }}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {progress !== undefined && progress >= 0 && progress < 100 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{progress}%</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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





      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => {
          const IconComponent = folderIcons[folder.type];
          const isExpanded = expandedFolders.has(folder.id);
          const files = folderFiles[folder.id] || [];
          const isLoadingFiles = loadingFiles.has(folder.id);
          const hasFiles = folder.fileIds && folder.fileIds.length > 0;
          
          return (
            <Card
              key={folder.id}
              className="folder-card group "
            >
              <CardContent className="p-6"> 
                <div className="flex items-center justify-between mb-4 ">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                      <IconComponent className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-l group-hover:text-blue-100 transition-colors">{folder.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {folder.itemCount} {folder.itemCount === 1 ? 'элемент' : 'элементов'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasFiles && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFolderExpansion(folder);
                        }}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFolder(folder);
                      }}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* File List */}
                {isExpanded && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    {isLoadingFiles ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                        <span className="ml-2 text-gray-400 text-sm">Загрузка файлов...</span>
                      </div>
                    ) : files.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400 font-medium mb-3">Файлы в папке:</p>
                        <ScrollArea className="max-h-48">
                          {files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg mb-2">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-blue-400" />
                                <div className="flex-1">
                                  <p className="text-sm text-white font-medium truncate max-w-[200px]" title={file.filename}>
                                    {file.filename}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatFileSize(file.file_size)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(file.download_url, '_blank');
                                  }}
                                  className="text-gray-400 hover:text-blue-400 p-1"
                                  title="Скачать файл"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">В папке нет файлов</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}