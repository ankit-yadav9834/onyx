import { useState } from 'react';
import { Settings, Key, Bell, Globe, Shield, Database, Webhook, Copy } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/storage';

const SECTIONS = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data Retention', icon: Database },
];

export function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const [section, setSection] = useState('general');

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Section nav */}
        <nav className="space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-ink-900 text-ink-50' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                <Icon size={15} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="space-y-6">
          {section === 'general' && <GeneralSection />}
          {section === 'api' && <ApiSection />}
          {section === 'webhooks' && <WebhooksSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'security' && <SecuritySection />}
          {section === 'data' && <DataSection />}
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink-950">{title}</h3>
      <p className="mt-0.5 text-2xs text-ink-500">{desc}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Toggle({ on, label, desc, onToggle }: { on: boolean; label: string; desc: string; onToggle?: (val: boolean) => void }) {
  const [enabled, setEnabled] = useState(on);
  return (
    <div className="flex items-center justify-between border-b border-line/40 py-3 last:border-0">
      <div>
        <div className="text-xs font-medium text-ink-900">{label}</div>
        <div className="text-2xs text-ink-500">{desc}</div>
      </div>
      <button
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
          onToggle?.(next);
        }}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          enabled ? 'bg-ink-900' : 'bg-ink-200',
        )}
      >
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform', enabled ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </div>
  );
}

function Field({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        defaultValue={value}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/5"
      />
    </div>
  );
}

function GeneralSection() {
  const [settings, setSettings] = useSettings();

  return (
    <>
      <Card title="Workspace" desc="Organization-level configuration">
        <div className="space-y-4">
          <div>
            <label className="label">Language</label>
            <select 
              value={settings.language}
              onChange={(e) => setSettings({ language: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Japanese</option>
            </select>
          </div>
          <div>
            <label className="label">Default Model (OpenRouter)</label>
            <select 
              value={settings.model}
              onChange={(e) => setSettings({ model: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none"
            >
              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
            </select>
          </div>
          <div>
            <label className="label">Theme</label>
            <select 
              value={settings.theme}
              onChange={(e) => setSettings({ theme: e.target.value as 'light'|'dark'|'system' })}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </Card>
      <Card title="Default Routing" desc="Strategy applied when no rule matches">
        <div>
          <label className="label">Fallback Strategy</label>
          <select className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none">
            <option>Balanced</option>
            <option>Quality</option>
            <option>Latency</option>
            <option>Cost</option>
            <option>Privacy</option>
          </select>
        </div>
      </Card>
    </>
  );
}

function ApiSection() {
  return (
    <Card title="API Keys" desc="Manage programmatic access to OrchestrAI">
      <div className="space-y-3">
        {[
          { name: 'Production', key: 'sk-orc-prod-••••••••••••4a2f', created: '2026-06-12', lastUsed: '2m ago' },
          { name: 'Staging', key: 'sk-orc-stg-••••••••••••9b1c', created: '2026-05-04', lastUsed: '1h ago' },
          { name: 'CI / CD', key: 'sk-orc-ci-••••••••••••e7d3', created: '2026-04-22', lastUsed: '5h ago' },
        ].map((k) => (
          <div key={k.name} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-900">{k.name}</span>
                <Badge variant="ok">Active</Badge>
              </div>
              <button className="text-ink-400 hover:text-ink-900"><Copy size={14} /></button>
            </div>
            <div className="mt-2 mono text-2xs text-ink-500">{k.key}</div>
            <div className="mt-1 flex items-center gap-3 text-2xs text-ink-400">
              <span>Created {k.created}</span>
              <span>·</span>
              <span>Last used {k.lastUsed}</span>
            </div>
          </div>
        ))}
        <button className="w-full rounded-lg border border-dashed border-line-dark py-2.5 text-xs font-medium text-ink-600 hover:bg-ink-50">
          + Generate New Key
        </button>
      </div>
    </Card>
  );
}

function WebhooksSection() {
  return (
    <Card title="Webhooks" desc="Event delivery endpoints">
      <div className="space-y-3">
        {[
          { url: 'https://hooks.acme.com/orchestrai/query.complete', events: 'query.complete', status: 'active' },
          { url: 'https://api.internal/orc/consensus', events: 'consensus.resolved', status: 'active' },
        ].map((w) => (
          <div key={w.url} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="mono text-xs text-ink-900 truncate">{w.url}</span>
              <Badge variant="ok">{w.status}</Badge>
            </div>
            <div className="mt-1 text-2xs text-ink-500">Events: {w.events}</div>
          </div>
        ))}
        <button className="w-full rounded-lg border border-dashed border-line-dark py-2.5 text-xs font-medium text-ink-600 hover:bg-ink-50">
          + Add Webhook
        </button>
      </div>
    </Card>
  );
}

function NotificationsSection() {
  const [settings, setSettings] = useSettings();

  return (
    <Card title="Notifications" desc="Alert and digest preferences">
      <Toggle 
        on={settings.notifications} 
        onToggle={(val) => setSettings({ notifications: val })}
        label="Pipeline failures" 
        desc="Alert when any stage fails" 
      />
      <Toggle on={true} label="Consensus conflicts" desc="Notify on split or weighted resolutions" />
      <Toggle on={false} label="Cost threshold" desc="Alert when daily spend exceeds budget" />
      <Toggle on={true} label="Model degradation" desc="Alert when reliability drops below 95%" />
      <Toggle on={false} label="Weekly digest" desc="Summary of orchestration activity" />
    </Card>
  );
}

function SecuritySection() {
  return (
    <>
      <Card title="Authentication" desc="Access control configuration">
        <Toggle on={true} label="Enforce SSO" desc="Require SAML/OIDC for all users" />
        <Toggle on={true} label="MFA required" desc="Multi-factor authentication for all accounts" />
        <Toggle on={false} label="IP allowlist" desc="Restrict API access to known IPs" />
      </Card>
      <Card title="Compliance" desc="Regulatory framework readiness">
        <div className="flex items-center justify-between border-b border-line/40 py-3">
          <div>
            <div className="text-xs font-medium text-ink-900">SOC 2 Type II</div>
            <div className="text-2xs text-ink-500">Audit-ready compliance framework</div>
          </div>
          <Badge variant="ok">Ready</Badge>
        </div>
        <div className="flex items-center justify-between border-b border-line/40 py-3">
          <div>
            <div className="text-xs font-medium text-ink-900">GDPR</div>
            <div className="text-2xs text-ink-500">EU data protection regulation</div>
          </div>
          <Badge variant="ok">Ready</Badge>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-xs font-medium text-ink-900">HIPAA</div>
            <div className="text-2xs text-ink-500">Healthcare data protection</div>
          </div>
          <Badge>In Progress</Badge>
        </div>
      </Card>
    </>
  );
}

function DataSection() {
  return (
    <Card title="Data Retention" desc="How long OrchestrAI stores your data">
      <div className="space-y-4">
        <div>
          <label className="label">Query History</label>
          <select className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none">
            <option>90 days</option>
            <option>180 days</option>
            <option>1 year</option>
            <option>Indefinite</option>
          </select>
        </div>
        <div>
          <label className="label">Audit Logs</label>
          <select className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none">
            <option>1 year</option>
            <option>3 years</option>
            <option>7 years</option>
          </select>
        </div>
        <Toggle on={true} label="PII Redaction" desc="Automatically redact PII before model calls" />
        <Toggle on={false} label="Store model outputs" desc="Keep raw model responses for debugging" />
      </div>
    </Card>
  );
}
