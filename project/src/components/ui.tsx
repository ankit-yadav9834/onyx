import { cn } from '@/lib/utils';
import type { CheckStatus, RiskLevel } from '@/lib/types';

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'ok' | 'warn' | 'err' | 'dark';
  className?: string;
}) {
  const styles: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-600 border-line',
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    err: 'bg-red-50 text-red-700 border-red-200',
    dark: 'bg-ink-900 text-ink-50 border-ink-900',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status, className }: { status: 'ok' | 'warn' | 'err' | 'idle'; className?: string }) {
  const colors = {
    ok: 'bg-emerald-500',
    warn: 'bg-amber-500',
    err: 'bg-red-500',
    idle: 'bg-ink-300',
  };
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      {status === 'ok' && (
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-40', colors[status])} />
      )}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', colors[status])} />
    </span>
  );
}

export function Bar({ value, max = 1, className, color = 'dark' }: { value: number; max?: number; className?: string; color?: 'dark' | 'ok' | 'warn' | 'err' }) {
  const pctVal = Math.min(100, (value / max) * 100);
  const colors = { dark: 'bg-ink-900', ok: 'bg-emerald-600', warn: 'bg-amber-500', err: 'bg-red-500' };
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', colors[color])}
        style={{ width: `${pctVal}%` }}
      />
    </div>
  );
}

export function ScoreRing({ value, size = 56, stroke = 4, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - value * circ;
  const color = value > 0.9 ? '#15803D' : value > 0.75 ? '#18181B' : value > 0.6 ? '#B45309' : '#B91C1C';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECECEF" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-semibold tabular-nums text-ink-900">{(value * 100).toFixed(0)}</span>
        {label && <span className="text-2xs text-ink-400">{label}</span>}
      </div>
    </div>
  );
}

export function riskVariant(risk: RiskLevel) {
  return risk === 'critical' ? 'err' : risk === 'high' ? 'err' : risk === 'medium' ? 'warn' : 'ok';
}

export function checkVariant(status: CheckStatus) {
  return status === 'pass' ? 'ok' : status === 'warn' ? 'warn' : 'err';
}

export function Sparkline({ data, className, color = '#18181B' }: { data: number[]; className?: string; color?: string }) {
  const w = 100;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div className={cn('card card-hover p-5', className)}>
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        {trend && (
          <span className={cn('text-2xs font-medium tabular-nums', trend.positive ? 'text-emerald-600' : 'text-ink-400')}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-ink-950">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-line', className)} />;
}

export function IconButton({
  children,
  onClick,
  active,
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
        active
          ? 'border-ink-900 bg-ink-900 text-ink-50'
          : 'border-line bg-white text-ink-500 hover:border-line-dark hover:text-ink-900',
        className,
      )}
    >
      {children}
    </button>
  );
}
