import { cn } from '@/lib/utils';

const statusColors = {
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-destructive',
  info: 'bg-blue-600',
  neutral: 'bg-neutral-500',
} as const;

export type StatusDotKind = keyof typeof statusColors;

export interface StatusDotProps {
  kind: StatusDotKind;
  className?: string;
}

/**
 * Tiny 8px solid-color dot for standalone status signals (breakdown rows,
 * list legends). Always paired with an adjacent text label — the color is a
 * redundant cue, never the sole one.
 */
export function StatusDot({ kind, className }: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn('size-2 shrink-0 rounded-full', statusColors[kind], className)}
    />
  );
}
