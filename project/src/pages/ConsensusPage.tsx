import { useState } from 'react';
import { Network, Target, AlertTriangle, CheckCircle2, TrendingUp, Layers, GitMerge } from 'lucide-react';
import { FRONTIER_MODELS, MODELS } from '@/lib/models';
import { useQuerySessions } from '@/lib/storage';
import { Badge, Bar, ScoreRing, MetricCard } from '@/components/ui';
import { cn, pct } from '@/lib/utils';
import type { QuerySession } from '@/lib/types';

export function ConsensusPage() {
  const [selected, setSelected] = useState(0);
  const allSessions = useQuerySessions();

  // Show at most 10 recent sessions for the consensus view
  const sessions = allSessions.slice(0, 10);
  const session = sessions[selected];

  const avgAgreement = allSessions.length > 0 
    ? allSessions.reduce((acc, s) => acc + s.consensus.agreement, 0) / allSessions.length 
    : 0;
  
  const unanimousRate = allSessions.length > 0
    ? allSessions.filter(s => s.consensus.agreement > 0.95).length / allSessions.length
    : 0;

  const conflictRate = allSessions.length > 0
    ? allSessions.filter(s => s.consensus.agreement < 0.82).length / allSessions.length
    : 0;

  const avgModelsPerQuery = allSessions.length > 0
    ? allSessions.reduce((acc, s) => acc + s.consensus.votes.length, 0) / allSessions.length
    : 0;

  if (allSessions.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-center mt-20">
        <Network size={32} className="mx-auto text-ink-300 mb-4" />
        <h3 className="text-lg font-semibold text-ink-900">No Consensus Data Yet</h3>
        <p className="text-ink-500 mt-2">Submit a query in the Workspace to see consensus in action.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Avg Agreement" value={pct(avgAgreement)} sub="Across all sessions" trend={{ value: 'Live', positive: true }} />
        <MetricCard label="Unanimous Rate" value={pct(unanimousRate)} sub="All time" trend={{ value: 'Live', positive: true }} />
        <MetricCard label="Conflict Rate" value={pct(conflictRate)} sub="Resolved via meta-reasoning" trend={{ value: 'Live', positive: true }} />
        <MetricCard label="Avg Models per Query" value={avgModelsPerQuery.toFixed(1)} sub="Frontier + judge" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Session list */}
        <div className="card p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Network size={14} className="text-ink-900" />
            <h3 className="text-sm font-semibold text-ink-950">Consensus Sessions</h3>
          </div>
          <div className="space-y-1">
            {sessions.map((s, i) => {
              const resolution = s.consensus.agreement > 0.95 ? 'unanimous' : s.consensus.agreement > 0.88 ? 'majority' : s.consensus.agreement > 0.8 ? 'weighted' : 'split';
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    i === selected ? 'border-ink-900 bg-ink-50' : 'border-line bg-white hover:border-line-dark',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-2xs text-ink-400">{s.id.slice(0, 10)}...</span>
                    <Badge variant={resolution === 'unanimous' ? 'ok' : resolution === 'split' ? 'err' : 'neutral'}>
                      {resolution}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-ink-900">{s.userPrompt}</p>
                  <div className="mt-2 flex items-center gap-3 text-2xs text-ink-500">
                    <span>{s.consensus.votes.length} models</span>
                    <span>·</span>
                    <span>{pct(s.consensus.agreement)} agreement</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session detail */}
        <div className="lg:col-span-2 space-y-4">
          {session && (
            <>
              {/* Overview */}
              <div className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="max-w-[80%]">
                    <span className="mono text-2xs text-ink-400">{session.id}</span>
                    <h3 className="mt-1 text-sm font-semibold text-ink-950 truncate" title={session.userPrompt}>{session.userPrompt}</h3>
                  </div>
                  <Badge variant={session.consensus.agreement > 0.95 ? 'ok' : 'neutral'}>
                    {session.consensus.agreement > 0.95 ? 'unanimous' : session.consensus.agreement > 0.88 ? 'majority' : session.consensus.agreement > 0.8 ? 'weighted' : 'split'}
                  </Badge>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-4 rounded-lg border border-line p-4">
                    <ScoreRing value={session.consensus.agreement} size={64} label="agree" />
                    <div>
                      <div className="label">Agreement Score</div>
                      <p className="mt-1 text-xs text-ink-500">How closely models align on the answer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border border-line p-4">
                    <ScoreRing value={session.consensus.confidence} size={64} label="conf" />
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
                  {session.consensus.votes.map((v, i) => {
                    const m = MODELS[v.model as keyof typeof MODELS];
                    if (!m) return null;
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
                {session.consensus.agreement < 0.82 ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle size={13} /> Disagreement detected among models on projection specifics.
                      </div>
                    </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
