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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { messages, append, isLoading, setMessages } = useChat({
    api: '/api/analyze',
    onError: (err) => {
      console.error('Chat error:', err);
      setError(err.message || 'An error occurred. Please try again.');
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
    setError(null);
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
    if (score >= 80) return '#21b01c';
    if (score >= 60) return '#1a8d17';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen grid-bg">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <header className={`flex items-center justify-between mb-10 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--accent-cyan)' }}>
            REPO.SCAN
          </h1>
          <div className="status-badge">
            <span className="status-dot" />
            <span>Agent Online</span>
          </div>
        </header>

        {/* Stats Row - Only show when we have data */}
        {scores && (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 ${mounted ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
            <div className="stat-card">
              <p className="stat-label">Health Score</p>
              <p className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{scores.overall}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Documentation</p>
              <p className="stat-value">{scores.documentation}%</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Structure</p>
              <p className="stat-value">{scores.structure}%</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Issues Found</p>
              <p className="stat-value" style={{ color: issues.length > 0 ? 'var(--status-warning)' : 'var(--accent-cyan)' }}>
                {issues.length}
              </p>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className={`dark-card rounded-xl p-5 mb-6 ${mounted ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
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
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Scanning</span>
                </>
              ) : (
                <span>Analyze</span>
              )}
            </button>
          </div>
          {analysisComplete && (
            <button 
              onClick={resetAnalysis} 
              className="mt-3 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ← New analysis
            </button>
          )}
        </div>

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
                className="ml-auto"
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
                    borderTopColor: 'var(--accent-cyan)',
                  }} 
                />
              </div>
              <div className="text-center">
                <p style={{ color: 'var(--text-primary)' }}>Scanning repository...</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Analyzing structure and documentation
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
                  <svg className="w-6 h-6" style={{ color: 'var(--accent-cyan)' }} fill="currentColor" viewBox="0 0 24 24">
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
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-cyan)' }} />
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
          </div>
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
                      <span style={{ color: 'var(--accent-cyan)' }}>→</span>
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
                { id: 'readme', label: 'README.md', icon: '📄' },
                { id: 'license', label: 'LICENSE', icon: '⚖️' },
                { id: 'contributing', label: 'CONTRIBUTING.md', icon: '🤝' },
                { id: 'api-docs', label: 'API Docs', icon: '📚' },
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
                  <span>{action.icon}</span>
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
                      style={{ color: 'var(--accent-cyan)' }}
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
