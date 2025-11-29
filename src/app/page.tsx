'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import RepoInput from '@/components/RepoInput';
import AnalysisResults from '@/components/AnalysisResults';
import GeneratedFiles, { GeneratedFile } from '@/components/GeneratedFiles';
import ActionSelector from '@/components/ActionSelector';
import LoadingState from '@/components/LoadingState';

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

export default function Home() {
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [scores, setScores] = useState<AnalysisScores | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { messages, append, isLoading, setMessages } = useChat({
    api: '/api/analyze',
    onFinish: (message) => {
      // Process the response to extract data from tool results
      console.log('Message finished:', message);
    },
  });

  // Extract tool results from messages
  const processToolResults = () => {
    for (const message of messages) {
      if (message.toolInvocations) {
        for (const invocation of message.toolInvocations) {
          if (invocation.state === 'result' && invocation.result) {
            const result = invocation.result;

            // Handle fetchRepo result
            if (invocation.toolName === 'fetchRepo' && result.success) {
              setRepoData({
                owner: result.owner,
                repo: result.repo,
                files: result.files,
                metadata: result.metadata,
                keyFilesContent: result.keyFilesContent,
              });
            }

            // Handle analyzeStructure result
            if (invocation.toolName === 'analyzeStructure' && result.success) {
              setScores(result.scores);
              setIssues(result.issues);
              setRecommendations(result.recommendations);
              setAnalysisComplete(true);
            }

            // Handle file generation results
            if (
              ['generateReadme', 'generateGitignore', 'generateLicense', 'generateContributing', 'generateApiDocs'].includes(invocation.toolName) &&
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

  // Process tool results when messages change
  if (messages.length > 0) {
    processToolResults();
  }

  const handleAnalyze = async (url: string) => {
    // Reset state
    setAnalysisComplete(false);
    setScores(null);
    setIssues([]);
    setRecommendations([]);
    setGeneratedFiles([]);
    setSelectedActions([]);
    setRepoData(null);
    setMessages([]);

    // Start analysis
    await append({
      role: 'user',
      content: `Please analyze this GitHub repository and provide a detailed health report: ${url}`,
    });
  };

  const handleExecuteActions = async () => {
    if (!repoData || selectedActions.length === 0) return;

    setIsGenerating(true);

    const actionPrompts = selectedActions.map((action) => {
      switch (action) {
        case 'generateReadme':
          return 'Generate a comprehensive README.md file for this repository.';
        case 'generateGitignore':
          return 'Generate an appropriate .gitignore file for this repository.';
        case 'generateLicense':
          return 'Generate an MIT LICENSE file for this repository.';
        case 'generateContributing':
          return 'Generate a CONTRIBUTING.md file for this repository.';
        case 'generateApiDocs':
          return 'Generate API documentation for the code in this repository.';
        default:
          return '';
      }
    }).filter(Boolean);

    await append({
      role: 'user',
      content: `Based on the repository analysis, please perform these actions:\n${actionPrompts.join('\n')}`,
    });

    setIsGenerating(false);
  };

  const resetAnalysis = () => {
    setAnalysisComplete(false);
    setScores(null);
    setIssues([]);
    setRecommendations([]);
    setGeneratedFiles([]);
    setSelectedActions([]);
    setRepoData(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GitHub Repo Analyzer</h1>
              <p className="text-sm text-gray-500">AI-powered repository analysis and optimization</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <RepoInput onSubmit={handleAnalyze} isLoading={isLoading} />
          
          {analysisComplete && (
            <button
              onClick={resetAnalysis}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Analyze another repository
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && !analysisComplete && (
          <LoadingState message="Analyzing repository structure..." />
        )}

        {/* Analysis Results */}
        {analysisComplete && scores && (
          <AnalysisResults
            scores={scores}
            issues={issues}
            recommendations={recommendations}
          />
        )}

        {/* Action Selector */}
        {analysisComplete && recommendations.length > 0 && generatedFiles.length === 0 && (
          <ActionSelector
            recommendations={recommendations}
            selectedActions={selectedActions}
            onSelectionChange={setSelectedActions}
            onExecute={handleExecuteActions}
            isExecuting={isGenerating || isLoading}
          />
        )}

        {/* Generated Files */}
        {generatedFiles.length > 0 && (
          <GeneratedFiles files={generatedFiles} />
        )}

        {/* Chat Messages (for debugging) */}
        {process.env.NODE_ENV === 'development' && messages.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 text-sm">
            <h3 className="text-white font-medium mb-4">Debug: Agent Messages</h3>
            <div className="space-y-4 max-h-96 overflow-auto">
              {messages.map((message) => (
                <div key={message.id} className="text-gray-300">
                  <div className="font-medium text-gray-400">{message.role}:</div>
                  <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
                  {message.toolInvocations && (
                    <div className="mt-2 pl-4 border-l-2 border-gray-600">
                      {message.toolInvocations.map((tool, i) => (
                        <div key={i} className="text-green-400">
                          🔧 {tool.toolName}: {tool.state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Built with Next.js, Vercel AI SDK, and OpenAI GPT-4o-mini</p>
          <p className="mt-1">CS 4680 Prompt Engineering - An Nguyen</p>
        </div>
      </footer>
    </div>
  );
}
