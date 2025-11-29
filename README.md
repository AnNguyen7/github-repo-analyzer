# GitHub Repository Analyzer & Optimizer Agent

An AI-powered agent that analyzes GitHub repositories, evaluates their health, and automatically generates missing documentation files.

**CS 4680 Prompt Engineering Final Project — An Nguyen**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-blue?logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

This project implements an **AI Agent** following Dr. Sun's agent framework:

| Component | Implementation |
|-----------|----------------|
| **LLM (Brain)** | Google Gemini 2.5 Flash — decides which actions to take |
| **Tools (Actors)** | 8 specialized tools that execute real operations |
| **Orchestrator** | Vercel AI SDK — connects LLM decisions to tool execution |

The agent autonomously analyzes any public GitHub repository, identifies issues, and generates professional documentation to improve repository health.

## Features

- **Repository Health Scoring** — Overall score (0-100) with Documentation & Structure breakdown
- **Issue Detection** — Identifies missing LICENSE, README, CONTRIBUTING, tests, etc.
- **Smart File Generation** — AI-powered creation of:
  - README.md
  - .gitignore
  - LICENSE (MIT, Apache 2.0, GPL 3.0)
  - CONTRIBUTING.md
  - API Documentation
- **One-Click Download** — Download individual files or all as ZIP
- **Beautiful UI** — Modern dark theme with smooth animations

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| AI/LLM | Google Gemini 2.5 Flash via Vercel AI SDK |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| GitHub API | Octokit REST |
| Font | Outfit (Google Fonts) |

## Quick Start

### Prerequisites
- Node.js 18+
- Google AI Studio API Key ([Get one free](https://aistudio.google.com/apikey))

### Installation

1. **Clone the repository:**
\`\`\`bash
git clone https://github.com/annguyen7/github-repo-analyzer.git
cd github-repo-analyzer
npm install
\`\`\`

2. **Configure environment variables:**
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\`:
\`\`\`env
# Required
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Optional - for private repos
GITHUB_TOKEN=ghp_your_github_token
\`\`\`

3. **Start the development server:**
\`\`\`bash
npm run dev
\`\`\`

4. **Open http://localhost:3000** and analyze any GitHub repo!

## Agent Tools

The agent has 8 specialized tools at its disposal:

| Tool | Description |
|------|-------------|
| \`fetchRepo\` | Fetches repository structure, files, and metadata from GitHub API |
| \`analyzeStructure\` | Evaluates project organization and identifies missing components |
| \`generateReadme\` | Creates comprehensive README.md based on project analysis |
| \`generateGitignore\` | Generates .gitignore tailored to detected language/framework |
| \`generateLicense\` | Creates LICENSE file (MIT, Apache 2.0, or GPL 3.0) |
| \`generateContributing\` | Generates CONTRIBUTING.md with contribution guidelines |
| \`generateApiDocs\` | Documents functions, classes, and API endpoints |
| \`createGithubIssues\` | Suggests GitHub issues for identified improvements |

## Project Structure

\`\`\`
github-repo-analyzer/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main UI with chat interface
│   │   ├── globals.css           # Tailwind + custom animations
│   │   └── api/analyze/route.ts  # AI SDK streaming endpoint
│   ├── components/
│   │   ├── AnalysisResults.tsx   # Health score & issues display
│   │   └── GeneratedFiles.tsx    # File viewer with download
│   └── lib/
│       ├── agent.ts              # Tool definitions & configuration
│       ├── tools/                # 8 agent tool implementations
│       │   ├── fetchRepo.ts
│       │   ├── analyzeStructure.ts
│       │   ├── generateReadme.ts
│       │   ├── generateGitignore.ts
│       │   ├── generateLicense.ts
│       │   ├── generateContributing.ts
│       │   ├── generateApiDocs.ts
│       │   └── createGithubIssues.ts
│       ├── github.ts             # GitHub API utilities
│       └── prompts.ts            # System prompts for agent
├── .env.example
├── package.json
└── README.md
\`\`\`

## Screenshots

<p align="center">
  <img src="docs/screenshot.png" alt="GitHub Repo Analyzer Screenshot" width="800">
</p>

## Example Usage

1. Enter a GitHub repository URL: `facebook/react`
2. Click **Analyze**
3. View the health score, issues found, and recommendations
4. Select files to generate (README, LICENSE, etc.)
5. Click **Generate** and download files individually or as ZIP

## API Keys

| Key | Required | Purpose |
|-----|----------|---------|
| \`GOOGLE_GENERATIVE_AI_API_KEY\` | ✅ Yes | Powers the AI agent (Gemini 2.5 Flash) |
| \`GITHUB_TOKEN\` | ❌ Optional | Access private repos & higher rate limits |

## License

MIT © An Nguyen

---

<p align="center">
  Built for CS 4680 Prompt Engineering
</p>
