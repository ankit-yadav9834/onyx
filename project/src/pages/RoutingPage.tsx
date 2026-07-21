import { useState } from 'react';
import {
  GitBranch,
  Plus,
  ArrowDownRight,
  Settings2,
  Zap,
  DollarSign,
  ShieldCheck,
  Gauge,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { IntentType, ModelId, RouteStrategy } from '@/lib/types';
import { FRONTIER_MODELS, MODELS } from '@/lib/models';
import { useQuerySessions } from '@/lib/storage';
import { Badge, Bar } from '@/components/ui';
import { cn, pct, hashStr } from '@/lib/utils';

const STRATEGIES: { id: RouteStrategy; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'quality', label: 'Quality', icon: ShieldCheck, desc: 'Maximize output quality & verification score' },
  { id: 'latency', label: 'Latency', icon: Zap, desc: 'Minimize response time for real-time use' },
  { id: 'cost', label: 'Cost', icon: DollarSign, desc: 'Optimize spend per query' },
  { id: 'balanced', label: 'Balanced', icon: Gauge, desc: 'Trade-off across all dimensions' },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck, desc: 'Enterprise-only models for regulated data' },
];

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

export function RoutingPage() {
  const sessions = useQuerySessions();
  
  // Default to the last used strategy or 'balanced'
  const latestSession = sessions[0];
  const defaultStrategy = latestSession?.routing?.strategy as RouteStrategy || 'balanced';

  const [strategy, setStrategy] = useState<RouteStrategy>(defaultStrategy);
  const [selectedIntent, setSelectedIntent] = useState<IntentType>('reasoning');

  // Compute capability matrix dynamically using deterministic hashing
  const capabilityMatrix = FRONTIER_MODELS.map(model => {
    const scores = {} as Record<IntentType, number>;
    INTENT_TYPES.forEach(t => {
      // Deterministic score based on model and intent
      const h = hashStr(model + t);
      // Give a boost to certain known strengths just for realism
      let boost = 0;
      if (t === 'math' && model.includes('deepseek')) boost = 0.15;
      if (t === 'code_generation' && model.includes('claude-opus')) boost = 0.1;
      if (t === 'reasoning' && model.includes('gpt-5')) boost = 0.12;
      
      scores[t] = Math.min(0.99, 0.70 + (h % 25) / 100 + boost);
    });
    return { model, scores };
  });

  const getBestModel = (intent: IntentType): ModelId => {
    let best: ModelId = FRONTIER_MODELS[0];
    let bestScore = 0;
    for (const entry of capabilityMatrix) {
      if (entry.scores[intent] > bestScore) {
        bestScore = entry.scores[intent];
        best = entry.model;
      }
    }
    return best;
  };

  // Derive active routing rules dynamically based on recent sessions
  const dynamicRules = [];
  if (sessions.length > 0) {
    const recentIntents = Array.from(new Set(sessions.slice(0, 5).map(s => s.intent)));
    recentIntents.forEach((intent, i) => {
      const relatedSession = sessions.find(s => s.intent === intent);
      if (relatedSession) {
        dynamicRules.push({
          id: `r-dyn-${i}`,
          name: `${intent.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Policy`,
          priority: i + 1,
          condition: `intent == "${intent}" && complexity > ${relatedSession.complexity - 10}`,
          target: relatedSession.models[0]?.id as ModelId || 'claude-opus-4.5',
          enabled: true,
        });
      }
    });
  }

  // Ensure there's always at least one rule to display
  if (dynamicRules.length === 0) {
    dynamicRules.push({
      id: 'r-default',
      name: 'Default Policy',
      priority: 1,
      condition: 'fallback == true',
      target: 'claude-opus-4.5',
      enabled: true,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Strategy selector */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={14} className="text-ink-900" />
          <h3 className="text-sm font-semibold text-ink-950">Routing Strategy</h3>
        </div>
        <p className="text-2xs text-ink-500">Select the optimization policy for the routing engine</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STRATEGIES.map((s) => {
            const Icon = s.icon;
            const active = strategy === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStrategy(s.id)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all',
                  active ? 'border-ink-900 bg-ink-900 text-ink-50' : 'border-line bg-white hover:border-line-dark',
                )}
              >
                <Icon size={16} className={active ? 'text-ink-50' : 'text-ink-900'} />
                <div className="mt-2 text-xs font-semibold">{s.label}</div>
                <div className={cn('mt-0.5 text-2xs', active ? 'text-ink-300' : 'text-ink-500')}>{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Capability matrix */}
      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink-950">Capability Matrix</h3>
            <p className="text-2xs text-ink-500">Deterministic model proficiency scores (0–1)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-ink-500">Intent:</span>
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value as IntentType)}
              className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink-900 focus:outline-none"
            >
              {INTENT_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix table */}
        <div className="mt-4 overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-left text-2xs font-medium uppercase tracking-wide text-ink-400">Model</th>
                {INTENT_TYPES.map((t) => (
                  <th key={t} className="pb-2 px-1 text-center text-2xs font-medium uppercase tracking-wide text-ink-400">
                    <span className={cn(t === selectedIntent && 'text-ink-900 font-semibold')}>{t.replace('_', ' ').slice(0, 4)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilityMatrix.map((entry) => {
                const m = MODELS[entry.model as keyof typeof MODELS];
                if (!m) return null;
                return (
                  <tr key={entry.model} className="border-b border-line/40 last:border-0 hover:bg-ink-50">
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-ink-100 text-2xs font-semibold text-ink-700">{m.vendor.slice(0, 2)}</div>
                        <span className="text-xs font-medium text-ink-900 whitespace-nowrap">{m.name}</span>
                      </div>
                    </td>
                    {INTENT_TYPES.map((t) => {
                      const score = entry.scores[t];
                      const isMax = entry.model === getBestModel(t);
                      return (
                        <td key={t} className="px-1 py-2 text-center">
                          <div
                            className={cn(
                              'inline-flex h-7 w-9 items-center justify-center rounded text-2xs font-medium tabular-nums',
                              t === selectedIntent && 'ring-1 ring-ink-300',
                              isMax ? 'bg-ink-900 text-ink-50' : score > 0.9 ? 'bg-emerald-50 text-emerald-700' : score > 0.8 ? 'bg-ink-100 text-ink-700' : 'bg-ink-50 text-ink-500',
                            )}
                          >
                            {score.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Routing rules */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-950">Dynamic Routing Rules</h3>
              <p className="text-2xs text-ink-500">Auto-generated from recent query sessions</p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-line-dark">
              <Plus size={13} /> New Rule
            </button>
          </div>
          <div className="space-y-2">
            {dynamicRules.map((rule) => {
              const m = MODELS[rule.target as keyof typeof MODELS];
              return (
                <div key={rule.id} className={cn('flex items-center gap-3 rounded-lg border p-3', rule.enabled ? 'border-line bg-white' : 'border-line bg-ink-50/50 opacity-60')}>
                  <span className="mono flex h-6 w-6 items-center justify-center rounded bg-ink-900 text-2xs font-semibold text-ink-50">{rule.priority}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink-900">{rule.name}</span>
                      {!rule.enabled && <Badge>disabled</Badge>}
                    </div>
                    <p className="mt-0.5 mono text-2xs text-ink-500 truncate">{rule.condition}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-ink-100 text-2xs font-semibold text-ink-700">{m?.vendor.slice(0, 2)}</span>
                    <span className="text-xs font-medium text-ink-700 whitespace-nowrap">{m?.name || rule.target}</span>
                  </div>
                  <button className="text-ink-400 hover:text-ink-900">
                    <Settings2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fallback & health */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-950">Fallback Policy</h3>
            <div className="mt-3 space-y-2">
              {FRONTIER_MODELS.slice(0, 5).map((id, i) => {
                const m = MODELS[id];
                const fallback = FRONTIER_MODELS[i + 1] ?? FRONTIER_MODELS[0];
                const fm = MODELS[fallback];
                return (
                  <div key={id} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate text-ink-700">{m.name}</span>
                    <ArrowDownRight size={12} className="text-ink-400" />
                    <span className="flex-1 truncate text-ink-500">{fm.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-950">Model Health</h3>
            <div className="mt-3 space-y-2.5">
              {FRONTIER_MODELS.slice(0, 5).map((id) => {
                const m = MODELS[id];
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-700">{m.name}</span>
                      <span className="tabular-nums text-ink-500">{pct(m.reliability, 2)}</span>
                    </div>
                    <Bar value={m.reliability} className="mt-1" color="ok" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-ink-900" />
              <h3 className="text-sm font-semibold text-ink-950">Region Selector</h3>
            </div>
            <div className="space-y-2">
              {['us-east-1', 'us-west-2', 'eu-west-1', 'us-central-1', 'local'].map((r) => (
                <div key={r} className="flex items-center justify-between text-xs">
                  <span className="mono text-ink-700">{r}</span>
                  <span className="flex items-center gap-1.5 text-2xs text-emerald-600">
                    <span className={cn("h-1.5 w-1.5 rounded-full", latestSession?.routing?.region === r ? "bg-emerald-500" : "bg-ink-300")} /> 
                    {latestSession?.routing?.region === r ? 'Active' : 'Standby'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
