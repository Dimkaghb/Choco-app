import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export function ChatSidebar() {
  return (
    <div className="flex flex-col h-full p-4 bg-background/50 border-r border-border">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <h1 className="text-xl font-bold font-headline">ChocoAnalyze AI</h1>
        <Button variant="ghost" size="icon">
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder="Поиск чатов..." className="pl-10" />
      </div>
      <div className="flex-1 mt-4">
        {/* Chat history would go here */}
        <p className="text-sm text-muted-foreground text-center mt-8">Нет недавних чатов</p>
      </div>
      <div className="pt-4 border-t border-border">
        {/* User profile or settings can go here */}
      </div>
    </div>
  );
}
