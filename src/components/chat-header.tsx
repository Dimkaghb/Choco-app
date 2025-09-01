import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { BotIcon } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function ChatHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-lg font-headline">ChocoAnalyze AI Помощник</p>
          <p className="text-sm text-muted-foreground">Онлайн</p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  );
}
