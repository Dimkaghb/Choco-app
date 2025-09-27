import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { BotIcon } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Chat } from "@/lib/types";

interface ChatHeaderProps {
  currentChat?: Chat | null;
}

export function ChatHeader({ currentChat }: ChatHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-1.5 sm:p-2 md:p-3 border-b border-border">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm sm:text-base font-headline truncate">
            {currentChat ? currentChat.title : 'Freedom AI Analysis Помощник'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentChat 
              ? `Создан ${formatDate(currentChat.created_at.toString())}`
              : 'Онлайн'
            }
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="flex-shrink-0 h-7 w-7">
        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
}
