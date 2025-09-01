"use server";

import { sendToAgent, sendDirectMessage, createSimpleAgentInput, createMultiFileAgentInput } from "@/ai/flows/agent-api";
import { z } from "zod";

const sendMessageActionSchema = z.object({
  prompt: z.string(),
  image: z.instanceof(File).optional(), // Deprecated: use files instead
  files: z.array(z.instanceof(File)).optional(),
});

export async function sendMessageAction(formData: FormData) {
  // Get all files from FormData
  const allFiles: File[] = [];
  
  // Get the old image field for backward compatibility
  const imageFile = formData.get("image");
  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    allFiles.push(imageFile);
  }
  
  // Get all files from the files field
  const filesFromFormData = formData.getAll("files");
  // Filter to ensure we only get File objects, not strings
  const validFiles = filesFromFormData.filter((file): file is File => 
    file instanceof File && file.size > 0
  );
  allFiles.push(...validFiles);

  const validatedData = sendMessageActionSchema.safeParse({
    prompt: formData.get("prompt"),
    image: imageFile instanceof File ? imageFile : undefined,
    files: allFiles,
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

  const { prompt, files } = validatedData.data;

  try {
    // Create the agent input with the new API structure
    const agentInput = await createMultiFileAgentInput(
      prompt,
      files || [],
      {
        // You can add customer_id, session_id, etc. here if needed
        // customer_id: "some-customer-id",
        // session_id: "some-session-id",
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
export async function sendDirectMessageAction(prompt: string) {
  if (!prompt || prompt.trim().length === 0) {
    return {
      failure: {
        prompt: "Message cannot be empty",
      },
    };
  }

  try {
    const result = await sendDirectMessage(prompt);
    return { response: result.response };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "Could not get a response from the AI.";
    return { failure: { server: errorMessage } };
  }
}
