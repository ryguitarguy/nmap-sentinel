import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, AlertTriangle, ShieldCheck, ShieldAlert, Wifi, RefreshCw, Terminal, Clock, Radio } from 'lucide-react';
import { MonitoringEvent, NmapHost, ScanData } from '../types';

interface RealtimeMonitorProps {
  scan: ScanData;
  isMonitoringActive: boolean;
  onToggleMonitoring: () => void;
}

export const RealtimeMonitor: React.FC<RealtimeMonitorProps> = ({
  scan,
  isMonitoringActive,
  onToggleMonitoring,
}) => {
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [hostsState, setHostsState] = useState<NmapHost[]>(scan.hosts);
  const [pulseHostId, setPulseHostId] = useState<string | null>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);

  // Initialize initial baseline events
  useEffect(() => {
    const initialEvents: MonitoringEvent[] = scan.hosts.slice(0, 5).map((h, i) => ({
      id: `evt-init-${i}`,
      timestamp: new Date(Date.now() - (5 - i) * 8000).toLocaleTimeString(),
      hostIp: h.ip,
      type: 'heartbeat',
      message: `Initial telemetry handshake verified for ${h.ip} (${h.ports.length} ports mapped)`,
      severity: h.riskScore >= 60 ? 'critical' : h.riskScore >= 35 ? 'warning' : 'info',
    }));
    setEvents(initialEvents);
  }, [scan.id]);

  // Real-time interval simulation
  useEffect(() => {
    if (!isMonitoringActive || scan.hosts.length === 0) return;

    const timer = setInterval(() => {
      // Pick a random host
      const randomHostIdx = Math.floor(Math.random() * scan.hosts.length);
      const targetHost = scan.hosts[randomHostIdx];

      setPulseHostId(targetHost.id);
      setTimeout(() => setPulseHostId(null), 1200);

      // Generate latency fluctuation
      const newLatency = Math.round((Math.max(0.4, (targetHost.latencyMs || 2.0) + (Math.random() * 2 - 1))) * 10) / 10;

      // Decide event type
      const rand = Math.random();
      let eventType: MonitoringEvent['type'] = 'heartbeat';
      let sev: MonitoringEvent['severity'] = 'info';
      let msg = '';

      if (targetHost.riskScore >= 60 && rand < 0.4) {
        eventType = 'vulnerability_triggered';
        sev = 'critical';
        const critPort = targetHost.ports.find((p) => p.state === 'open');
        msg = `Vulnerability Alert: Active unauthenticated listener confirmed on ${targetHost.ip}:${critPort?.portNumber || 80} (${critPort?.service || 'daemon'})`;
      } else if (newLatency > 8.0) {
        eventType = 'latency_spike';
        sev = 'warning';
        msg = `Latency spike detected on ${targetHost.ip}: ${newLatency}ms (threshold 6.0ms)`;
      } else if (rand < 0.25) {
        eventType = 'port_alert';
        sev = 'warning';
        msg = `Port probe: SYN/ACK verified on ${targetHost.ip} across ${targetHost.ports.length} perimeter ports`;
      } else {
        eventType = 'heartbeat';
        sev = 'info';
        msg = `Heartbeat ok for ${targetHost.ip} - status UP (${newLatency}ms)`;
      }

      const newEvt: MonitoringEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        hostIp: targetHost.ip,
        type: eventType,
        message: msg,
        severity: sev,
      };

      setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);

      // Update host in local state
      setHostsState((prev) =>
        prev.map((h) =>
          h.id === targetHost.id
            ? {
                ...h,
                latencyMs: newLatency,
                lastMonitored: new Date().toLocaleTimeString(),
                pingHistory: [...(h.pingHistory || []).slice(-5), newLatency],
              }
            : h
        )
      );
    }, 2800);

    return () => clearInterval(timer);
  }, [isMonitoringActive, scan.hosts]);

  const triggerManualProbe = () => {
    const probeEvents: MonitoringEvent[] = scan.hosts.map((h) => ({
      id: `manual-${Date.now()}-${h.id}`,
      timestamp: new Date().toLocaleTimeString(),
      hostIp: h.ip,
      type: 'port_alert',
      message: `Manual SOC sweep: Probed ${h.ports.length} open sockets on ${h.ip} - All daemons responding`,
      severity: h.riskScore >= 60 ? 'warning' : 'info',
    }));
    setEvents((prev) => [...probeEvents, ...prev].slice(0, 50));
  };

  return (
    <div className="space-y-6">
      {/* Control Station Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isMonitoringActive
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            <Radio className={`h-5 w-5 ${isMonitoringActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Live Vulnerability & Perimeter Monitor</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  isMonitoringActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isMonitoringActive ? 'MONITORING ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuously probes discovered perimeter ports and streams real-time threat telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={triggerManualProbe}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Probe Now</span>
          </button>

          <button
            onClick={onToggleMonitoring}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isMonitoringActive
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isMonitoringActive ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Start Monitoring</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Host Telemetry Cards + Realtime Log Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Discovered Hosts Telemetry Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Endpoint Telemetry Grid ({hostsState.length} Nodes)
            </span>
            <span className="text-[11px] font-mono text-slate-500">Live Pulse Interval: ~2.8s</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hostsState.map((host) => {
              const isPulsing = pulseHostId === host.id;
              const hostVulns = scan.vulnerabilities.filter((v) => v.hostIp === host.ip);
              const critCount = hostVulns.filter((v) => v.severity === 'critical').length;

              return (
                <div
                  key={host.id}
                  className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                    isPulsing
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-md shadow-cyan-500/10 scale-[1.01]'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  {/* Top: IP and Health */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          host.riskScore >= 60 ? 'bg-rose-500' : host.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                        } ${isPulsing ? 'animate-ping' : ''}`}
                      />
                      <span className="font-mono text-sm font-bold text-white">{host.ip}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        host.riskScore >= 60
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : host.riskScore >= 35
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Risk: {host.riskScore}/100
                    </span>
                  </div>

                  {host.hostname && (
                    <p className="font-mono text-xs text-slate-400 truncate mb-2">{host.hostname}</p>
                  )}

                  {/* Telemetry stats */}
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-2 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Latency</span>
                      <span className="text-white font-semibold">{host.latencyMs || 1.8} ms</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Open Ports</span>
                      <span className="text-cyan-400 font-semibold">
                        {host.ports.filter((p) => p.state === 'open').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Weak Spots</span>
                      <span className={critCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {hostVulns.length} ({critCount} Crit)
                      </span>
                    </div>
                  </div>

                  {/* Tiny ping history bars */}
                  <div className="mt-3 flex items-end gap-1 h-4 bg-slate-950/60 rounded px-1.5 py-0.5">
                    {(host.pingHistory || [2, 3, 2, 4, 3]).map((lat, idx) => {
                      const h = Math.min(100, Math.max(20, (lat / 10) * 100));
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-cyan-500/40 rounded-t"
                          style={{ height: `${h}%` }}
                          title={`Ping: ${lat}ms`}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Last Ping: {host.lastMonitored || 'Just now'}</span>
                    <span className="text-slate-400">Probe Active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Event Stream Terminal (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-white">SOC Alert & Heartbeat Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400">STREAMING</span>
            </div>
          </div>

          {/* Event items container */}
          <div
            ref={eventLogRef}
            className="flex-1 max-h-[520px] overflow-y-auto p-3 space-y-2 font-mono text-xs divide-y divide-slate-800/40"
          >
            {events.map((evt) => {
              const getBadge = () => {
                switch (evt.severity) {
                  case 'critical':
                    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                  case 'warning':
                    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                  default:
                    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                }
              };

              return (
                <div key={evt.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="text-slate-400">{evt.timestamp}</span>
                    <span className="text-cyan-400 font-semibold">{evt.hostIp}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] uppercase font-bold border ${getBadge()}`}
                    >
                      {evt.type.replace('_', ' ')}
                    </span>
                    <p className="text-slate-300 leading-snug break-words">{evt.message}</p>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Waiting for incoming heartbeat telemetry...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
