import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  formatDateNumeric,
  formatRelative,
  formatTimestamp,
} from '@/lib/formatters';

/* ─────────────────────────────────────────────────────────────────────────
 * Timestamp — canonical date/time cell with a relative-time tooltip.
 *
 * Visible text is the absolute timestamp (LangChain-style) by default. The
 * complementary representation (relative "2h ago" for absolute formats; the
 * full timestamp for the inverse "relative" mode) is shown in a tooltip on
 * hover/focus. This pairs Olivia's "is this fresh?" scan with Devon's
 * "greppable absolute" need on a single primitive.
 *
 * For `date === null` (e.g., a key that's never been used) the component
 * renders "Never" with no tooltip — there's no underlying instant to relate.
 *
 * Use in every table cell that surfaces a date or datetime. The relative
 * tooltip is computed against `anchor` (defaults to `new Date()`).
 * ───────────────────────────────────────────────────────────────────────── */

type TimestampFormat = 'timestamp' | 'dateNumeric' | 'relative';

type TimestampProps = {
  date: Date | null;
  format?: TimestampFormat;
  anchor?: Date;
  className?: string;
};

export function Timestamp({
  date,
  format = 'timestamp',
  anchor,
  className,
}: TimestampProps) {
  if (date === null) {
    return <span className={cn(className)}>Never</span>;
  }

  const visible =
    format === 'timestamp'
      ? formatTimestamp(date)
      : format === 'dateNumeric'
        ? formatDateNumeric(date)
        : formatRelative(date, anchor);

  const tooltip =
    format === 'relative' ? formatTimestamp(date) : formatRelative(date, anchor);

  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <span
            {...props}
            className={cn('cursor-default', className)}
          >
            {visible}
          </span>
        )}
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
