export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type VulnCategory =
  | 'insecure-protocol'
  | 'exposed-database'
  | 'known-exploit'
  | 'unauthenticated-service'
  | 'misconfiguration'
  | 'legacy-crypto'
  | 'management-interface';

export type RemediationStatus = 'open' | 'investigating' | 'mitigated' | 'resolved';

export interface NmapPort {
  portNumber: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed' | 'unfiltered';
  service: string;
  version?: string;
  product?: string;
  extraInfo?: string;
  scriptsOutput?: Record<string, string>;
  tunnel?: string;
}

export interface NmapHost {
  id: string;
  ip: string;
  hostname?: string;
  status: 'up' | 'down';
  latencyMs?: number;
  osName?: string;
  osAccuracy?: number;
  macAddress?: string;
  vendor?: string;
  ports: NmapPort[];
  riskScore: number; // 0 (safest) to 100 (most critical)
  lastMonitored?: string;
  monitorStatus?: 'normal' | 'warning' | 'critical' | 'offline';
  pingHistory?: number[];
}

export interface RemediationCommand {
  label: string;
  command: string;
  os?: 'linux' | 'windows' | 'network' | 'generic';
}

export interface VulnerabilityFinding {
  id: string;
  hostIp: string;
  hostName?: string;
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  title: string;
  severity: SeverityLevel;
  cvss: number;
  cveId?: string;
  cweId?: string;
  category: VulnCategory;
  description: string;
  impact: string;
  remediation: {
    title: string;
    steps: string[];
    commands?: RemediationCommand[];
    references?: string[];
  };
  status: RemediationStatus;
  detectedAt: string;
  notes?: string;
}

export interface ScanReportStats {
  totalHosts: number;
  hostsUp: number;
  totalOpenPorts: number;
  criticalVulns: number;
  highVulns: number;
  mediumVulns: number;
  lowVulns: number;
  resolvedVulns: number;
  overallScore: number; // 0-100 (Security Posture Index: 100 is best)
  attackSurfaceRating: 'Minimal' | 'Moderate' | 'Elevated' | 'Severe';
}

export interface ScanData {
  id: string;
  scanTitle: string;
  scanTime: string;
  rawInput: string;
  inputFormat: 'txt' | 'xml' | 'json' | 'csv';
  nmapVersion?: string;
  scanArgs?: string;
  hosts: NmapHost[];
  vulnerabilities: VulnerabilityFinding[];
  stats: ScanReportStats;
}

export interface MonitoringEvent {
  id: string;
  timestamp: string;
  hostIp: string;
  type: 'status_change' | 'latency_spike' | 'port_alert' | 'heartbeat' | 'vulnerability_triggered' | 'remediation_applied';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}
