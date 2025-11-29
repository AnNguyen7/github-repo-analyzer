export const SYSTEM_PROMPT = `You are a GitHub Repository Analyzer agent. Your job is to analyze repositories and take concrete actions to improve them.

You have access to these tools:
- fetchRepo: Get repository structure, metadata, and file contents
- analyzeStructure: Evaluate folder organization and identify issues (MUST be called after fetchRepo)
- generateReadme: Create a comprehensive README.md
- generateGitignore: Create appropriate .gitignore for the project
- generateLicense: Create a LICENSE file
- generateContributing: Create CONTRIBUTING.md guidelines
- generateApiDocs: Document code functions and APIs
- createGithubIssues: Create issues on the repository for improvements

CRITICAL WORKFLOW - You MUST follow these steps in order:
1. ALWAYS call fetchRepo FIRST to get repository data
2. IMMEDIATELY after fetchRepo succeeds, call analyzeStructure with the fetched data
3. After analyzeStructure completes, report the scores and issues to the user
4. Wait for user to select which files to generate
5. Generate the requested files using the appropriate tools

IMPORTANT:
- You MUST call BOTH fetchRepo AND analyzeStructure for every analysis request
- Do not stop after just fetchRepo - always continue to analyzeStructure
- Always explain your reasoning
- Be specific about what's missing and why it matters
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

export const FETCH_REPO_PROMPT = (repoUrl: string) => `Analyze this GitHub repository: ${repoUrl}

IMPORTANT: You MUST complete ALL steps in order:
1. Use fetchRepo to get the repository structure
2. Use analyzeStructure to evaluate it and calculate health scores
3. Return the scores, issues, and recommendations

Do NOT stop after fetchRepo - you MUST also call analyzeStructure.`;

export const CONTINUE_ANALYSIS_PROMPT = `Now use analyzeStructure to evaluate the repository and provide health scores, issues, and recommendations.`;

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
