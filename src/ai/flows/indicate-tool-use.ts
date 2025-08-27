'use server';

/**
 * @fileOverview Implements a Genkit flow that indicates when the AI chatbot is using external tools.
 *
 * - indicateToolUse - A function that handles the process of generating a response from the AI chatbot.
 * - IndicateToolUseInput - The input type for the indicateToolUse function.
 * - IndicateToolUseOutput - The return type for the indicateToolUse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IndicateToolUseInputSchema = z.object({
  query: z.string().describe('The user query.'),
});
export type IndicateToolUseInput = z.infer<typeof IndicateToolUseInputSchema>;

const IndicateToolUseOutputSchema = z.object({
  response: z.string().describe('The response from the AI chatbot.'),
});
export type IndicateToolUseOutput = z.infer<typeof IndicateToolUseOutputSchema>;

export async function indicateToolUse(input: IndicateToolUseInput): Promise<IndicateToolUseOutput> {
  return indicateToolUseFlow(input);
}

const indicateToolUsePrompt = ai.definePrompt({
  name: 'indicateToolUsePrompt',
  input: {schema: IndicateToolUseInputSchema},
  output: {schema: IndicateToolUseOutputSchema},
  prompt: `You are an AI chatbot. When you are using external tools, make sure to indicate it by including the word "tool" in your response.\n\nUser query: {{{query}}}`,
});

const indicateToolUseFlow = ai.defineFlow(
  {
    name: 'indicateToolUseFlow',
    inputSchema: IndicateToolUseInputSchema,
    outputSchema: IndicateToolUseOutputSchema,
  },
  async input => {
    const {output} = await indicateToolUsePrompt(input);
    return output!;
  }
);
