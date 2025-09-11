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
  const [reportReady, setReportReady] = useState(false);
  const [reportFilename, setReportFilename] = useState<string>('');
  const [reportProgress, setReportProgress] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentChatDocuments } = useDocuments();
  const { currentChat } = useChatStore();

  const pollJobStatus = async (jobId: string, filename: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/report/job-status/${jobId}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to check job status');
        }

        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          setReportFilename(filename);
          setReportReady(true);
          setReportProgress(100);
          setCurrentJobId('');
          
          // Show warnings if any
          if (statusData.warnings && statusData.warnings.length > 0) {
            const warningMessage = `Отчет создан успешно, но с предупреждениями:\n${statusData.warnings.join('\n')}`;
            console.warn('Report warnings:', statusData.warnings);
            alert(warningMessage);
          }
          
          return;
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.error_message || statusData.error || 'Report generation failed');
        } else if (statusData.status === 'processing') {
          setReportProgress(Math.min(90, (attempts / maxAttempts) * 100));
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }

    throw new Error('Report generation timed out');
  };

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
    setReportReady(false);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Prepare chat messages
      const messages = currentChat?.messages || [];
      
      // Prepare files content
      const filesContent = [];
      
      // Add current chat documents content
      for (const doc of currentChatDocuments) {
        try {
          // Check if we have already processed data from document context
          if (doc.processedData && doc.processingStatus === 'completed') {
            // Use the already processed data from document context
            const structuredContent = JSON.stringify(doc.processedData, null, 2);
            filesContent.push({
              name: doc.name,
              content: `Файл: ${doc.name}\nТип: ${doc.type || 'unknown'}\nРазмер: ${doc.size} bytes\nСтатус обработки: ${doc.processingStatus}\n\nОбработанные данные:\n${structuredContent}`
            });
          } else if (doc.processedContent) {
            // Use processed content if available
            filesContent.push({
              name: doc.name,
              content: `Файл: ${doc.name}\nТип: ${doc.type || 'unknown'}\nРазмер: ${doc.size} bytes\nСтатус обработки: ${doc.processingStatus}\n\nСодержимое:\n${doc.processedContent}`
            });
          } else {
            // If processing is still in progress or failed, include basic info
            const statusMessage = doc.processingStatus === 'processing' ? 'обрабатывается' : 
                                doc.processingStatus === 'error' ? 'ошибка обработки' : 'ожидает обработки';
            filesContent.push({
              name: doc.name,
              content: `Файл: ${doc.name}\nТип: ${doc.type || 'unknown'}\nРазмер: ${doc.size} bytes\nСтатус: ${statusMessage}`
            });
          }
        } catch (error) {
          console.warn(`Could not process file ${doc.name}:`, error);
          filesContent.push({
            name: doc.name,
            content: `File: ${doc.name}, Size: ${doc.size} bytes (processing error: ${error})`
          });
        }
      }
      
      // Add additional files content - use backend processing for structured analysis
      for (const file of additionalFiles) {
        try {
          // Check if this is a data file that should be processed by backend
          const isDataFile = file.name.toLowerCase().endsWith('.csv') ||
                           file.name.toLowerCase().endsWith('.xlsx') ||
                           file.name.toLowerCase().endsWith('.xls') ||
                           file.name.toLowerCase().endsWith('.json') ||
                           file.type === 'text/csv' ||
                           file.type === 'application/json' ||
                           file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                           file.type === 'application/vnd.ms-excel';
          
          if (isDataFile) {
            // Use backend service for structured data processing
            const { backendService } = await import('@/lib/backend-service');
            const processResult = await backendService.processFile({
              file: file,
              prompt: 'Extract and structure file content for analysis'
            });
            
            if (processResult.success && processResult.processed_data) {
              // Use the structured data from backend processing
              const structuredContent = JSON.stringify(processResult.processed_data, null, 2);
              filesContent.push({
                name: file.name,
                content: `Файл: ${file.name}\nТип: ${processResult.file_info?.content_type || file.type}\nРазмер: ${processResult.file_info?.size || file.size} bytes\n\nСтруктурированные данные:\n${structuredContent}`
              });
            } else {
              // Fallback to text reading if backend processing fails
              const content = await file.text();
              filesContent.push({
                name: file.name,
                content: `${content}\n\n(Note: Backend processing failed: ${processResult.error || 'unknown error'})`
              });
            }
          } else {
            // For non-data files, read as text
            const content = await file.text();
            filesContent.push({
              name: file.name,
              content: content
            });
          }
        } catch (error) {
          console.warn(`Could not read file ${file.name}:`, error);
          filesContent.push({
            name: file.name,
            content: `File: ${file.name}, Size: ${file.size} bytes (content could not be read: ${error})`
          });
        }
      }
      
      // Add custom prompt if provided
      const finalPrompt = promptText ? 
        `Создай детальный отчет. Дополнительные требования: ${promptText}` : 
        'Создай детальный отчет';
      
      // Step 1: Generate report configuration using VITE API (like chat messages)
      const { sendDirectMessageAction } = await import('@/app/actions');
      
      // Prepare the AI prompt with chat context and files
      let aiPrompt = `${finalPrompt}\n\nСообщения чата:\n`;
      
      // Add chat messages to prompt
      for (const msg of messages) {
        const role = msg.role || 'user';
        const content = msg.content || '';
        aiPrompt += `${role}: ${content}\n`;
      }
      
      // Add files content to prompt
      if (filesContent.length > 0) {
        aiPrompt += "\nСодержимое файлов:\n";
        for (const fileInfo of filesContent) {
          aiPrompt += `Файл ${fileInfo.name}:\n${fileInfo.content}\n\n`;
        }
      }
      
      aiPrompt += "\nСоздай JSON конфигурацию для Excel отчета на основе этих данных. Ответ должен содержать только валидный JSON без дополнительного текста.";
      
      // Send to VITE API with rawResponse option for reports
      const aiResponse = await sendDirectMessageAction(
        aiPrompt,
        currentChat?.id || 'report-generation',
        { rawResponse: true }
      );
      
      if (aiResponse.failure) {
        throw new Error(aiResponse.failure.server || aiResponse.failure.prompt || 'Failed to get AI response');
      }
      
      // Parse the AI response to extract JSON configuration
      let reportConfig;
      try {
        // With rawResponse option, we get the actual content directly
        reportConfig = JSON.parse(aiResponse.response);
      } catch (jsonError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            reportConfig = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            throw new Error('AI response does not contain valid JSON configuration');
          }
        } else {
          throw new Error('AI response does not contain JSON configuration');
        }
      }
      
      if (!reportConfig) {
        throw new Error('Failed to generate report configuration');
      }
      
      // Step 2: Generate Excel file from configuration
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `report_${timestamp}.xlsx`;
      
      const excelResponse = await fetch(`${API_BASE_URL}/report/generate-excel-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: reportConfig,
          filename: filename
        })
      });
      
      if (!excelResponse.ok) {
        throw new Error(`Failed to generate Excel file: ${excelResponse.statusText}`);
      }
      
      const excelData = await excelResponse.json();
      
      if (!excelData.success) {
        throw new Error('Failed to start report generation');
      }
      
      // Start polling for job status
      const jobId = excelData.job_id;
      await pollJobStatus(jobId, filename);
      
    } catch (error) {
      console.error('Failed to create report:', error);
      alert(`Ошибка создания отчета: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportFilename) return;
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const downloadUrl = `${API_BASE_URL}/report/download/${reportFilename}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = reportFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Ошибка при скачивании отчета');
    }
  };

  const handleCloseModal = () => {
    setReportReady(false);
    setReportFilename('');
    setPromptText('');
    setAdditionalFiles([]);
    setPreviewMode(null);
    setReportProgress(0);
    setCurrentJobId('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleCloseModal}
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
            onClick={handleCloseModal}
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

          {/* Create/Download Button */}
          <div className="mt-8 flex flex-col items-center gap-4">
            {reportReady ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-400 mb-2">Ваш отчет готов!</p>
                  <p className="text-sm text-gray-400">{reportFilename}</p>
                </div>
                <Button
                  onClick={handleDownloadReport}
                  className="px-12 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium transition-all duration-300 shadow-md hover:shadow-green-500/15"
                >
                  Скачать отчет
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {isLoading && reportProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Генерация отчёта</span>
                      <span>{Math.round(reportProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${reportProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleCreateReport}
                  disabled={isLoading}
                  className="px-12 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium transition-all duration-300 shadow-md hover:shadow-primary/15"
                >
                  {isLoading ? (reportProgress > 0 ? `Генерация отчёта... ${Math.round(reportProgress)}%` : 'Запуск генерации...') : 'Создать отчет'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};