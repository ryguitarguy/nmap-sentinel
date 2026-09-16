import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client to avoid crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGemini: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint for AI-powered Threat Analysis and Strategic Defense Briefing
app.post('/api/ai-assessment', async (req, res) => {
  try {
    const { hosts, vulnerabilities, networkSummary } = req.body;

    const ai = getAIClient();
    if (!ai) {
      return res.status(200).json({
        available: false,
        message: 'Gemini API key not configured. Using deterministic offline security engine.',
        assessment: null,
      });
    }

    const prompt = `You are a Senior Network Security Architect and Penetration Testing Director conducting a defensive security audit.
Analyze the following parsed Nmap scan data and detected vulnerabilities:

Network Summary:
${JSON.stringify(networkSummary, null, 2)}

Hosts Breakdown (summary of ports and OS):
${JSON.stringify(hosts?.slice(0, 10), null, 2)}

Top Detected Vulnerabilities & Weak Spots:
${JSON.stringify(vulnerabilities?.slice(0, 15), null, 2)}

Please provide a structured, professional Executive Cybersecurity Assessment with:
1. Executive Risk Summary (2-3 crisp paragraphs highlighting the most pressing attack vectors and threat exposure)
2. Primary Attack Paths (Explain how an adversary could chain these vulnerabilities, e.g. unauthenticated service + outdated banner + lateral movement)
3. Regulatory & Compliance Impact (e.g., PCI-DSS Req 1 & 2, NIST 800-53, HIPAA technical safeguards)
4. Strategic Remediation Roadmap (Immediate containment within 24h, Short-term remediation within 7d, Long-term architecture hardening)
5. Zero Trust & Network Segmentation Recommendations

Format in clean Markdown without fluff or generic buzzwords. Be specific to the exact ports, services, and hosts in the scan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return res.status(200).json({
      available: true,
      assessment: response.text || '',
    });
  } catch (error: any) {
    console.error('Gemini Assessment Error:', error);
    return res.status(500).json({
      available: false,
      error: error?.message || 'Failed to generate AI security assessment',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nmap Sentinel server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
