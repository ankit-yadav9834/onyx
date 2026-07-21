import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Brain,
  FileText,
  Calculator,
  Code2,
  Lock,
  GitCompare,
  Quote,
} from 'lucide-react';
import { Badge, Bar, MetricCard, ScoreRing } from '@/components/ui';
import { cn, pct } from '@/lib/utils';
import { MODELS } from '@/lib/models';

const CHECK_DEFS = [
  { name: 'Fact Check', icon: Brain, desc: 'Claims verified against retrieved evidence' },
  { name: 'Citation Check', icon: Quote, desc: 'Source provenance and trust verified' },
  { name: 'Hallucination Detector', icon: AlertTriangle, desc: 'Unsupported content flagged' },
  { name: 'Logic Validator', icon: GitCompare, desc: 'Reasoning chain consistency' },
  { name: 'Safety Checker', icon: Lock, desc: 'Policy & compliance enforcement' },
  { name: 'Math Validator', icon: Calculator, desc: 'Numerical results recomputed' },
  { name: 'JSON Validator', icon: Code2, desc: 'Structured output schema validation' },
  { name: 'Contradiction Detector', icon: FileText, desc: 'Cross-model agreement check' },
];

const JUDGE_MODELS = ['gpt-5-judge', 'claude-judge', 'gemma-3-27b'] as const;

function genChecks() {
  return CHECK_DEFS.map((def, i) => {
    const status = i === 2 ? 'warn' : i === 5 ? 'warn' : 'pass';
    const score = status === 'pass' ? 0.9 + (i % 10) / 100 : 0.72 + (i % 8) / 100;
    return {
      ...def,
      status: status as 'pass' | 'warn' | 'fail',
      score,
      checker: JUDGE_MODELS[i % JUDGE_MODELS.length],
      latencyMs: 90 + (i * 37) % 180,
      detail: status === 'pass'
        ? 'All checks passed'
        : 'Minor discrepancy detected — flagged for review',
    };
  });
}

export function VerificationPage() {
  const [selectedCheck, setSelectedCheck] = useState(0);
  const checks = genChecks();
  const check = checks[selectedCheck];
  const overall = checks.reduce((a, c) => a + c.score, 0) / checks.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Pass Rate" value="97.2%" sub="Last 7 days" trend={{ value: '+0.8%', positive: true }} />
        <MetricCard label="Avg Score" value={pct(overall)} sub="Across 8 checks" />
        <MetricCard label="Checks Today" value="14,820" sub="Across all queries" trend={{ value: '+12%', positive: true }} />
        <MetricCard label="Flagged" value="418" sub="Requires review" trend={{ value: '-3.2%', positive: true }} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Check pipeline */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={14} className="text-ink-900" />
            <h3 className="text-sm font-semibold text-ink-950">Verification Pipeline</h3>
          </div>
          <div className="space-y-1">
            {checks.map((c, i) => {
              const Icon = c.icon;
              const active = i === selectedCheck;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCheck(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    active ? 'border-ink-900 bg-ink-50' : 'border-line bg-white hover:border-line-dark',
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    c.status === 'pass' ? 'bg-emerald-50 text-emerald-600' : c.status === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600',
                  )}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink-900">{c.name}</div>
                    <div className="text-2xs text-ink-400 truncate">{c.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold tabular-nums text-ink-900">{(c.score * 100).toFixed(0)}%</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Check detail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  check.status === 'pass' ? 'bg-emerald-50 text-emerald-600' : check.status === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600',
                )}>
                  <check.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-950">{check.name}</h3>
                  <p className="text-2xs text-ink-500">{check.desc}</p>
                </div>
              </div>
              <Badge variant={check.status === 'pass' ? 'ok' : check.status === 'warn' ? 'warn' : 'err'}>
                {check.status === 'pass' ? 'Passed' : check.status === 'warn' ? 'Warning' : 'Failed'}
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-line p-4 text-center">
                <ScoreRing value={check.score} size={56} label="score" />
                <div className="mt-2 label">Check Score</div>
              </div>
              <div className="rounded-lg border border-line p-4">
                <div className="label">Checker Model</div>
                <div className="mt-1.5 text-sm font-semibold text-ink-900">{MODELS[check.checker].name}</div>
                <div className="text-2xs text-ink-500">{MODELS[check.checker].vendor}</div>
              </div>
              <div className="rounded-lg border border-line p-4">
                <div className="label">Latency</div>
                <div className="mt-1.5 text-sm font-semibold text-ink-900">{check.latencyMs}ms</div>
                <div className="text-2xs text-ink-500">Per query avg</div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-line bg-ink-50/50 p-4">
              <div className="label">Detail</div>
              <p className="mt-1 text-xs text-ink-700">{check.detail}</p>
            </div>
          </div>

          {/* Overall pipeline score */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-950">Pipeline Score Distribution</h3>
            <p className="text-2xs text-ink-500">Last 1,000 verified queries</p>
            <div className="mt-4 space-y-2.5">
              {checks.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-xs text-ink-700">{c.name}</span>
                  <Bar value={c.score} className="flex-1" color={c.status === 'pass' ? 'ok' : 'warn'} />
                  <span className="w-10 text-right text-xs tabular-nums text-ink-500">{(c.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Judge models */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-ink-900" />
              <h3 className="text-sm font-semibold text-ink-950">Judge Models</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {JUDGE_MODELS.map((id) => {
                const m = MODELS[id];
                return (
                  <div key={id} className="rounded-lg border border-line p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-100 text-2xs font-semibold text-ink-700">{m.vendor.slice(0, 2)}</div>
                      <span className="text-xs font-medium text-ink-900">{m.name}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-2xs text-ink-500">
                      <span>Reliability</span>
                      <span className="tabular-nums text-ink-700">{pct(m.reliability, 2)}</span>
                    </div>
                    <Bar value={m.reliability} className="mt-1" color="ok" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
