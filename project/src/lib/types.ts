// OrchestrAI — Core domain types for the AI Operating System

export type ModelId =
  | 'gpt-5'
  | 'claude-opus-4.5'
  | 'claude-sonnet-4.5'
  | 'gemini-2.5-pro'
  | 'deepseek-r2'
  | 'grok-4'
  | 'llama-4-405b'
  | 'gemma-3-27b'
  | 'qwen-3-4b'
  | 'phi-4-mini'
  | 'llama-3.2-3b'
  | 'gpt-5-judge'
  | 'claude-judge'
  | 'mistral-large-2';

export type ModelTier = 'frontier' | 'reasoning' | 'fast' | 'judge' | 'local';

export interface ModelMeta {
  id: ModelId;
  name: string;
  vendor: string;
  tier: ModelTier;
  contextWindow: number;
  costPer1M: { input: number; output: number };
  avgLatencyMs: number;
  reliability: number; // 0-1
  capabilities: string[];
  region: string;
  privacy: 'tier-1' | 'tier-2' | 'enterprise-only';
}

export type IntentType =
  | 'factual_qa'
  | 'code_generation'
  | 'reasoning'
  | 'math'
  | 'summarization'
  | 'translation'
  | 'data_extraction'
  | 'creative'
  | 'multi_step'
  | 'tool_use';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Intent {
  type: IntentType;
  classification: string;
  risk: RiskLevel;
  complexity: number; // 0-100
  outputFormat: 'text' | 'json' | 'code' | 'markdown' | 'table';
  requiresTools: boolean;
  language: string;
  detectedBy: ModelId;
  latencyMs: number;
}

export interface Subtask {
  id: string;
  description: string;
  dependencies: string[];
  estimatedCost: number;
  estimatedLatencyMs: number;
  assignedModels: ModelId[];
}

export interface TaskPlan {
  subtasks: Subtask[];
  dag: { nodes: string[]; edges: [string, string][] };
  totalEstimatedCost: number;
  totalEstimatedLatencyMs: number;
  planner: ModelId;
  latencyMs: number;
}

export type RouteStrategy = 'latency' | 'cost' | 'quality' | 'balanced' | 'privacy';

export interface RouteDecision {
  subtaskId: string;
  model: ModelId;
  strategy: RouteStrategy;
  reason: string;
  fallback: ModelId | null;
  region: string;
}

export interface ExecutionResult {
  subtaskId: string;
  model: ModelId;
  output: string;
  latencyMs: number;
  cost: number;
  tokens: { input: number; output: number };
  citations: Citation[];
  reasoning: string;
  status: 'success' | 'partial' | 'failed';
  retries: number;
}

export interface Citation {
  id: string;
  source: string;
  url: string;
  snippet: string;
  trust: number;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface VerificationCheck {
  name: string;
  status: CheckStatus;
  score: number; // 0-1
  detail: string;
  checker: ModelId;
  latencyMs: number;
}

export interface VerificationReport {
  subtaskId: string;
  checks: VerificationCheck[];
  overallScore: number;
  passed: boolean;
  latencyMs: number;
}

export interface ModelVote {
  model: ModelId;
  output: string;
  confidence: number;
  weight: number;
  reliability: number;
  agreement: number; // agreement with consensus
}

export interface ConsensusReport {
  subtaskId: string;
  votes: ModelVote[];
  agreementScore: number; // 0-1
  confidenceScore: number; // 0-1
  conflicts: string[];
  resolution: 'unanimous' | 'majority' | 'weighted' | 'split';
  metaReasoning: string;
  latencyMs: number;
}

export interface PipelineStageState {
  stage: PipelineStage;
  status: 'pending' | 'running' | 'complete' | 'failed';
  startedAt?: number;
  completedAt?: number;
  data?: unknown;
}

export type PipelineStage =
  | 'intent'
  | 'planning'
  | 'routing'
  | 'execution'
  | 'collection'
  | 'verification'
  | 'consensus'
  | 'synthesis';

export interface OrchestratedQuery {
  id: string;
  query: string;
  createdAt: number;
  stages: PipelineStageState[];
  intent?: Intent;
  plan?: TaskPlan;
  routes?: RouteDecision[];
  results?: ExecutionResult[];
  verifications?: VerificationReport[];
  consensus?: ConsensusReport[];
  finalAnswer?: string;
  finalConfidence?: number;
  totalCost?: number;
  totalLatencyMs?: number;
  status: 'running' | 'complete' | 'failed';
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  condition: string;
  target: ModelId;
  enabled: boolean;
}

export interface CapabilityMatrixEntry {
  model: ModelId;
  scores: Record<IntentType, number>; // 0-1
}

export interface ModelMetric {
  model: ModelId;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  avgCost: number;
  totalSpend: number;
  avgConfidence: number;
  hallucinationRate: number;
  citationsPerQuery: number;
}

export interface AuditLog {
  eventId: string;
  traceId: string;
  requestId: string;
  queryId: string;
  timestamp: number;
  selectedModel: string;
  latencyMs: number;
  tokens: number;
  cost: number;
  status: 'success' | 'error';
  promptPreview: string;
  provider: string;
}

export interface QuerySession {
  id: string;
  timestamp: number;
  userPrompt: string;
  finalAnswer: string;

  intent: string;
  complexity: number;
  risk: string;
  language: string;

  planner: { model: string; latencyMs: number };
  routing: { rulesMatched: number; fallbackTriggered: boolean; region: string; strategy: string };
  models: { id: string; latencyMs: number; tokens: number; cost: number; provider: string }[];
  verification: { checks: VerificationCheck[]; score: number; passed: boolean };
  consensus: { votes: ModelVote[]; agreement: number; confidence: number };

  latency: number;
  cost: number;

  citations: Citation[];
  auditLogs: AuditLog[];

  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  provider: string;
  model: string;
  finishReason: string;
  traceId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'architect' | 'analyst' | 'viewer';
  team: string;
  lastActive: number;
}
