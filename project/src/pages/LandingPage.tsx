import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  GitBranch,
  Network,
  Gauge,
  Layers,
  Lock,
  Activity,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { Route } from '@/lib/router';
import { Logo } from '@/components/Logo';
import { Badge, Bar, ScoreRing } from '@/components/ui';

const PIPELINE = [
  { label: 'Intent Detection', model: 'Gemma 3 27B', desc: 'Classify · score risk · detect format' },
  { label: 'Task Planning', model: 'Claude Opus 4.5', desc: 'Decompose into subtasks · build DAG' },
  { label: 'Smart Routing', model: 'Routing Engine', desc: 'Capability matrix · cost · latency · privacy' },
  { label: 'Parallel Execution', model: 'GPT-5 · Claude · Gemini', desc: 'Stream across frontier models' },
  { label: 'Verification', model: 'Judge Models', desc: 'Fact-check · hallucination · logic · safety' },
  { label: 'Consensus', model: 'Weighted Voting', desc: 'Agreement score · conflict resolution' },
  { label: 'Synthesis', model: 'Claude Opus 4.5', desc: 'One trusted answer · citations · confidence' },
];

const MODELS_ROW = ['GPT-5', 'Claude Opus 4.5', 'Gemini 2.5 Pro', 'DeepSeek R2', 'Grok 4', 'Llama 4 405B', 'Mistral Large 2'];

export function LandingPage({ navigate }: { navigate: (n: Route['name']) => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Logo size={28} className="text-ink-950" />
            <span className="text-base font-semibold tracking-tight text-ink-950">
              Orchestr<span className="text-ink-400">AI</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#platform" className="text-sm text-ink-600 hover:text-ink-950">Platform</a>
            <a href="#pipeline" className="text-sm text-ink-600 hover:text-ink-950">Pipeline</a>
            <a href="#trust" className="text-sm text-ink-600 hover:text-ink-950">Trust Layer</a>
            <a href="#enterprise" className="text-sm text-ink-600 hover:text-ink-950">Enterprise</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('dashboard')} className="text-sm font-medium text-ink-600 hover:text-ink-950">
              Sign in
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-3.5 py-2 text-sm font-medium text-ink-50 transition-colors hover:bg-ink-900"
            >
              Launch Platform
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge variant="dark" className="mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Production-ready · v2.4
            </Badge>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-ink-950 md:text-7xl">
              One query.
              <br />
              Every frontier model.
              <br />
              <span className="text-ink-400">One trusted answer.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-600">
              OrchestrAI is the orchestration, verification, routing, and trust layer sitting above all frontier LLMs.
              Not another chatbot — the infrastructure that makes AI trustworthy at enterprise scale.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={() => navigate('workspace')}
                className="inline-flex items-center gap-2 rounded-lg bg-ink-950 px-5 py-3 text-sm font-medium text-ink-50 transition-colors hover:bg-ink-900"
              >
                Open Query Workspace
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-medium text-ink-900 transition-colors hover:border-ink-300"
              >
                View Dashboard
              </button>
            </div>
            <div className="mt-12 flex items-center gap-6 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><Lock size={13} /> SOC2-ready</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> GDPR-ready</span>
              <span className="flex items-center gap-1.5"><Activity size={13} /> 99.94% uptime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> 8 frontier models</span>
            </div>
          </div>
        </div>
      </section>

      {/* Model strip */}
      <section className="border-b border-line bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-4 text-center text-2xs font-medium uppercase tracking-[0.12em] text-ink-400">
            Orchestrating every frontier model
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {MODELS_ROW.map((m) => (
              <span key={m} className="text-sm font-medium text-ink-500">{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <Badge className="mb-4">The Lifecycle</Badge>
            <h2 className="text-4xl font-semibold tracking-tight text-ink-950">
              Understand. Plan. Route. Execute. Verify. Build Consensus.
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              Every query passes through an eight-stage pipeline. Each stage is observable, configurable, and audited.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-line" />
            <div className="space-y-1">
              {PIPELINE.map((stage, i) => (
                <div key={stage.label} className="group relative flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-ink-50">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-900">
                    <span className="mono text-xs font-semibold">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-ink-950">{stage.label}</h3>
                      <span className="mono text-2xs text-ink-400">{stage.model}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500">{stage.desc}</p>
                  </div>
                  <ChevronRight size={16} className="mt-3 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section id="trust" className="border-b border-line bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <Badge className="mb-4">The Trust Layer</Badge>
            <h2 className="text-4xl font-semibold tracking-tight text-ink-950">
              Verification is not optional.
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              Eight independent checks run on every response. No answer ships without passing through the verification pipeline.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Fact Checker', desc: 'Claims verified against retrieved evidence' },
              { icon: Network, title: 'Hallucination Detector', desc: 'Lightweight judge models flag unsupported content' },
              { icon: GitBranch, title: 'Logic Validator', desc: 'Reasoning chains checked for internal consistency' },
              { icon: Lock, title: 'Safety Checker', desc: 'Policy & compliance enforcement on every output' },
              { icon: Gauge, title: 'Math Validator', desc: 'Numerical results independently recomputed' },
              { icon: Layers, title: 'JSON Validator', desc: 'Structured output schema validation' },
              { icon: Network, title: 'Contradiction Detector', desc: 'Cross-model agreement verification' },
              { icon: ShieldCheck, title: 'Citation Checker', desc: 'Every source verified for provenance & trust' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white p-6">
                  <Icon size={20} className="text-ink-900" />
                  <h3 className="mt-4 text-sm font-semibold text-ink-950">{item.title}</h3>
                  <p className="mt-1 text-xs text-ink-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="platform" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { value: '8', label: 'Frontier models orchestrated' },
              { value: '94.2%', label: 'Average consensus confidence' },
              { value: '3.2s', label: 'Median end-to-end latency' },
              { value: '99.94%', label: 'Platform uptime (90-day)' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-5xl font-semibold tracking-tight tabular-nums text-ink-950">{s.value}</div>
                <div className="mt-2 text-sm text-ink-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consensus demo card */}
      <section id="enterprise" className="border-b border-line bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-4">Consensus Engine</Badge>
              <h2 className="text-4xl font-semibold tracking-tight text-ink-950">
                Multiple models. One verified answer.
              </h2>
              <p className="mt-4 text-lg text-ink-600">
                Instead of trusting a single model, OrchestrAI runs parallel inference across frontier LLMs, then builds
                weighted consensus. Disagreements are surfaced, conflicts are resolved, and every answer carries a
                transparent confidence score.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Weighted voting by model reliability & evidence quality',
                  'Agreement scoring across all participating models',
                  'Conflict resolution with meta-reasoning trace',
                  'Confidence score grounded in verification results',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('consensus')}
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-950 hover:gap-2.5"
              >
                Explore the Consensus Engine
                <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <span className="label">Query Consensus</span>
                <Badge variant="ok">Unanimous</Badge>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <ScoreRing value={0.94} size={72} label="conf" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">5 models in agreement</div>
                  <div className="mt-1 text-xs text-ink-500">GPT-5 · Claude Opus · Gemini · DeepSeek · Llama 4</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { model: 'GPT-5', conf: 0.96, w: 1.0 },
                  { model: 'Claude Opus 4.5', conf: 0.94, w: 0.99 },
                  { model: 'Gemini 2.5 Pro', conf: 0.92, w: 0.99 },
                  { model: 'DeepSeek R2', conf: 0.93, w: 0.97 },
                  { model: 'Llama 4 405B', conf: 0.89, w: 0.97 },
                ].map((v) => (
                  <div key={v.model} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-xs font-medium text-ink-700">{v.model}</span>
                    <Bar value={v.conf} className="flex-1" />
                    <span className="w-10 text-right text-xs tabular-nums text-ink-500">{(v.conf * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight text-ink-950 md:text-5xl">
            Deploy the trust layer for your AI stack.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
            Orchestrate every frontier model. Verify every output. Ship with confidence.
          </p>
          <button
            onClick={() => navigate('dashboard')}
            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-ink-950 px-6 py-3.5 text-sm font-medium text-ink-50 transition-colors hover:bg-ink-900"
          >
            Launch OrchestrAI
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <Logo size={22} className="text-ink-950" />
              <span className="text-sm font-semibold tracking-tight text-ink-950">
                Orchestr<span className="text-ink-400">AI</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-ink-500">
              <a href="#" className="hover:text-ink-900">Documentation</a>
              <a href="#" className="hover:text-ink-900">API Reference</a>
              <a href="#" className="hover:text-ink-900">Security</a>
              <a href="#" className="hover:text-ink-900">Status</a>
              <a href="#" className="hover:text-ink-900">Enterprise</a>
            </div>
            <span className="text-2xs text-ink-400">© 2026 OrchestrAI Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
