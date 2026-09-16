# Nmap Sentinel 🛡️

A web-based network security and vulnerability analyzer that ingests Nmap scans (TXT, XML, JSON, CSV) to automatically identify weak spots and generate actionable remediation reports.

## 🚀 Key Features

**[🚀 Launch Nmap Sentinel Live](https://nmapsentinel.ai.studio)**

*   **Multi-Format Ingestion:** Supports `.txt` (standard Nmap terminal output & grepable formats), `-oX` `.xml` (standard Nmap XML), `.json`, and `.csv` exports. Includes drag-and-drop file upload, direct command output pasting, and preloaded enterprise scan scenarios.
*   **Automated Weak Spot Detection:** Automatically identifies critical network exposure vectors such as legacy cleartext protocols (Telnet, FTP, HTTP), exposed database listeners (Redis, MongoDB, MySQL), dangerous services (vsftpd backdoors, EternalBlue/SMBv1), and unauthenticated management ports, complete with CVSS scores and CVE references.
*   **Actionable Remediation Engine:** Provides step-by-step remediation procedures for identified issues, featuring copyable terminal hardening commands for Linux (UFW/iptables), Windows, and network firewalls. Includes live status tracking to recalculate security posture scores in real time.
*   **Real-Time SOC Vulnerability Monitoring:** A continuous monitoring station with live endpoint telemetry pings, latency tracking, health status indicators, and an event log stream of perimeter probes and threshold alerts.
*   **Comprehensive Audit Reporting:** Generates executive-ready security assessment reports with attack surface metrics, prioritized vulnerability registers, and strategic remediation timelines. Export your reports to PDF, Markdown, CSV, and JSON.

## 🛠️ Usage

1. Open the Nmap Sentinel dashboard.
2. Choose **Import Your Scan** to upload your own Nmap results or paste terminal text directly. 
3. Alternatively, select one of the **Preloaded Sample Scans** (like the Enterprise DMZ or Cloud Kubernetes clusters) to explore the interface.
4. Review the auto-generated Vulnerability Dashboard to prioritize your remediation efforts.
5. Export your final security report for your team or clients.
