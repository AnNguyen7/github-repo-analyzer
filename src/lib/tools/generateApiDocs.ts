import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { API_DOCS_PROMPT } from '../prompts';
import { getFileContent } from '../github';

export const generateApiDocsParameters = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  files: z.array(z.string()).describe('List of all files in the repository'),
});

export async function generateApiDocsExecute({ 
  owner, 
  repo, 
  files 
}: z.infer<typeof generateApiDocsParameters>) {
  // Find code files to document (focusing on main source files)
  const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs'];
  const codeFiles = files.filter(f => {
    const ext = f.substring(f.lastIndexOf('.'));
    return codeExtensions.includes(ext) && 
           !f.includes('node_modules') && 
           !f.includes('test') &&
           !f.includes('spec') &&
           !f.includes('.d.ts');
  }).slice(0, 10); // Limit to prevent too many API calls

  // Fetch content of code files
  const codeContents: string[] = [];
  for (const file of codeFiles) {
    const content = await getFileContent(owner, repo, file);
    if (content) {
      codeContents.push(`\n--- ${file} ---\n${content.slice(0, 2000)}`); // Limit per file
    }
  }

  if (codeContents.length === 0) {
    return {
      success: false,
      error: 'No code files found to document',
    };
  }

  const prompt = API_DOCS_PROMPT.replace('{codeFiles}', codeContents.join('\n'));

  // Retry logic for reliability
  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
      });

      return {
        success: true,
        fileName: 'API_DOCS.md',
        content: text,
        filesDocumented: codeFiles,
      };
    } catch (error: unknown) {
      console.error(`API docs generation attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate API documentation';
        return { 
          success: false, 
          error: errorMessage 
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

export const generateApiDocsDescription = 'Generate API documentation for code files in the repository.';
