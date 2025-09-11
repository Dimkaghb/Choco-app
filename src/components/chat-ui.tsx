'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendMessageAction, sendDirectMessageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Message, Chat, MessageCreate } from '@/lib/types';
import { backendService } from '@/lib/backend-service';
import { extractChartFromResponse, removeChartFromResponse } from '@/lib/chart-extractor';
import { ChatSidebar } from './chat-sidebar';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ContextSidebar } from './context-sidebar';
import { chatService } from '@/lib/chat-service';
import { useDocuments } from '@/contexts/document-context';
import { useChatStore } from '@/hooks/use-chat-store';

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isContextSidebarCollapsed, setIsContextSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const { uploadDocument, currentChatDocuments, setCurrentChatId: setDocumentChatId } = useDocuments();
  const { currentChat, setCurrentChat } = useChatStore();

  // Sync current chat with document context and chat store
  useEffect(() => {
    if (currentChatId && currentChat) {
      setDocumentChatId(currentChatId);
      setCurrentChat(currentChat);
    }
  }, [currentChatId, currentChat, setDocumentChatId, setCurrentChat]);

  const handleSendMessage = async (formData: FormData) => {
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;
    const allFiles = formData.getAll('files') as File[];

    // Create attachments from files
    const attachments: Message['attachments'] = [];
    let imagePreviewUrl: string | undefined = undefined;
    
    // Collect all files (including legacy image field)
    const filesToProcess: File[] = [];
    
    // Collect unique files (avoid duplicates between allFiles and imageFile)
    const uniqueFiles = new Map<string, File>();
    
    // Add files from allFiles array
    [...allFiles].forEach(file => {
      if (file && file.size > 0) {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        uniqueFiles.set(fileKey, file);
      }
    });
    
    // Add imageFile if it's not already in the collection
    if (imageFile && imageFile.size > 0) {
      const fileKey = `${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`;
      if (!uniqueFiles.has(fileKey)) {
        uniqueFiles.set(fileKey, imageFile);
      }
    }
    
    // Process unique files
    Array.from(uniqueFiles.values()).forEach(file => {
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');
      
      attachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        url,
        isImage
      });
      
      // Set first image as preview for backward compatibility
      if (isImage && !imagePreviewUrl) {
        imagePreviewUrl = url;
      }
      
      filesToProcess.push(file);
    });
    
    // Ensure we have a current chat before proceeding
    let chatId: string;
    try {
      chatId = await ensureCurrentChat(prompt);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive'
      });
      return;
    }

    // Upload files to document context
    for (const file of filesToProcess) {
      try {
        await uploadDocument(file, chatId, 'chat');
      } catch (error) {
        console.error('Failed to upload document to context:', error);
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      attachments,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let result: any;
    
    // Get session_id from current chat
    const sessionId = currentChat?.session_id;
    if (!sessionId) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить идентификатор сессии чата',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    // Check if we have any files at all
    if (filesToProcess.length === 0) {
      // No files - send directly to AI API for fastest response
      result = await sendDirectMessageAction(prompt, sessionId);
    } else {
      // Check if we have data files that need backend processing
      const dataFiles = filesToProcess.filter(file => 
        file.name.toLowerCase().endsWith('.csv') ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.name.toLowerCase().endsWith('.json') ||
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.log') ||
        file.type === 'text/csv' ||
        file.type === 'application/json' ||
        file.type === 'text/plain' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
      );
      
      if (dataFiles.length > 0) {
        // Process data files and extract content as text to send directly to AI API
        try {
          // Get file content as text
          const file = dataFiles[0];
          let fileContent = '';
          
          if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
            fileContent = await file.text();
          } else if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
            fileContent = await file.text();
          } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
            fileContent = await file.text();
          } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            // For Excel files, we still need backend processing
            const backendResult = await backendService.processFile({
              file: file,
              prompt: prompt
            });
            
            if (backendResult.success && backendResult.processed_data) {
              // Create enhanced prompt with processed data from backend
              const fileInfo = backendResult.file_info || {} as any;
              const processedData = backendResult.processed_data;
              
              const enhancedPrompt = `File Information:
- Filename: ${fileInfo.filename || file.name}
- Size: ${fileInfo.size || 0} bytes (${fileInfo.size_mb || 0} MB)
- Type: ${processedData.type || 'unknown'}

Data Analysis:
${JSON.stringify(processedData, null, 2)}

User Request:
${prompt}

Please analyze the provided data and respond to the user's request. The data has been processed and structured for your analysis.`;
              
              // Send enhanced prompt to AI API
            result = await sendDirectMessageAction(enhancedPrompt, sessionId);
            } else {
              throw new Error(backendResult.error || 'Backend processing failed');
            }
          } else {
            // For other data files, try to read as text
            fileContent = await file.text();
          }
          
          // If we have file content, create enhanced prompt and send directly to AI API
          if (fileContent && !result) {
            const enhancedPrompt = `File: ${file.name} (${file.type})\n\nFile Content:\n${fileContent}\n\nUser Request:\n${prompt}\n\nPlease analyze the provided file data and respond to the user's request.`;
            
            result = await sendDirectMessageAction(enhancedPrompt, sessionId);
          }
          
        } catch (error) {
          console.error('File processing error:', error);
          // Fallback to regular action if file processing fails
          formData.append('sessionId', sessionId);
          result = await sendMessageAction(formData);
        }
      } else {
        // Use regular action for image-only messages
        formData.append('sessionId', sessionId);
        result = await sendMessageAction(formData);
      }
    }

    setIsLoading(false);
    
    // Clean up object URLs
    attachments.forEach(attachment => {
      if (attachment.url) {
        URL.revokeObjectURL(attachment.url);
      }
    });

    if (result.failure) {
      const errorMsg = result.failure.server || result.failure.prompt || result.failure.image;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg || 'An unknown error occurred.',
      });
      // Optionally remove the user's message if submission failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      return;
    }

    // Parse the response to check for visualization data
    let parsedResponse: any = null;
    let messageContent = result.response;
    let visualizationData: Message['visualization'] = undefined;
    let plotlyChartData: Message['plotlyChart'] = undefined;

    // Try to parse the response as JSON first
    try {
      parsedResponse = JSON.parse(result.response);
      console.log('Parsed AI API response:', parsedResponse);
      
      // Handle nested response structure (response.answer, response.chart)
      if (parsedResponse.response && typeof parsedResponse.response === 'object') {
        const responseObj = parsedResponse.response;
        
        // Extract message content from response.answer
        if (responseObj.answer) {
          messageContent = typeof responseObj.answer === 'string' 
            ? responseObj.answer 
            : JSON.stringify(responseObj.answer);
        } else if (responseObj.message) {
          messageContent = typeof responseObj.message === 'string'
            ? responseObj.message
            : JSON.stringify(responseObj.message);
        } else if (responseObj.text) {
          messageContent = typeof responseObj.text === 'string'
            ? responseObj.text
            : JSON.stringify(responseObj.text);
        } else if (responseObj.content) {
          messageContent = typeof responseObj.content === 'string'
            ? responseObj.content
            : JSON.stringify(responseObj.content);
        }
        
        // Check for chart data in response.chart
        if (responseObj.visualization_needed && responseObj.chart) {
          const chartData = responseObj.chart;
          
          // Convert to plotlyChart format
          if (chartData.data && Array.isArray(chartData.data)) {
            plotlyChartData = {
              data: chartData.data.map((item: any) => ({
                label: item.label || item.name || String(item.x || item.category || 'Unknown'),
                value: item.value || item.y || 0
              })),
              type: chartData.type || 'bar',
              title: chartData.title
            };
          }
        }
      } else {
        // Handle flat response structure
        // Always prioritize 'answer' field for message content
        if (parsedResponse.answer) {
          messageContent = typeof parsedResponse.answer === 'string'
            ? parsedResponse.answer
            : JSON.stringify(parsedResponse.answer);
        } else if (parsedResponse.message) {
          messageContent = typeof parsedResponse.message === 'string'
            ? parsedResponse.message
            : JSON.stringify(parsedResponse.message);
        } else if (parsedResponse.text) {
          messageContent = typeof parsedResponse.text === 'string'
            ? parsedResponse.text
            : JSON.stringify(parsedResponse.text);
        } else if (parsedResponse.content) {
          messageContent = typeof parsedResponse.content === 'string'
            ? parsedResponse.content
            : JSON.stringify(parsedResponse.content);
        } else {
          // If no specific content field found, use the original response
          // This avoids double-stringifying already processed content
          messageContent = typeof result.response === 'string'
            ? result.response
            : JSON.stringify(result.response);
        }
        
        // Check for Plotly chart data
        const extractedChart = extractChartFromResponse(result.response);
        if (extractedChart) {
          plotlyChartData = extractedChart;
        }
        
        // Check for D3 visualization data
        if (parsedResponse.visualization === true && parsedResponse.chartData) {
          visualizationData = {
            enabled: true,
            chartData: parsedResponse.chartData
          };
        } else if (parsedResponse.visualization_needed && parsedResponse.chart) {
          visualizationData = {
            enabled: true,
            chartData: parsedResponse.chart
          };
        }
      }
    } catch (error) {
      // If parsing fails, try to extract Plotly chart from text
      const extractedChart = extractChartFromResponse(result.response);
      if (extractedChart) {
        plotlyChartData = extractedChart;
        messageContent = removeChartFromResponse(result.response);
      } else {
        // Treat as regular text response
        messageContent = result.response;
      }
      console.debug('Response is not JSON, treating as text:', error);
    }

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: messageContent,
      timestamp: new Date(),
      visualization: visualizationData,
      plotlyChart: plotlyChartData,
    };
    setMessages((prev) => [...prev, aiMessage]);
    
    // Save messages to current chat if one exists
    if (currentChatId) {
      try {
        // Save user message
        await chatService.addMessage(currentChatId, {
          role: 'user',
          content: prompt,
          attachments: attachments
        });
        
        // Save AI message
        await chatService.addMessage(currentChatId, {
          role: 'assistant',
          content: messageContent,
          attachments: [],
          visualization: visualizationData,
          // Convert plotlyChart (frontend) to plotly_chart (backend)
          plotly_chart: plotlyChartData
        } as any);
      } catch (error) {
        console.error('Failed to save messages to chat:', error);
        // Don't show error to user as the chat still works locally
      }
    }
  };

  const handleChatSelect = useCallback(async (chatId: string) => {
    if (!chatId || chatId === 'undefined') {
      console.error('Invalid chatId provided:', chatId);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Loading chat with ID:', chatId);
      const chatWithMessages = await chatService.getChat(chatId);
      console.log('Received chat data:', chatWithMessages);
      console.log('Messages count:', chatWithMessages.messages?.length || 0);
      
      setCurrentChatId(chatId);
      setCurrentChat(chatWithMessages);
      
      // Convert backend messages to frontend format
      const formattedMessages: Message[] = chatWithMessages.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        role: msg.role as 'user' | 'assistant',
        // Convert plotly_chart (backend) to plotlyChart (frontend)
        plotlyChart: (msg as any).plotly_chart || msg.plotlyChart
      }));
      
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чат',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleNewChat = useCallback(() => {
    setCurrentChatId(undefined);
    setCurrentChat(undefined);
    setMessages([]);
  }, []);

  // Auto-create chat when user sends first message in a new chat
  const ensureCurrentChat = useCallback(async (firstMessage: string): Promise<string> => {
    if (currentChatId) {
      return currentChatId;
    }
    
    try {
      // Create a new chat with a title based on the first message
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + '...'
        : firstMessage;
      
      const newChat = await chatService.createChat({ title });
      setCurrentChatId(newChat.id);
      setCurrentChat(newChat);
      
      // Trigger sidebar refresh by forcing a re-render
      // This will cause the sidebar to reload chats and show the new one
      window.dispatchEvent(new CustomEvent('chatCreated', { detail: newChat }));
      
      return newChat.id;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  }, [currentChatId]);

  return (
      <div className="flex h-screen w-full bg-background text-foreground relative overflow-hidden">
        {/* Left Sidebar - Hidden on mobile, shown on tablet+ */}
        <aside className="hidden md:flex md:w-64 lg:w-80 xl:w-96 h-full z-10 flex-shrink-0">
          <ChatSidebar 
            currentChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
          />
        </aside>
        
        {/* Main Chat Area - Full width on mobile, adjusted on desktop */}
        <main className={`flex flex-1 flex-col h-full min-w-0 transition-all duration-300 z-20 ${
          isContextSidebarCollapsed 
            ? 'mr-0 sm:mr-2 md:mr-16 lg:mr-20' 
            : 'mr-0 sm:mr-2 md:mr-80 lg:mr-80 xl:mr-96'
        }`}>
          <ChatHeader currentChat={currentChat} />
          <div className="flex-1 overflow-hidden px-2 sm:px-4">
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
          <div className="px-2 sm:px-4 pb-2 sm:pb-4">
            <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
          </div>
        </main>
        
        {/* Right Context Sidebar - Hidden on mobile and small tablets */}
        <ContextSidebar onCollapseChange={setIsContextSidebarCollapsed} />
      </div>
    );
}
