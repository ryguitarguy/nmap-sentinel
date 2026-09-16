import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { MetricsOverview } from './components/MetricsOverview';
import { HostsInventory } from './components/HostsInventory';
import { VulnerabilityDashboard } from './components/VulnerabilityDashboard';
import { RealtimeMonitor } from './components/RealtimeMonitor';
import { ComprehensiveReportView } from './components/ComprehensiveReportView';
import { RawScanViewer } from './components/RawScanViewer';
import { UploadModal } from './components/UploadModal';
import { RemediationStatus, ScanData } from './types';
import { parseNmapScan } from './utils/parsers';
import { SAMPLE_SCANS } from './utils/sampleData';
import { calculateHostRiskScore } from './utils/vulnerabilityEngine';
import { RotateCcw, ArrowRight, Play, Upload, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Start with no scan loaded so the dashboard begins cleanly
  const [scan, setScan] = useState<ScanData | null>(null);

  const [activeTab, setActiveTab] = useState<'inventory' | 'vulnerabilities' | 'monitoring' | 'report' | 'raw'>('vulnerabilities');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const [selectedHostFilter, setSelectedHostFilter] = useState<string | undefined>(undefined);

  // Parse new scan from file upload or paste
  const handleLoadScan = (content: string, format?: 'txt' | 'xml' | 'json' | 'csv') => {
    try {
      const parsed = parseNmapScan(content, format);
      setScan(parsed);
      setSelectedHostFilter(undefined);
      setActiveTab('vulnerabilities');
    } catch (err) {
      console.error('Failed to parse scan:', err);
    }
  };

  // Load a pre-packaged sample scan by ID
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_SCANS.find((s) => s.id === sampleId);
    if (sample) {
      handleLoadScan(sample.content, sample.format);
    }
  };

  // Clear current scan and return to the empty state dashboard
  const handleClearScan = () => {
    setScan(null);
    setSelectedHostFilter(undefined);
    setActiveTab('vulnerabilities');
  };

  // Dynamic Remediation Status update (with instant recalculation of host risk and global score)
  const handleUpdateStatus = (vulnId: string, newStatus: RemediationStatus) => {
    if (!scan) return;

    setScan((prev) => {
      if (!prev) return null;

      const updatedVulns = prev.vulnerabilities.map((v) =>
        v.id === vulnId ? { ...v, status: newStatus } : v
      );

      // Recalculate hosts risk scores
      const updatedHosts = prev.hosts.map((host) => {
        const hostFindings = updatedVulns.filter((v) => v.hostIp === host.ip);
        const openPortsCount = host.ports.filter((p) => p.state === 'open').length;
        const newScore = calculateHostRiskScore(hostFindings, openPortsCount);
        return {
          ...host,
          riskScore: newScore,
          monitorStatus: newScore >= 60 ? ('critical' as const) : newScore >= 35 ? ('warning' as const) : ('normal' as const),
        };
      });

      // Recalculate overall posture score
      const activeVulns = updatedVulns.filter((v) => v.status !== 'resolved');
      const criticals = activeVulns.filter((v) => v.severity === 'critical').length;
      const highs = activeVulns.filter((v) => v.severity === 'high').length;
      const mediums = activeVulns.filter((v) => v.severity === 'medium').length;
      const lows = activeVulns.filter((v) => v.severity === 'low').length;
      const resolvedCount = updatedVulns.filter((v) => v.status === 'resolved').length;

      const penalty = criticals * 25 + highs * 12 + mediums * 5 + lows * 1;
      const overallScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));

      let attackSurfaceRating: ScanData['stats']['attackSurfaceRating'] = 'Minimal';
      if (overallScore < 45 || criticals >= 2) attackSurfaceRating = 'Severe';
      else if (overallScore < 70 || highs >= 2) attackSurfaceRating = 'Elevated';
      else if (overallScore < 90 || prev.stats.totalOpenPorts > 8) attackSurfaceRating = 'Moderate';

      return {
        ...prev,
        vulnerabilities: updatedVulns,
        hosts: updatedHosts,
        stats: {
          ...prev.stats,
          criticalVulns: criticals,
          highVulns: highs,
          mediumVulns: mediums,
          lowVulns: lows,
          resolvedVulns: resolvedCount,
          overallScore,
          attackSurfaceRating,
        },
      };
    });
  };

  const handleSelectHostForVulns = (hostIp: string) => {
    setSelectedHostFilter(hostIp);
    setActiveTab('vulnerabilities');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <Navbar
        scan={scan}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenReport={() => setActiveTab('report')}
        onClearScan={handleClearScan}
        onSelectSample={handleSelectSample}
        isMonitoringActive={isMonitoringActive}
        onToggleMonitoring={() => setIsMonitoringActive((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* If no scan is loaded, display the clean welcome empty state */}
        {!scan ? (
          <EmptyState
            onLoadScan={handleLoadScan}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        ) : (
          <>
            {/* Active Scan Context Banner */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400">Loaded Scan:</span>
                <span className="font-semibold text-white">{scan.scanTitle}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 border border-slate-700">
                  {scan.inputFormat.toUpperCase()}
                </span>
                <span className="text-slate-500 font-mono hidden md:inline">
                  • {scan.hosts.length} Hosts • {scan.vulnerabilities.length} Weak Spots
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Switch Scan</span>
                </button>
                <span className="text-slate-700">|</span>
                <button
                  onClick={handleClearScan}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-300 font-medium transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear & Reset</span>
                </button>
              </div>
            </div>

            {/* Metric Cards Overview */}
            <MetricsOverview
              scan={scan}
              onOpenReport={() => setActiveTab('report')}
              onFilterSeverity={() => setActiveTab('vulnerabilities')}
            />

            {/* Dynamic Tab Views */}
            {activeTab === 'vulnerabilities' && (
              <VulnerabilityDashboard
                vulnerabilities={scan.vulnerabilities}
                onUpdateStatus={handleUpdateStatus}
                selectedHostFilter={selectedHostFilter}
                onClearHostFilter={() => setSelectedHostFilter(undefined)}
              />
            )}

            {activeTab === 'inventory' && (
              <HostsInventory scan={scan} onSelectHostForVulns={handleSelectHostForVulns} />
            )}

            {activeTab === 'monitoring' && (
              <RealtimeMonitor
                scan={scan}
                isMonitoringActive={isMonitoringActive}
                onToggleMonitoring={() => setIsMonitoringActive((prev) => !prev)}
              />
            )}

            {activeTab === 'report' && <ComprehensiveReportView scan={scan} />}

            {activeTab === 'raw' && <RawScanViewer scan={scan} />}
          </>
        )}
      </main>

      {/* Footer status banner */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Nmap Sentinel Security Suite • Compatible with Nmap stdout, <code className="text-cyan-400 font-mono">-oX</code> XML, JSON, and CSV exports
          </span>
          <div className="flex items-center gap-3">
            {scan ? (
              <>
                <button
                  onClick={() => setActiveTab('raw')}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Inspect Raw AST
                </button>
                <span>•</span>
                <button
                  onClick={handleClearScan}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear Scan
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Open Ingestion Modal
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Ingestion & Upload Dialog */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLoadScan={handleLoadScan}
      />
    </div>
  );
}
