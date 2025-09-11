import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { D3Visualization } from "./d3-visualization";
import { PlotlyChart } from './plotly-chart-wrapper';
import { FileAttachmentList } from "./file-attachment";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-2 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-6 w-6">
        <AvatarFallback>
          {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] animate-in fade-in duration-300 min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "p-2 sm:p-3 rounded-lg break-words overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-secondary text-secondary-foreground rounded-bl-none"
          )}
        >
          {/* Display file attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2">
              <FileAttachmentList 
                attachments={message.attachments} 
                size="md"
                maxDisplay={4}
              />
            </div>
          )}
          
          {/* Legacy image support for backward compatibility */}
          {message.image && (!message.attachments || message.attachments.length === 0) && (
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
            <>
              <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {message.content}
              </p>
              {message.visualization?.enabled && message.visualization.chartData && (
                <div className="mt-4 w-full overflow-hidden">
                  <D3Visualization 
                    chartData={message.visualization.chartData}
                    className="rounded-md border bg-background p-2 sm:p-4 max-w-full overflow-auto"
                  />
                </div>
              )}
              {message.plotlyChart && (
                <div className="mt-4 w-full overflow-hidden">
                  <PlotlyChart 
                    data={message.plotlyChart.data}
                    type={message.plotlyChart.type}
                    title={message.plotlyChart.title}
                    className="rounded-md border bg-background p-2 sm:p-4 max-w-full overflow-auto"
                  />
                </div>
              )}
            </>
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
