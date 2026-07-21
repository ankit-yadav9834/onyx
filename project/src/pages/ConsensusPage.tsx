import { useState } from 'react';
import { Network, Target, AlertTriangle, CheckCircle2, TrendingUp, Layers, GitMerge } from 'lucide-react';
import { FRONTIER_MODELS, MODELS } from '@/lib/models';
import { Badge, Bar, ScoreRing, MetricCard } from '@/components/ui';
import { cn, pct } from '@/lib/utils';

// Generate consensus sessions from mock data
function genSessions() {
  const sessions = [];
  for (let i = 0; i < 6; i++) {
    const numModels = 3 + (i % 3);
    const models = FRONTIER_MODELS.slice(i, i + numModels);
    const agreement = 0.82 + (i % 5) * 0.04;
    const confidence = 0.85 + (i % 4) * 0.035;
    const resolution = agreement > 0.95 ? 'unanimous' : agreement > 0.88 ? 'majority' : agreement > 0.8 ? 'weighted' : 'split';
    sessions.push({
      id: `cs-${String(i + 1).padStart(4, '0')}`,
      query: [
        'Compare hyperscaler capex 2025 projections',
        'Rust lock-free MPSC queue with memory ordering',
        'FDA AI/ML medical device guidelines Q2 2026',
        'Black-Litterman with view uncertainty derivation',
        'RAG vs long-context retrieval trade-offs',
        'Circuit breaker pattern for multi-model orchestration',
      ][i],
      models,
      agreement,
      confidence,
      resolution,
      timestamp: Date.now() - i * 420000,
      conflicts: i % 3 === 2 ? ['Models disagree on projected 2026 growth rate'] : [],
      votes: models.map((m, j) => ({
        model: m,
        confidence: confidence - j * 0.02,
        weight: MODELS[m].reliability,
        agreement: agreement - j * 0.015,
      })),
    });
  }
  return sessions;
}

export function ConsensusPage() {
  const [selected, setSelected] = useState(0);
  const sessions = genSessions();
  const session = sessions[selected];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Avg Agreement" value="91.4%" sub="Across all sessions" trend={{ value: '+2.1%', positive: true }} />
        <MetricCard label="Unanimous Rate" value="34.2%" sub="Last 30 days" trend={{ value: '+5.8%', positive: true }} />
        <MetricCard label="Conflict Rate" value="8.7%" sub="Resolved via meta-reasoning" trend={{ value: '-1.2%', positive: true }} />
        <MetricCard label="Avg Models per Query" value="4.8" sub="Frontier + judge" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Session list */}
        <div className="card p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Network size={14} className="text-ink-900" />
            <h3 className="text-sm font-semibold text-ink-950">Consensus Sessions</h3>
          </div>
          <div className="space-y-1">
            {sessions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelected(i)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors',
                  i === selected ? 'border-ink-900 bg-ink-50' : 'border-line bg-white hover:border-line-dark',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="mono text-2xs text-ink-400">{s.id}</span>
                  <Badge variant={s.resolution === 'unanimous' ? 'ok' : s.resolution === 'split' ? 'err' : 'neutral'}>
                    {s.resolution}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-ink-900">{s.query}</p>
                <div className="mt-2 flex items-center gap-3 text-2xs text-ink-500">
                  <span>{s.models.length} models</span>
                  <span>·</span>
                  <span>{pct(s.agreement)} agreement</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Session detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="mono text-2xs text-ink-400">{session.id}</span>
                <h3 className="mt-1 text-sm font-semibold text-ink-950">{session.query}</h3>
              </div>
              <Badge variant={session.resolution === 'unanimous' ? 'ok' : 'neutral'}>{session.resolution}</Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-lg border border-line p-4">
                <ScoreRing value={session.agreement} size={64} label="agree" />
                <div>
                  <div className="label">Agreement Score</div>
                  <p className="mt-1 text-xs text-ink-500">How closely models align on the answer</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-line p-4">
                <ScoreRing value={session.confidence} size={64} label="conf" />
                <div>
                  <div className="label">Confidence Score</div>
                  <p className="mt-1 text-xs text-ink-500">Weighted by reliability & evidence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Votes */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitMerge size={14} className="text-ink-900" />
              <h3 className="text-sm font-semibold text-ink-950">Model Votes</h3>
            </div>
            <div className="space-y-3">
              {session.votes.map((v, i) => {
                const m = MODELS[v.model];
                return (
                  <div key={v.model} className="rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-2xs font-semibold text-ink-700">
                          {m.vendor.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-ink-900">{m.name}</div>
                          <div className="text-2xs text-ink-400">{m.vendor} · weight {v.weight.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xs text-ink-400">confidence</div>
                          <div className="text-xs font-semibold tabular-nums text-ink-900">{pct(v.confidence)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xs text-ink-400">agreement</div>
                          <div className="text-xs font-semibold tabular-nums text-ink-900">{pct(v.agreement)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <div>
                        <Bar value={v.confidence} color="ok" />
                      </div>
                      <div>
                        <Bar value={v.agreement} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conflicts & meta-reasoning */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-ink-900" />
              <h3 className="text-sm font-semibold text-ink-950">Meta-Reasoning & Conflict Resolution</h3>
            </div>
            {session.conflicts.length > 0 ? (
              <div className="space-y-3">
                {session.conflicts.map((c, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                      <AlertTriangle size={13} /> {c}
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-line bg-ink-50/50 p-3">
                  <div className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-ink-500">
                    <Target size={12} /> Resolution Strategy
                  </div>
                  <p className="mt-1.5 text-xs text-ink-700">
                    Meta-reasoning applied: weighted vote by reliability score and evidence quality. Models with higher
                    verification pass rates received amplified weights. Disagreement surfaced in consensus report with
                    confidence adjusted accordingly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">No conflicts detected — all models in agreement</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
