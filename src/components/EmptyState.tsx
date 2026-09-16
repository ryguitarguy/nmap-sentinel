import React, { useState, useRef } from 'react';
import { Upload, FileCode, Play, ShieldAlert, Terminal, FileText, CheckCircle2, ArrowRight, ShieldCheck, Database, Server, Cpu, Network, Info } from 'lucide-react';
import { SAMPLE_SCANS } from '../utils/sampleData';

interface EmptyStateProps {
  onLoadScan: (content: string, format?: 'txt' | 'xml' | 'json' | 'csv') => void;
  onOpenUploadModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onLoadScan, onOpenUploadModal }) => {
  const [pasteContent, setPasteContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'auto' | 'txt' | 'xml' | 'json' | 'csv'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && content.trim().length > 0) {
        const formatToPass = selectedFormat === 'auto' ? undefined : selectedFormat;
        onLoadScan(content, formatToPass);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (pasteContent.trim()) {
      const formatToPass = selectedFormat === 'auto' ? undefined : selectedFormat;
      onLoadScan(pasteContent, formatToPass);
    }
  };

  const sampleIcons: Record<string, React.ReactNode> = {
    'sample-1': <Server className="h-5 w-5 text-cyan-400" />,
    'sample-2': <Cpu className="h-5 w-5 text-amber-400" />,
    'sample-3': <Database className="h-5 w-5 text-indigo-400" />,
    'sample-4': <Network className="h-5 w-5 text-emerald-400" />,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            Ready for Scan Analysis • No Active Scan Loaded
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Nmap Security Intelligence & Vulnerability Remediation
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Ingest Nmap scan files to automatically catalog listening ports, uncover network perimeter weak spots, monitor host endpoints in real-time, and generate executive remediation reports.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Supports .txt, .xml (-oX), .json, .csv</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Automated CVE & Weak Spot Detection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Hardening Commands & Exportable Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Grid: Upload Custom Scan vs Load Sample */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Direct File Ingestion (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Import Your Scan</h2>
                  <p className="text-xs text-slate-400">Load real Nmap scan results</p>
                </div>
              </div>

              {/* Mode switch */}
              <button
                onClick={() => setIsPasting(!isPasting)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                {isPasting ? 'Switch to Drag & Drop' : 'Paste Terminal Text'}
              </button>
            </div>

            {!isPasting ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.xml,.json,.csv,.nmap,.gnmap"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/20">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Drop your scan file here or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Select any standard Nmap output (<code className="text-cyan-400 font-mono">.txt</code>, <code className="text-cyan-400 font-mono">.xml</code>, <code className="text-cyan-400 font-mono">.json</code>, or <code className="text-cyan-400 font-mono">.csv</code>)
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-0.5">.TXT (Terminal)</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.XML (-oX)</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.JSON</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.CSV</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for 192.168.1.10\nHost is up (0.0012s latency).\nPORT     STATE SERVICE\n21/tcp   open  ftp\n22/tcp   open  ssh\n80/tcp   open  http\n6379/tcp open  redis`}
                  rows={8}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setPasteContent('')}
                    className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handlePasteSubmit}
                    disabled={!pasteContent.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-40 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Parse & Analyze
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Prefer a popup modal?</span>
            <button
              onClick={onOpenUploadModal}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Open Ingestion Modal <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right Column: Preloaded Sample Scans (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Preloaded Sample Scans</h2>
                  <p className="text-xs text-slate-400">
                    Explore vulnerability detection with realistic multi-format network scenarios:
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                {SAMPLE_SCANS.length} Samples
              </span>
            </div>

            {/* 4 Sample Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_SCANS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => onLoadScan(sample.content, sample.format)}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900 cursor-pointer shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {sampleIcons[sample.id] || <Server className="h-4 w-4 text-cyan-400" />}
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {sample.name}
                        </span>
                      </div>
                      <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-800/40 uppercase">
                        {sample.format}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-rose-400 font-medium">
                      {sample.badge}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      Load Sample <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <Info className="h-4 w-4 text-slate-500 shrink-0" />
            <span>
              Each sample showcases different vulnerabilities (such as vsftpd backdoors, EternalBlue SMBv1, unauthenticated Redis/Mongo, and Telnet) along with full remediation workflows.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
