export interface SampleScanOption {
  id: string;
  name: string;
  badge: string;
  format: 'txt' | 'xml' | 'json' | 'csv';
  description: string;
  content: string;
}

export const SAMPLE_SCANS: SampleScanOption[] = [
  {
    id: 'dmz-perimeter',
    name: 'Perimeter DMZ & Web Gateway Audit',
    badge: 'Critical Risks',
    format: 'txt',
    description: 'Multiple Linux hosts featuring vsftpd backdoor banner, Apache 2.4.49 RCE, exposed Redis cache, and legacy Telnet switch.',
    content: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-16 10:15 EDT
Nmap scan report for dmz-gw01.corp.internal (192.168.10.1)
Host is up (0.0014s latency).
MAC Address: 00:50:56:9A:82:11 (VMware)
OS details: Cisco IOS-XE 16.9.3 / Linux 4.14
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
23/tcp   open  telnet  Linux telnetd (cleartext administration)
80/tcp   open  http    Apache httpd 2.4.49 ((Unix) OpenSSL/1.1.1k)
|_http-server-header: Apache/2.4.49 (Unix)
443/tcp  open  ssl/http Apache httpd 2.4.49 ((Unix) OpenSSL/1.1.1k)
161/udp  open  snmp    ciscoSystems SNMPv2c agent (public community string)

Nmap scan report for app-worker-02.internal (192.168.10.25)
Host is up (0.0028s latency).
MAC Address: 00:0C:29:7B:44:E2 (VMware)
OS details: Ubuntu Linux 20.04 LTS (Kernel 5.4)
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 2.3.4 (backdoor triggerable)
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5
6379/tcp open  redis   Redis key-value store 6.0.9 (unauthenticated)
| redis-info: 
|   role: master
|   connected_clients: 8
|   os: Linux 5.4.0-80-generic x86_64

Nmap scan report for db-cluster-primary (192.168.10.80)
Host is up (0.0031s latency).
MAC Address: 00:0C:29:DE:AD:01 (VMware)
OS details: Red Hat Enterprise Linux 8.4
PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.0 (protocol 2.0)
3306/tcp open  mysql      MySQL 8.0.28 (source distribution)
5432/tcp open  postgresql PostgreSQL DB 13.4
9200/tcp open  http       Elasticsearch REST API 7.14.0 (no auth)

Nmap done: 3 IP addresses (3 hosts up) scanned in 14.82 seconds`,
  },
  {
    id: 'active-directory-xml',
    name: 'Enterprise Active Directory & Windows Server',
    badge: 'XML Format',
    format: 'xml',
    description: 'Standard Nmap -oX XML output with Windows Domain Controller, SMBv1 EternalBlue vulnerability, RDP, and Kerberos.',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nmaprun>
<nmaprun scanner="nmap" args="nmap -sS -sV -O -oX scan.xml 10.10.40.10 10.10.40.15" start="1773700000" version="7.94">
<scaninfo type="syn" protocol="tcp" numservices="1000" services="1-1000"/>
<host>
  <status state="up" reason="arp-response"/>
  <address addr="10.10.40.10" addrtype="ipv4"/>
  <address addr="00:15:5D:01:23:45" addrtype="mac" vendor="Microsoft"/>
  <hostnames>
    <hostname name="CORP-DC01.corp.global" type="PTR"/>
  </hostnames>
  <times srtt="1800"/>
  <ports>
    <port protocol="tcp" portid="53"><state state="open"/><service name="domain" product="Microsoft DNS" version="6.1.7601"/></port>
    <port protocol="tcp" portid="88"><state state="open"/><service name="kerberos-sec" product="Microsoft Windows Kerberos"/></port>
    <port protocol="tcp" portid="135"><state state="open"/><service name="msrpc" product="Microsoft Windows RPC"/></port>
    <port protocol="tcp" portid="139"><state state="open"/><service name="netbios-ssn" product="Microsoft Windows netbios-ssn"/></port>
    <port protocol="tcp" portid="445">
      <state state="open"/>
      <service name="microsoft-ds" product="Windows Server 2008 R2 Standard 7601 Service Pack 1 microsoft-ds"/>
      <script id="smb-vuln-ms17-010" output="VULNERABLE: Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)"/>
    </port>
    <port protocol="tcp" portid="3389"><state state="open"/><service name="ms-wbt-server" product="Microsoft Terminal Services"/></port>
  </ports>
  <os>
    <osmatch name="Microsoft Windows Server 2008 R2 SP1" accuracy="96"/>
  </os>
</host>
<host>
  <status state="up" reason="echo-reply"/>
  <address addr="10.10.40.15" addrtype="ipv4"/>
  <hostnames>
    <hostname name="FINANCE-SQL01.corp.global" type="PTR"/>
  </hostnames>
  <times srtt="2400"/>
  <ports>
    <port protocol="tcp" portid="1433"><state state="open"/><service name="ms-sql-s" product="Microsoft SQL Server 2019" version="15.0.2000"/></port>
    <port protocol="tcp" portid="3389"><state state="open"/><service name="ms-wbt-server" product="Microsoft Terminal Services"/></port>
    <port protocol="tcp" portid="80"><state state="open"/><service name="http" product="Microsoft IIS httpd" version="10.0"/></port>
  </ports>
  <os>
    <osmatch name="Microsoft Windows Server 2019" accuracy="94"/>
  </os>
</host>
</nmaprun>`,
  },
  {
    id: 'cloud-k8s-json',
    name: 'Cloud Native & Kubernetes Infrastructure',
    badge: 'JSON Format',
    format: 'json',
    description: 'Modern microservices cluster with exposed etcd 2379, unauthenticated Docker daemon, Kubernetes API 6443, and Grafana.',
    content: `{
  "scan": {
    "scanner": "nmap",
    "version": "7.94",
    "timestamp": "2026-09-16T12:00:00Z"
  },
  "hosts": [
    {
      "ip": "172.20.0.5",
      "hostname": "k8s-control-plane-master",
      "status": "up",
      "latencyMs": 1.1,
      "os": "CoreOS / Flatcar Container Linux (Kernel 5.10)",
      "ports": [
        {
          "port": 22,
          "protocol": "tcp",
          "state": "open",
          "service": "ssh",
          "version": "OpenSSH 8.4"
        },
        {
          "port": 2379,
          "protocol": "tcp",
          "state": "open",
          "service": "etcd",
          "version": "etcd 3.5.0",
          "extraInfo": "unauthenticated raft cluster"
        },
        {
          "port": 6443,
          "protocol": "tcp",
          "state": "open",
          "service": "kubernetes",
          "version": "Kubernetes API Server v1.24.2"
        },
        {
          "port": 10250,
          "protocol": "tcp",
          "state": "open",
          "service": "kubelet",
          "version": "Kubelet API (unrestricted)"
        }
      ]
    },
    {
      "ip": "172.20.0.12",
      "hostname": "ci-runner-buildnode",
      "status": "up",
      "latencyMs": 1.5,
      "os": "Debian GNU/Linux 11 (Bullseye)",
      "ports": [
        {
          "port": 2375,
          "protocol": "tcp",
          "state": "open",
          "service": "docker",
          "version": "Docker Daemon 20.10.14 (unencrypted remote socket)"
        },
        {
          "port": 3000,
          "protocol": "tcp",
          "state": "open",
          "service": "http",
          "version": "Grafana v8.3.3 (admin/admin default credentials)"
        },
        {
          "port": 8080,
          "protocol": "tcp",
          "state": "open",
          "service": "http-proxy",
          "version": "Jenkins Automation Server 2.332"
        }
      ]
    }
  ]
}`,
  },
  {
    id: 'network-switch-csv',
    name: 'Multi-Tenant Network Switch & Router Ports',
    badge: 'CSV Format',
    format: 'csv',
    description: 'Ingest tabular CSV rows grouping IP, ports, protocols, services, and detection details.',
    content: `IP,Hostname,Port,Protocol,State,Service,Version,OS
10.0.50.1,core-switch-gw,22,tcp,open,ssh,Cisco SSH 1.25,Cisco IOS 15.2
10.0.50.1,core-switch-gw,23,tcp,open,telnet,Cisco Telnet,Cisco IOS 15.2
10.0.50.1,core-switch-gw,161,udp,open,snmp,SNMPv2c public,Cisco IOS 15.2
10.0.50.15,sec-camera-hq,80,tcp,open,http,Hikvision Web Server,Embedded Linux
10.0.50.15,sec-camera-hq,554,tcp,open,rtsp,RTSP streaming daemon,Embedded Linux
10.0.50.15,sec-camera-hq,5900,tcp,open,vnc,RealVNC 4.1.2,Embedded Linux
10.0.50.90,printer-marketing,80,tcp,open,http,HP LaserJet Embedded Web Server,HP JetDirect
10.0.50.90,printer-marketing,515,tcp,open,printer,Line Printer Daemon (LPD),HP JetDirect
10.0.50.90,printer-marketing,9100,tcp,open,jetdirect,HP Raw Print Port 9100,HP JetDirect`,
  },
];
