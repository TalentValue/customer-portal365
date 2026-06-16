import { cn } from '@/lib/utils';

/** BusinessValue365 mark: bar-chart in a blue circle, middle bar orange (DESIGN_SYSTEM §1.1). */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary',
        className,
      )}
      aria-hidden="true"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="11" width="3.5" height="6" rx="1" fill="white" />
        <rect x="8.25" y="5" width="3.5" height="12" rx="1" fill="var(--accent)" />
        <rect x="14.5" y="8" width="3.5" height="9" rx="1" fill="white" />
      </svg>
    </span>
  );
}
