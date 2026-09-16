import { NmapHost, NmapPort, ScanData, VulnerabilityFinding } from '../types';
import { analyzeHostVulnerabilities, calculateHostRiskScore } from './vulnerabilityEngine';

export function parseNmapScan(rawInput: string, customFormat?: 'txt' | 'xml' | 'json' | 'csv'): ScanData {
  const trimmed = rawInput.trim();
  let format: 'txt' | 'xml' | 'json' | 'csv' = customFormat || detectFormat(trimmed);

  let hosts: NmapHost[] = [];
  let nmapVersion = '';
  let scanArgs = '';

  try {
    if (format === 'json') {
      hosts = parseJsonScan(trimmed);
    } else if (format === 'xml') {
      const xmlRes = parseXmlScan(trimmed);
      hosts = xmlRes.hosts;
      nmapVersion = xmlRes.version;
      scanArgs = xmlRes.args;
    } else if (format === 'csv') {
      hosts = parseCsvScan(trimmed);
    } else {
      format = 'txt';
      const txtRes = parseTextScan(trimmed);
      hosts = txtRes.hosts;
      nmapVersion = txtRes.version;
      scanArgs = txtRes.args;
    }
  } catch (err: any) {
    console.error('Primary parsing failed, falling back to text regex parser:', err);
    format = 'txt';
    const txtRes = parseTextScan(trimmed);
    hosts = txtRes.hosts;
  }

  // If no hosts were parsed, generate a fallback host if raw text contains ports
  if (hosts.length === 0 && trimmed.length > 0) {
    const fallbackPorts = extractLoosePorts(trimmed);
    if (fallbackPorts.length > 0) {
      hosts.push({
        id: 'host-1',
        ip: '127.0.0.1',
        hostname: 'target-endpoint',
        status: 'up',
        latencyMs: 1.2,
        ports: fallbackPorts,
        riskScore: 50,
      });
    }
  }

  // Analyze vulnerabilities and calculate risk for each host
  let allVulnerabilities: VulnerabilityFinding[] = [];
  hosts = hosts.map((host, idx) => {
    const findings = analyzeHostVulnerabilities(host);
    allVulnerabilities.push(...findings);
    const score = calculateHostRiskScore(findings, host.ports.filter((p) => p.state === 'open').length);
    const mockLatency = host.latencyMs || Math.round((0.5 + Math.random() * 8.5) * 10) / 10;

    return {
      ...host,
      id: host.id || `host-${idx + 1}-${host.ip.replace(/[^a-zA-Z0-9]/g, '-')}`,
      riskScore: score,
      latencyMs: mockLatency,
      monitorStatus: score >= 60 ? 'critical' : score >= 35 ? 'warning' : 'normal',
      pingHistory: [mockLatency, mockLatency + 0.3, Math.max(0.1, mockLatency - 0.2), mockLatency],
      lastMonitored: new Date().toLocaleTimeString(),
    };
  });

  // Calculate overall stats
  const totalHosts = hosts.length;
  const hostsUp = hosts.filter((h) => h.status === 'up').length;
  const totalOpenPorts = hosts.reduce((acc, h) => acc + h.ports.filter((p) => p.state === 'open').length, 0);

  const criticalVulns = allVulnerabilities.filter((v) => v.severity === 'critical').length;
  const highVulns = allVulnerabilities.filter((v) => v.severity === 'high').length;
  const mediumVulns = allVulnerabilities.filter((v) => v.severity === 'medium').length;
  const lowVulns = allVulnerabilities.filter((v) => v.severity === 'low').length;

  // Overall posture score: 100 is pristine, drops with findings
  let penalty = criticalVulns * 25 + highVulns * 12 + mediumVulns * 5 + lowVulns * 1;
  const overallScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));

  let attackSurfaceRating: ScanData['stats']['attackSurfaceRating'] = 'Minimal';
  if (overallScore < 45 || criticalVulns >= 2) attackSurfaceRating = 'Severe';
  else if (overallScore < 70 || highVulns >= 2) attackSurfaceRating = 'Elevated';
  else if (overallScore < 90 || totalOpenPorts > 8) attackSurfaceRating = 'Moderate';

  return {
    id: `scan-${Date.now()}`,
    scanTitle: `Scan Assessment ${new Date().toLocaleDateString()} (${totalHosts} targets)`,
    scanTime: new Date().toLocaleString(),
    rawInput,
    inputFormat: format,
    nmapVersion,
    scanArgs,
    hosts,
    vulnerabilities: allVulnerabilities,
    stats: {
      totalHosts,
      hostsUp,
      totalOpenPorts,
      criticalVulns,
      highVulns,
      mediumVulns,
      lowVulns,
      resolvedVulns: 0,
      overallScore,
      attackSurfaceRating,
    },
  };
}

export function detectFormat(content: string): 'txt' | 'xml' | 'json' | 'csv' {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid json
    }
  }
  if (trimmed.startsWith('<?xml') || trimmed.includes('<nmaprun') || (trimmed.startsWith('<') && trimmed.includes('</'))) {
    return 'xml';
  }
  const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length > 1) {
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes(',') && (firstLine.includes('port') || firstLine.includes('ip') || firstLine.includes('host'))) {
      return 'csv';
    }
  }
  return 'txt';
}

function parseTextScan(text: string): { hosts: NmapHost[]; version: string; args: string } {
  const hosts: NmapHost[] = [];
  const lines = text.split(/\r?\n/);

  let version = '';
  let args = '';

  const versionMatch = text.match(/Starting Nmap\s+([0-9\.]+.*?)\s+at/i);
  if (versionMatch) version = versionMatch[1];

  const argsMatch = text.match(/nmap\s+([^\r\n]+)/i);
  if (argsMatch) args = argsMatch[1];

  let currentHost: Partial<NmapHost> | null = null;
  let currentPortList: NmapPort[] = [];
  let inPortSection = false;

  const finalizeCurrentHost = () => {
    if (currentHost && (currentHost.ip || currentHost.hostname)) {
      hosts.push({
        id: `host-${hosts.length + 1}-${(currentHost.ip || 'target').replace(/[^a-zA-Z0-9]/g, '-')}`,
        ip: currentHost.ip || 'Unknown IP',
        hostname: currentHost.hostname || currentHost.ip,
        status: currentHost.status || 'up',
        latencyMs: currentHost.latencyMs || 2.4,
        osName: currentHost.osName,
        macAddress: currentHost.macAddress,
        vendor: currentHost.vendor,
        ports: currentPortList,
        riskScore: 0,
      });
    }
    currentHost = null;
    currentPortList = [];
    inPortSection = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Host start: "Nmap scan report for myserver.domain (192.168.1.50)" or "Nmap scan report for 192.168.1.50"
    if (line.toLowerCase().startsWith('nmap scan report for')) {
      finalizeCurrentHost();
      const hostPart = line.substring('Nmap scan report for'.length).trim();
      const parenMatch = hostPart.match(/^(.*?)\s*\((.*?)\)$/);

      if (parenMatch) {
        currentHost = {
          hostname: parenMatch[1].trim(),
          ip: parenMatch[2].trim(),
          status: 'up',
        };
      } else {
        const isIp = /^[0-9a-fA-F:.]+$/.test(hostPart);
        currentHost = {
          ip: hostPart,
          hostname: isIp ? undefined : hostPart,
          status: 'up',
        };
      }
      continue;
    }

    if (!currentHost) continue;

    // Host status & latency: "Host is up (0.0012s latency)."
    if (line.toLowerCase().startsWith('host is up')) {
      currentHost.status = 'up';
      const latMatch = line.match(/\(([\d\.]+)\s*s\s+latency\)/i);
      if (latMatch) {
        currentHost.latencyMs = Math.round(parseFloat(latMatch[1]) * 1000 * 10) / 10;
      }
      continue;
    }

    // MAC Address: "MAC Address: 00:0C:29:4F:8E:22 (VMware)"
    if (line.toLowerCase().startsWith('mac address:')) {
      const macMatch = line.match(/mac address:\s*([0-9a-f:]+)(?:\s*\((.*?)\))?/i);
      if (macMatch) {
        currentHost.macAddress = macMatch[1];
        if (macMatch[2]) currentHost.vendor = macMatch[2];
      }
      continue;
    }

    // OS detection: "OS details: Linux 4.15 - 5.6", "Running: Linux 5.X"
    if (line.toLowerCase().startsWith('os details:') || line.toLowerCase().startsWith('running:')) {
      const osName = line.split(':')[1]?.trim();
      if (osName && !currentHost.osName) {
        currentHost.osName = osName;
      }
      continue;
    }

    // Port table header: "PORT   STATE SERVICE VERSION"
    if (line.match(/^port\s+state\s+service/i)) {
      inPortSection = true;
      continue;
    }

    // Port line: e.g. "80/tcp open http Apache httpd 2.4.49 ((Unix))" or "22/tcp open ssh"
    const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(\w+)\s+([a-zA-Z0-9_\-\.\?]+)(?:\s+(.*))?$/i);
    if (portMatch) {
      inPortSection = true;
      const portNum = parseInt(portMatch[1], 10);
      const proto = portMatch[2].toLowerCase() as 'tcp' | 'udp';
      const state = portMatch[3].toLowerCase() as NmapPort['state'];
      const service = portMatch[4];
      const versionStr = portMatch[5] || '';

      currentPortList.push({
        portNumber: portNum,
        protocol: proto,
        state: state === 'open' || state === 'filtered' || state === 'closed' ? state : 'open',
        service,
        version: versionStr,
        product: versionStr.split(' ')[0] || service,
        scriptsOutput: {},
      });
      continue;
    }

    // Script output lines attached to previous port: e.g. "|  ftp-anon: Anonymous FTP login allowed"
    if (line.startsWith('|') || line.startsWith('|_')) {
      if (currentPortList.length > 0) {
        const lastPort = currentPortList[currentPortList.length - 1];
        lastPort.scriptsOutput = lastPort.scriptsOutput || {};
        const cleanScript = line.replace(/^[|_]\s*/, '');
        const colonIdx = cleanScript.indexOf(':');
        if (colonIdx !== -1) {
          const key = cleanScript.substring(0, colonIdx).trim();
          const val = cleanScript.substring(colonIdx + 1).trim();
          lastPort.scriptsOutput[key] = (lastPort.scriptsOutput[key] ? lastPort.scriptsOutput[key] + '\n' : '') + val;
        } else {
          lastPort.scriptsOutput['info'] = (lastPort.scriptsOutput['info'] ? lastPort.scriptsOutput['info'] + '\n' : '') + cleanScript;
        }
      }
      continue;
    }

    // End of port section on empty or footer lines
    if (inPortSection && line === '') {
      // keep going for OS info
    }
  }

  finalizeCurrentHost();
  return { hosts, version, args };
}

function parseXmlScan(xmlStr: string): { hosts: NmapHost[]; version: string; args: string } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');

  const nmaprun = xmlDoc.querySelector('nmaprun');
  const version = nmaprun?.getAttribute('version') || '';
  const args = nmaprun?.getAttribute('args') || '';

  const hostElements = xmlDoc.querySelectorAll('host');
  const hosts: NmapHost[] = [];

  hostElements.forEach((hEl, idx) => {
    // Status
    const statusEl = hEl.querySelector('status');
    const status = statusEl?.getAttribute('state') === 'up' ? 'up' : 'down';

    // IP & MAC
    let ip = '';
    let macAddress = '';
    let vendor = '';
    const addressEls = hEl.querySelectorAll('address');
    addressEls.forEach((addrEl) => {
      const addrType = addrEl.getAttribute('addrtype');
      const addrVal = addrEl.getAttribute('addr') || '';
      if (addrType === 'ipv4' || addrType === 'ipv6') {
        ip = addrVal;
      } else if (addrType === 'mac') {
        macAddress = addrVal;
        vendor = addrEl.getAttribute('vendor') || '';
      }
    });

    if (!ip) ip = `192.168.1.${idx + 10}`;

    // Hostname
    const hostnameEl = hEl.querySelector('hostnames hostname');
    const hostname = hostnameEl?.getAttribute('name') || undefined;

    // Latency
    const timesEl = hEl.querySelector('times');
    let latencyMs = 2.0;
    if (timesEl?.getAttribute('srtt')) {
      const srtt = parseInt(timesEl.getAttribute('srtt') || '2000', 10);
      latencyMs = Math.round((srtt / 1000) * 10) / 10;
    }

    // OS
    const osMatchEl = hEl.querySelector('os osmatch');
    const osName = osMatchEl?.getAttribute('name') || undefined;
    const osAccuracy = osMatchEl?.getAttribute('accuracy') ? parseInt(osMatchEl.getAttribute('accuracy')!, 10) : undefined;

    // Ports
    const ports: NmapPort[] = [];
    const portEls = hEl.querySelectorAll('ports port');
    portEls.forEach((pEl) => {
      const portId = parseInt(pEl.getAttribute('portid') || '0', 10);
      const protocol = (pEl.getAttribute('protocol') || 'tcp').toLowerCase() as 'tcp' | 'udp';
      const stateEl = pEl.querySelector('state');
      const state = (stateEl?.getAttribute('state') || 'open') as NmapPort['state'];

      const serviceEl = pEl.querySelector('service');
      const service = serviceEl?.getAttribute('name') || 'unknown';
      const product = serviceEl?.getAttribute('product') || '';
      const ver = serviceEl?.getAttribute('version') || '';
      const extraInfo = serviceEl?.getAttribute('extrainfo') || '';

      const scriptsOutput: Record<string, string> = {};
      const scriptEls = pEl.querySelectorAll('script');
      scriptEls.forEach((sEl) => {
        const id = sEl.getAttribute('id') || 'script';
        const output = sEl.getAttribute('output') || '';
        scriptsOutput[id] = output;
      });

      ports.push({
        portNumber: portId,
        protocol,
        state,
        service,
        version: ver,
        product,
        extraInfo,
        scriptsOutput,
      });
    });

    hosts.push({
      id: `host-${idx + 1}-${ip.replace(/[^a-zA-Z0-9]/g, '-')}`,
      ip,
      hostname,
      status,
      latencyMs,
      osName,
      osAccuracy,
      macAddress,
      vendor,
      ports,
      riskScore: 0,
    });
  });

  return { hosts, version, args };
}

function parseJsonScan(jsonStr: string): NmapHost[] {
  const parsed = JSON.parse(jsonStr);
  const rawList = Array.isArray(parsed) ? parsed : parsed.hosts || parsed.targets || [parsed];

  return rawList.map((item: any, idx: number): NmapHost => {
    const ip = item.ip || item.address || item.host || `10.0.0.${idx + 1}`;
    const ports: NmapPort[] = (item.ports || item.services || []).map((p: any) => ({
      portNumber: Number(p.portNumber || p.port || p.portid || 80),
      protocol: (p.protocol || 'tcp').toLowerCase() as 'tcp' | 'udp',
      state: (p.state || 'open') as NmapPort['state'],
      service: p.service || p.name || 'unknown',
      version: p.version || '',
      product: p.product || '',
      extraInfo: p.extraInfo || '',
      scriptsOutput: p.scriptsOutput || p.scripts || {},
    }));

    return {
      id: item.id || `host-${idx + 1}-${ip.replace(/[^a-zA-Z0-9]/g, '-')}`,
      ip,
      hostname: item.hostname || item.name,
      status: item.status === 'down' ? 'down' : 'up',
      latencyMs: item.latencyMs || item.latency || 2.5,
      osName: item.osName || item.os,
      osAccuracy: item.osAccuracy,
      macAddress: item.macAddress || item.mac,
      vendor: item.vendor,
      ports,
      riskScore: 0,
    };
  });
}

function parseCsvScan(csvStr: string): NmapHost[] {
  const lines = csvStr.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const hostMap = new Map<string, { hostname?: string; os?: string; ports: NmapPort[] }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });

    const ip = row['ip'] || row['host'] || row['ipaddress'] || row['target'] || '127.0.0.1';
    const hostname = row['hostname'] || row['name'];
    const portNum = parseInt(row['port'] || row['portnumber'] || row['portid'] || '0', 10);
    const protocol = (row['protocol'] || row['proto'] || 'tcp').toLowerCase() as 'tcp' | 'udp';
    const state = (row['state'] || row['status'] || 'open').toLowerCase() as NmapPort['state'];
    const service = row['service'] || row['servicename'] || 'unknown';
    const version = row['version'] || row['banner'] || '';
    const os = row['os'] || row['operatingsystem'];

    if (!hostMap.has(ip)) {
      hostMap.set(ip, { hostname, os, ports: [] });
    }

    if (portNum > 0) {
      hostMap.get(ip)!.ports.push({
        portNumber: portNum,
        protocol,
        state: state === 'open' || state === 'filtered' || state === 'closed' ? state : 'open',
        service,
        version,
        product: version.split(' ')[0] || service,
        scriptsOutput: {},
      });
    }
  }

  const hosts: NmapHost[] = [];
  let idx = 0;
  hostMap.forEach((data, ip) => {
    hosts.push({
      id: `host-${++idx}-${ip.replace(/[^a-zA-Z0-9]/g, '-')}`,
      ip,
      hostname: data.hostname,
      status: 'up',
      osName: data.os,
      ports: data.ports,
      riskScore: 0,
    });
  });

  return hosts;
}

function extractLoosePorts(text: string): NmapPort[] {
  const ports: NmapPort[] = [];
  const regex = /(\d+)\/(tcp|udp)\s+(\w+)\s+([a-zA-Z0-9_\-]+)(?:\s+(.*))?/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ports.push({
      portNumber: parseInt(match[1], 10),
      protocol: match[2].toLowerCase() as 'tcp' | 'udp',
      state: (match[3].toLowerCase() as NmapPort['state']) || 'open',
      service: match[4],
      version: match[5]?.trim() || '',
      product: match[5]?.split(' ')[0] || match[4],
      scriptsOutput: {},
    });
  }
  return ports;
}
