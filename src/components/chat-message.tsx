import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%] animate-in fade-in duration-300",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "p-3 rounded-lg",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-secondary text-secondary-foreground rounded-bl-none"
          )}
        >
          {message.image && (
            <div className="mb-2 rounded-md overflow-hidden">
              <Image
                src={message.image}
                alt="User uploaded image"
                width={300}
                height={200}
                className="object-cover"
                data-ai-hint="user image"
              />
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-3 rounded-full bg-current" />
              <Skeleton className="h-3 w-3 rounded-full bg-current animate-delay-150" />
              <Skeleton className="h-3 w-3 rounded-full bg-current animate-delay-300" />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        {!isLoading && (
          <p className="text-xs text-muted-foreground">
            {format(message.timestamp, "h:mm a")}
          </p>
        )}
      </div>
    </div>
  );
}
