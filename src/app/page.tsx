'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';

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
}

interface GeneratedFile {
  fileName: string;
  content: string;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const { messages, append, isLoading, setMessages } = useChat({
    api: '/api/analyze',
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
              setRepoData({
                owner: result.owner,
                repo: result.repo,
                files: result.files,
                metadata: result.metadata,
                keyFilesContent: result.keyFilesContent,
              });
            }

            if (toolName === 'analyzeStructure' && result.success) {
              setScores(result.scores);
              setIssues(result.issues);
              setRecommendations(result.recommendations);
              setAnalysisComplete(true);
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
    setAnalysisComplete(false);
    setScores(null);
    setIssues([]);
    setRecommendations([]);
    setGeneratedFiles([]);
    setSelectedActions([]);
    setRepoData(null);
    setMessages([]);

    await append({
      role: 'user',
      content: `Analyze this GitHub repository: ${repoUrl}

Please do the following:
1. First, use fetchRepo to get the repository structure
2. Then, use analyzeStructure to evaluate it and provide health scores
3. Report the overall score, documentation score, structure score, issues, and recommendations`,
    });
  };

  const handleExecuteActions = async () => {
    if (!repoData || selectedActions.length === 0) return;

    const actionPrompts = selectedActions.map((action) => {
      switch (action) {
        case 'readme': return 'Generate a comprehensive README.md file.';
        case 'gitignore': return 'Generate an appropriate .gitignore file.';
        case 'license': return 'Generate an MIT LICENSE file.';
        case 'contributing': return 'Generate a CONTRIBUTING.md file.';
        case 'api-docs': return 'Generate API documentation.';
        default: return '';
      }
    }).filter(Boolean);

    await append({
      role: 'user',
      content: `Based on the repository analysis, please perform these actions:\n${actionPrompts.join('\n')}`,
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#22c55e';
    if (score >= 40) return '#4ade80';
    return '#86efac';
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="pattern-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className={`text-center mb-12 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-green-200/50 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">AI-Powered Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-green-900 tracking-tight mb-3">
            Repo Analyzer
          </h1>
          <p className="text-green-700/70 text-lg max-w-md mx-auto">
            Analyze, optimize, and enhance your GitHub repositories with intelligent automation
          </p>
        </header>

        {/* Input Section */}
        <div className={`glass-card rounded-2xl p-6 mb-8 ${mounted ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
          <label className="block text-sm font-medium text-green-800 mb-2">
            Repository URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="input-field flex-1"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !repoUrl}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>
          {analysisComplete && (
            <button onClick={resetAnalysis} className="mt-4 text-sm text-green-600 hover:text-green-800 transition-colors">
              ← Analyze another repository
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && !analysisComplete && (
          <div className="glass-card rounded-2xl p-8 mb-8 animate-scale-in">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-green-200" />
                <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-green-800 font-medium">Analyzing repository...</p>
                <p className="text-green-600/60 text-sm mt-1">This may take a few moments</p>
              </div>
            </div>
          </div>
        )}

        {/* Repository Info */}
        {repoData && (
          <div className={`glass-card rounded-2xl p-6 mb-6 ${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-green-900">{repoData.metadata.name}</h2>
                <p className="text-green-700/70 mt-1">{repoData.metadata.description || 'No description'}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                {repoData.owner}/{repoData.repo}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-green-100">
              <div className="text-center">
                <span className="text-lg">💻</span>
                <p className="text-xl font-semibold text-green-900 mt-1">{repoData.metadata.language || '—'}</p>
                <p className="text-xs text-green-600/60">Language</p>
              </div>
              <div className="text-center">
                <span className="text-lg">📁</span>
                <p className="text-xl font-semibold text-green-900 mt-1">{repoData.files.length}</p>
                <p className="text-xs text-green-600/60">Files</p>
              </div>
              <div className="text-center">
                <span className="text-lg">📄</span>
                <p className="text-xl font-semibold text-green-900 mt-1">{Object.keys(repoData.keyFilesContent).length}</p>
                <p className="text-xs text-green-600/60">Key Files</p>
              </div>
            </div>
          </div>
        )}

        {/* Health Score */}
        {scores && (
          <div className={`glass-card rounded-2xl p-6 mb-6 ${mounted ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-900">Repository Health</h3>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#dcfce7" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke={getScoreColor(scores.overall)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(scores.overall / 100) * 283} 283`}
                    className="score-ring"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-900">{scores.overall}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-700">Documentation</span>
                  <span className="text-lg font-semibold text-green-900">{scores.documentation}%</span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000" style={{ width: `${scores.documentation}%` }} />
                </div>
              </div>
              <div className="bg-white/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-700">Structure</span>
                  <span className="text-lg font-semibold text-green-900">{scores.structure}%</span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000" style={{ width: `${scores.structure}%` }} />
                </div>
              </div>
            </div>

            {issues.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Issues Found</h4>
                <ul className="space-y-2">
                  {issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700/80">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700/80">
                      <span className="text-green-500 mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {analysisComplete && recommendations.length > 0 && generatedFiles.length === 0 && (
          <div className={`glass-card rounded-2xl p-6 mb-6 ${mounted ? 'animate-fade-up delay-400' : 'opacity-0'}`}>
            <h3 className="text-xl font-semibold text-green-900 mb-4">Generate Files</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                { id: 'readme', label: 'README.md' },
                { id: 'gitignore', label: '.gitignore' },
                { id: 'license', label: 'LICENSE' },
                { id: 'contributing', label: 'CONTRIBUTING.md' },
                { id: 'api-docs', label: 'API Docs' },
              ].map((action) => (
                <label
                  key={action.id}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    selectedActions.includes(action.id)
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-white/60 text-green-800 hover:bg-green-50'
                  }`}
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
                  <span className="text-sm font-medium">{action.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleExecuteActions}
              disabled={selectedActions.length === 0 || isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Selected Files'}
            </button>
          </div>
        )}

        {/* Generated Files */}
        {generatedFiles.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-900">Generated Files</h3>
              <button
                onClick={downloadFiles}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ZIP
              </button>
            </div>
            <div className="space-y-3">
              {generatedFiles.map((file, i) => (
                <details key={i} className="group bg-white/50 rounded-xl overflow-hidden">
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-50/50 transition-colors">
                    <svg className="w-4 h-4 text-green-600 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-mono text-sm text-green-800">{file.fileName}</span>
                  </summary>
                  <pre className="px-4 py-3 text-xs text-green-700 bg-green-50/30 overflow-x-auto max-h-64">
                    <code>{file.content}</code>
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-green-600/60">
          <p>CS 4680 Prompt Engineering • An Nguyen</p>
        </footer>
      </main>
    </div>
  );
}
