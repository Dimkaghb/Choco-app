'use client';

import { useState } from 'react';
import { sendMessageAction, sendDirectMessageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/lib/types';
import { backendService } from '@/lib/backend-service';
import { extractChartFromResponse, removeChartFromResponse } from '@/lib/chart-extractor';
import { ChatSidebar } from './chat-sidebar';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (formData: FormData) => {
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;
    const allFiles = formData.getAll('files') as File[];

    // Create attachments from files
    const attachments: Message['attachments'] = [];
    let imagePreviewUrl: string | undefined = undefined;
    
    // Collect all files (including legacy image field)
    const filesToProcess: File[] = [];
    
    // Process all files
    [...allFiles].forEach(file => {
      if (file && file.size > 0) {
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
      }
    });

    // Handle legacy image field
    if (imageFile && imageFile.size > 0 && attachments.length === 0) {
      imagePreviewUrl = URL.createObjectURL(imageFile);
      attachments.push({
        id: crypto.randomUUID(),
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
        url: imagePreviewUrl,
        isImage: true
      });
      filesToProcess.push(imageFile);
    }
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      image: imagePreviewUrl, // Keep for backward compatibility
      attachments,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let result: any;
    
    // Check if we have any files at all
    if (filesToProcess.length === 0) {
      // No files - send directly to AI API for fastest response
      result = await sendDirectMessageAction(prompt);
    } else {
      // Check if we have data files that need backend processing
      const dataFiles = filesToProcess.filter(file => 
        !file.type.startsWith('image/') || 
        file.name.toLowerCase().includes('.csv') ||
        file.name.toLowerCase().includes('.xlsx') ||
        file.name.toLowerCase().includes('.xls') ||
        file.name.toLowerCase().includes('.json') ||
        file.name.toLowerCase().includes('.txt')
      );
      
      if (dataFiles.length > 0) {
        // Use backend service for data file processing
        try {
          const backendResult = await backendService.processFile({
            file: dataFiles[0], // Process first data file
            prompt: prompt
            // Remove aiApiUrl to let backend use its default AI API endpoint
          });
          
          if (backendResult.success) {
            // Backend returns AI response in data field
            // Extract the actual response content from the AI API response
            let responseContent = '';
            
            if (typeof backendResult.data === 'string') {
              responseContent = backendResult.data;
            } else if (backendResult.data && typeof backendResult.data === 'object') {
              // Check for common response fields from AI API
              if (backendResult.data.response) {
                responseContent = backendResult.data.response;
              } else if (backendResult.data.answer) {
                responseContent = backendResult.data.answer;
              } else if (backendResult.data.message) {
                responseContent = backendResult.data.message;
              } else if (backendResult.data.text) {
                responseContent = backendResult.data.text;
              } else {
                // Fallback: stringify the entire object
                responseContent = JSON.stringify(backendResult.data);
              }
            } else {
              responseContent = String(backendResult.data || '');
            }
            
            result = {
              response: responseContent
            };
          } else {
            throw new Error(backendResult.error || 'Backend processing failed');
          }
        } catch (error) {
          console.error('Backend processing error:', error);
          // Fallback to regular action if backend fails
          result = await sendMessageAction(formData);
        }
      } else {
        // Use regular action for image-only messages
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
          messageContent = responseObj.answer;
        } else if (responseObj.message) {
          messageContent = responseObj.message;
        } else if (responseObj.text) {
          messageContent = responseObj.text;
        } else if (responseObj.content) {
          messageContent = responseObj.content;
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
          messageContent = parsedResponse.answer;
        } else if (parsedResponse.message) {
          messageContent = parsedResponse.message;
        } else if (parsedResponse.text) {
          messageContent = parsedResponse.text;
        } else if (parsedResponse.content) {
          messageContent = parsedResponse.content;
        } else {
          // If no specific content field found, use the original response
          // This avoids double-stringifying already processed content
          messageContent = result.response;
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
      role: 'ai',
      content: messageContent,
      timestamp: new Date(),
      visualization: visualizationData,
      plotlyChart: plotlyChartData,
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex md:w-80 lg:w-96 h-full">
        <ChatSidebar />
      </aside>
      <main className="flex flex-1 flex-col h-full">
        <ChatHeader />
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
