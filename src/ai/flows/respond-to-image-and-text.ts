'use server';
/**
 * @fileOverview An AI agent that can respond to questions about images and text.
 *
 * - respondToImageAndText - A function that handles the image and text question answering process.
 * - RespondToImageAndTextInput - The input type for the respondToImageAndText function.
 * - RespondToImageAndTextOutput - The return type for the respondToImageAndText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RespondToImageAndTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question about the image.'),
});
export type RespondToImageAndTextInput = z.infer<typeof RespondToImageAndTextInputSchema>;

const RespondToImageAndTextOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the image.'),
});
export type RespondToImageAndTextOutput = z.infer<typeof RespondToImageAndTextOutputSchema>;

export async function respondToImageAndText(input: RespondToImageAndTextInput): Promise<RespondToImageAndTextOutput> {
  return respondToImageAndTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'respondToImageAndTextPrompt',
  input: {schema: RespondToImageAndTextInputSchema},
  output: {schema: RespondToImageAndTextOutputSchema},
  prompt: `You are an AI assistant that can answer questions about images.

  The user will provide an image and a question about the image.
  You should answer the question based on the content of the image.

  Here is the image:
  {{media url=photoDataUri}}

  Here is the question:
  {{question}}
  `,
});

const respondToImageAndTextFlow = ai.defineFlow(
  {
    name: 'respondToImageAndTextFlow',
    inputSchema: RespondToImageAndTextInputSchema,
    outputSchema: RespondToImageAndTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
