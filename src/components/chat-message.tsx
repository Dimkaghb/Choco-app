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
        "flex items-start gap-1.5 sm:gap-2 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
        <AvatarFallback>
          {isUser ? <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col gap-0.5 sm:gap-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] animate-in fade-in duration-300 min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "p-1.5 sm:p-2 rounded-lg break-words overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-secondary text-secondary-foreground rounded-bl-none"
          )}
        >
          {/* Display file attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-1.5">
              <FileAttachmentList 
                attachments={message.attachments} 
                size="sm"
                maxDisplay={4}
              />
            </div>
          )}
          
          {/* Legacy image support for backward compatibility */}
          {message.image && (!message.attachments || message.attachments.length === 0) && (
            <div className="mb-1.5 rounded-md overflow-hidden">
              <Image
                src={message.image}
                alt="User uploaded image"
                width={240}
                height={160}
                className="object-cover"
                data-ai-hint="user image"
              />
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center gap-1">
              <Skeleton className="h-2.5 w-2.5 rounded-full bg-current" />
              <Skeleton className="h-2.5 w-2.5 rounded-full bg-current animate-delay-150" />
              <Skeleton className="h-2.5 w-2.5 rounded-full bg-current animate-delay-300" />
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {message.content}
              </p>
              {message.visualization?.enabled && message.visualization.chartData && (
                <div className="mt-3 w-full overflow-hidden">
                  <D3Visualization 
                    chartData={message.visualization.chartData}
                    className="rounded-md border bg-background p-1.5 sm:p-3 max-w-full overflow-auto"
                  />
                </div>
              )}
              {message.plotlyChart && (
                <div className="mt-3 w-full overflow-hidden">
                  <PlotlyChart 
                    data={message.plotlyChart.data}
                    type={message.plotlyChart.type}
                    title={message.plotlyChart.title}
                    className="rounded-md border bg-background p-1.5 sm:p-3 max-w-full overflow-auto"
                  />
                  {message.plotlyChart.comment && (
                    <div className="mt-1.5 px-1.5 sm:px-3">
                      <p className="text-xs text-muted-foreground italic">
                        {message.plotlyChart.comment}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {message.charts && message.charts.length > 0 && (
                <div className="mt-3 w-full overflow-hidden space-y-3">
                  {message.charts.map((chart, index) => (
                    <div key={index} className="w-full">
                      <PlotlyChart 
                        data={chart.data}
                        type={chart.type}
                        title={chart.title}
                        className="rounded-md border bg-background p-1.5 sm:p-3 max-w-full overflow-auto"
                      />
                      {chart.comment && (
                        <div className="mt-1.5 px-1.5 sm:px-3">
                          <p className="text-xs text-muted-foreground italic">
                            {chart.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {!isLoading && (
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {format(message.timestamp, "h:mm a")}
          </p>
        )}
      </div>
    </div>
  );
}
