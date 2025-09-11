'use server';

/**
 * @fileOverview API integration flow for communicating with external AI agent endpoint.
 * 
 * - sendToAgent - A function that sends user messages to the external AI API and returns responses.
 * - SendToAgentInput - The input type for the sendToAgent function.
 * - SendToAgentOutput - The return type for the sendToAgent function.
 */

import { z } from 'zod';

// Define attachment types
const AttachmentSchema = z.object({
  type: z.enum(['image', 'video', 'file', 'audio']),
  url: z.string(),
  filename: z.string(),
  content_type: z.string(),
  size: z.number(),
  metadata: z.record(z.any()).optional(),
  alt_text: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(), // for video/audio
  transcript: z.string().optional(), // for audio
});

// Define message structure
const MessageSchema = z.record(z.any()); // Flexible structure for messages

// Main input schema matching the API structure
const SendToAgentInputSchema = z.object({
  customer_id: z.string().optional(),
  message: z.string().describe('The user message to send to the AI agent.'),
  messages: z.array(MessageSchema).optional(),
  audio: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  session_id: z.string().optional(),
  execution_mode: z.enum(['sync', 'async']).default('sync'),
  metadata: z.record(z.any()).optional(),
  with_tts: z.boolean().default(false),
});

export type SendToAgentInput = z.infer<typeof SendToAgentInputSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;

const SendToAgentOutputSchema = z.object({
  response: z.string().describe('The response from the AI agent.'),
});
export type SendToAgentOutput = z.infer<typeof SendToAgentOutputSchema>;

/**
 * Sends a message to the external AI agent API and returns the response.
 * Uses the VITE_API_URL environment variable for the base URL and sends to /agent/run endpoint.
 */
export async function sendToAgent(input: SendToAgentInput): Promise<SendToAgentOutput> {
  const baseUrl = process.env.VITE_API_URL;
  
  if (!baseUrl) {
    throw new Error('VITE_API_URL environment variable is not configured');
  }

  const apiUrl = `${baseUrl}/agent/run`;

  try {
    // Validate input - session_id should be provided by caller
    const validatedInput = SendToAgentInputSchema.parse(input);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedInput),
      // Increase timeout for long-running AI operations
      signal: AbortSignal.timeout(300000), // 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Debug: Log the actual API response structure
    console.log('AI API Response:', JSON.stringify(data, null, 2));
    
    // Return the full JSON response for processing in chat-ui.tsx
    // This allows the UI to handle both text content and visualization data
    const agentResponse = JSON.stringify(data);

    return {
      response: agentResponse,
    };
  } catch (error) {
    console.error('Error communicating with AI agent API:', error);
    
    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw new Error(`Failed to get response from AI agent: ${error.message}`);
    } else {
      throw new Error('Failed to get response from AI agent: Unknown error occurred');
    }
  }
}

/**
 * Sends a simple text message directly to the AI API without files.
 * This is optimized for fast responses when no file processing is needed.
 */
export async function sendDirectMessage(message: string, sessionId: string, options?: { rawResponse?: boolean }): Promise<SendToAgentOutput> {
  const baseUrl = process.env.VITE_API_URL;
  
  if (!baseUrl) {
    throw new Error('VITE_API_URL environment variable is not configured');
  }

  const apiUrl = `${baseUrl}/agent/run`;

  try {
    const requestData = {
      message,
      session_id: sessionId,
      execution_mode: 'sync' as const,
      with_tts: false,
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      // Increase timeout for long-running AI operations
      signal: AbortSignal.timeout(300000), // 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Debug: Log the actual API response structure
    console.log('AI API Response (sendDirectMessage):', JSON.stringify(data, null, 2));
    
    // If rawResponse is requested (for reports), return the data directly
    if (options?.rawResponse) {
      // Extract the actual content from the API response for reports
      const actualContent = data.content || data.response || data.message || data;
      return {
        response: typeof actualContent === 'string' ? actualContent : JSON.stringify(actualContent),
      };
    }
    
    // Return the full JSON response for processing in chat-ui.tsx
    // This allows the UI to handle both text content and visualization data
    const agentResponse = JSON.stringify(data);

    return {
      response: agentResponse,
    };
  } catch (error) {
    console.error('Error communicating with AI agent API:', error);
    
    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw new Error(`Failed to get response from AI agent: ${error.message}`);
    } else {
      throw new Error('Failed to get response from AI agent: Unknown error occurred');
    }
  }
}

/**
 * Helper function to create an attachment from a File object.
 * Converts the file to a base64 data URI and creates an attachment object.
 */
export async function createAttachmentFromFile(file: File): Promise<Attachment> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;
  
  // Determine attachment type based on MIME type
  let type: 'image' | 'video' | 'file' | 'audio' = 'file';
  if (file.type.startsWith('image/')) {
    type = 'image';
  } else if (file.type.startsWith('video/')) {
    type = 'video';
  } else if (file.type.startsWith('audio/')) {
    type = 'audio';
  }

  return {
    type,
    url: dataUri,
    filename: file.name,
    content_type: file.type,
    size: file.size,
    alt_text: file.name,
  };
}

/**
 * Helper function to convert a File object to base64 data URI format.
 * @deprecated Use createAttachmentFromFile instead for the new API structure.
 */
export async function fileToBase64DataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

/**
 * Helper function to create a simple API request with just a message and optional image attachment.
 * This is a convenience function for the common use case of sending a text message with an optional image.
 */
export async function createSimpleAgentInput(
  message: string, 
  imageFile?: File, 
  options?: {
    customer_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<SendToAgentInput> {
  const input: SendToAgentInput = {
    message,
    customer_id: options?.customer_id,
    session_id: options?.session_id,
    metadata: options?.metadata,
    execution_mode: 'sync',
    with_tts: false,
  };

  if (imageFile) {
    const attachment = await createAttachmentFromFile(imageFile);
    input.attachments = [attachment];
  }

  return input;
}

/**
 * Helper function to create an API request with a message and multiple file attachments.
 * This function supports any type of files, not just images.
 */
export async function createMultiFileAgentInput(
  message: string, 
  files: File[], 
  options?: {
    customer_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<SendToAgentInput> {
  const input: SendToAgentInput = {
    message,
    customer_id: options?.customer_id,
    session_id: options?.session_id,
    metadata: options?.metadata,
    execution_mode: 'sync',
    with_tts: false,
  };

  if (files && files.length > 0) {
    const attachments = await Promise.all(
      files.map(file => createAttachmentFromFile(file))
    );
    input.attachments = attachments;
  }

  return input;
}