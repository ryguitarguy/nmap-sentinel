import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, FileCode } from 'lucide-react';
import { ScanData } from '../types';
import { downloadFile } from '../utils/reportGenerator';

interface RawScanViewerProps {
  scan: ScanData;
}

export const RawScanViewer: React.FC<RawScanViewerProps> = ({ scan }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'parsedJson'>('raw');

  const contentToDisplay =
    viewMode === 'raw' ? scan.rawInput : JSON.stringify(scan, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = viewMode === 'raw' ? scan.inputFormat : 'json';
    const mime = viewMode === 'raw' ? 'text/plain' : 'application/json';
    downloadFile(contentToDisplay, `nmap-scan-source.${ext}`, mime);
  };

  const lineCount = contentToDisplay.split('\n').length;

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">Scan Data Inspector</span>
          <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-400 border border-cyan-800/40 uppercase">
            Format: {scan.inputFormat}
          </span>
          <span className="text-xs text-slate-500 font-mono">({lineCount} lines)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('raw')}
              className={`rounded px-2.5 py-1 transition-colors ${
                viewMode === 'raw'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Input
            </button>
            <button
              onClick={() => setViewMode('parsedJson')}
              className={`rounded px-2.5 py-1 transition-colors ${
                viewMode === 'parsedJson'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structured AST
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
        <div className="max-h-[600px] overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre">{contentToDisplay}</pre>
        </div>
      </div>
    </div>
  );
};
