import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, Check, AlertCircle, FileText, Play, Layers } from 'lucide-react';
import { SAMPLE_SCANS } from '../utils/sampleData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScan: (content: string, format?: 'txt' | 'xml' | 'json' | 'csv') => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onLoadScan }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'auto' | 'txt' | 'xml' | 'json' | 'csv'>('auto');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content || content.trim().length === 0) {
        setErrorMsg('The selected file appears to be empty.');
        return;
      }
      const formatToPass = selectedFormat === 'auto' ? undefined : selectedFormat;
      onLoadScan(content, formatToPass);
      onClose();
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file. Please ensure it is a valid text, XML, JSON, or CSV file.');
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste some Nmap scan output first.');
      return;
    }
    const formatToPass = selectedFormat === 'auto' ? undefined : selectedFormat;
    onLoadScan(pastedText, formatToPass);
    onClose();
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_SCANS.find((s) => s.id === sampleId);
    if (sample) {
      onLoadScan(sample.content, sample.format);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Nmap Scan Data</h2>
              <p className="text-xs text-slate-400">Supports .txt stdout, .xml (-oX), .json, and .csv exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            File Upload (.txt, .xml, .json, .csv)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'paste'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            Paste Scan Output
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'samples'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            Preloaded Scenarios ({SAMPLE_SCANS.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Format Selector Bar */}
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Parsing Mode:</span>
            <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
              {(['auto', 'txt', 'xml', 'json', 'csv'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`rounded px-2.5 py-1 text-[11px] font-mono uppercase font-medium transition-colors ${
                    selectedFormat === fmt
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'upload' && (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-inner'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/70'
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
                  Click to select or drag & drop scan file here
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Accepts standard terminal reports (<code className="font-mono text-cyan-400">.txt</code>), Nmap XML (<code className="font-mono text-cyan-400">-oX .xml</code>), JSON (<code className="font-mono text-cyan-400">.json</code>), or table (<code className="font-mono text-cyan-400">.csv</code>)
                </p>
                <div className="mt-4 flex gap-2 text-[10px] font-mono text-slate-500">
                  <span className="rounded bg-slate-800 px-2 py-0.5">.TXT</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.XML</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.JSON</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.CSV</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5">.NMAP</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Paste Raw Scan Output or Command Terminal Results:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for 192.168.1.100\nHost is up (0.0021s latency).\nPORT     STATE SERVICE VERSION\n21/tcp   open  ftp     vsftpd 2.3.4\n22/tcp   open  ssh     OpenSSH 8.2p1\n80/tcp   open  http    Apache httpd 2.4.49\n6379/tcp open  redis   Redis 6.0.9`}
                rows={9}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setPastedText('')}
                  className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 transition-colors shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  Parse & Analyze
                </button>
              </div>
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Test the vulnerability engine and remediation reports immediately with realistic multi-format scans:
              </p>
              <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {SAMPLE_SCANS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample.id)}
                    className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-cyan-500/40 hover:bg-slate-900 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {sample.name}
                        </span>
                        <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-400 border border-cyan-800/40">
                          {sample.format.toUpperCase()}
                        </span>
                        <span className="rounded bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-800/30">
                          {sample.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{sample.description}</p>
                    </div>
                    <button className="flex items-center gap-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 px-2.5 py-1 text-xs font-medium text-cyan-300 group-hover:bg-cyan-600 group-hover:text-white transition-all shrink-0">
                      <Play className="h-3 w-3" />
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
