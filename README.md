# 🔍 GitHub Repository Analyzer & Optimizer Agent

An AI-powered agent that analyzes GitHub repositories and takes concrete actions to improve them. Built for **CS 4680 Prompt Engineering** final project.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-3.4-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-cyan)

## 🎯 What It Does

This AI agent analyzes GitHub repositories and performs real actions:

- **Fetches & Analyzes** repository structure and metadata
- **Identifies Issues** like missing documentation, poor structure, security risks
- **Generates Files** including README.md, .gitignore, LICENSE, CONTRIBUTING.md, and API docs
- **Provides Downloads** for all generated files (individual or ZIP)

## 🧠 Following Dr. Sun's AI Agent Framework

This project implements the AI Agent architecture from Dr. Sun's Prompt Engineering lectures:

1. **LLM is the Brain** — GPT-4o-mini makes decisions about what actions to take
2. **Tools Execute Actions** — Each tool performs real operations (not just text generation)
3. **Connection Mechanism** — Vercel AI SDK connects LLM outputs to tool execution

Similar to LangChain's `@tool` decorators, we define tools with:
- Descriptions (LLM reads these to understand capabilities)
- Parameters (validated with Zod schemas)
- Execute functions (perform actual operations)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| AI/Agent | Vercel AI SDK + OpenAI GPT-4o-mini |
| Database | Neon PostgreSQL + Prisma ORM |
| External API | GitHub REST API (Octokit) |

## 📋 Project Requirements Checklist

- ✅ **LLM Integration Module** — OpenAI API via Vercel AI SDK
- ✅ **Action Interpreter/Executor** — Tools with execute functions
- ✅ **User Interface** — Next.js + Tailwind CSS
- ✅ **Error Handling & Safety** — Validation, confirmation, logging

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key
- GitHub Personal Access Token (optional, for higher rate limits)
- Neon Database (for production logging)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/github-repo-analyzer.git
   cd github-repo-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
   DATABASE_URL=postgresql://...
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
github-repo-analyzer/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main UI
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind styles
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts      # Main API endpoint
│   │
│   ├── components/
│   │   ├── RepoInput.tsx         # URL input component
│   │   ├── AnalysisResults.tsx   # Display analysis scores
│   │   ├── GeneratedFiles.tsx    # File preview and download
│   │   ├── ActionSelector.tsx    # Checkboxes for actions
│   │   └── LoadingState.tsx      # Loading indicators
│   │
│   └── lib/
│       ├── agent.ts              # Agent configuration
│       ├── tools/                # All agent tools
│       │   ├── fetchRepo.ts
│       │   ├── analyzeStructure.ts
│       │   ├── generateReadme.ts
│       │   ├── generateGitignore.ts
│       │   ├── generateLicense.ts
│       │   ├── generateContributing.ts
│       │   ├── generateApiDocs.ts
│       │   └── createGithubIssues.ts
│       ├── github.ts             # GitHub API utilities
│       ├── db.ts                 # Prisma client
│       └── prompts.ts            # System prompts
│
├── prisma/
│   └── schema.prisma             # Database schema
│
└── package.json
```

## 🔧 Agent Tools

| Tool | Description |
|------|-------------|
| `fetchRepo` | Fetches repository structure, metadata, and key file contents |
| `analyzeStructure` | Evaluates folder organization and identifies issues |
| `generateReadme` | Creates a comprehensive README.md |
| `generateGitignore` | Creates appropriate .gitignore for the project |
| `generateLicense` | Creates a LICENSE file (MIT, Apache, GPL) |
| `generateContributing` | Creates CONTRIBUTING.md guidelines |
| `generateApiDocs` | Documents code functions and APIs |
| `createGithubIssues` | Creates issues on the repository for improvements |

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                   Next.js 15 + Tailwind CSS                     │
│                                                                 │
│   [Input GitHub URL] [Analyze Button]                          │
│   [Analysis Results] [Generated Files] [Download]              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTE                            │
│                   /api/analyze/route.ts                         │
│                                                                 │
│              Vercel AI SDK + OpenAI Integration                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT TOOLS                                │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ fetchRepo    │ │analyzeStruct │ │ gen_readme   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │gen_gitignore │ │ gen_license  │ │gen_contributing│          │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│         GitHub API │ Neon Database │ OpenAI API                │
└─────────────────────────────────────────────────────────────────┘
```

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `DATABASE_URL`
   - `GITHUB_TOKEN` (optional)
4. Click Deploy

## 👤 Author

**An Nguyen**  
CS 4680 Prompt Engineering  
California State Polytechnic University, Pomona

## 📄 License

MIT License - see [LICENSE](LICENSE) for details
