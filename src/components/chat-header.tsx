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
    <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-border">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-base sm:text-lg font-headline truncate">
            {currentChat ? currentChat.title : 'Freedom AI Analysis Помощник'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {currentChat 
              ? `Создан ${formatDate(currentChat.created_at.toString())}`
              : 'Онлайн'
            }
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="flex-shrink-0">
        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
}
