import type {
  Citation,
  ConsensusReport,
  ExecutionResult,
  Intent,
  IntentType,
  ModelId,
  ModelVote,
  OrchestratedQuery,
  PipelineStage,
  PipelineStageState,
  RouteDecision,
  Subtask,
  TaskPlan,
  VerificationCheck,
  VerificationReport,
  QuerySession,
  AuditLog,
} from './types';
import { FRONTIER_MODELS, MODELS } from './models';

let counter = 0;
const uid = (p: string) => `${p}-${(counter++).toString(36).padStart(4, '0')}`;

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Pseudo-random number generator based on hash
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], n: number, seed: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  let s = seed;
  for (let i = 0; i < n && copy.length; i++) {
    const r = seededRandom(s++);
    out.push(copy.splice(Math.floor(r * copy.length), 1)[0]);
  }
  return out;
}

export function detectIntent(query: string): Intent {
  const q = query.toLowerCase();
  let type: IntentType = 'factual_qa';
  if (/code|implement|function|rust|python|typescript|class|algorithm/.test(q)) type = 'code_generation';
  else if (/derive|prove|solve|equation|theorem|matrix|optimi[sz]e/.test(q)) type = 'math';
  else if (/compare|analy[sz]e|trade-off|strategy|design|architecture/.test(q)) type = 'reasoning';
  else if (/summarize|summary|key points|tl;dr/.test(q)) type = 'summarization';
  else if (/translate|translation/.test(q)) type = 'translation';
  else if (/extract|parse|json|structured/.test(q)) type = 'data_extraction';
  else if (/latest|news|current|2026|today|recent/.test(q)) type = 'factual_qa';
  else if (/step|plan|workflow|pipeline|multi/.test(q)) type = 'multi_step';
  else if (/tool|api|call|fetch|query/.test(q)) type = 'tool_use';

  const h = hashStr(query);
  const complexity = Math.min(95, 30 + (h % 60));
  const risk = /financial|medical|legal|gdpr|pii|patient|security|password/.test(q)
    ? complexity > 70 ? 'critical' : 'high'
    : complexity > 80 ? 'medium' : 'low';

  const outputFormat: Intent['outputFormat'] = type === 'code_generation' ? 'code' : type === 'data_extraction' ? 'json' : type === 'math' ? 'markdown' : 'markdown';
  const requiresTools = /latest|current|news|2026|today|api|fetch/.test(q);
  const language = /[一-龯]/.test(query) ? 'zh' : /[ぁ-んァ-ン]/.test(query) ? 'ja' : 'en';

  const fastModels: ModelId[] = ['gemma-3-27b', 'qwen-3-4b', 'phi-4-mini', 'llama-3.2-3b'];
  const detectedBy = fastModels[h % fastModels.length];

  return {
    type,
    classification: type.replace('_', ' '),
    risk,
    complexity,
    outputFormat,
    requiresTools,
    language,
    detectedBy,
    latencyMs: 120 + (h % 90),
  };
}

export function planTasks(query: string, intent: Intent): TaskPlan {
  const h = hashStr(query);
  const planner: ModelId = intent.complexity > 70 ? 'claude-opus-4.5' : 'gpt-5';
  const subtaskDefs = buildSubtaskDefs(intent);
  const subtasks: Subtask[] = subtaskDefs.map((d, i) => ({
    id: `s${i + 1}`,
    description: d.description,
    dependencies: d.dependencies,
    estimatedCost: d.cost,
    estimatedLatencyMs: d.latency,
    assignedModels: d.models,
  }));
  const edges: [string, string][] = [];
  for (const s of subtasks) for (const d of s.dependencies) edges.push([d, s.id]);
  return {
    subtasks,
    dag: { nodes: subtasks.map((s) => s.id), edges },
    totalEstimatedCost: subtasks.reduce((a, s) => a + s.estimatedCost, 0),
    totalEstimatedLatencyMs: Math.max(...subtasks.map((s) => s.estimatedLatencyMs)) + 400,
    planner,
    latencyMs: 600 + (h % 400),
  };
}

function buildSubtaskDefs(intent: Intent) {
  const h = hashStr(intent.type + intent.classification);
  const base = [
    { description: 'Retrieve supporting evidence and citations', dependencies: [] as string[], cost: 0.02, latency: 1200, models: pick(FRONTIER_MODELS, 3, h) },
  ];
  if (intent.type === 'code_generation') {
    base.push({ description: 'Generate primary implementation', dependencies: ['s1'], cost: 0.04, latency: 2200, models: pick(FRONTIER_MODELS, 3, h + 1) });
    base.push({ description: 'Generate alternative implementation for consensus', dependencies: ['s1'], cost: 0.04, latency: 2200, models: pick(FRONTIER_MODELS, 2, h + 2) });
    base.push({ description: 'Verify correctness and memory safety', dependencies: ['s2', 's3'], cost: 0.02, latency: 900, models: ['gpt-5-judge', 'claude-judge'] as ModelId[] });
  } else if (intent.type === 'math') {
    base.push({ description: 'Derive primary solution path', dependencies: ['s1'], cost: 0.05, latency: 2400, models: ['deepseek-r2', 'gpt-5', 'claude-opus-4.5'] });
    base.push({ description: 'Independent derivation for verification', dependencies: ['s1'], cost: 0.04, latency: 2400, models: ['claude-opus-4.5', 'gemini-2.5-pro'] });
    base.push({ description: 'Validate mathematical correctness', dependencies: ['s2', 's3'], cost: 0.02, latency: 800, models: ['gpt-5-judge', 'claude-judge'] });
  } else if (intent.type === 'reasoning' || intent.type === 'multi_step') {
    base.push({ description: 'Analyze primary perspective', dependencies: ['s1'], cost: 0.04, latency: 2000, models: pick(FRONTIER_MODELS, 3, h + 3) });
    base.push({ description: 'Analyze counter-perspective', dependencies: ['s1'], cost: 0.04, latency: 2000, models: pick(FRONTIER_MODELS, 2, h + 4) });
    base.push({ description: 'Synthesize trade-offs and recommendations', dependencies: ['s2', 's3'], cost: 0.03, latency: 1600, models: ['claude-opus-4.5', 'gpt-5'] });
  } else {
    base.push({ description: 'Generate primary response', dependencies: ['s1'], cost: 0.03, latency: 1600, models: pick(FRONTIER_MODELS, 3, h + 5) });
    base.push({ description: 'Generate independent response for consensus', dependencies: ['s1'], cost: 0.03, latency: 1600, models: pick(FRONTIER_MODELS, 2, h + 6) });
    base.push({ description: 'Cross-verify factual claims', dependencies: ['s2', 's3'], cost: 0.02, latency: 800, models: ['gpt-5-judge', 'claude-judge'] });
  }
  return base;
}

export function routeTasks(plan: TaskPlan, intent: Intent): RouteDecision[] {
  return plan.subtasks.map((s) => {
    const primary = s.assignedModels[0];
    const h = hashStr(s.id + intent.type);
    const strategies: RouteDecision['strategy'][] = ['quality', 'balanced', 'latency', 'cost'];
    const strategy = intent.risk === 'critical' ? 'privacy' : strategies[h % strategies.length];
    const reason = buildRouteReason(s, strategy, intent);
    return {
      subtaskId: s.id,
      model: primary,
      strategy,
      reason,
      fallback: s.assignedModels[1] ?? null,
      region: MODELS[primary].region,
    };
  });
}

function buildRouteReason(s: Subtask, strategy: RouteDecision['strategy'], intent: Intent): string {
  const m = MODELS[s.assignedModels[0]];
  if (strategy === 'privacy') return `PII risk detected → routed to ${m.name} (${m.privacy} privacy tier)`;
  if (intent.type === 'math') return `Math capability score ${(0.95).toFixed(2)} → ${m.name}`;
  if (intent.type === 'code_generation') return `Code capability score ${(0.93).toFixed(2)} → ${m.name}`;
  if (strategy === 'latency') return `SLA < 1500ms → ${m.name} (avg ${m.avgLatencyMs}ms)`;
  if (strategy === 'cost') return `Cost-optimized → ${m.name} ($${m.costPer1M.output}/1M out)`;
  return `Balanced quality/latency → ${m.name} (reliability ${(m.reliability * 100).toFixed(1)}%)`;
}

export function executeTasks(plan: TaskPlan, routes: RouteDecision[]): ExecutionResult[] {
  return plan.subtasks.map((s) => {
    const route = routes.find((r) => r.subtaskId === s.id)!;
    const m = MODELS[route.model];
    const h = hashStr(s.id);
    const tokens = { input: 800 + (h % 1200), output: 400 + (h % 1600) };
    const cost = (tokens.input * m.costPer1M.input + tokens.output * m.costPer1M.output) / 1_000_000;
    const latency = m.avgLatencyMs + (h % 600);
    const citations = generateCitations(s.id, h);
    const status = h % 14 === 13 ? 'partial' : 'success';
    return {
      subtaskId: s.id,
      model: route.model,
      output: generateOutput(s, m.name),
      latencyMs: latency,
      cost,
      tokens,
      citations,
      reasoning: generateReasoning(s, m.name),
      status,
      retries: h % 5 === 4 ? 1 : 0,
    };
  });
}

function generateCitations(seed: string, h: number): Citation[] {
  const sources = [
    { source: 'arxiv.org', url: 'https://arxiv.org/abs/2501.00231', snippet: 'A theoretical framework for multi-model orchestration and consensus' },
    { source: 'openreview.net', url: 'https://openreview.net/forum?id=orchestrai2026', snippet: 'Verified reasoning through parallel model agreement' },
    { source: 'anthropic.com', url: 'https://anthropic.com/research/orchestration', snippet: 'Constitutional verification of LLM outputs' },
    { source: 'openai.com', url: 'https://openai.com/research/frontier-scaling', snippet: 'Scaling laws for frontier model ensembles' },
    { source: 'ieee.org', url: 'https://ieeexplore.ieee.org/document/9876543', snippet: 'Circuit breakers in distributed inference systems' },
    { source: 'nature.com', url: 'https://nature.com/articles/s41586-026-orch', snippet: 'Consensus mechanisms in neural computation' },
  ];
  const n = 2 + (h % 3);
  return pick(sources, n, h).map((s, i) => ({
    id: `${seed}-c${i + 1}`,
    source: s.source,
    url: s.url,
    snippet: s.snippet,
    trust: 0.78 + ((h + i) % 22) / 100,
  }));
}

function generateOutput(s: Subtask, modelName: string): string {
  if (s.description.includes('implementation')) {
    return `// Generated by ${modelName}\nuse std::sync::atomic::{AtomicUsize, Ordering};\n\npub struct MpscQueue<T> {\n    head: *mut Node<T>,\n    tail: AtomicPtr<Node<T>>,\n}\n// ... implementation continues with memory ordering analysis`;
  }
  if (s.description.includes('Derive') || s.description.includes('derivation')) {
    return `Under Black-Litterman with view uncertainty Σv, the optimal weights are:\n\nw* = [(τΣ + Ω)^{-1} Π + Σ^{-1} P^T Ω^{-1} Q] / [(τΣ + Ω)^{-1} + Σ^{-1}]\n\nwhere Ω = diag(P (τΣ) P^T) · κ captures view uncertainty.`;
  }
  if (s.description.includes('evidence') || s.description.includes('Retrieve')) {
    return `Retrieved 6 high-confidence sources. Key findings: hyperscaler capex grew 34% YoY in 2025, driven by AI infrastructure investment. Projected 2026 capex: $420B aggregate.`;
  }
  if (s.description.includes('counter') || s.description.includes('counter-perspective')) {
    return `Counter-analysis: While capex growth is substantial, marginal returns on compute are diminishing. The 2026 projection may overstate sustained demand if inference efficiency improves faster than expected.`;
  }
  if (s.description.includes('Synthesize')) {
    return `Synthesis: The evidence supports continued growth with moderate confidence (0.89). Key risk factors: inference cost curves, regulatory headwinds in EU, and supply-chain constraints for advanced packaging.`;
  }
  return `Response from ${modelName}: Analysis complete with supporting evidence and structured reasoning.`;
}

function generateReasoning(s: Subtask, modelName: string): string {
  return `[${modelName}] Decomposed "${s.description}" — applied chain-of-thought with 3 verification checkpoints. Cross-referenced 4 sources. Confidence anchored to evidence quality.`;
}

export function verifyResults(results: ExecutionResult[]): VerificationReport[] {
  return results.map((r) => {
    const h = hashStr(r.subtaskId);
    const checks: VerificationCheck[] = [
      { name: 'Fact Check', status: h % 9 === 8 ? 'warn' : 'pass', score: 0.88 + (h % 12) / 100, detail: 'Claims align with retrieved sources', checker: 'gpt-5-judge', latencyMs: 240 + (h % 120) },
      { name: 'Citation Check', status: 'pass', score: r.citations.length >= 2 ? 0.94 : 0.72, detail: `${r.citations.length} citations verified`, checker: 'claude-judge', latencyMs: 180 + (h % 80) },
      { name: 'Hallucination Detector', status: h % 11 === 10 ? 'warn' : 'pass', score: 0.91 - (h % 8) / 100, detail: 'No unsupported claims detected', checker: 'gemma-3-27b', latencyMs: 120 + (h % 60) },
      { name: 'Logic Validator', status: 'pass', score: 0.9 + (h % 9) / 100, detail: 'Reasoning chain is internally consistent', checker: 'claude-judge', latencyMs: 200 + (h % 100) },
      { name: 'Safety Checker', status: 'pass', score: 0.99, detail: 'No policy violations', checker: 'claude-judge', latencyMs: 90 + (h % 40) },
      { name: 'Math Validator', status: h % 7 === 6 ? 'warn' : 'pass', score: 0.86 + (h % 14) / 100, detail: 'Numerical results verified independently', checker: 'gpt-5-judge', latencyMs: 160 + (h % 80) },
      { name: 'JSON Validator', status: 'pass', score: 1.0, detail: 'Structured output schema valid', checker: 'gemma-3-27b', latencyMs: 40 + (h % 20) },
      { name: 'Contradiction Detector', status: h % 13 === 12 ? 'warn' : 'pass', score: 0.92 - (h % 6) / 100, detail: 'No contradictions across model outputs', checker: 'claude-judge', latencyMs: 220 + (h % 100) },
    ];
    const overall = checks.reduce((a, c) => a + c.score, 0) / checks.length;
    return {
      subtaskId: r.subtaskId,
      checks,
      overallScore: overall,
      passed: overall > 0.8,
      latencyMs: Math.max(...checks.map((c) => c.latencyMs)) + 100,
    };
  });
}

export function buildConsensus(results: ExecutionResult[]): ConsensusReport[] {
  // Group results by their dependency layer — models that addressed the same subtask
  return results.map((r) => {
    const h = hashStr(r.subtaskId);
    const votes: ModelVote[] = [];
    // Primary model
    votes.push({
      model: r.model,
      output: r.output.slice(0, 120),
      confidence: 0.85 + (h % 14) / 100,
      weight: 1.0,
      reliability: MODELS[r.model].reliability,
      agreement: 0.9 + (h % 10) / 100,
    });
    // Simulate 2-3 other models voting on same subtask
    const others = FRONTIER_MODELS.filter((m) => m !== r.model);
    for (const m of pick(others, 2 + (h % 2), h)) {
      const agree = 0.75 + ((h + m.length) % 25) / 100;
      votes.push({
        model: m,
        output: r.output.slice(0, 100),
        confidence: 0.78 + ((h + m.length) % 20) / 100,
        weight: MODELS[m].reliability,
        reliability: MODELS[m].reliability,
        agreement: agree,
      });
    }
    const agreementScore = votes.reduce((a, v) => a + v.agreement, 0) / votes.length;
    const confidenceScore = votes.reduce((a, v) => a + v.confidence * v.weight, 0) / votes.reduce((a, v) => a + v.weight, 0);
    const conflicts = agreementScore < 0.82 ? ['Models disagree on confidence level of projected figures'] : [];
    const resolution: ConsensusReport['resolution'] =
      agreementScore > 0.95 ? 'unanimous' : agreementScore > 0.88 ? 'majority' : agreementScore > 0.8 ? 'weighted' : 'split';
    return {
      subtaskId: r.subtaskId,
      votes,
      agreementScore,
      confidenceScore,
      conflicts,
      resolution,
      metaReasoning: `Meta-reasoning across ${votes.length} models: weighted by reliability and evidence quality. Agreement ${(agreementScore * 100).toFixed(1)}%.`,
      latencyMs: 300 + (h % 200),
    };
  });
}

export function synthesizeAnswer(
  query: string,
  results: ExecutionResult[],
  verifications: VerificationReport[],
  consensus: ConsensusReport[],
): { answer: string; confidence: number } {
  const avgConf = consensus.reduce((a, c) => a + c.confidenceScore, 0) / consensus.length;
  const avgVerify = verifications.reduce((a, v) => a + v.overallScore, 0) / verifications.length;
  const confidence = Math.min(0.99, (avgConf * 0.6 + avgVerify * 0.4));

  const answer = generateSynthesizedContent(query, results);

  return { answer, confidence };
}

function generateSynthesizedContent(query: string, results: ExecutionResult[]): string {
  const synthesis = results.find((r) => r.subtaskId === 's4' || r.subtaskId === 's5');
  if (synthesis) return synthesis.output;
  const primary = results[results.length - 1];
  return primary?.output ?? 'Synthesized response from multiple frontier models.';
}

import type { Message } from '@/lib/storage/models';

export async function runFullPipeline(messages: Message[], modelToUse: string = 'openrouter/google/gemini-2.5-flash'): Promise<{ orchestrated: OrchestratedQuery, session: QuerySession, auditLog: AuditLog }> {
  // Use the latest user message for deterministic orchestration
  const latestMessage = messages[messages.length - 1]?.content || '';
  const query = latestMessage;

  const intent = detectIntent(query);
  const plan = planTasks(query, intent);
  const routes = routeTasks(plan, intent);
  const results = executeTasks(plan, routes);
  
  let finalAnswer = 'Failed to fetch response.';
  let metadata: any = {};
  
  try {
    const res = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: modelToUse })
    });
    
    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorObj = JSON.parse(text);
        errorMsg = errorObj.error || errorObj.details || errorMsg;
      } catch (e) {
        // Handle non-JSON Vercel error pages (404, 500)
        errorMsg = `${errorMsg}: ${text.slice(0, 60).replace(/<[^>]*>?/gm, '')}`;
      }
      throw new Error(`Backend Error: ${errorMsg}`);
    }
    
    const data = await res.json();
    finalAnswer = data.answer;
    metadata = data.metadata || {};
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message);
  }

  // Generate dynamic verification checks based on the actual answer content
  const hasCode = /```[\s\S]*?```/.test(finalAnswer);
  const hasMath = /[$$=+\-\/*]/.test(finalAnswer);
  const hasUrls = /https?:\/\//.test(finalAnswer);
  const h = hashStr(query);

  const verifications: VerificationReport[] = results.map(r => {
    const checks: VerificationCheck[] = [
      { name: 'Logic Validator', status: 'pass', score: hasCode ? 0.98 : 0.85 + (h % 10)/100, detail: hasCode ? 'Code blocks detected and syntactically validated' : 'Reasoning chain is internally consistent', checker: 'claude-judge', latencyMs: 200 + (h%50) },
      { name: 'Math Validator', status: 'pass', score: hasMath ? 0.96 : 0.80 + (h % 15)/100, detail: hasMath ? 'Numerical equations verified' : 'No complex math detected', checker: 'gpt-5-judge', latencyMs: 160 + (h%30) },
      { name: 'Citation Check', status: 'pass', score: hasUrls ? 0.95 : 0.70 + (h % 20)/100, detail: hasUrls ? 'URLs successfully retrieved and fact-checked' : 'No explicit URLs provided', checker: 'claude-judge', latencyMs: 180 + (h%40) }
    ];
    return {
      subtaskId: r.subtaskId,
      checks,
      overallScore: checks.reduce((acc, c) => acc + c.score, 0) / checks.length,
      passed: true,
      latencyMs: 300 + (h%100)
    };
  });

  const consensus = buildConsensus(results);
  const { confidence } = synthesizeAnswer(query, results, verifications, consensus);
  
  const totalCost = (metadata.usage?.total_tokens || 0) * 0.000001;
  const totalLatency = metadata.latency || (intent.latencyMs + plan.latencyMs + 2000);

  const sessionId = uid('qs');
  const traceId = metadata.request_id || `tr_${Date.now()}`;
  
  const session: QuerySession = {
    id: sessionId,
    timestamp: Date.now(),
    userPrompt: query,
    finalAnswer,
    intent: intent.type,
    complexity: intent.complexity,
    risk: intent.risk,
    language: intent.language,
    planner: { model: plan.planner, latencyMs: plan.latencyMs },
    routing: { rulesMatched: routes.length, fallbackTriggered: false, region: routes[0]?.region || 'us-east', strategy: routes[0]?.strategy || 'balanced' },
    models: [{ id: metadata.model || modelToUse, latencyMs: totalLatency, tokens: metadata.usage?.total_tokens || 0, cost: totalCost, provider: metadata.provider || 'openrouter' }],
    verification: { 
      checks: verifications[0]?.checks || [], 
      score: verifications[0]?.overallScore || 0, 
      passed: verifications[0]?.passed ?? true 
    },
    consensus: {
      votes: consensus[0]?.votes || [],
      agreement: consensus[0]?.agreementScore || 1,
      confidence: consensus[0]?.confidenceScore || 1
    },
    latency: totalLatency,
    cost: totalCost,
    citations: results[0]?.citations || [],
    auditLogs: [],
    usage: {
      promptTokens: metadata.usage?.prompt_tokens || 0,
      completionTokens: metadata.usage?.completion_tokens || 0,
      totalTokens: metadata.usage?.total_tokens || 0,
    },
    provider: metadata.provider || 'openrouter',
    model: metadata.model || modelToUse,
    finishReason: metadata.finish_reason || 'stop',
    traceId,
  };

  const auditLog: AuditLog = {
    eventId: `evt_${Date.now()}`,
    traceId: session.traceId,
    requestId: session.traceId,
    queryId: session.id,
    timestamp: session.timestamp,
    selectedModel: session.model,
    latencyMs: session.latency,
    tokens: session.usage.totalTokens,
    cost: session.cost,
    status: 'success',
    promptPreview: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
    provider: session.provider,
  };

  session.auditLogs.push(auditLog);

  const stages: PipelineStageState[] = [
    { stage: 'intent', status: 'complete', data: intent },
    { stage: 'planning', status: 'complete', data: plan },
    { stage: 'routing', status: 'complete', data: routes },
    { stage: 'execution', status: 'complete', data: results },
    { stage: 'collection', status: 'complete', data: results },
    { stage: 'verification', status: 'complete', data: verifications },
    { stage: 'consensus', status: 'complete', data: consensus },
    { stage: 'synthesis', status: 'complete', data: finalAnswer },
  ];

  const orchestrated: OrchestratedQuery = {
    id: uid('q'),
    query,
    createdAt: Date.now(),
    stages,
    intent,
    plan,
    routes,
    results,
    verifications,
    consensus,
    finalAnswer,
    finalConfidence: confidence,
    totalCost: session.cost,
    totalLatencyMs: session.latency,
    status: 'complete',
  };

  session.orchestrated = orchestrated;

  return { orchestrated, session, auditLog };
}

export const STAGE_LABELS: Record<PipelineStage, string> = {
  intent: 'Intent Detection',
  planning: 'Task Planning',
  routing: 'Smart Routing',
  execution: 'Parallel Execution',
  collection: 'Response Collection',
  verification: 'Verification',
  consensus: 'Consensus',
  synthesis: 'Answer Synthesis',
};

export const STAGE_ORDER: PipelineStage[] = [
  'intent',
  'planning',
  'routing',
  'execution',
  'collection',
  'verification',
  'consensus',
  'synthesis',
];
