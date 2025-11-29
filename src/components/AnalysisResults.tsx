'use client';

interface AnalysisResultsProps {
  scores: {
    overall: number;
    documentation: number;
    structure: number;
  };
  issues: string[];
  recommendations: string[];
}

export default function AnalysisResults({ scores, issues, recommendations }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
      </div>

      {/* Scores */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${getScoreBgColor(scores.overall)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}>
              {scores.overall}
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className={`p-4 rounded-lg ${getScoreBgColor(scores.documentation)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(scores.documentation)}`}>
              {scores.documentation}
            </div>
            <div className="text-sm text-gray-600">Documentation</div>
          </div>
          <div className={`p-4 rounded-lg ${getScoreBgColor(scores.structure)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(scores.structure)}`}>
              {scores.structure}
            </div>
            <div className="text-sm text-gray-600">Structure</div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Issues Found</h3>
            <ul className="space-y-2">
              {issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-lg leading-none">{issue.charAt(0)}</span>
                  <span>{issue.slice(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">Recommended Actions</h3>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {rec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
