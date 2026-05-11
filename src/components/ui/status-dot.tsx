import { cn } from '@/lib/utils';

const statusColors = {
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-destructive',
  info: 'bg-blue-600',
  neutral: 'bg-ink-500',
} as const;

export type StatusDotKind = keyof typeof statusColors;

const SIZE_CLASSES = {
  sm: 'size-1.5', // 6px — default; pairs with Badge h-5 chrome
  md: 'size-2',   // 8px — standalone, breakdown rows, list legends
} as const;

export interface StatusDotProps {
  kind: StatusDotKind;
  /** Dot size. Default `sm` (6px, in-badge). `md` (8px) for standalone rows. */
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

/**
 * Tiny solid-color dot used inside <Badge /> to communicate status.
 * Use as a child with `data-icon="inline-start"` so the badge applies
 * the right padding adjustment.
 */
export function StatusDot({ kind, size = 'sm', className }: StatusDotProps) {
  return (
    <span
      data-icon="inline-start"
      aria-hidden
      className={cn(
        SIZE_CLASSES[size],
        'shrink-0 rounded-full',
        statusColors[kind],
        className,
      )}
    />
  );
}
