import { useState } from 'react';
import { BarChart3, DollarSign, Clock, Target, AlertTriangle } from 'lucide-react';
import { MODELS, FRONTIER_MODELS, FAST_MODELS, JUDGE_MODELS, formatCost, formatLatency } from '@/lib/models';
import { useQuerySessions, useAppState } from '@/lib/storage';
import { Badge, Bar, MetricCard, Sparkline } from '@/components/ui';
import { cn, pct } from '@/lib/utils';

const ALL_IDS = [...FRONTIER_MODELS, ...FAST_MODELS, ...JUDGE_MODELS];

function genSparkline(seed: number): number[] {
  return Array.from({ length: 12 }, (_, i) => 0.7 + Math.sin(i * 0.5 + seed) * 0.15 + (i % 3) * 0.02);
}

export function ModelsPage() {
  const sessions = useQuerySessions();
  const { activeQuerySessionId } = useAppState();
  const [tier, setTier] = useState<'all' | 'frontier' | 'fast' | 'judge'>('all');
  const filtered = tier === 'all' ? ALL_IDS : tier === 'frontier' ? FRONTIER_MODELS : tier === 'fast' ? FAST_MODELS : JUDGE_MODELS;

  const activeSession = activeQuerySessionId ? sessions.find(s => s.id === activeQuerySessionId) : null;
  const targetSessions = activeSession ? [activeSession] : sessions;

  // Aggregate stats per model based on targetSessions
  const modelStats: Record<string, { calls: number; spend: number; latency: number; confidence: number; hallucination: number; success: number }> = {};
  
  // Initialize with empty so everything appears
  ALL_IDS.forEach(id => {
    modelStats[id] = { calls: 0, spend: 0, latency: 0, confidence: 0, hallucination: 0, success: 0 };
  });

  targetSessions.forEach(s => {
    s.models.forEach(m => {
      if (!modelStats[m.id]) return;
      modelStats[m.id].calls++;
      modelStats[m.id].spend += m.cost;
      modelStats[m.id].latency += m.latencyMs;
      modelStats[m.id].confidence += s.consensus.confidence; // using global consensus confidence
      modelStats[m.id].hallucination += (1 - s.verification.score); // proxy for hallucination
      modelStats[m.id].success++;
    });
  });

  // Convert to array of metrics
  const metrics = filtered.map(model => {
    const stats = modelStats[model];
    const calls = stats.calls || 1; // avoid div 0
    return {
      model,
      totalCalls: stats.calls,
      totalSpend: stats.spend,
      avgLatencyMs: stats.calls > 0 ? stats.latency / calls : MODELS[model as keyof typeof MODELS].avgLatencyMs,
      p99LatencyMs: stats.calls > 0 ? (stats.latency / calls) * 1.5 : MODELS[model as keyof typeof MODELS].avgLatencyMs * 1.5,
      avgConfidence: stats.calls > 0 ? stats.confidence / calls : 0,
      hallucinationRate: stats.calls > 0 ? stats.hallucination / calls : 0,
      successRate: stats.calls > 0 ? stats.success / calls : 1,
    };
  });

  const totalSpend = Object.values(modelStats).reduce((a, s) => a + s.spend, 0);
  const frontierCalls = FRONTIER_MODELS.reduce((a, id) => a + modelStats[id].calls, 0) || 1;
  const avgLatency = FRONTIER_MODELS.reduce((a, id) => a + modelStats[id].latency, 0) / frontierCalls;
  
  const totalCallsAll = Object.values(modelStats).reduce((a, s) => a + s.calls, 0) || 1;
  const avgConfidence = Object.values(modelStats).reduce((a, s) => a + s.confidence, 0) / totalCallsAll;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Models" value={ALL_IDS.length} sub="8 frontier · 4 fast · 2 judge" />
        <MetricCard label="Total Spend" value={`$${totalSpend.toFixed(3)}`} sub="All time" trend={{ value: 'Live', positive: false }} />
        <MetricCard label="Avg Latency" value={formatLatency(avgLatency)} sub="Frontier models" trend={{ value: 'Live', positive: true }} />
        <MetricCard label="Avg Confidence" value={pct(avgConfidence)} sub="All models" trend={{ value: 'Live', positive: true }} />
      </div>

      {/* Filter */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-2xs font-medium uppercase tracking-wide text-ink-400">Tier:</span>
        {(['all', 'frontier', 'fast', 'judge'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors',
              tier === t ? 'border-ink-900 bg-ink-900 text-ink-50' : 'border-line bg-white text-ink-600 hover:border-line-dark',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Model grid */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, i) => {
          const m = MODELS[metric.model as keyof typeof MODELS];
          return (
            <div key={metric.model} className="card card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-xs font-semibold text-ink-700">
                    {m.vendor.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-950">{m.name}</div>
                    <div className="text-2xs text-ink-500">{m.vendor} · {m.tier}</div>
                  </div>
                </div>
                <Badge variant={metric.successRate > 0.98 ? 'ok' : 'neutral'}>
                  {pct(metric.successRate, 2)}
                </Badge>
              </div>

              <div className="mt-4">
                <Sparkline data={genSparkline(i)} className="h-10 w-full" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-2xs text-ink-500">
                    <Clock size={11} /> Avg Latency
                  </div>
                  <div className="mt-0.5 text-xs font-semibold tabular-nums text-ink-900">{formatLatency(metric.avgLatencyMs)}</div>
                  <div className="text-2xs text-ink-400">p99: {formatLatency(metric.p99LatencyMs)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-2xs text-ink-500">
                    <DollarSign size={11} /> Cost / 1M
                  </div>
                  <div className="mt-0.5 text-xs font-semibold tabular-nums text-ink-900">{formatCost(m.costPer1M.output)}</div>
                  <div className="text-2xs text-ink-400">in: {formatCost(m.costPer1M.input)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-2xs text-ink-500">
                    <Target size={11} /> Confidence
                  </div>
                  <div className="mt-0.5 text-xs font-semibold tabular-nums text-ink-900">{pct(metric.avgConfidence)}</div>
                  <Bar value={metric.avgConfidence} className="mt-1" color="ok" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-2xs text-ink-500">
                    <AlertTriangle size={11} /> Hallucination
                  </div>
                  <div className="mt-0.5 text-xs font-semibold tabular-nums text-ink-900">{pct(metric.hallucinationRate, 2)}</div>
                  <Bar value={metric.hallucinationRate} max={1.0} className="mt-1" color="err" />
                </div>
              </div>

              <div className="mt-4 border-t border-line pt-3">
                <div className="flex items-center justify-between text-2xs text-ink-500">
                  <span>{metric.totalCalls.toLocaleString()} calls</span>
                  <span>${metric.totalSpend.toFixed(4)} spend</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-2xs text-ink-500">
                  <span>{m.region}</span>
                  <span className="capitalize">{m.privacy.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-6 card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-ink-900" />
          <h3 className="text-sm font-semibold text-ink-950">Model Comparison</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Model</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Tier</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Reliability</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Latency</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Cost/1M out</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Confidence</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Hallucination</th>
                <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Calls</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const m = MODELS[metric.model as keyof typeof MODELS];
                return (
                  <tr key={metric.model} className="border-b border-line/40 last:border-0 hover:bg-ink-50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-ink-100 text-2xs font-semibold text-ink-700">{m.vendor.slice(0, 2)}</div>
                        <span className="text-xs font-medium text-ink-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5"><Badge>{m.tier}</Badge></td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Bar value={metric.successRate} className="w-14" color="ok" />
                        <span className="text-xs tabular-nums text-ink-600">{pct(metric.successRate, 2)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-xs tabular-nums text-ink-600">{formatLatency(metric.avgLatencyMs)}</td>
                    <td className="py-2.5 text-xs tabular-nums text-ink-600">{formatCost(m.costPer1M.output)}</td>
                    <td className="py-2.5 text-xs tabular-nums text-ink-600">{pct(metric.avgConfidence)}</td>
                    <td className="py-2.5 text-xs tabular-nums text-ink-600">{pct(metric.hallucinationRate, 2)}</td>
                    <td className="py-2.5 text-xs tabular-nums text-ink-600">{metric.totalCalls.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
