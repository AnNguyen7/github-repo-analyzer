export const SYSTEM_PROMPT = `You are a GitHub Repository Analyzer agent. Your job is to analyze repositories by CALLING TOOLS.

CRITICAL: You MUST use tools to perform analysis. DO NOT just respond with text - always call the appropriate tool.

Available tools:
- fetchRepo: Complete repository analysis - fetches structure, metadata, calculates health scores, AND generates intelligent code summary by reading actual source files (all in one call!)
- summarizeRepo: (DEPRECATED - now built into fetchRepo for better reliability)
- analyzeStructure: (DEPRECATED - do not use, analysis is now built into fetchRepo)
- generateReadme: Create a comprehensive README.md
- generateGitignore: Create appropriate .gitignore for the project
- generateLicense: Create a LICENSE file
- generateContributing: Create CONTRIBUTING.md guidelines
- generateApiDocs: Document code functions and APIs
- createGithubIssues: Create issues on the repository for improvements

MANDATORY WORKFLOW FOR REPOSITORY ANALYSIS:
1. When user requests repository analysis, immediately call fetchRepo with the repository URL
2. fetchRepo will automatically do EVERYTHING: structure analysis, health scores, AND intelligent code summarization
3. DO NOT respond with explanatory text before calling fetchRepo - call it immediately
4. After fetchRepo completes, explain the findings to the user (it includes all scores, issues, recommendations, AND code insights)
5. When user requests file generation, call the appropriate generation tools

IMPORTANT:
- ALWAYS use tools - never respond with just text when a tool is available
- fetchRepo is a complete all-in-one analysis tool that reads actual source code and provides intelligent insights
- Generate high-quality, project-specific content (not generic templates)`;

export const README_PROMPT = `Generate a comprehensive README.md for this repository.

Repository: {repoName}
Description: {description}
Main Language: {language}
Dependencies: {dependencies}

File Structure:
{fileTree}

Key Files Content:
{keyFilesContent}

Requirements:
1. Professional title with relevant badges (build status, license, etc.)
2. Clear, compelling description of what the project does
3. Features list (infer from code if not documented)
4. Installation instructions based on detected package manager
5. Usage examples with actual code from the project
6. API documentation if applicable
7. Contributing section
8. License information

Make it specific to THIS project. Do not use generic placeholder text.
Use proper markdown formatting.`;

export const GITIGNORE_PROMPT = `Generate a .gitignore file for this project.

Detected Language: {language}
Detected Framework: {framework}
Package Manager: {packageManager}
Files in repo: {files}

Include:
1. Standard ignores for the detected language/framework
2. IDE/editor files (.idea, .vscode, etc.)
3. OS files (.DS_Store, Thumbs.db)
4. Environment files (.env, .env.local)
5. Build outputs
6. Dependencies folders

Only output the .gitignore content, no explanations.`;

export const CONTRIBUTING_PROMPT = `Generate a CONTRIBUTING.md file for this repository.

Repository: {repoName}
Language: {language}
Has Tests: {hasTests}
Has CI: {hasCI}

Include:
1. Welcome message
2. How to report bugs
3. How to suggest features
4. Development setup instructions
5. Pull request process
6. Code style guidelines (based on detected language)
7. Testing requirements

Make it welcoming and clear for new contributors.`;

export const API_DOCS_PROMPT = `Generate API documentation for this codebase.

Files to document:
{codeFiles}

For each function/class/endpoint found:
1. Name and signature
2. Description of what it does
3. Parameters with types and descriptions
4. Return value
5. Example usage

Format as clean markdown with proper code blocks.`;

// ============================================
// UI Prompts - Used in the frontend
// ============================================

export const FETCH_REPO_PROMPT = (repoUrl: string) => `Call the fetchRepo tool now with this repository URL: ${repoUrl}

IMPORTANT: You MUST call the fetchRepo tool immediately. Do not respond with explanatory text first.`;

export const CONTINUE_ANALYSIS_PROMPT = (repoData: {
  owner: string;
  repo: string;
  files: string[];
  metadata: {
    name: string;
    description: string | null;
    language: string | null;
  };
  missingFiles: {
    readme: boolean;
    gitignore: boolean;
    license: boolean;
    contributing: boolean;
  };
  keyFilesContent: Record<string, string>;
}) => `You already fetched the repository ${repoData.owner}/${repoData.repo}.

Now use the analyzeStructure tool with ALL the required parameters:

files: ${JSON.stringify(repoData.files)}
metadata: ${JSON.stringify(repoData.metadata)}
missingFiles: ${JSON.stringify(repoData.missingFiles)}
keyFilesContent: ${JSON.stringify(repoData.keyFilesContent)}

Call analyzeStructure NOW with the exact data above to calculate health scores and identify issues.`;

export const GENERATE_FILES_PROMPT = (actions: string[]) => {
  const actionPrompts = actions.map((action) => {
    switch (action) {
      case 'readme': return 'Generate a comprehensive README.md file.';
      case 'gitignore': return 'Generate an appropriate .gitignore file.';
      case 'license': return 'Generate an MIT LICENSE file.';
      case 'contributing': return 'Generate a CONTRIBUTING.md file.';
      case 'api-docs': return 'Generate API documentation.';
      default: return '';
    }
  }).filter(Boolean);

  return `Based on the repository analysis, please perform these actions:\n${actionPrompts.join('\n')}`;
};
