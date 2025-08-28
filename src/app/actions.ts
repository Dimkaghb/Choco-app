"use server";

import { sendToAgent, createSimpleAgentInput } from "@/ai/flows/agent-api";
import { z } from "zod";

const sendMessageActionSchema = z.object({
  prompt: z.string(),
  image: z.instanceof(File).optional(),
});

export async function sendMessageAction(formData: FormData) {
  const validatedData = sendMessageActionSchema.safeParse({
    prompt: formData.get("prompt"),
    image: formData.get("image"),
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

  const { prompt, image } = validatedData.data;

  try {
    // Create the agent input with the new API structure
    const agentInput = await createSimpleAgentInput(
      prompt,
      image && image.size > 0 ? image : undefined,
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
