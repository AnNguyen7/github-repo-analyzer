'use client';

import { useState } from 'react';

interface TechStack {
  framework?: string;
  language: string;
  database?: string;
  deployment?: string;
  aiTools?: string[];
  otherTools?: string[];
}

interface Architecture {
  pattern: string;
  components: string[];
  dataFlow: string;
}

interface CodeQuality {
  hasTypes: boolean;
  hasTests: boolean;
  patterns: string[];
}

interface RepoSummaryData {
  purpose: string;
  category: string;
  techStack: TechStack;
  architecture: Architecture;
  keyFeatures: string[];
  codeQuality: CodeQuality;
  narrative: string;
  filesAnalyzed?: string[];
}

interface RepoSummaryProps {
  summary: RepoSummaryData;
  filesAnalyzedCount?: number;
}

export default function RepoSummary({ summary, filesAnalyzedCount }: RepoSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="dark-card rounded-xl p-6 mb-6 animate-scale-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI-Powered Code Analysis
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Analyzed {filesAnalyzedCount || summary.filesAnalyzed?.length || 0} source files
          </p>
        </div>
      </div>

      {/* Purpose & Category */}
      <div className="mb-4">
        <p className="text-base leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
          {summary.purpose}
        </p>
        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: 'rgba(120, 119, 198, 0.1)',
            color: 'var(--accent-purple)'
          }}
        >
          {summary.category}
        </span>
      </div>

      {/* Tech Stack */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
          TECH STACK
        </h3>
        <div className="flex flex-wrap gap-2">
          {summary.techStack.framework && (
            <span className="px-3 py-1 rounded-lg text-sm" style={{
              backgroundColor: 'var(--card-hover)',
              color: 'var(--accent-primary)'
            }}>
              {summary.techStack.framework}
            </span>
          )}
          <span className="px-3 py-1 rounded-lg text-sm" style={{
            backgroundColor: 'var(--card-hover)',
            color: 'var(--accent-primary)'
          }}>
            {summary.techStack.language}
          </span>
          {summary.techStack.database && (
            <span className="px-3 py-1 rounded-lg text-sm" style={{
              backgroundColor: 'var(--card-hover)',
              color: 'var(--accent-primary)'
            }}>
              {summary.techStack.database}
            </span>
          )}
          {summary.techStack.aiTools && summary.techStack.aiTools.map((tool, i) => (
            <span key={i} className="px-3 py-1 rounded-lg text-sm" style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: 'var(--accent-purple)'
            }}>
              🤖 {tool}
            </span>
          ))}
          {summary.techStack.otherTools && summary.techStack.otherTools.slice(0, 3).map((tool, i) => (
            <span key={i} className="px-3 py-1 rounded-lg text-sm" style={{
              backgroundColor: 'var(--card-hover)',
              color: 'var(--text-secondary)'
            }}>
              {tool}
            </span>
          ))}
          {summary.techStack.otherTools && summary.techStack.otherTools.length > 3 && (
            <span className="px-3 py-1 rounded-lg text-sm" style={{
              backgroundColor: 'var(--card-hover)',
              color: 'var(--text-muted)'
            }}>
              +{summary.techStack.otherTools.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors mb-4"
        style={{
          backgroundColor: 'var(--card-hover)',
          color: 'var(--text-secondary)'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--card-hover)'}
      >
        <span className="text-sm font-medium">
          {expanded ? 'Show Less' : 'View Full Analysis'}
        </span>
        <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="space-y-6 animate-fade-in">
          {/* Narrative */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              DETAILED ANALYSIS
            </h3>
            <div style={{ color: 'var(--text-secondary)' }}>
              <ul className="space-y-2">
                {summary.narrative
                  .split('\n')
                  .filter(line => line.trim())
                  .map((point, i) => {
                    // Remove leading bullet markers if present
                    const cleanPoint = point.replace(/^[-•*]\s*/, '').trim();
                    return (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span style={{ color: 'var(--accent-primary)', minWidth: '1rem' }}>•</span>
                        <span>{cleanPoint}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>

          {/* Architecture */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              ARCHITECTURE
            </h3>
            <div className="space-y-2">
              <p style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-primary)' }}>Pattern:</span> {summary.architecture.pattern}
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-primary)' }}>Data Flow:</span> {summary.architecture.dataFlow}
              </p>
              <div>
                <span style={{ color: 'var(--accent-primary)' }}>Main Components:</span>
                <ul className="mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  {summary.architecture.components.map((component, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--accent-primary)' }}>•</span>
                      {component}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              KEY FEATURES
            </h3>
            <ul className="space-y-2">
              {summary.keyFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--status-success)' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Code Quality */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              CODE QUALITY
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span style={{ color: summary.codeQuality.hasTypes ? 'var(--status-success)' : 'var(--text-muted)' }}>
                  {summary.codeQuality.hasTypes ? '✓' : '○'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>Type Safety</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: summary.codeQuality.hasTests ? 'var(--status-success)' : 'var(--text-muted)' }}>
                  {summary.codeQuality.hasTests ? '✓' : '○'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>Test Coverage</span>
              </div>
            </div>
            {summary.codeQuality.patterns.length > 0 && (
              <div className="mt-3">
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  Notable Patterns:
                </p>
                <div className="flex flex-wrap gap-2">
                  {summary.codeQuality.patterns.map((pattern, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: 'var(--status-success)'
                      }}
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Files Analyzed */}
          {summary.filesAnalyzed && summary.filesAnalyzed.length > 0 && (
            <details>
              <summary
                className="cursor-pointer text-sm font-medium mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Files Analyzed ({summary.filesAnalyzed.length})
              </summary>
              <div className="mt-2 pl-4 space-y-1">
                {summary.filesAnalyzed.map((file, i) => (
                  <p key={i} className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {file}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
