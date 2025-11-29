import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { README_PROMPT } from '../prompts';

export const generateReadmeParameters = z.object({
  repoName: z.string().describe('Repository name'),
  description: z.string().nullable().describe('Repository description'),
  language: z.string().nullable().describe('Primary programming language'),
  files: z.array(z.string()).describe('List of files in repository'),
  keyFilesContent: z.record(z.string(), z.string()).describe('Content of key files like package.json'),
});

export async function generateReadmeExecute({ 
  repoName, 
  description, 
  language, 
  files, 
  keyFilesContent 
}: z.infer<typeof generateReadmeParameters>) {
  // Build context for README generation
  const fileTree = files.slice(0, 50).join('\n'); // Limit to prevent token overflow
  
  let dependencies = '';
  if (keyFilesContent['package.json']) {
    try {
      const pkg = JSON.parse(keyFilesContent['package.json']);
      dependencies = JSON.stringify({
        dependencies: pkg.dependencies,
        devDependencies: pkg.devDependencies,
      }, null, 2);
    } catch {
      dependencies = 'Could not parse package.json';
    }
  }

  const prompt = README_PROMPT
    .replace('{repoName}', repoName)
    .replace('{description}', description || 'No description provided')
    .replace('{language}', language || 'Unknown')
    .replace('{dependencies}', dependencies)
    .replace('{fileTree}', fileTree)
    .replace('{keyFilesContent}', JSON.stringify(keyFilesContent).slice(0, 2000));

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    return {
      success: true,
      fileName: 'README.md',
      content: text,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate README';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export const generateReadmeDescription = 'Generate a comprehensive README.md file for the repository based on its structure and content.';
