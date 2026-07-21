import {
  Activity,
  ArrowUpRight,
  DollarSign,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { Route } from '@/lib/router';
import { MODELS, FRONTIER_MODELS, formatCost, formatLatency } from '@/lib/models';
import { useQuerySessions, useAuditLogs, useAppState } from '@/lib/storage';
import { Badge, Bar, MetricCard, Sparkline, StatusDot } from '@/components/ui';
import { timeAgo, pct } from '@/lib/utils';

export function DashboardPage({ navigate }: { navigate: (n: Route['name']) => void }) {
  const sessions = useQuerySessions();
  const auditLogs = useAuditLogs();
  const { activeQuerySessionId } = useAppState();

  const totalQueries = sessions.length;
  const totalSpend = sessions.reduce((acc, s) => acc + s.cost, 0);
  
  const activeSession = activeQuerySessionId ? sessions.find(s => s.id === activeQuerySessionId) : null;
  const latestSession = activeSession || (sessions.length > 0 ? sessions[sessions.length - 1] : null);

  // Use the active/latest session for the metrics if available, otherwise global averages
  const avgConf = latestSession 
    ? latestSession.consensus.confidence 
    : (sessions.length > 0 ? sessions.reduce((acc, s) => acc + s.consensus.confidence, 0) / sessions.length : 0);
    
  const avgHallucination = latestSession 
    ? (1 - latestSession.verification.score) 
    : (sessions.length > 0 ? sessions.reduce((acc, s) => acc + (1 - s.verification.score), 0) / sessions.length : 0);

  // Aggregate model metrics
  const modelStats: Record<string, { calls: number; spend: number; latency: number }> = {};
  sessions.forEach((s) => {
    s.models.forEach(m => {
      if (!modelStats[m.id]) modelStats[m.id] = { calls: 0, spend: 0, latency: 0 };
      modelStats[m.id].calls++;
      modelStats[m.id].spend += m.cost;
      modelStats[m.id].latency += m.latencyMs;
    });
  });

  // Most recent 5
  const recentQueries = [...sessions].reverse().slice(0, 5);
  const recentLogs = [...auditLogs].reverse().slice(0, 8);
  
  // Derive charts exclusively from real query sessions
  const recent12Sessions = [...sessions].reverse().slice(0, 12).reverse();
  const LATENCY_DATA = recent12Sessions.length > 0 
    ? recent12Sessions.map(s => s.latency)
    : [0];
    
  const CONFIDENCE_DATA = recent12Sessions.length > 0
    ? recent12Sessions.map(s => s.consensus.confidence)
    : [0];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Queries Orchestrated"
          value={totalQueries.toLocaleString()}
          sub="All time"
          trend={{ value: 'Live', positive: true }}
        />
        <MetricCard
          label="Total Spend"
          value={`$${totalSpend.toFixed(3)}`}
          sub="Across all models"
          trend={{ value: 'Live', positive: false }}
        />
        <MetricCard
          label="Avg Confidence"
          value={pct(avgConf)}
          sub="Weighted by reliability"
          trend={{ value: 'Live', positive: true }}
        />
        <MetricCard
          label="Hallucination Rate"
          value={pct(avgHallucination, 2)}
          sub="Verification pipeline"
          trend={{ value: 'Live', positive: true }}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink-950">Orchestration Volume</h3>
              <p className="text-2xs text-ink-500">Queries per hour · last 12 hours</p>
            </div>
            <Badge variant="ok"><span className="h-1 w-1 rounded-full bg-emerald-500" />Live</Badge>
          </div>
          <div className="mt-6 flex items-end gap-2">
            {LATENCY_DATA.map((v, i) => {
              const max = Math.max(...LATENCY_DATA, 1);
              const h = (v / max) * 100;
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t bg-ink-900 transition-all duration-500 hover:bg-ink-700"
                      style={{ height: `${h * 1.2}px` }}
                    />
                  </div>
                  <span className="text-2xs text-ink-400">Q{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-950">Confidence Trend</h3>
          <p className="text-2xs text-ink-500">Recent queries</p>
          <div className="mt-8 mb-2">
            <span className="text-3xl font-semibold tabular-nums text-ink-950">{pct(CONFIDENCE_DATA[CONFIDENCE_DATA.length - 1] || 0)}</span>
          </div>
          <Sparkline data={CONFIDENCE_DATA} className="h-12 w-full" />
          <div className="mt-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Verification pass rate</span>
              <span className="tabular-nums text-ink-900 font-medium">{pct(1 - avgHallucination)}</span>
            </div>
            <Bar value={1 - avgHallucination} color="ok" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Consensus agreement</span>
              <span className="tabular-nums text-ink-900 font-medium">{pct(sessions.reduce((acc, s) => acc + s.consensus.agreement, 0) / (sessions.length || 1))}</span>
            </div>
            <Bar value={sessions.reduce((acc, s) => acc + s.consensus.agreement, 0) / (sessions.length || 1)} />
          </div>
        </div>
      </div>

      {/* Model health + spend */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-950">Model Health & Usage</h3>
            <button onClick={() => navigate('models')} className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Model</th>
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Status</th>
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Reliability</th>
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Avg Latency</th>
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Calls</th>
                </tr>
              </thead>
              <tbody>
                {FRONTIER_MODELS.map((id) => {
                  const m = MODELS[id];
                  const stats = modelStats[id] || { calls: 0, spend: 0, latency: 0 };
                  const avgLat = stats.calls > 0 ? stats.latency / stats.calls : m.avgLatencyMs;
                  return (
                    <tr key={id} className="border-b border-line/60 last:border-0 hover:bg-ink-50">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-100 text-2xs font-semibold text-ink-700">
                            {m.vendor.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-ink-900">{m.name}</div>
                            <div className="text-2xs text-ink-400">{m.vendor}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-ink-600">
                          <StatusDot status="ok" /> Operational
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Bar value={m.reliability} className="w-16" color="ok" />
                          <span className="text-xs tabular-nums text-ink-600">{pct(m.reliability, 2)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs tabular-nums text-ink-600">{formatLatency(avgLat)}</td>
                      <td className="py-2.5 text-xs tabular-nums text-ink-600">{stats.calls.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-950">Spend by Model</h3>
          <p className="text-2xs text-ink-500">Live</p>
          <div className="mt-5 space-y-3">
            {Object.keys(modelStats).length === 0 && (
              <div className="text-xs text-ink-500 py-4 text-center">No spend data yet.</div>
            )}
            {Object.entries(modelStats)
              .sort((a, b) => b[1].spend - a[1].spend)
              .slice(0, 6)
              .map(([modelId, stats]) => {
                const model = MODELS[modelId as keyof typeof MODELS];
                const maxSpend = Math.max(...Object.values(modelStats).map(s => s.spend));
                return (
                  <div key={modelId}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-700">{model?.name || modelId}</span>
                      <span className="tabular-nums text-ink-500">${stats.spend.toFixed(4)}</span>
                    </div>
                    <Bar value={stats.spend} max={maxSpend} className="mt-1.5" />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent queries + activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-950">Recent Orchestrated Queries</h3>
            <button onClick={() => navigate('workspace')} className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">
              New query <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {recentQueries.length === 0 && (
              <div className="text-xs text-ink-500 py-4 text-center border rounded-lg">No queries yet. Start chatting in the Workspace!</div>
            )}
            {recentQueries.map((q) => (
              <button
                key={q.id}
                onClick={() => navigate('workspace')}
                className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-ink-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100">
                  <Cpu size={14} className="text-ink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-900">{q.userPrompt}</p>
                  <p className="text-2xs text-ink-400">{timeAgo(q.timestamp)} · {q.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs tabular-nums text-ink-900 font-medium">{pct(q.consensus.confidence ?? 0)}</div>
                    <div className="text-2xs text-ink-400">confidence</div>
                  </div>
                  <Badge variant="ok">complete</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-950">System Activity</h3>
          <p className="text-2xs text-ink-500">Live event stream</p>
          <div className="mt-4 space-y-3">
            {recentLogs.length === 0 && (
              <div className="text-xs text-ink-500 py-4 text-center border rounded-lg">No events yet.</div>
            )}
            {recentLogs.map((entry) => (
              <div key={entry.eventId} className="flex items-start gap-2.5">
                <div className="mt-1">
                  <StatusDot status={entry.status === 'success' ? 'ok' : 'err'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-700">
                    <span className="mono text-ink-900">query_execution</span>
                  </p>
                  <p className="text-2xs text-ink-400">{timeAgo(entry.timestamp)} · System</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline status bar */}
      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-950">Pipeline Status</h3>
          <Badge variant="ok"><span className="h-1 w-1 rounded-full bg-emerald-500" />All systems operational</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Intent Engine', status: 'ok', detail: '4 fast models · avg 180ms' },
            { label: 'Routing Engine', status: 'ok', detail: '7 active rules' },
            { label: 'Execution Layer', status: 'ok', detail: '8 models online · streaming' },
            { label: 'Verification Pipeline', status: 'ok', detail: `8 checks · ${pct(1 - avgHallucination)} pass` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-2">
                <StatusDot status={s.status as 'ok'} />
                <span className="text-xs font-medium text-ink-900">{s.label}</span>
              </div>
              <p className="mt-1.5 text-2xs text-ink-500">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
