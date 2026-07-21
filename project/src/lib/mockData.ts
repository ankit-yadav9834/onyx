import type { User } from './types';

export const USERS: User[] = [
  { id: 'u-001', name: 'Mira Chen', email: 'mira@orchestrai.ai', role: 'admin', team: 'Platform', lastActive: Date.now() - 120000 },
  { id: 'u-002', name: 'Dev Patel', email: 'dev@orchestrai.ai', role: 'architect', team: 'Infrastructure', lastActive: Date.now() - 600000 },
  { id: 'u-003', name: 'Sora Kim', email: 'sora@orchestrai.ai', role: 'analyst', team: 'ML Research', lastActive: Date.now() - 3600000 },
  { id: 'u-004', name: 'Leon Vargas', email: 'leon@orchestrai.ai', role: 'architect', team: 'Platform', lastActive: Date.now() - 7200000 },
  { id: 'u-005', name: 'Anya Roth', email: 'anya@orchestrai.ai', role: 'viewer', team: 'Security', lastActive: Date.now() - 86400000 },
];

export const SAMPLE_QUERY_TEMPLATES = [
  "Design an enterprise RAG architecture",
  "Compare MCP vs A2A vs LangGraph",
  "Build a production-grade LiteLLM deployment",
  "Design a multi-agent orchestration platform",
  "Analyze OpenAI vs Anthropic business strategy",
  "Design a Kubernetes deployment for AI inference",
  "Explain distributed tracing using OpenTelemetry",
  "Compare NVIDIA, AMD, Groq and Cerebras AI roadmap"
];
