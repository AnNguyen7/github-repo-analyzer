import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { CONTRIBUTING_PROMPT } from '../prompts';

export const generateContributingParameters = z.object({
  repoName: z.string().describe('Repository name'),
  language: z.string().nullable().describe('Primary programming language'),
  files: z.array(z.string()).describe('List of files to detect testing/CI setup'),
});

export async function generateContributingExecute({ 
  repoName, 
  language, 
  files 
}: z.infer<typeof generateContributingParameters>) {
  const hasTests = files.some(f => 
    f.includes('test') || 
    f.includes('spec') || 
    f.includes('__tests__')
  );
  
  const hasCI = files.some(f => 
    f.includes('.github/workflows') || 
    f.includes('.travis.yml') || 
    f.includes('.circleci')
  );

  const prompt = CONTRIBUTING_PROMPT
    .replace('{repoName}', repoName)
    .replace('{language}', language || 'Unknown')
    .replace('{hasTests}', hasTests.toString())
    .replace('{hasCI}', hasCI.toString());

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    return {
      success: true,
      fileName: 'CONTRIBUTING.md',
      content: text,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate CONTRIBUTING.md';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export const generateContributingDescription = 'Generate a CONTRIBUTING.md file with guidelines for contributors.';
