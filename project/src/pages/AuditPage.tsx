import { useState } from 'react';
import { ScrollText, Search, Download, Filter, ChevronRight } from 'lucide-react';
import { AUDIT_LOG } from '@/lib/mockData';
import { Badge } from '@/components/ui';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';

export function AuditPage() {
  const [filter, setFilter] = useState<'all' | 'success' | 'denied' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = AUDIT_LOG.filter((e) => {
    if (filter !== 'all' && e.outcome !== filter) return false;
    if (search && !e.action.includes(search) && !e.actor.includes(search) && !e.resource.includes(search)) return false;
    return true;
  });

  const selectedEntry = filtered.find((e) => e.id === selected) ?? filtered[0];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ScrollText size={15} className="text-ink-900" />
            <h3 className="text-sm font-semibold text-ink-950">Audit Trail</h3>
            <Badge>{filtered.length} events</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5">
              <Search size={13} className="text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actions, actors, resources…"
                className="w-56 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'success', 'denied', 'error'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-2xs font-medium capitalize transition-colors',
                    filter === f ? 'border-ink-900 bg-ink-900 text-ink-50' : 'border-line bg-white text-ink-600 hover:border-line-dark',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-line-dark">
              <Download size={13} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Log list */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="max-h-[640px] overflow-y-auto scrollbar-thin">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-line/50 px-4 py-3 text-left transition-colors hover:bg-ink-50',
                  selectedEntry?.id === entry.id && 'bg-ink-50',
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-2xs',
                  entry.outcome === 'success' ? 'bg-emerald-50 text-emerald-600' : entry.outcome === 'denied' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600',
                )}>
                  {entry.outcome === 'success' ? '✓' : entry.outcome === 'denied' ? '✕' : '!'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs font-medium text-ink-900">{entry.action}</span>
                    <Badge variant={entry.outcome === 'success' ? 'ok' : entry.outcome === 'denied' ? 'err' : 'warn'}>
                      {entry.outcome}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-2xs text-ink-500">
                    <span>{entry.actor}</span>
                    <span>·</span>
                    <span className="mono">{entry.resource}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xs text-ink-500">{timeAgo(entry.timestamp)}</div>
                  <div className="mono text-2xs text-ink-400">{entry.id}</div>
                </div>
                <ChevronRight size={14} className="text-ink-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedEntry && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-ink-900" />
              <h3 className="text-sm font-semibold text-ink-950">Event Detail</h3>
            </div>
            <div className="space-y-3">
              <DetailRow label="Event ID" value={selectedEntry.id} mono />
              <DetailRow label="Timestamp" value={formatDateTime(selectedEntry.timestamp)} mono />
              <DetailRow label="Actor" value={selectedEntry.actor} />
              <DetailRow label="Action" value={selectedEntry.action} mono />
              <DetailRow label="Resource" value={selectedEntry.resource} mono />
              <DetailRow label="Outcome" value={selectedEntry.outcome} />
              <DetailRow label="Source IP" value={selectedEntry.ip} mono />
              {selectedEntry.metadata && <DetailRow label="Metadata" value={selectedEntry.metadata} mono />}
            </div>

            <div className="mt-5 rounded-lg border border-line bg-ink-50/50 p-3">
              <div className="label">Raw Event</div>
              <pre className="mt-2 mono text-2xs leading-relaxed text-ink-600 overflow-x-auto">
{JSON.stringify(selectedEntry, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 pb-2">
      <span className="text-2xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
      <span className={cn('text-xs text-ink-900', mono && 'mono')}>{value}</span>
    </div>
  );
}
