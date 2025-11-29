'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface GeneratedFile {
  fileName: string;
  content: string;
  fileType?: string;
}

interface GeneratedFilesProps {
  files: GeneratedFile[];
}

export default function GeneratedFiles({ files }: GeneratedFilesProps) {
  const [previewFile, setPreviewFile] = useState<GeneratedFile | null>(null);

  const downloadAll = async () => {
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.fileName, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'generated-files.zip');
  };

  const downloadSingle = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    saveAs(blob, file.fileName);
  };

  const copyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Generated Files ({files.length})
        </h2>
        <button
          onClick={downloadAll}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download All (ZIP)
        </button>
      </div>

      {/* File List */}
      <div className="divide-y divide-gray-100">
        {files.map((file, index) => (
          <div
            key={index}
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium text-gray-900">{file.fileName}</div>
                <div className="text-sm text-gray-500">
                  {file.content.length.toLocaleString()} characters
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewFile(file)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={() => copyToClipboard(file.content)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => downloadSingle(file)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{previewFile.fileName}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                {previewFile.content}
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => copyToClipboard(previewFile.content)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => downloadSingle(previewFile)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
