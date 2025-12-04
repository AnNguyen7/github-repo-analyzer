'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import {
  FETCH_REPO_PROMPT,
  CONTINUE_ANALYSIS_PROMPT,
  GENERATE_FILES_PROMPT
} from '@/lib/prompts';
import RepoSummary from '@/components/RepoSummary';
import {
  MagnifyingGlassIcon,
  CogIcon,
  DocumentTextIcon,
  ScaleIcon,
  HandRaisedIcon,
  BookOpenIcon,
  CpuChipIcon,
  ChartBarIcon,
  SparklesIcon,
  BoltIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  WindowIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface AnalysisScores {
  overall: number;
  documentation: number;
  structure: number;
}

interface RepoData {
  owner: string;
  repo: string;
  files: string[];
  metadata: {
    name: string;
    description: string | null;
    language: string | null;
  };
  keyFilesContent: Record<string, string>;
  missingFiles: {
    readme: boolean;
    gitignore: boolean;
    license: boolean;
    contributing: boolean;
  };
}

interface GeneratedFile {
  fileName: string;
  content: string;
}

interface RepoSummaryData {
  purpose: string;
  category: string;
  techStack: {
    framework?: string;
    language: string;
    database?: string;
    deployment?: string;
    aiTools?: string[];
    otherTools?: string[];
  };
  architecture: {
    pattern: string;
    components: string[];
    dataFlow: string;
  };
  keyFeatures: string[];
  codeQuality: {
    hasTypes: boolean;
    hasTests: boolean;
    patterns: string[];
  };
  narrative: string;
  filesAnalyzed?: string[];
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [scores, setScores] = useState<AnalysisScores | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RepoSummaryData | null>(null);
  const [filesAnalyzedCount, setFilesAnalyzedCount] = useState<number>(0);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { messages, append, isLoading, setMessages } = useChat({
    api: '/api/analyze',
    onError: (err) => {
      console.error('Chat error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    },
    onFinish: (message) => {
      // Clear error if we got successful tool results
      if (message.toolInvocations?.some(inv => inv.state === 'result' && inv.result?.success)) {
        setError(null);
      }
    },
  });

  // Extract tool results from messages
  const processToolResults = () => {
    for (const message of messages) {
      if (message.toolInvocations) {
        for (const invocation of message.toolInvocations) {
          if (invocation.state === 'result' && invocation.result) {
            const result = invocation.result;
            const toolName = invocation.toolName;

            if (toolName === 'fetchRepo' && result.success) {
              // Set repo data
              setRepoData({
                owner: result.owner,
                repo: result.repo,
                files: result.files,
                metadata: result.metadata,
                keyFilesContent: result.keyFilesContent,
                missingFiles: result.missingFiles,
              });

              // Set analysis scores (now included in fetchRepo response)
              if (result.scores) {
                setScores(result.scores);
                setIssues(result.issues || []);
                setRecommendations(result.recommendations || []);
                setAnalysisComplete(true);
              }
            }

            if (toolName === 'analyzeStructure' && result.success) {
              // Keep this for backwards compatibility if needed
              setScores(result.scores);
              setIssues(result.issues);
              setRecommendations(result.recommendations);
              setAnalysisComplete(true);
            }

            if (toolName === 'summarizeRepo' && result.success) {
              // Set summary from summarizeRepo tool
              setSummary(result.summary);
              setFilesAnalyzedCount(result.filesAnalyzedCount || 0);
            }

            if (
              ['generateReadme', 'generateGitignore', 'generateLicense', 'generateContributing', 'generateApiDocs'].includes(toolName) &&
              result.success
            ) {
              setGeneratedFiles((prev) => {
                const exists = prev.some((f) => f.fileName === result.fileName);
                if (exists) return prev;
                return [...prev, { fileName: result.fileName, content: result.content }];
              });
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      processToolResults();
    }
  }, [messages]);

  const handleAnalyze = async () => {
    if (!repoUrl) return;
    setError(null);
    setAnalysisComplete(false);
    setScores(null);
    setIssues([]);
    setRecommendations([]);
    setGeneratedFiles([]);
    setSelectedActions([]);
    setRepoData(null);
    setSummary(null);
    setFilesAnalyzedCount(0);
    setMessages([]);

    await append({
      role: 'user',
      content: FETCH_REPO_PROMPT(repoUrl),
    });
  };

  const handleExecuteActions = async () => {
    if (!repoData || selectedActions.length === 0) return;

    await append({
      role: 'user',
      content: GENERATE_FILES_PROMPT(selectedActions),
    });
  };

  const resetAnalysis = () => {
    setRepoUrl('');
    setAnalysisComplete(false);
    setScores(null);
    setIssues([]);
    setRecommendations([]);
    setGeneratedFiles([]);
    setSelectedActions([]);
    setRepoData(null);
    setMessages([]);
    setSummary(null);
    setFilesAnalyzedCount(0);
  };

  const downloadFiles = async () => {
    if (generatedFiles.length === 0) return;
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');
    const zip = new JSZip();
    generatedFiles.forEach((file) => zip.file(file.fileName, file.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${repoData?.repo || 'generated'}-files.zip`);
  };

  const triggerDeepAnalysis = async () => {
    if (!repoData) return;

    setIsDeepAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/deep-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoData.owner,
          repo: repoData.repo,
          files: repoData.files,
          metadata: repoData.metadata,
          keyFilesContent: repoData.keyFilesContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      if (data.success) {
        setSummary(data.summary);
        setFilesAnalyzedCount(data.filesAnalyzedCount || 0);
      }
    } catch (err) {
      console.error('Deep analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform deep analysis');
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4a9617';
    if (score >= 60) return '#3d7d13';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen grid-bg">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <header className={`flex items-center justify-between mb-10 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--accent-primary)' }}>
            REPO.SCAN
          </h1>
          <div className="status-badge">
            <span className="status-dot" />
            <span>Agent Online</span>
          </div>
        </header>

        {/* Search Input - Glassmorphism */}
        <div className={`glass-card rounded-xl p-5 mb-6 ${mounted ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                style={{ color: 'var(--text-muted)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Enter repository URL or owner/repo..."
                className="input-field with-icon w-full"
                style={{ paddingLeft: '2.75rem' }}
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !repoUrl}
              className="btn-glass flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze Repository</span>
              )}
            </button>
          </div>
          {analysisComplete && (
            <button
              onClick={resetAnalysis}
              className="mt-3 text-sm transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ← New analysis
            </button>
          )}
        </div>

        {/* Landing Page Content - Show when no analysis */}
        {!analysisComplete && !isLoading && !repoData && (
          <div className="space-y-12 mb-12">
            {/* How It Works */}
            <section className={`${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}>
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: '1',
                    icon: MagnifyingGlassIcon,
                    title: 'Analyze',
                    description: 'Enter any GitHub repository URL. Agent fetches structure, files, and metadata.'
                  },
                  {
                    step: '2',
                    icon: ChartBarIcon,
                    title: 'Evaluate',
                    description: 'AI calculates health scores, identifies missing files, and detects issues.'
                  },
                  {
                    step: '3',
                    icon: SparklesIcon,
                    title: 'Generate',
                    description: 'Create professional documentation tailored to your specific project.'
                  }
                ].map((item, i) => (
                  <div key={i} className="dark-card rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                      style={{ background: 'rgba(90, 191, 27, 0.1)', border: '2px solid var(--accent-primary)' }}>
                      <item.icon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                      STEP {item.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Key Features */}
            <section className={`${mounted ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
                AI-Powered Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: CheckBadgeIcon,
                    title: 'Health Scoring',
                    description: 'Get 0-100 scores for documentation quality and project structure'
                  },
                  {
                    icon: BoltIcon,
                    title: 'Smart Generation',
                    description: 'Create README, LICENSE, CONTRIBUTING files specific to your project'
                  },
                  {
                    icon: CodeBracketIcon,
                    title: 'Deep Code Analysis',
                    description: 'AI reads your source code and generates intelligent summaries'
                  },
                  {
                    icon: ArrowPathIcon,
                    title: 'Multi-Tool AI Agent',
                    description: 'Specialized tools orchestrated by Gemini AI for optimal results'
                  }
                ].map((item, i) => (
                  <div key={i} className="dark-card rounded-xl p-5 flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(90, 191, 27, 0.1)' }}>
                        <item.icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Agent Architecture */}
            <section className={`${mounted ? 'animate-fade-up delay-400' : 'opacity-0'}`}>
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
                AI Agent Architecture
              </h2>
              <div className="dark-card rounded-xl p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Brain */}
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                      style={{ background: 'rgba(90, 191, 27, 0.15)', border: '2px solid var(--accent-primary)' }}>
                      <CpuChipIcon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>Brain</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gemini 2.5 Flash</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Decides which tools to call</p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:block" style={{ color: 'var(--accent-primary)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>

                  {/* Orchestrator */}
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                      style={{ background: 'rgba(90, 191, 27, 0.15)', border: '2px solid var(--accent-primary)' }}>
                      <ArrowPathIcon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>Orchestrator</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Vercel AI SDK</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Connects LLM to tools</p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:block" style={{ color: 'var(--accent-primary)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>

                  {/* Actors */}
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                      style={{ background: 'rgba(90, 191, 27, 0.15)', border: '2px solid var(--accent-primary)' }}>
                      <BoltIcon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>Actors</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Multi-Tool Suite</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Execute real operations</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tech Stack */}
            <section className={`${mounted ? 'animate-fade-up delay-500' : 'opacity-0'}`}>
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
                Built With Modern Tech
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Next.js 16', type: 'Framework', icon: WindowIcon },
                  { name: 'Gemini 2.5', type: 'LLM', icon: SparklesIcon },
                  { name: 'TypeScript 5', type: 'Language', icon: CodeBracketIcon },
                  { name: 'Vercel AI SDK', type: 'AI Tools', icon: BoltIcon },
                  { name: 'Tailwind CSS 4', type: 'Styling', icon: PaintBrushIcon },
                  { name: 'Octokit', type: 'GitHub API', icon: CogIcon },
                  { name: 'Zod', type: 'Validation', icon: ShieldCheckIcon },
                  { name: 'Poppins + Open Sans', type: 'Typography', icon: DocumentCheckIcon }
                ].map((tech, i) => (
                  <div key={i} className="dark-card rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <tech.icon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      {tech.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {tech.type}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div 
            className="dark-card rounded-xl p-4 mb-6 animate-scale-in"
            style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: '#ef4444' }}>⚠️</span>
              <div>
                <p style={{ color: '#ef4444' }} className="font-medium">Error</p>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !analysisComplete && (
          <div className="dark-card rounded-xl p-10 mb-6 animate-scale-in">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full" style={{ border: '2px solid var(--border-subtle)' }} />
                <div 
                  className="absolute inset-0 w-16 h-16 rounded-full animate-spin"
                  style={{ 
                    border: '2px solid transparent',
                    borderTopColor: 'var(--accent-primary)',
                  }} 
                />
              </div>
              <div className="text-center">
                <p style={{ color: 'var(--text-primary)' }}>Analyzing repository...</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Fetching structure, analyzing code, and calculating health scores
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Repository Info Card */}
        {repoData && (
          <div className={`dark-card rounded-xl p-5 mb-6 ${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {repoData.metadata.name}
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {repoData.metadata.description || 'No description available'}
                </p>
              </div>
              <span 
                className="px-3 py-1.5 rounded-md text-xs font-mono"
                style={{ 
                  background: 'var(--bg-elevated)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {repoData.owner}/{repoData.repo}
              </span>
            </div>

            <div className="flex gap-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {repoData.metadata.language || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm">{repoData.files.length} files</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">{Object.keys(repoData.keyFilesContent).length} key files</span>
              </div>
            </div>

            {/* Continue Analysis Button - shows if repo loaded but analysis didn't complete */}
            {!scores && !isLoading && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={async () => {
                    await append({
                      role: 'user',
                      content: CONTINUE_ANALYSIS_PROMPT(repoData),
                    });
                  }}
                  className="btn-primary w-full"
                >
                  Continue Analysis →
                </button>
                <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                  Analysis incomplete. Click to calculate health scores.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deep Analysis Button - HERO ELEMENT with glassmorphism */}
        {analysisComplete && !summary && repoData && (
          <div
            className={`glass-card rounded-xl p-8 mb-6 relative overflow-hidden ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
          >
            {/* Decorative gradient orbs */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl"
              style={{ background: 'var(--accent-primary)' }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-10 blur-3xl"
              style={{ background: 'var(--accent-primary)' }}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(90, 191, 27, 0.2)',
                  }}
                >
                  <CpuChipIcon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{
                      lineHeight: '1.3',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    AI-Powered Deep Code Analysis
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Unlock intelligent insights by reading and analyzing{' '}
                    <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      {repoData.files.length} files
                    </span>
                    {' '}from the actual source code
                  </p>
                </div>
              </div>

              <button
                onClick={triggerDeepAnalysis}
                disabled={isDeepAnalyzing}
                className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg relative group"
                style={{
                  background: isDeepAnalyzing
                    ? 'var(--border-color)'
                    : 'linear-gradient(135deg, rgba(90, 191, 27, 0.2), rgba(125, 209, 46, 0.3))',
                  border: isDeepAnalyzing ? 'none' : '1px solid rgba(90, 191, 27, 0.4)',
                  cursor: isDeepAnalyzing ? 'not-allowed' : 'pointer',
                  opacity: isDeepAnalyzing ? 0.6 : 1,
                  boxShadow: isDeepAnalyzing
                    ? 'none'
                    : '0 8px 24px rgba(90, 191, 27, 0.25)',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseOver={(e) => {
                  if (!isDeepAnalyzing) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(90, 191, 27, 0.3), rgba(125, 209, 46, 0.4))';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(90, 191, 27, 0.35)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isDeepAnalyzing) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(90, 191, 27, 0.2), rgba(125, 209, 46, 0.3))';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 191, 27, 0.25)';
                  }
                }}
              >
                {isDeepAnalyzing ? (
                  <span className="flex items-center justify-center gap-3">
                    <CogIcon className="w-5 h-5 animate-spin" />
                    <span className="text-base">
                      Analyzing source code...
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    <span className="text-base">Start Deep Analysis</span>
                    <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                )}
              </button>

              {/* Features list */}
              <div className="mt-5 flex items-center justify-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                  <span>Smart file selection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                  <span>Architecture analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                  <span>Pattern detection</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI-Powered Summary Card */}
        {summary && (
          <RepoSummary summary={summary} filesAnalyzedCount={filesAnalyzedCount} />
        )}

        {/* Health Score Card */}
        {scores && (
          <div className={`dark-card rounded-xl p-5 mb-6 ${mounted ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Repository Health
              </h3>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke="var(--bg-elevated)" 
                    strokeWidth="6" 
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={getScoreColor(scores.overall)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(scores.overall / 100) * 264} 264`}
                    className="score-ring"
                    style={{ filter: `drop-shadow(0 0 6px ${getScoreColor(scores.overall)})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: getScoreColor(scores.overall) }}>
                    {scores.overall}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Documentation</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{scores.documentation}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${scores.documentation}%` }} />
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Structure</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{scores.structure}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${scores.structure}%` }} />
                </div>
              </div>
            </div>

            {issues.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                  ISSUES FOUND
                </h4>
                <div className="space-y-2">
                  {issues.map((issue, i) => (
                    <div key={i} className="issue-item">
                      <span style={{ color: 'var(--status-warning)' }}>⚠</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                  RECOMMENDATIONS
                </h4>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="issue-item">
                      <span style={{ color: 'var(--accent-primary)' }}>→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Files Section */}
        {analysisComplete && recommendations.length > 0 && generatedFiles.length === 0 && (
          <div className={`dark-card rounded-xl p-5 mb-6 ${mounted ? 'animate-fade-up delay-400' : 'opacity-0'}`}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Generate Files
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { id: 'readme', label: 'README.md', Icon: DocumentTextIcon },
                { id: 'license', label: 'LICENSE', Icon: ScaleIcon },
                { id: 'contributing', label: 'CONTRIBUTING.md', Icon: HandRaisedIcon },
                { id: 'api-docs', label: 'API Docs', Icon: BookOpenIcon },
              ].map((action) => (
                <label
                  key={action.id}
                  className={`action-chip ${selectedActions.includes(action.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedActions.includes(action.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedActions([...selectedActions, action.id]);
                      } else {
                        setSelectedActions(selectedActions.filter((a) => a !== action.id));
                      }
                    }}
                    className="sr-only"
                  />
                  <action.Icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleExecuteActions}
              disabled={selectedActions.length === 0 || isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Generating...' : `Generate ${selectedActions.length} file${selectedActions.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Generated Files */}
        {generatedFiles.length > 0 && (
          <div className="dark-card rounded-xl p-5 mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Generated Files
              </h3>
              <button onClick={downloadFiles} className="btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ZIP
              </button>
            </div>
            <div className="space-y-3">
              {generatedFiles.map((file, i) => (
                <details key={i} className="file-item group">
                  <summary className="file-header">
                    <svg 
                      className="w-4 h-4 transition-transform group-open:rotate-90" 
                      style={{ color: 'var(--accent-primary)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {file.fileName}
                    </span>
                  </summary>
                  <pre className="file-content">
                    <code>{file.content}</code>
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>CS 4680 Prompt Engineering · An Nguyen</p>
        </footer>
      </main>
    </div>
  );
}
