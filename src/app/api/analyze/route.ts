import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { tools } from '@/lib/agent';
import { SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 60; // Allow longer execution for Vercel

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      maxToolRoundtrips: 10,
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
