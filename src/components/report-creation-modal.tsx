'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  FileText, 
  BarChart3, 
  Upload, 
  MessageSquare, 
  File,
  Trash2,
  Database,
  TrendingUp
} from 'lucide-react';
import { useDocuments } from '@/contexts/document-context';
import { useChatStore } from '@/hooks/use-chat-store';

interface ReportCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// CardSpotlight component from landing.tsx
const CardSpotlight = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-px bg-gradient-to-r from-primary/30 via-transparent to-primary/30 rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      <div className="relative bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 group-hover:border-white/15 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

export const ReportCreationModal = ({ isOpen, onClose }: ReportCreationModalProps) => {
  const [previewMode, setPreviewMode] = useState<'prompt' | 'file' | null>(null);
  const [promptText, setPromptText] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentChatDocuments } = useDocuments();
  const { currentChat } = useChatStore();

  // Mock data for analyses - replace with real data
  const mockAnalyses = [
    { id: '1', title: 'Анализ продаж Q4 2023', date: '2023-12-15', type: 'sales' },
    { id: '2', title: 'Пользовательская активность', date: '2023-12-10', type: 'users' },
    { id: '3', title: 'Финансовый отчет', date: '2023-12-05', type: 'finance' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    setAdditionalFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateReport = async () => {
    setIsLoading(true);
    
    try {
      // Here you would implement the actual report creation logic
      console.log('Creating report with:', {
        previewMode,
        promptText,
        additionalFiles,
        currentChatDocuments,
        currentChat
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Close modal after successful creation
      onClose();
    } catch (error) {
      console.error('Failed to create report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Report Creation Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="relative bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">
                Создание <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">отчета</span>
              </span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              Создать новый отчет
            </h2>
            <p className="text-gray-400 text-sm">
              Создайте детальный отчет на основе ваших данных и анализов
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Your Data Section */}
              <CardSpotlight>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Ваши данные</h3>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {currentChatDocuments.length > 0 ? (
                      currentChatDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <File className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-gray-400">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Нет данных</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardSpotlight>

              {/* Your Analyses Section */}
              <CardSpotlight>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Ваши анализы</h3>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {mockAnalyses.length > 0 ? (
                      mockAnalyses.map((analysis) => (
                        <div key={analysis.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{analysis.title}</p>
                            <p className="text-xs text-gray-400">{analysis.date}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Нет анализов</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardSpotlight>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Additional Data Section */}
              <CardSpotlight>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Дополнительные данные</h3>
                  </div>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full mb-4 bg-white/5 border-white/10 hover:bg-white/5 transition-all duration-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить файлы
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {additionalFiles.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {additionalFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                          <File className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            onClick={() => removeFile(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardSpotlight>

              {/* Preview Section */}
              <CardSpotlight>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Превью</h3>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => setPreviewMode(previewMode === 'prompt' ? null : 'prompt')}
                      variant={previewMode === 'prompt' ? 'default' : 'outline'}
                      className={previewMode === 'prompt' ? 'button-gradient' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Промт
                    </Button>
                    <Button
                      onClick={() => setPreviewMode(previewMode === 'file' ? null : 'file')}
                      variant={previewMode === 'file' ? 'default' : 'outline'}
                      className={previewMode === 'file' ? 'button-gradient' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                    >
                      <File className="w-4 h-4 mr-2" />
                      Превью файл
                    </Button>
                  </div>
                  
                  {previewMode === 'prompt' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="prompt" className="text-sm font-medium">
                        Описание отчета
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="Опишите, какой отчет вы хотите создать..."
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        className="min-h-[120px] bg-white/5 border-white/10 focus:border-primary/30 focus:ring-primary/10 resize-none"
                      />
                    </motion.div>
                  )}
                  
                  {previewMode === 'file' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-medium">
                        Загрузить файл для превью
                      </Label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/30 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400 mb-2">Перетащите файл сюда или</p>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/10 hover:bg-white/5"
                        >
                          Выберите файл
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardSpotlight>
            </div>
          </div>

          {/* Create Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleCreateReport}
              disabled={isLoading || (!previewMode && additionalFiles.length === 0)}
              className="px-12 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium transition-all duration-300 shadow-md hover:shadow-primary/15"
            >
              {isLoading ? 'Создание отчета...' : 'Создать отчет'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};