import React from 'react';
import { Shield, ShieldAlert, Server, Network, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';
import { ScanData } from '../types';

interface MetricsOverviewProps {
  scan: ScanData;
  onOpenReport: () => void;
  onFilterSeverity?: (sev: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ scan, onOpenReport, onFilterSeverity }) => {
  const { stats } = scan;

  const getScoreBadge = (sc: number) => {
    if (sc >= 80) return { label: 'Hardened Posture', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (sc >= 60) return { label: 'Moderate Risk', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Critical Exposure', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const badge = getScoreBadge(stats.overallScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Security Posture Index */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Security Posture</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">{stats.overallScore}</span>
          <span className="text-sm font-medium text-slate-400 font-mono">/ 100</span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.overallScore >= 80 ? 'bg-emerald-500' : stats.overallScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${stats.overallScore}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>Attack Surface: <strong className="text-slate-200">{stats.attackSurfaceRating}</strong></span>
          <span>{stats.resolvedVulns} Issues Fixed</span>
        </div>
      </div>

      {/* Metric 2: Target Hosts Status */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Scanned Assets</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Server className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono">{stats.totalHosts}</span>
          <span className="text-xs text-slate-400">Targets Enumerable</span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>{stats.hostsUp} Hosts Online</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400">Format: {scan.inputFormat.toUpperCase()}</span>
        </div>
      </div>

      {/* Metric 3: Open Ports & Attack Surface */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Open Attack Vectors</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Network className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono">{stats.totalOpenPorts}</span>
          <span className="text-xs text-slate-400">Open Listening Ports</span>
        </div>
        <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Perimeter Exposure</span>
          <span className="font-semibold text-cyan-400">{stats.attackSurfaceRating} Exposure</span>
        </div>
      </div>

      {/* Metric 4: Vulnerability Breakdown */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Identified Weak Spots</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Flame className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-3xl font-extrabold text-white font-mono">{scan.vulnerabilities.length}</span>
          <span className="text-xs text-slate-400">Flaws Detected</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono">
          <button
            onClick={() => onFilterSeverity?.('critical')}
            className="flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <span>{stats.criticalVulns}</span> Crit
          </button>
          <button
            onClick={() => onFilterSeverity?.('high')}
            className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <span>{stats.highVulns}</span> High
          </button>
          <button
            onClick={() => onFilterSeverity?.('medium')}
            className="flex items-center gap-1 rounded bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            <span>{stats.mediumVulns}</span> Med
          </button>
          <button
            onClick={() => onFilterSeverity?.('low')}
            className="flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <span>{stats.lowVulns}</span> Low
          </button>
        </div>
      </div>
    </div>
  );
};
