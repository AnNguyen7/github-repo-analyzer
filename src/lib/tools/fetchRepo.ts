import { z } from 'zod';
import { parseGitHubUrl, getRepoInfo, getRepoTree, getFileContent } from '../github';

interface TreeItem {
  path?: string;
  type?: string;
}

export const fetchRepoParameters = z.object({
  repoUrl: z.string().describe('The GitHub repository URL (e.g., https://github.com/owner/repo)'),
});

export async function fetchRepoExecute({ repoUrl }: z.infer<typeof fetchRepoParameters>) {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return { error: 'Invalid GitHub URL' };
    }

    const { owner, repo } = parsed;

    try {
      // Fetch repo metadata
      const repoInfo = await getRepoInfo(owner, repo);
      
      // Fetch file tree
      const tree = await getRepoTree(owner, repo);
      const files = tree
        .filter((item: TreeItem) => item.type === 'blob')
        .map((item: TreeItem) => item.path || '');

      // Identify key files to read
      const keyFiles = [
        'package.json',
        'README.md',
        'readme.md',
        '.gitignore',
        'LICENSE',
        'CONTRIBUTING.md',
        'requirements.txt',
        'setup.py',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
      ];

      const keyFilesContent: Record<string, string> = {};
      
      for (const file of keyFiles) {
        if (files.includes(file)) {
          const content = await getFileContent(owner, repo, file);
          if (content) {
            keyFilesContent[file] = content;
          }
        }
      }

      // Check what's missing
      const hasReadme = files.some((f: string) => f.toLowerCase() === 'readme.md');
      const hasGitignore = files.includes('.gitignore');
      const hasLicense = files.some((f: string) => f.toLowerCase().startsWith('license'));
      const hasContributing = files.some((f: string) => f.toLowerCase() === 'contributing.md');

      return {
        success: true,
        owner,
        repo,
        metadata: {
          name: repoInfo.name,
          description: repoInfo.description,
          language: repoInfo.language,
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          defaultBranch: repoInfo.default_branch,
          topics: repoInfo.topics,
          createdAt: repoInfo.created_at,
          updatedAt: repoInfo.updated_at,
        },
        files,
        fileCount: files.length,
        keyFilesContent,
        missingFiles: {
          readme: !hasReadme,
          gitignore: !hasGitignore,
          license: !hasLicense,
          contributing: !hasContributing,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repository';
      return { error: errorMessage };
    }
}

export const fetchRepoDescription = 'Fetch a GitHub repository structure, metadata, and key file contents. Use this first to understand the repository.';
