'use client';

interface ActionSelectorProps {
  recommendations: string[];
  selectedActions: string[];
  onSelectionChange: (actions: string[]) => void;
  onExecute: () => void;
  isExecuting: boolean;
}

const ACTION_LABELS: Record<string, { label: string; description: string }> = {
  generateReadme: {
    label: 'Generate README.md',
    description: 'Create a comprehensive README file with project documentation',
  },
  generateGitignore: {
    label: 'Generate .gitignore',
    description: 'Create a .gitignore file based on your project type',
  },
  generateLicense: {
    label: 'Generate LICENSE',
    description: 'Add a license file (MIT by default)',
  },
  generateContributing: {
    label: 'Generate CONTRIBUTING.md',
    description: 'Create contribution guidelines for your project',
  },
  generateApiDocs: {
    label: 'Generate API Documentation',
    description: 'Document your code functions and APIs',
  },
};

export default function ActionSelector({
  recommendations,
  selectedActions,
  onSelectionChange,
  onExecute,
  isExecuting,
}: ActionSelectorProps) {
  const toggleAction = (action: string) => {
    if (selectedActions.includes(action)) {
      onSelectionChange(selectedActions.filter((a) => a !== action));
    } else {
      onSelectionChange([...selectedActions, action]);
    }
  };

  const selectAll = () => {
    onSelectionChange([...recommendations]);
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Select Actions to Perform</h2>
        <div className="flex gap-2 text-sm">
          <button
            onClick={selectAll}
            className="text-blue-600 hover:text-blue-700"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={selectNone}
            className="text-gray-600 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        {recommendations.map((action) => {
          const info = ACTION_LABELS[action] || { label: action, description: '' };
          const isSelected = selectedActions.includes(action);

          return (
            <label
              key={action}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleAction(action)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">{info.label}</div>
                <div className="text-sm text-gray-500">{info.description}</div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Execute Button */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onExecute}
          disabled={selectedActions.length === 0 || isExecuting}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Files...
            </span>
          ) : (
            `Execute ${selectedActions.length} Action${selectedActions.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  );
}
