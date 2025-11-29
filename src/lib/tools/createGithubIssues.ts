import { z } from 'zod';
import { createIssue } from '../github';

export const createGithubIssuesParameters = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  issues: z.array(z.object({
    title: z.string().describe('Issue title'),
    body: z.string().describe('Issue description'),
  })).describe('List of issues to create'),
});

export async function createGithubIssuesExecute({ 
  owner, 
  repo, 
  issues 
}: z.infer<typeof createGithubIssuesParameters>) {
  const createdIssues: Array<{ title: string; number: number; url: string }> = [];
  const errors: string[] = [];

  for (const issue of issues) {
    try {
      const created = await createIssue(owner, repo, issue.title, issue.body);
      createdIssues.push({
        title: issue.title,
        number: created.number,
        url: created.html_url,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to create issue "${issue.title}": ${errorMessage}`);
    }
  }

  return {
    success: errors.length === 0,
    createdIssues,
    errors,
    message: `Created ${createdIssues.length} of ${issues.length} issues`,
  };
}

export const createGithubIssuesDescription = 'Create GitHub issues for repository improvements. Requires GITHUB_TOKEN with repo write access.';
