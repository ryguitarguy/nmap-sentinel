import React, { useState } from 'react';
import { Server, ChevronDown, ChevronRight, ShieldAlert, Cpu, Network, Search, Filter, Terminal, Wifi } from 'lucide-react';
import { NmapHost, ScanData } from '../types';

interface HostsInventoryProps {
  scan: ScanData;
  onSelectHostForVulns?: (hostIp: string) => void;
}

export const HostsInventory: React.FC<HostsInventoryProps> = ({ scan, onSelectHostForVulns }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHosts, setExpandedHosts] = useState<Record<string, boolean>>({});
  const [filterRisk, setFilterRisk] = useState<'all' | 'critical' | 'high'>('all');

  const toggleExpand = (hostId: string) => {
    setExpandedHosts((prev) => ({ ...prev, [hostId]: !prev[hostId] }));
  };

  const filteredHosts = scan.hosts.filter((host) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      host.ip.toLowerCase().includes(term) ||
      (host.hostname && host.hostname.toLowerCase().includes(term)) ||
      (host.osName && host.osName.toLowerCase().includes(term)) ||
      host.ports.some((p) => p.portNumber.toString().includes(term) || p.service.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (filterRisk === 'critical') return host.riskScore >= 60;
    if (filterRisk === 'high') return host.riskScore >= 35;
    return true;
  });

  const getRiskColor = (score: number) => {
    if (score >= 60) return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    if (score >= 35) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by IP, hostname, service, port, or OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Filter Risk:</span>
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setFilterRisk('all')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filterRisk === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({scan.hosts.length})
            </button>
            <button
              onClick={() => setFilterRisk('high')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filterRisk === 'high' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => setFilterRisk('critical')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filterRisk === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical
            </button>
          </div>
        </div>
      </div>

      {/* Host Cards */}
      <div className="space-y-3">
        {filteredHosts.map((host) => {
          const isExpanded = !!expandedHosts[host.id];
          const openPorts = host.ports.filter((p) => p.state === 'open');
          const hostVulns = scan.vulnerabilities.filter((v) => v.hostIp === host.ip);
          const critVulns = hostVulns.filter((v) => v.severity === 'critical');

          return (
            <div
              key={host.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 transition-all hover:border-slate-700 shadow-sm"
            >
              {/* Host Summary Header */}
              <div
                onClick={() => toggleExpand(host.id)}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 cursor-pointer gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button className="mt-1 text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-white tracking-wide">{host.ip}</span>
                      {host.hostname && (
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300 border border-slate-700/50">
                          {host.hostname}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          host.status === 'up'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        {host.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      {host.osName && (
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3.5 w-3.5 text-slate-500" />
                          <span>{host.osName}</span>
                        </div>
                      )}
                      {host.latencyMs !== undefined && (
                        <div className="flex items-center gap-1">
                          <Wifi className="h-3.5 w-3.5 text-slate-500" />
                          <span>{host.latencyMs} ms latency</span>
                        </div>
                      )}
                      {host.macAddress && (
                        <div className="flex items-center gap-1 font-mono text-slate-400">
                          <span>MAC: {host.macAddress}</span>
                          {host.vendor && <span className="text-slate-500">({host.vendor})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right badges & risk score */}
                <div className="flex items-center gap-3 pl-7 lg:pl-0">
                  {/* Quick port chips */}
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {openPorts.slice(0, 6).map((p) => (
                      <span
                        key={p.portNumber}
                        className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300 border border-slate-800"
                      >
                        {p.portNumber}/{p.protocol}
                      </span>
                    ))}
                    {openPorts.length > 6 && (
                      <span className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-slate-400 border border-slate-800">
                        +{openPorts.length - 6} more
                      </span>
                    )}
                  </div>

                  {/* Vulnerability pill */}
                  {hostVulns.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHostForVulns?.(host.ip);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${getRiskColor(
                        host.riskScore
                      )} hover:opacity-80`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{hostVulns.length} Issues</span>
                      {critVulns.length > 0 && (
                        <span className="ml-1 rounded-full bg-rose-500 text-white text-[10px] px-1 font-bold">
                          {critVulns.length} Crit
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-400">
                      Clean
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Port Table */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-slate-300">
                      Discovered Listening Services ({host.ports.length} ports evaluated)
                    </span>
                    <span className="text-[11px] font-mono">Host ID: {host.id}</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono">
                        <tr>
                          <th className="py-2.5 px-3">Port</th>
                          <th className="py-2.5 px-3">Protocol</th>
                          <th className="py-2.5 px-3">State</th>
                          <th className="py-2.5 px-3">Service</th>
                          <th className="py-2.5 px-3">Banner / Version</th>
                          <th className="py-2.5 px-3 text-right">Scripts / Findings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {host.ports.map((port) => {
                          const portFindings = hostVulns.filter((v) => v.port === port.portNumber);
                          const hasCrit = portFindings.some((f) => f.severity === 'critical');
                          const hasHigh = portFindings.some((f) => f.severity === 'high');

                          return (
                            <React.Fragment key={`${port.portNumber}-${port.protocol}`}>
                              <tr className="hover:bg-slate-900/40 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-white">{port.portNumber}</td>
                                <td className="py-2.5 px-3 uppercase text-slate-400">{port.protocol}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                      port.state === 'open'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {port.state}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-cyan-300">{port.service}</td>
                                <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                                  {port.version || port.product || port.extraInfo || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {portFindings.length > 0 ? (
                                    <span
                                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                                        hasCrit
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                          : hasHigh
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                      }`}
                                    >
                                      {portFindings.length} Vulnerability Flag(s)
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">Normal</span>
                                  )}
                                </td>
                              </tr>

                              {/* Script output rows if any */}
                              {port.scriptsOutput && Object.keys(port.scriptsOutput).length > 0 && (
                                <tr className="bg-slate-950/80">
                                  <td colSpan={6} className="py-2 px-4 border-t border-slate-800/40">
                                    <div className="space-y-1 text-[11px] font-mono text-slate-400">
                                      {Object.entries(port.scriptsOutput).map(([k, v]) => (
                                        <div key={k} className="flex items-start gap-2">
                                          <span className="text-cyan-400 font-semibold">{k}:</span>
                                          <pre className="whitespace-pre-wrap text-slate-300">{v}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredHosts.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
            <p>No hosts matching search criteria "{searchTerm}".</p>
          </div>
        )}
      </div>
    </div>
  );
};
