import { useState } from 'react';
import { ScrollText, Search, Download, Filter, ChevronRight, Cpu } from 'lucide-react';
import { useAuditLogs } from '@/lib/storage';
import { Badge } from '@/components/ui';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';
import { formatCost, formatLatency } from '@/lib/models';

export function AuditPage() {
  const allLogs = useAuditLogs();
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = allLogs.filter((e) => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search && !e.eventId.includes(search) && !e.promptPreview.toLowerCase().includes(search.toLowerCase()) && !e.selectedModel.includes(search)) return false;
    return true;
  });

  const selectedEntry = filtered.find((e) => e.eventId === selected) ?? filtered[0];

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
                placeholder="Search queries, models, events…"
                className="w-56 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'success', 'error'] as const).map((f) => (
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
            {filtered.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center">
                 <Cpu size={24} className="text-ink-300 mb-3" />
                 <div className="text-sm font-medium text-ink-900">No events found</div>
                 <div className="text-xs text-ink-500 mt-1">Audit logs will appear here after queries are processed.</div>
               </div>
            ) : filtered.map((entry) => (
              <button
                key={entry.eventId}
                onClick={() => setSelected(entry.eventId)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-line/50 px-4 py-3 text-left transition-colors hover:bg-ink-50',
                  selectedEntry?.eventId === entry.eventId && 'bg-ink-50',
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-2xs',
                  entry.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                )}>
                  {entry.status === 'success' ? '✓' : '✕'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs font-medium text-ink-900">query_execution</span>
                    <Badge variant={entry.status === 'success' ? 'ok' : 'err'}>
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-2xs text-ink-500">
                    <span className="truncate max-w-[200px]">"{entry.promptPreview}"</span>
                    <span>·</span>
                    <span className="mono">{entry.selectedModel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xs text-ink-500">{timeAgo(entry.timestamp)}</div>
                  <div className="mono text-2xs text-ink-400">{entry.eventId.slice(0, 10)}...</div>
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
              <DetailRow label="Event ID" value={selectedEntry.eventId} mono />
              <DetailRow label="Trace ID" value={selectedEntry.traceId} mono />
              <DetailRow label="Timestamp" value={formatDateTime(selectedEntry.timestamp)} mono />
              <DetailRow label="Status" value={selectedEntry.status} />
              <DetailRow label="Model" value={selectedEntry.selectedModel} mono />
              <DetailRow label="Provider" value={selectedEntry.provider} />
              <DetailRow label="Latency" value={formatLatency(selectedEntry.latencyMs)} />
              <DetailRow label="Tokens" value={selectedEntry.tokens.toLocaleString()} />
              <DetailRow label="Cost" value={formatCost(selectedEntry.cost)} />
            </div>

            <div className="mt-5 rounded-lg border border-line bg-ink-50/50 p-3">
              <div className="label">Raw Event JSON</div>
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

function DetailRow({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 pb-2">
      <span className="text-2xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
      <span className={cn('text-xs text-ink-900', mono && 'mono')}>{value}</span>
    </div>
  );
}
