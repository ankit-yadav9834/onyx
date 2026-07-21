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
import { MODEL_METRICS, RECENT_QUERIES, AUDIT_LOG } from '@/lib/mockData';
import { Badge, Bar, MetricCard, Sparkline, StatusDot } from '@/components/ui';
import { timeAgo, pct } from '@/lib/utils';

const LATENCY_DATA = [3200, 2800, 3400, 2600, 3100, 2400, 2900, 2200, 2700, 2300, 2500, 2100];
const COST_DATA = [42, 38, 45, 41, 39, 36, 43, 38, 35, 40, 37, 34];
const CONFIDENCE_DATA = [0.88, 0.91, 0.89, 0.93, 0.92, 0.94, 0.91, 0.95, 0.93, 0.94, 0.96, 0.94];

export function DashboardPage({ navigate }: { navigate: (n: Route['name']) => void }) {
  const totalQueries = MODEL_METRICS.reduce((a, m) => a + m.totalCalls, 0);
  const totalSpend = MODEL_METRICS.reduce((a, m) => a + m.totalSpend, 0);
  const avgConf = MODEL_METRICS.reduce((a, m) => a + m.avgConfidence, 0) / MODEL_METRICS.length;
  const avgHallucination = MODEL_METRICS.reduce((a, m) => a + m.hallucinationRate, 0) / MODEL_METRICS.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Queries Orchestrated"
          value={totalQueries.toLocaleString()}
          sub="Last 30 days"
          trend={{ value: '+12.4%', positive: true }}
        />
        <MetricCard
          label="Total Spend"
          value={`$${(totalSpend / 1000).toFixed(1)}K`}
          sub="Across 14 models"
          trend={{ value: '-4.2%', positive: false }}
        />
        <MetricCard
          label="Avg Confidence"
          value={pct(avgConf)}
          sub="Weighted by reliability"
          trend={{ value: '+1.8%', positive: true }}
        />
        <MetricCard
          label="Hallucination Rate"
          value={pct(avgHallucination, 2)}
          sub="Verification pipeline"
          trend={{ value: '-0.3%', positive: true }}
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
              const max = Math.max(...LATENCY_DATA);
              const h = (v / max) * 100;
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t bg-ink-900 transition-all duration-500 hover:bg-ink-700"
                      style={{ height: `${h * 1.2}px` }}
                    />
                  </div>
                  <span className="text-2xs text-ink-400">{i + 1}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-950">Confidence Trend</h3>
          <p className="text-2xs text-ink-500">12-day rolling average</p>
          <div className="mt-8 mb-2">
            <span className="text-3xl font-semibold tabular-nums text-ink-950">{pct(CONFIDENCE_DATA[CONFIDENCE_DATA.length - 1])}</span>
            <span className="ml-2 text-xs text-emerald-600">+6.8%</span>
          </div>
          <Sparkline data={CONFIDENCE_DATA} className="h-12 w-full" />
          <div className="mt-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Verification pass rate</span>
              <span className="tabular-nums text-ink-900 font-medium">97.2%</span>
            </div>
            <Bar value={0.972} color="ok" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Consensus agreement</span>
              <span className="tabular-nums text-ink-900 font-medium">91.4%</span>
            </div>
            <Bar value={0.914} />
          </div>
        </div>
      </div>

      {/* Model health + spend */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-950">Model Health</h3>
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
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Latency</th>
                  <th className="pb-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Calls</th>
                </tr>
              </thead>
              <tbody>
                {FRONTIER_MODELS.map((id) => {
                  const m = MODELS[id];
                  const metric = MODEL_METRICS.find((x) => x.model === id)!;
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
                      <td className="py-2.5 text-xs tabular-nums text-ink-600">{formatLatency(m.avgLatencyMs)}</td>
                      <td className="py-2.5 text-xs tabular-nums text-ink-600">{metric.totalCalls.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-950">Spend by Model</h3>
          <p className="text-2xs text-ink-500">Last 30 days</p>
          <div className="mt-5 space-y-3">
            {MODEL_METRICS
              .filter((m) => FRONTIER_MODELS.includes(m.model))
              .sort((a, b) => b.totalSpend - a.totalSpend)
              .slice(0, 6)
              .map((m) => {
                const model = MODELS[m.model];
                const max = Math.max(...MODEL_METRICS.map((x) => x.totalSpend));
                return (
                  <div key={m.model}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-700">{model.name}</span>
                      <span className="tabular-nums text-ink-500">${(m.totalSpend).toFixed(0)}</span>
                    </div>
                    <Bar value={m.totalSpend} max={max} className="mt-1.5" />
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
            {RECENT_QUERIES.map((q) => (
              <button
                key={q.id}
                onClick={() => navigate('workspace')}
                className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-ink-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100">
                  <Cpu size={14} className="text-ink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-900">{q.query}</p>
                  <p className="text-2xs text-ink-400">{timeAgo(q.createdAt)} · {q.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs tabular-nums text-ink-900 font-medium">{pct(q.finalConfidence ?? 0)}</div>
                    <div className="text-2xs text-ink-400">confidence</div>
                  </div>
                  <Badge variant={q.status === 'complete' ? 'ok' : 'warn'}>{q.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-950">System Activity</h3>
          <p className="text-2xs text-ink-500">Live event stream</p>
          <div className="mt-4 space-y-3">
            {AUDIT_LOG.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-start gap-2.5">
                <div className="mt-1">
                  <StatusDot status={entry.outcome === 'success' ? 'ok' : entry.outcome === 'denied' ? 'err' : 'warn'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-700">
                    <span className="mono text-ink-900">{entry.action}</span>
                  </p>
                  <p className="text-2xs text-ink-400">{timeAgo(entry.timestamp)} · {entry.actor.split('@')[0]}</p>
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
            { label: 'Verification Pipeline', status: 'ok', detail: '8 checks · 97.2% pass' },
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
