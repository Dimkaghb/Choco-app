import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { BotIcon } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Chat } from "@/lib/types";

interface ChatHeaderProps {
  currentChat?: Chat;
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
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-lg font-headline">
            {currentChat ? currentChat.title : 'ChocoAnalyze AI Помощник'}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentChat 
              ? `Создан ${formatDate(currentChat.created_at.toString())}`
              : 'Онлайн'
            }
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  );
}
