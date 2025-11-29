# GitHub Repository Analyzer

An AI agent that analyzes GitHub repositories and generates missing documentation files.

**CS 4680 Prompt Engineering Final Project - An Nguyen**

## Overview

This project implements an AI agent following Dr. Sun's framework:
- **LLM as the brain**: Google Gemini 1.5 Flash decides which actions to take
- **Tools as actors**: Each tool executes real operations (fetch data, generate files)
- **Vercel AI SDK**: Connects LLM decisions to tool execution (similar to LangChain)

## Features

- Analyze repository structure and provide health scores (0-100)
- Identify missing files and potential issues
- Generate README.md, .gitignore, LICENSE, CONTRIBUTING.md, API docs
- Download generated files individually or as ZIP

## Tech Stack

- Next.js 15 (App Router)
- Vercel AI SDK + Google Gemini 1.5 Flash
- Tailwind CSS
- Prisma + Neon PostgreSQL (optional)
- GitHub REST API (Octokit)

## Setup

1. Clone and install:
\`\`\`bash
git clone https://github.com/annguyen7/github-repo-analyzer.git
cd github-repo-analyzer
npm install
\`\`\`

2. Create \`.env.local\` with your API keys:
\`\`\`env
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GITHUB_TOKEN=ghp_...  # optional, for private repos
# DATABASE_URL=postgresql://...  # optional, for history feature
\`\`\`

3. Run the app:
\`\`\`bash
npm run dev
\`\`\`

4. Open http://localhost:3000

## Agent Tools

| Tool | Function |
|------|----------|
| fetchRepo | Get repository structure and metadata from GitHub |
| analyzeStructure | Evaluate organization and identify issues |
| generateReadme | Create README.md based on project analysis |
| generateGitignore | Create .gitignore for detected language/framework |
| generateLicense | Create LICENSE file (MIT/Apache/GPL) |
| generateContributing | Create CONTRIBUTING.md guidelines |
| generateApiDocs | Document code functions and APIs |
| createGithubIssues | Create issues for improvements |

## Project Structure

\`\`\`
src/
├── app/
│   ├── page.tsx           # Main UI
│   └── api/analyze/       # API endpoint with AI SDK
├── components/            # React components
└── lib/
    ├── agent.ts           # Tool configuration
    ├── tools/             # 8 agent tools
    ├── github.ts          # GitHub API utilities
    └── prompts.ts         # System prompts
\`\`\`

## License

MIT
