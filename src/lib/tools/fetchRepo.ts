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

      const missingFiles = {
        readme: !hasReadme,
        gitignore: !hasGitignore,
        license: !hasLicense,
        contributing: !hasContributing,
      };

      const metadata = {
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        defaultBranch: repoInfo.default_branch,
        topics: repoInfo.topics,
        createdAt: repoInfo.created_at,
        updatedAt: repoInfo.updated_at,
      };

      // === ANALYZE STRUCTURE (merged from analyzeStructure.ts) ===
      const issues: string[] = [];
      let documentationScore = 100;
      let structureScore = 100;

      // Check missing files
      if (missingFiles.readme) {
        issues.push('❌ Missing README.md - No project documentation');
        documentationScore -= 30;
      } else {
        const readmeContent = keyFilesContent['README.md'] || keyFilesContent['readme.md'] || '';
        if (readmeContent && readmeContent.length < 500) {
          issues.push('⚠️ README.md is too short - Needs more documentation');
          documentationScore -= 15;
        }
      }

      if (missingFiles.gitignore) {
        issues.push('❌ Missing .gitignore - May have unnecessary files committed');
        structureScore -= 20;
      }

      if (missingFiles.license) {
        issues.push('⚠️ Missing LICENSE - Project licensing unclear');
        documentationScore -= 10;
      }

      if (missingFiles.contributing) {
        issues.push('💡 No CONTRIBUTING.md - Could help attract contributors');
        documentationScore -= 5;
      }

      // Check for common issues
      const hasNodeModules = files.some(f => f.includes('node_modules/'));
      if (hasNodeModules) {
        issues.push('🚨 node_modules committed to repository!');
        structureScore -= 30;
      }

      const hasEnvFile = files.some(f => f === '.env' || f.includes('.env.local'));
      if (hasEnvFile) {
        issues.push('🚨 Environment files may be committed - Security risk!');
        structureScore -= 25;
      }

      const hasBuildDir = files.some(f =>
        f.startsWith('dist/') ||
        f.startsWith('build/') ||
        f.startsWith('.next/')
      );
      if (hasBuildDir) {
        issues.push('⚠️ Build artifacts committed to repository');
        structureScore -= 15;
      }

      // Check folder structure
      const hasSourceFolder = files.some(f =>
        f.startsWith('src/') ||
        f.startsWith('lib/') ||
        f.startsWith('app/')
      );
      if (!hasSourceFolder && files.length > 10) {
        issues.push('💡 Consider organizing code into src/ or lib/ folders');
        structureScore -= 10;
      }

      // Check for tests
      const hasTests = files.some(f =>
        f.includes('test') ||
        f.includes('spec') ||
        f.includes('__tests__')
      );
      if (!hasTests) {
        issues.push('💡 No tests found - Consider adding test coverage');
        structureScore -= 10;
      }

      // Calculate overall score
      documentationScore = Math.max(0, documentationScore);
      structureScore = Math.max(0, structureScore);
      const overallScore = Math.round((documentationScore + structureScore) / 2);

      // Generate recommendations
      const recommendations: string[] = [];
      if (missingFiles.readme) recommendations.push('generateReadme');
      if (missingFiles.gitignore) recommendations.push('generateGitignore');
      if (missingFiles.license) recommendations.push('generateLicense');
      if (missingFiles.contributing) recommendations.push('generateContributing');

      return {
        success: true,
        owner,
        repo,
        metadata,
        files,
        fileCount: files.length,
        keyFilesContent,
        missingFiles,
        // Analysis results (now included in the same response)
        scores: {
          overall: overallScore,
          documentation: documentationScore,
          structure: structureScore,
        },
        issues,
        recommendations,
        summary: `Repository health: ${overallScore}/100. Found ${issues.length} issues.`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repository';
      return { error: errorMessage };
    }
}

export const fetchRepoDescription = 'Analyze a GitHub repository - fetches structure, metadata, file contents, AND calculates health scores. This single tool does everything: returns repo data, scores, issues, and recommendations all at once.';
