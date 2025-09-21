"use server";

import { sendToAgent, sendDirectMessage, createSimpleAgentInput, createMultiFileAgentInput } from "@/ai/flows/agent-api";
import { z } from "zod";

const sendMessageActionSchema = z.object({
  prompt: z.string(),
  sessionId: z.string(),
});

export async function sendMessageAction(formData: FormData) {
  // Get all files from FormData
  const allFiles: File[] = [];
  
  // Get the old image field for backward compatibility
  const imageFile = formData.get("image");
  if (imageFile && typeof imageFile === 'object' && 'size' in imageFile && imageFile.size > 0) {
    allFiles.push(imageFile as File);
  }
  
  // Get all files from the files field
  const filesFromFormData = formData.getAll("files");
  // Filter to ensure we only get File objects, not strings
  const validFiles = filesFromFormData.filter((file): file is File => 
    typeof file === 'object' && file !== null && 'size' in file && (file as any).size > 0
  );
  allFiles.push(...validFiles);

  const validatedData = sendMessageActionSchema.safeParse({
    prompt: formData.get("prompt"),
    sessionId: formData.get("sessionId"),
  });

  if (!validatedData.success) {
    const error = validatedData.error.flatten();
    return {
      failure: {
        prompt: error.fieldErrors.prompt?.[0],
        image: error.fieldErrors.image?.[0],
      },
    };
  }

  const { prompt, sessionId } = validatedData.data;

  try {
    // Create the agent input with the new API structure
    const agentInput = await createMultiFileAgentInput(
      prompt,
      allFiles || [],
      {
        session_id: sessionId,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "chat-ui",
        },
      }
    );

    const result = await sendToAgent(agentInput);
    
    return { response: result.response };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "Could not get a response from the AI.";
    return { failure: { server: errorMessage } };
  }
}

/**
 * Optimized action for sending messages without files directly to AI API
 * Bypasses backend processing for faster responses
 */
export async function sendDirectMessageAction(prompt: string, sessionId: string, options?: { rawResponse?: boolean }) {
  if (!prompt || prompt.trim().length === 0) {
    return {
      failure: {
        prompt: "Message cannot be empty",
      },
    };
  }

  if (!sessionId) {
    return {
      failure: {
        prompt: "Session ID is required",
      },
    };
  }

  try {
    const result = await sendDirectMessage(prompt, sessionId, options);
    return { response: result.response };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "Could not get a response from the AI.";
    return { failure: { server: errorMessage } };
  }
}
