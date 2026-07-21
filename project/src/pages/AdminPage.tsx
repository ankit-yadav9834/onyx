import { useState } from 'react';
import { Building2, Users, Shield, Plus, MoreHorizontal, CheckCircle2, Lock, KeyRound, Server, FileCheck } from 'lucide-react';
import { USERS } from '@/lib/mockData';
import { Badge, Bar, MetricCard } from '@/components/ui';
import { cn, timeAgo } from '@/lib/utils';

const ROLES = ['admin', 'architect', 'analyst', 'viewer'] as const;
const ROLE_PERMS: Record<string, string[]> = {
  admin: ['Full system access', 'Manage users & policies', 'Configure routing rules', 'View audit logs', 'Export data'],
  architect: ['Configure routing', 'Manage models', 'View analytics', 'Create queries'],
  analyst: ['View dashboards', 'Run queries', 'View consensus reports'],
  viewer: ['View dashboards', 'View audit logs (read-only)'],
};

export function AdminPage() {
  const [tab, setTab] = useState<'users' | 'roles' | 'policies' | 'compliance'>('users');

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Users" value={USERS.length} sub="Across 3 teams" />
        <MetricCard label="Active Sessions" value="3" sub="Last 24 hours" />
        <MetricCard label="API Keys" value="6" sub="3 active environments" />
        <MetricCard label="Compliance" value="2/3" sub="SOC2 · GDPR ready" />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 border-b border-line">
        {(['users', 'roles', 'policies', 'compliance'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors',
              tab === t ? 'border-ink-900 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-900',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'users' && <UsersTab />}
        {tab === 'roles' && <RolesTab />}
        {tab === 'policies' && <PoliciesTab />}
        {tab === 'compliance' && <ComplianceTab />}
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-ink-900" />
          <h3 className="text-sm font-semibold text-ink-950">Users</h3>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-medium text-ink-50 hover:bg-ink-900">
          <Plus size={13} /> Invite User
        </button>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-2 text-2xs font-medium uppercase tracking-wide text-ink-400">User</th>
              <th className="px-4 py-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Role</th>
              <th className="px-4 py-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Team</th>
              <th className="px-4 py-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Last Active</th>
              <th className="px-4 py-2 text-2xs font-medium uppercase tracking-wide text-ink-400">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => (
              <tr key={u.id} className="border-b border-line/40 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-2xs font-semibold text-ink-50">
                      {u.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-ink-900">{u.name}</div>
                      <div className="text-2xs text-ink-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'admin' ? 'dark' : 'neutral'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-700">{u.team}</td>
                <td className="px-4 py-3 text-2xs text-ink-500">{timeAgo(u.lastActive)}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-2xs text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-ink-400 hover:text-ink-900"><MoreHorizontal size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ROLES.map((role) => (
        <div key={role} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                role === 'admin' ? 'bg-ink-900 text-ink-50' : 'bg-ink-100 text-ink-700',
              )}>
                <Shield size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-950 capitalize">{role}</div>
                <div className="text-2xs text-ink-500">{ROLE_PERMS[role].length} permissions</div>
              </div>
            </div>
            <Badge>{USERS.filter((u) => u.role === role).length} users</Badge>
          </div>
          <div className="mt-4 space-y-1.5">
            {ROLE_PERMS[role].map((perm) => (
              <div key={perm} className="flex items-center gap-2 text-xs text-ink-600">
                <CheckCircle2 size={13} className="text-emerald-600" />
                {perm}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PoliciesTab() {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={14} className="text-ink-900" />
          <h3 className="text-sm font-semibold text-ink-950">Access Policies</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Default RBAC', desc: 'Role-based access control for all resources', enabled: true },
            { name: 'IP Allowlist', desc: 'Restrict API access to corporate IP ranges', enabled: false },
            { name: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true },
            { name: 'Key Rotation', desc: 'Enforce 90-day API key rotation', enabled: true },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between border-b border-line/40 pb-3 last:border-0">
              <div>
                <div className="text-xs font-medium text-ink-900">{p.name}</div>
                <div className="text-2xs text-ink-500">{p.desc}</div>
              </div>
              <Badge variant={p.enabled ? 'ok' : 'neutral'}>{p.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server size={14} className="text-ink-900" />
          <h3 className="text-sm font-semibold text-ink-950">Model Access Policies</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Frontier models', desc: 'GPT-5, Claude, Gemini, DeepSeek, Grok, Llama', pct: 1.0 },
            { name: 'Local models', desc: 'Gemma, Qwen, Phi, Llama 3.2 (on-prem)', pct: 1.0 },
            { name: 'Judge models', desc: 'GPT-5 Judge, Claude Judge, Gemma', pct: 1.0 },
            { name: 'Enterprise-only', desc: 'Llama 4 405B for regulated data', pct: 0.85 },
          ].map((p) => (
            <div key={p.name}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-ink-900">{p.name}</div>
                  <div className="text-2xs text-ink-500">{p.desc}</div>
                </div>
                <span className="text-2xs tabular-nums text-ink-500">{Math.round(p.pct * 100)}% enabled</span>
              </div>
              <Bar value={p.pct} className="mt-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[
        { name: 'SOC 2 Type II', icon: FileCheck, status: 'Ready', desc: 'Security, availability, and confidentiality controls audited', color: 'ok' },
        { name: 'GDPR', icon: Shield, status: 'Ready', desc: 'EU data protection with PII redaction and right-to-erasure', color: 'ok' },
        { name: 'HIPAA', icon: Lock, status: 'In Progress', desc: 'Healthcare data protection — BAA available on request', color: 'warn' },
        { name: 'ISO 27001', icon: Building2, status: 'Planned', desc: 'Information security management certification', color: 'neutral' },
      ].map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.name} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-950">{c.name}</div>
                  <div className="text-2xs text-ink-500">{c.status}</div>
                </div>
              </div>
              <Badge variant={c.color as 'ok' | 'warn' | 'neutral'}>{c.status}</Badge>
            </div>
            <p className="mt-3 text-xs text-ink-600">{c.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
