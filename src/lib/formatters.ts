// Locale is intentionally undefined — Intl.* falls back to navigator.language
// so users in any region see their native date/number/currency format. Do not
// pin a locale here; pin per-call only if a fixed-locale invariant is required
// (e.g. machine-readable strings that must round-trip across users).
const LOCALE: string | undefined = undefined;

export function formatCurrency(
  amount: number,
  options: {
    currency?: string;
    minFrac?: number;
    maxFrac?: number;
    signDisplay?: Intl.NumberFormatOptions['signDisplay'];
  } = {},
): string {
  const { currency = 'USD', minFrac = 2, maxFrac = 2, signDisplay } = options;
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
    signDisplay,
  }).format(amount);
}

export function formatNumber(
  n: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(LOCALE, options).format(n);
}

export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

export function formatDateTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
): string {
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

export function formatTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false },
): string {
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

/** Absolute timestamp: "May 12, 09:23:49". For null inputs (e.g., key never
 *  used) returns 'Never'. Use in table cells where a precise timestamp is more
 *  useful than a relative ("2h ago") hint. */
export function formatTimestamp(date: Date | null): string {
  if (date === null) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/** Date only: "May 12, 2026". Use in table cells with date-only fields
 *  (joined date, transaction date) where time would be misleading. */
export function formatDateNumeric(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatRelative(target: Date, anchor: Date = new Date()): string {
  const diffMs = target.getTime() - anchor.getTime();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  if (absMs < MIN) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (absMs < HOUR) return rtf.format(Math.round(diffMs / MIN), 'minute');
  if (absMs < DAY) return rtf.format(Math.round(diffMs / HOUR), 'hour');
  if (absMs < WEEK) return rtf.format(Math.round(diffMs / DAY), 'day');
  if (absMs < MONTH) return rtf.format(Math.round(diffMs / WEEK), 'week');
  if (absMs < YEAR) return rtf.format(Math.round(diffMs / MONTH), 'month');
  return rtf.format(Math.round(diffMs / YEAR), 'year');
}
