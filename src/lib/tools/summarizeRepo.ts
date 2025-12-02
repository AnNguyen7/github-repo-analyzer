import { z } from 'zod';
import { getFileContent } from '../github';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

// ============================================
// TYPE DEFINITIONS
// ============================================

type ProjectType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'express'
  | 'django'
  | 'flask'
  | 'fastapi'
  | 'cli'
  | 'library'
  | 'reactNative'
  | 'go'
  | 'rust'
  | 'python'
  | 'unknown';

interface EntryPointPatterns {
  [key: string]: string[];
}

// ============================================
// ENTRY POINT PATTERNS
// ============================================

const ENTRY_POINT_PATTERNS: EntryPointPatterns = {
  nextjs: ['src/app/page.tsx', 'src/app/page.js', 'src/pages/index.tsx', 'src/pages/index.js', 'pages/index.tsx', 'pages/index.js', 'app/page.tsx'],
  react: ['src/App.tsx', 'src/App.jsx', 'src/index.tsx', 'src/index.jsx', 'src/main.tsx', 'src/main.jsx'],
  vue: ['src/App.vue', 'src/main.ts', 'src/main.js'],
  express: ['src/server.ts', 'src/app.ts', 'server.js', 'app.js', 'src/index.ts', 'index.js'],
  django: ['manage.py', 'settings.py', 'urls.py', 'wsgi.py'],
  flask: ['app.py', 'main.py', 'application.py', 'wsgi.py'],
  fastapi: ['main.py', 'app/main.py', 'src/main.py'],
  cli: ['src/cli.ts', 'src/index.ts', 'bin/cli.js', 'cli.js'],
  library: ['src/index.ts', 'lib/index.js', 'index.ts', 'src/lib.rs'],
  reactNative: ['App.tsx', 'App.js', 'index.js', 'app/index.tsx'],
  go: ['main.go', 'cmd/main.go', 'cmd/server/main.go'],
  rust: ['src/main.rs', 'src/lib.rs'],
  python: ['__main__.py', 'main.py', 'setup.py', 'app.py'],
};

// ============================================
// ZOD SCHEMAS
// ============================================

export const summarizeRepoParameters = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  files: z.array(z.string()).describe('List of all files in the repository'),
  metadata: z.object({
    name: z.string(),
    description: z.string().nullable(),
    language: z.string().nullable(),
    stars: z.number().optional(),
    topics: z.array(z.string()).optional(),
  }).describe('Repository metadata'),
  keyFilesContent: z.record(z.string()).describe('Content of key configuration files'),
});

const summarySchema = z.object({
  purpose: z.string().describe('One-sentence description of what this project does'),
  category: z.enum(['Web Application', 'Library', 'CLI Tool', 'API Service', 'Mobile App', 'Desktop App', 'Other']).describe('Project category'),
  techStack: z.object({
    framework: z.string().optional().describe('Main framework (e.g., Next.js 16, React, Express)'),
    language: z.string().describe('Primary programming language'),
    database: z.string().optional().describe('Database technology if any'),
    deployment: z.string().optional().describe('Deployment platform if detected'),
    aiTools: z.array(z.string()).optional().describe('AI/ML tools and services used'),
    otherTools: z.array(z.string()).optional().describe('Other notable tools and libraries'),
  }).describe('Technology stack'),
  architecture: z.object({
    pattern: z.string().describe('Architectural pattern (e.g., MVC, Microservices, Agent Framework)'),
    components: z.array(z.string()).describe('Main components or modules'),
    dataFlow: z.string().describe('How data flows through the system'),
  }).describe('Architecture insights'),
  keyFeatures: z.array(z.string()).describe('Main capabilities and features discovered from code'),
  codeQuality: z.object({
    hasTypes: z.boolean().describe('Uses TypeScript or type hints'),
    hasTests: z.boolean().describe('Has test files'),
    patterns: z.array(z.string()).describe('Notable code patterns (e.g., React Hooks, Dependency Injection)'),
  }).describe('Code quality insights'),
  narrative: z.string().describe('Concise bullet-point summary (4-6 points) with each point on a new line starting with "- ", covering: problem/approach, architecture/components, interesting details, and notable patterns'),
});

// ============================================
// PROJECT TYPE DETECTION
// ============================================

function detectProjectType(files: string[], packageJson?: string, language?: string): ProjectType {
  // Parse package.json if available
  let dependencies: string[] = [];
  let devDependencies: string[] = [];

  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      dependencies = Object.keys(pkg.dependencies || {});
      devDependencies = Object.keys(pkg.devDependencies || {});
    } catch (e) {
      // Ignore parse errors
    }
  }

  const allDeps = [...dependencies, ...devDependencies].map(d => d.toLowerCase());

  // Check for Next.js
  if (allDeps.includes('next') || files.some(f => f === 'next.config.js' || f === 'next.config.ts' || f === 'next.config.mjs')) {
    return 'nextjs';
  }

  // Check for React
  if (allDeps.includes('react') || allDeps.includes('react-dom')) {
    if (allDeps.includes('react-native')) return 'reactNative';
    return 'react';
  }

  // Check for Vue
  if (allDeps.includes('vue')) {
    return 'vue';
  }

  // Check for Express
  if (allDeps.includes('express')) {
    return 'express';
  }

  // Check for FastAPI
  if (files.includes('requirements.txt') && language?.toLowerCase() === 'python') {
    if (packageJson) { // Actually a requirements.txt check
      const reqs = packageJson.toLowerCase();
      if (reqs.includes('fastapi')) return 'fastapi';
      if (reqs.includes('flask')) return 'flask';
      if (reqs.includes('django')) return 'django';
    }
  }

  // Check for Go
  if (files.includes('go.mod') || language?.toLowerCase() === 'go') {
    return 'go';
  }

  // Check for Rust
  if (files.includes('Cargo.toml') || language?.toLowerCase() === 'rust') {
    return 'rust';
  }

  // Check for Python
  if (language?.toLowerCase() === 'python') {
    return 'python';
  }

  // Check if it's a library (has index file but no app/server files)
  const hasIndex = files.some(f =>
    f === 'src/index.ts' ||
    f === 'src/index.js' ||
    f === 'lib/index.js' ||
    f === 'index.ts'
  );
  const hasApp = files.some(f =>
    f.includes('app.') ||
    f.includes('server.') ||
    f.includes('main.')
  );

  if (hasIndex && !hasApp) {
    return 'library';
  }

  return 'unknown';
}

// ============================================
// SMART FILE SELECTION
// ============================================

function findEntryPoints(files: string[], projectType: ProjectType): string[] {
  const patterns = ENTRY_POINT_PATTERNS[projectType] || [];
  const entryPoints: string[] = [];

  for (const pattern of patterns) {
    if (files.includes(pattern)) {
      entryPoints.push(pattern);
    }
  }

  return entryPoints;
}

function selectFilesToRead(
  files: string[],
  projectType: ProjectType,
  keyFilesContent: Record<string, string>
): string[] {
  const selectedFiles: string[] = [];
  const MAX_FILES = 25;

  // Priority 1: Entry points
  const entryPoints = findEntryPoints(files, projectType);
  selectedFiles.push(...entryPoints);

  // Priority 2: Core directories
  const corePatterns = [
    'src/lib/',
    'src/core/',
    'lib/',
    'core/',
    'src/app/api/',
    'src/pages/api/',
    'api/',
    'routes/',
    'controllers/',
    'models/',
    'schema.prisma',
    'src/components/',
    'components/',
  ];

  // Add files from core directories (prioritize shorter files)
  for (const pattern of corePatterns) {
    const matchingFiles = files
      .filter(f => f.startsWith(pattern) && !selectedFiles.includes(f))
      .filter(f => {
        // Skip test files, style files, and very large files for now
        return !f.includes('.test.') &&
               !f.includes('.spec.') &&
               !f.endsWith('.css') &&
               !f.endsWith('.scss') &&
               !f.endsWith('.json');
      })
      .slice(0, 3); // Max 3 files per directory

    selectedFiles.push(...matchingFiles);

    if (selectedFiles.length >= MAX_FILES) break;
  }

  // Priority 3: Top-level source files
  if (selectedFiles.length < MAX_FILES) {
    const topLevelSrc = files
      .filter(f =>
        (f.startsWith('src/') && f.split('/').length === 2) || // Direct children of src/
        (!f.includes('/') && f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx')) // Root level code files
      )
      .filter(f => !selectedFiles.includes(f))
      .slice(0, MAX_FILES - selectedFiles.length);

    selectedFiles.push(...topLevelSrc);
  }

  // Ensure we don't exceed MAX_FILES
  return selectedFiles.slice(0, MAX_FILES);
}

// ============================================
// EXECUTE FUNCTION
// ============================================

export async function summarizeRepoExecute({
  owner,
  repo,
  files,
  metadata,
  keyFilesContent
}: z.infer<typeof summarizeRepoParameters>) {
  try {
    // Step 1: Detect project type
    const packageJson = keyFilesContent['package.json'];
    const projectType = detectProjectType(files, packageJson, metadata.language || undefined);

    // Step 2: Select files to read
    const filesToRead = selectFilesToRead(files, projectType, keyFilesContent);

    console.log(`📖 Reading ${filesToRead.length} source files for ${owner}/${repo}...`);

    // Step 3: Read source files
    const sourceFilesContent: Record<string, string> = {};
    const MAX_FILE_LENGTH = 10000; // Limit to first 10K chars per file

    for (const filePath of filesToRead) {
      try {
        const content = await getFileContent(owner, repo, filePath);
        if (content) {
          // Truncate if too long
          sourceFilesContent[filePath] = content.length > MAX_FILE_LENGTH
            ? content.substring(0, MAX_FILE_LENGTH) + '\n... (truncated)'
            : content;
        }
      } catch (error) {
        console.warn(`Failed to read ${filePath}:`, error);
        // Continue with other files
      }
    }

    console.log(`✅ Successfully read ${Object.keys(sourceFilesContent).length} files`);

    // Step 4: Build context for Gemini
    const readmeContent = keyFilesContent['README.md'] || keyFilesContent['readme.md'] || 'No README';
    const fileTreeSample = files.slice(0, 50).join('\n'); // First 50 files

    // Step 5: Generate summary with Gemini
    const prompt = `You are analyzing a GitHub repository to understand what it does and how it works.

REPOSITORY METADATA:
- Name: ${metadata.name}
- Description: ${metadata.description || 'No description'}
- Language: ${metadata.language || 'Unknown'}
- Stars: ${metadata.stars || 0}
- Topics: ${metadata.topics?.join(', ') || 'None'}
- Detected Type: ${projectType}

FILE STRUCTURE (sample):
${fileTreeSample}

README CONTENT:
${readmeContent.substring(0, 2000)}

CONFIGURATION FILES:
${Object.entries(keyFilesContent)
  .filter(([name]) => name !== 'README.md' && name !== 'readme.md')
  .map(([name, content]) => `--- ${name} ---\n${content.substring(0, 1000)}`)
  .join('\n\n')}

SOURCE CODE FILES (${Object.keys(sourceFilesContent).length} files analyzed):
${Object.entries(sourceFilesContent)
  .map(([path, content]) => `--- ${path} ---\n${content}`)
  .join('\n\n')}

YOUR TASK:
Analyze this repository deeply and provide:

1. PURPOSE: What problem does this project solve? (1 sentence)
2. CATEGORY: What type of project is this?
3. TECH STACK: List all technologies, frameworks, databases, AI tools you can identify from the code
4. ARCHITECTURE: How is the code organized? What patterns are used? How does data flow?
5. KEY FEATURES: What are the main capabilities? (infer from actual code, not just README)
6. CODE QUALITY: Does it use TypeScript/types? Are there tests? What patterns do you see?
7. NARRATIVE: Write a CONCISE summary with 4-6 bullet points covering:
   - What problem this project solves and the approach it takes
   - Key architecture decisions and main components (reference specific files/code)
   - Most interesting or unique implementation details
   - Notable patterns or techniques discovered in the codebase

BE SPECIFIC. Reference actual code you see. Mention specific files, functions, patterns.
Make it concise, technical, and easy to scan - this is for developers who want quick insights.`;

    const { object: summary } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: summarySchema,
      prompt,
    });

    // Return success with summary
    return {
      success: true,
      summary: {
        ...summary,
        filesAnalyzed: Object.keys(sourceFilesContent),
      },
      filesAnalyzedCount: Object.keys(sourceFilesContent).length,
      projectType,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to summarize repository';
    console.error('Summarization error:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

export const summarizeRepoDescription = 'Analyze repository source code in depth - reads key source files, understands the codebase architecture, and generates an intelligent narrative summary explaining what the project does, how it works, and its key features. Call this after fetchRepo to provide deep code-level insights.';
