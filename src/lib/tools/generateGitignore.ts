import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { GITIGNORE_PROMPT } from '../prompts';

export const generateGitignoreParameters = z.object({
  language: z.string().nullable().describe('Primary programming language'),
  files: z.array(z.string()).describe('Current files in repository'),
});

export async function generateGitignoreExecute({ 
  language, 
  files 
}: z.infer<typeof generateGitignoreParameters>) {
  // Detect framework from files
  let framework = 'unknown';
  let packageManager = 'unknown';

  if (files.includes('package.json')) {
    packageManager = 'npm';
    if (files.some(f => f.includes('next.config'))) framework = 'Next.js';
    else if (files.includes('vite.config.ts') || files.includes('vite.config.js')) framework = 'Vite';
    else if (files.some(f => f.includes('angular.json'))) framework = 'Angular';
    else if (files.includes('vue.config.js')) framework = 'Vue';
    else framework = 'Node.js';
  } else if (files.includes('requirements.txt') || files.includes('setup.py')) {
    framework = 'Python';
    packageManager = 'pip';
  } else if (files.includes('Cargo.toml')) {
    framework = 'Rust';
    packageManager = 'cargo';
  } else if (files.includes('go.mod')) {
    framework = 'Go';
    packageManager = 'go mod';
  }

  const prompt = GITIGNORE_PROMPT
    .replace('{language}', language || 'Unknown')
    .replace('{framework}', framework)
    .replace('{packageManager}', packageManager)
    .replace('{files}', files.slice(0, 30).join(', '));

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    return {
      success: true,
      fileName: '.gitignore',
      content: text,
      detectedFramework: framework,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate .gitignore';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export const generateGitignoreDescription = 'Generate an appropriate .gitignore file based on the project type and language.';
