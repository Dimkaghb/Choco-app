"use server";

import { indicateToolUse } from "@/ai/flows/indicate-tool-use";
import { respondToImageAndText } from "@/ai/flows/respond-to-image-and-text";
import { z } from "zod";

const fileToGenerativePart = async (file: File) => {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${base64}`;
};

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
    if (image && image.size > 0) {
      const photoDataUri = await fileToGenerativePart(image);
      const result = await respondToImageAndText({
        question: prompt,
        photoDataUri: photoDataUri,
      });
      return { response: result.answer };
    } else {
      const result = await indicateToolUse({ query: prompt });
      return { response: result.response };
    }
  } catch (e) {
    console.error(e);
    return { failure: { server: "Could not get a response from the AI." } };
  }
}
