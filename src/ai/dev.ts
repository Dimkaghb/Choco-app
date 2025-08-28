import { config } from 'dotenv';
config();

import '@/ai/flows/respond-to-image-and-text.ts';
import '@/ai/flows/indicate-tool-use.ts';
import '@/ai/flows/agent-api.ts';