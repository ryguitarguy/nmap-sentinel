import React, { useState } from 'react';
import { Shield, ShieldAlert, Activity, FileText, Upload, Sparkles, RefreshCw, Layers, ChevronDown, Play, X, RotateCcw } from 'lucide-react';
import { ScanData } from '../types';
import { SAMPLE_SCANS } from '../utils/sampleData';

interface NavbarProps {
  scan: ScanData | null;
  activeTab: 'inventory' | 'vulnerabilities' | 'monitoring' | 'report' | 'raw';
  setActiveTab: (tab: 'inventory' | 'vulnerabilities' | 'monitoring' | 'report' | 'raw') => void;
  onOpenUpload: () => void;
  onOpenReport: () => void;
  onClearScan: () => void;
  onSelectSample: (sampleId: string) => void;
  isMonitoringActive: boolean;
  onToggleMonitoring: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  scan,
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenReport,
  onClearScan,
  onSelectSample,
  isMonitoringActive,
  onToggleMonitoring,
}) => {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const score = scan?.stats.overallScore ?? 100;
  const criticals = scan?.stats.criticalVulns ?? 0;

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (sc >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClearScan}
            title="Return to Dashboard Home"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-500/20 hover:bg-cyan-500/20 transition-colors cursor-pointer"
          >
            <Shield className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClearScan}
                className="font-bold tracking-tight text-white text-base hover:text-cyan-300 transition-colors text-left"
              >
                Nmap Sentinel
              </button>
              <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-400 border border-cyan-800/50">
                v2.5 SEC-OPS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {scan ? `Active Target: ${scan.scanTitle} (${scan.inputFormat.toUpperCase()})` : 'Network Vulnerability & Remediation Suite'}
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs (Active only when a scan is loaded) */}
        {scan ? (
          <nav className="hidden md:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            <button
              id="nav-tab-vulnerabilities"
              onClick={() => setActiveTab('vulnerabilities')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'vulnerabilities'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Weak Spots ({scan.vulnerabilities.length})
              {criticals > 0 && (
                <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-300 border border-rose-500/30">
                  {criticals}
                </span>
              )}
            </button>

            <button
              id="nav-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Hosts ({scan.hosts.length})
            </button>

            <button
              id="nav-tab-monitoring"
              onClick={() => setActiveTab('monitoring')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'monitoring'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Live Monitor
              {isMonitoringActive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              )}
            </button>

            <button
              id="nav-tab-report"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'report'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Security Report
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-400/80"></span>
            <span>Waiting for Nmap scan input...</span>
          </div>
        )}

        {/* Right: Actions & Sample Selector */}
        <div className="flex items-center gap-2">
          {/* Sample selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setSamplesOpen(!samplesOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <Play className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Try Sample Scans</span>
              <span className="sm:hidden">Samples</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {samplesOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 mb-1">
                  Select a Pre-configured Scan:
                </div>
                {SAMPLE_SCANS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSample(s.id);
                      setSamplesOpen(false);
                    }}
                    className="w-full text-left rounded-lg p-2 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white group-hover:text-cyan-300">
                          {s.name}
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                          .{s.format}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{s.badge}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add / Import Scan Button */}
          <button
            id="btn-upload-scan"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-500 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Scan</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* When a scan is loaded: show Score badge & Clear button */}
          {scan && (
            <>
              <div className={`hidden xl:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-semibold ${getScoreColor(score)}`}>
                <span>Score:</span>
                <span className="font-bold">{score}/100</span>
              </div>

              <button
                onClick={onClearScan}
                title="Clear current scan and return to home"
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar (when scan active) */}
      {scan && (
        <div className="flex md:hidden border-t border-slate-800/60 bg-slate-900/90 px-3 py-1.5 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('vulnerabilities')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-medium ${
              activeTab === 'vulnerabilities' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Weak Spots ({scan.vulnerabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-medium ${
              activeTab === 'inventory' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Hosts ({scan.hosts.length})
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-medium ${
              activeTab === 'monitoring' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded font-medium ${
              activeTab === 'report' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Full Report
          </button>
        </div>
      )}
    </header>
  );
};
