'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Settings, HelpCircle, ChevronLeft, ChevronRight, Upload, X, Loader2 } from 'lucide-react';
import { FileAttachment } from '@/lib/types';
import { DocumentList } from '@/components/document-list';
import { useDocuments } from '@/contexts/document-context';
import { useChatStore } from '@/hooks/use-chat-store';
import { ReportCreationModal } from '@/components/report-creation-modal';

interface ContextSidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export function ContextSidebar({ onCollapseChange }: ContextSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentChatDocuments, uploadDocument, removeDocument, setCurrentChatId, isProcessing } = useDocuments();
  const { currentChat } = useChatStore();

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  useEffect(() => {
    if (currentChat?.id) {
      setCurrentChatId(currentChat.id);
    }
  }, [currentChat?.id, setCurrentChatId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentChat?.id) return;

    for (const file of Array.from(files)) {
      try {
        await uploadDocument(file, currentChat.id, 'sidebar');
      } catch (error) {
        console.error('Failed to upload document:', error);
      }
    }

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveDocument = (id: string) => {
    removeDocument(id);
  };

  const handleDocumentsClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setActiveSection(activeSection === 'documents' ? null : 'documents');
  };

  const menuItems = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Документы',
      onClick: handleDocumentsClick,
      isActive: activeSection === 'documents'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Настройки',
      onClick: () => console.log('Настройки clicked'),
      isActive: false
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Помощь',
      onClick: () => console.log('Помощь clicked'),
      isActive: false
    }
  ];

  return (
    <div className={`fixed right-0 top-0 h-full z-50 transition-all duration-300 hidden lg:block ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Glass background with blur effect */}
      <div className="h-full bg-black/20 backdrop-blur-xl border-l border-white/10">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          {!isCollapsed && (
            <h3 className="text-base font-semibold text-foreground">Контекст</h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Menu items */}
        <div className="p-3 space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.onClick}
              className={`w-full justify-start gap-2 h-10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 ${
                isCollapsed ? 'px-2' : 'px-3'
              } ${item.isActive ? 'bg-white/10 text-foreground' : ''}`}
            >
              {item.icon}
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </Button>
          ))}
        </div>

        {/* Document Upload Section */}
        {!isCollapsed && activeSection === 'documents' && (
          <div className="flex-1 flex flex-col px-3 pb-3 space-y-3 min-h-0 overflow-hidden">
            {/* Upload Button */}
            <div className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-all duration-200 text-xs h-8"
                variant="outline"
              >
                <Upload className="w-3 h-3 mr-1" />
                Загрузить
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Documents List */}
            <div className="space-y-2 flex-1 min-h-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-foreground">Документы</h4>
                {isProcessing && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                )}
              </div>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-48">
                  <DocumentList
                    documents={currentChatDocuments}
                    onRemove={handleRemoveDocument}
                    showSource={true}
                    showProcessingStatus={true}
                    isEditable={true}
                    size="xs"
                  />
                  {currentChatDocuments.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      {currentChat ? 'Нет документов' : 'Выберите чат'}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        {/* Bottom section with report button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <Button
            className={`w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground font-medium transition-all duration-300 shadow-lg hover:shadow-primary/25 h-9 text-xs ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
            onClick={() => setIsReportModalOpen(true)}
          >
            {isCollapsed ? (
              <FileText className="w-4 h-4" />
            ) : (
              'Отчетность'
            )}
          </Button>
        </div>
      </div>
      
      {/* Report Creation Modal */}
      <ReportCreationModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />
    </div>
  );
}