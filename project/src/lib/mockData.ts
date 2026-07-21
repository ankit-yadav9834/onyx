import type {
  CapabilityMatrixEntry,
  IntentType,
  ModelMetric,
  ModelId,
  OrchestratedQuery,
  RoutingRule,
  User,
} from './types';
import { FRONTIER_MODELS, FAST_MODELS, JUDGE_MODELS, MODELS } from './models';

const INTENT_TYPES: IntentType[] = [
  'factual_qa',
  'code_generation',
  'reasoning',
  'math',
  'summarization',
  'translation',
  'data_extraction',
  'creative',
  'multi_step',
  'tool_use',
];

// Capability matrix — 0-1 scores per intent per model
export const CAPABILITY_MATRIX: CapabilityMatrixEntry[] = FRONTIER_MODELS.map((model) => {
  const m = MODELS[model];
  const scores = {} as Record<IntentType, number>;
  for (const t of INTENT_TYPES) {
    let base = 0.5;
    if (m.capabilities.includes('reasoning') && (t === 'reasoning' || t === 'multi_step')) base = 0.94;
    if (m.capabilities.includes('code') && t === 'code_generation') base = 0.93;
    if (m.capabilities.includes('math') && t === 'math') base = 0.95;
    if (m.capabilities.includes('tools') && t === 'tool_use') base = 0.9;
    if (t === 'factual_qa') base = 0.88;
    if (t === 'summarization') base = 0.86;
    if (t === 'translation') base = 0.82;
    if (t === 'data_extraction') base = 0.84;
    if (t === 'creative') base = 0.8;
    // vendor-specific nudges
    if (model === 'claude-opus-4.5' && (t === 'reasoning' || t === 'code_generation')) base = 0.97;
    if (model === 'gpt-5' && (t === 'code_generation' || t === 'tool_use')) base = 0.96;
    if (model === 'gemini-2.5-pro' && t === 'factual_qa') base = 0.93;
    if (model === 'deepseek-r2' && (t === 'math' || t === 'reasoning')) base = 0.95;
    if (model === 'grok-4' && t === 'factual_qa') base = 0.9;
    if (model === 'llama-4-405b') base = Math.max(base, 0.85);
    if (model === 'mistral-large-2' && t === 'code_generation') base = 0.9;
    scores[t] = Math.min(0.99, base + (m.reliability - 0.97));
  }
  return { model, scores };
});

export const ROUTING_RULES: RoutingRule[] = [
  {
    id: 'rule-001',
    name: 'PII / regulated data → enterprise-only',
    priority: 1,
    condition: 'intent.risk == critical OR query.containsPII == true',
    target: 'llama-4-405b',
    enabled: true,
  },
  {
    id: 'rule-002',
    name: 'Math & symbolic → DeepSeek R2',
    priority: 2,
    condition: 'intent.type == math',
    target: 'deepseek-r2',
    enabled: true,
  },
  {
    id: 'rule-003',
    name: 'Long-context (>128k) → Gemini 2.5 Pro',
    priority: 3,
    condition: 'context.length > 128000',
    target: 'gemini-2.5-pro',
    enabled: true,
  },
  {
    id: 'rule-004',
    name: 'Code generation → Claude Opus 4.5',
    priority: 4,
    condition: 'intent.type == code_generation',
    target: 'claude-opus-4.5',
    enabled: true,
  },
  {
    id: 'rule-005',
    name: 'Latency-sensitive → Claude Sonnet 4.5',
    priority: 5,
    condition: 'sla.maxLatencyMs < 1500',
    target: 'claude-sonnet-4.5',
    enabled: true,
  },
  {
    id: 'rule-006',
    name: 'Cost-optimized batch → Llama 4 405B',
    priority: 6,
    condition: 'strategy == cost AND intent.complexity < 50',
    target: 'llama-4-405b',
    enabled: true,
  },
  {
    id: 'rule-007',
    name: 'Realtime knowledge → Grok 4',
    priority: 7,
    condition: 'intent.requiresRealtime == true',
    target: 'grok-4',
    enabled: false,
  },
];

export const MODEL_METRICS: ModelMetric[] = [...FRONTIER_MODELS, ...FAST_MODELS, ...JUDGE_MODELS].map(
  (model, i) => {
    const m = MODELS[model];
    const calls = [48210, 39140, 28760, 22310, 18450, 15280, 11920, 8410, 94210, 88120, 76340, 71280, 4210, 3870][i] ?? 10000;
    return {
      model,
      totalCalls: calls,
      successRate: m.reliability,
      avgLatencyMs: m.avgLatencyMs,
      p99LatencyMs: Math.round(m.avgLatencyMs * 2.4),
      avgCost: (m.costPer1M.input + m.costPer1M.output) / 2,
      totalSpend: calls * ((m.costPer1M.input + m.costPer1M.output) / 2) * 0.0012,
      avgConfidence: 0.82 + (m.reliability - 0.97) * 2 + (i % 3) * 0.01,
      hallucinationRate: 0.018 + (1 - m.reliability) * 0.3 + (i % 4) * 0.004,
      citationsPerQuery: 2.4 + (i % 5) * 0.3,
    };
  },
);

export const USERS: User[] = [
  { id: 'u-001', name: 'Mira Chen', email: 'mira@orchestrai.ai', role: 'admin', team: 'Platform', lastActive: Date.now() - 120000 },
  { id: 'u-002', name: 'Dev Patel', email: 'dev@orchestrai.ai', role: 'architect', team: 'Infrastructure', lastActive: Date.now() - 600000 },
  { id: 'u-003', name: 'Sora Kim', email: 'sora@orchestrai.ai', role: 'analyst', team: 'ML Research', lastActive: Date.now() - 3600000 },
  { id: 'u-004', name: 'Leon Vargas', email: 'leon@orchestrai.ai', role: 'architect', team: 'Platform', lastActive: Date.now() - 7200000 },
  { id: 'u-005', name: 'Anya Roth', email: 'anya@orchestrai.ai', role: 'viewer', team: 'Security', lastActive: Date.now() - 86400000 },
];

const ACTIONS = [
  'query.execute',
  'route.override',
  'model.disable',
  'policy.update',
  'user.invite',
  'api.key.rotate',
  'consensus.review',
  'verification.flag',
  'config.export',
  'auth.login',
  'auth.logout',
  'rule.create',
];
const RESOURCES = ['orchestrator', 'routing-engine', 'model:gpt-5', 'model:claude-opus-4.5', 'audit-log', 'policy:pii', 'workspace', 'consensus-engine'];
const IPS = ['10.0.4.12', '10.0.4.88', '172.16.2.4', '10.0.8.21', '10.0.4.12', '172.16.2.4'];

export const AUDIT_LOG: any[] = Array.from({ length: 48 }, (_, i) => {
  const user = USERS[i % USERS.length];
  const action = ACTIONS[i % ACTIONS.length];
  const resource = RESOURCES[i % RESOURCES.length];
  const outcome = i % 9 === 8 ? 'denied' : i % 13 === 12 ? 'error' : 'success';
  return {
    id: `evt-${String(i + 1).padStart(4, '0')}`,
    timestamp: Date.now() - i * 180000 - (i % 7) * 11000,
    actor: user.email,
    action,
    resource,
    outcome,
    ip: IPS[i % IPS.length],
    metadata: i % 3 === 0 ? `trace_id=tr_${(i * 991).toString(16)}` : undefined,
  };
});

export const RECENT_QUERIES: OrchestratedQuery[] = [
  {
    id: 'q-9f2a',
    query: 'Compare the capital expenditure of the top 5 hyperscalers in 2025 and project 2026 trends',
    createdAt: Date.now() - 240000,
    status: 'complete',
    stages: [],
    finalConfidence: 0.94,
    totalCost: 0.142,
    totalLatencyMs: 8420,
  },
  {
    id: 'q-7c1b',
    query: 'Generate a Rust implementation of a lock-free MPSC queue with memory ordering analysis',
    createdAt: Date.now() - 620000,
    status: 'complete',
    stages: [],
    finalConfidence: 0.91,
    totalCost: 0.087,
    totalLatencyMs: 6210,
  },
  {
    id: 'q-3d8e',
    query: 'What are the latest FDA guidelines on AI/ML in medical devices as of Q2 2026?',
    createdAt: Date.now() - 1800000,
    status: 'complete',
    stages: [],
    finalConfidence: 0.88,
    totalCost: 0.064,
    totalLatencyMs: 5140,
  },
  {
    id: 'q-5a4f',
    query: 'Summarize the key arguments in the EU AI Act enforcement framework',
    createdAt: Date.now() - 3600000,
    status: 'complete',
    stages: [],
    finalConfidence: 0.96,
    totalCost: 0.031,
    totalLatencyMs: 3280,
  },
  {
    id: 'q-1b2c',
    query: 'Derive the closed-form solution for optimal portfolio weights under Black-Litterman with view uncertainty',
    createdAt: Date.now() - 7200000,
    status: 'complete',
    stages: [],
    finalConfidence: 0.92,
    totalCost: 0.119,
    totalLatencyMs: 7430,
  },
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
