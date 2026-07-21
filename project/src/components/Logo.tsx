import { cn } from '@/lib/utils';

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M16 6 L25 11 V21 L16 26 L7 21 V11 Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3" fill="#FAFAFA" />
      <path d="M16 6 V13 M25 11 L19 15 M25 21 L19 17 M16 26 V19 M7 21 L13 17 M7 11 L13 15" stroke="#FAFAFA" strokeWidth="0.75" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Logo className="text-ink-950" size={26} />
      <span className="text-[15px] font-semibold tracking-tight text-ink-950">
        Orchestr<span className="text-ink-400">AI</span>
      </span>
    </div>
  );
}
