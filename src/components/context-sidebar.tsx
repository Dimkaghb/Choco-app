'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ContextSidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export function ContextSidebar({ onCollapseChange }: ContextSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const menuItems = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Документы',
      onClick: () => console.log('Документы clicked')
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Настройки',
      onClick: () => console.log('Настройки clicked')
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Помощь',
      onClick: () => console.log('Помощь clicked')
    }
  ];

  return (
    <div className={`fixed right-0 top-0 h-full z-40 transition-all duration-300 hidden md:block ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Glass background with blur effect */}
      <div className="h-full bg-black/20 backdrop-blur-xl border-l border-white/10">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!isCollapsed && (
            <h3 className="text-lg font-semibold text-foreground">Контекстное меню</h3>
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
        <div className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.onClick}
              className={`w-full justify-start gap-3 h-12 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 ${
                isCollapsed ? 'px-3' : 'px-4'
              }`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>

        {/* Bottom section with report button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Button
            className={`w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground font-medium transition-all duration-300 shadow-lg hover:shadow-primary/25 ${
              isCollapsed ? 'px-3' : 'px-6'
            }`}
            onClick={() => console.log('Создать отчетность clicked')}
          >
            {isCollapsed ? (
              <FileText className="w-5 h-5" />
            ) : (
              'Создать отчетность'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}