import { formatDate, formatTime } from "@/lib/formatters";

/* ─────────────────────────────────────────────────────────────────────────
 * Data retention policy (PRD "Configurable data retention v1", AG-1018).
 *
 * Pure helpers: callers pass the data and `now`, so the policy holds no data
 * and no clock of its own. Two inputs, two jobs (owner ruling 2026-10-07):
 *   counts   a message curve through MESSAGE_TOTALS anchors (built by
 *            `pages/settings/retention-data.ts`). MESSAGE_TOTALS is the ONE
 *            count of messages (data-model.md §5.1), so a window of exactly
 *            1 / 7 / 30 days, or one covering the whole lifetime, prints the
 *            same number as the Messages hero pill for that range.
 *   dates    the Messages rows (`REQUEST_ROWS_ALL` through `requestDate`),
 *            which give the oldest message a window still holds.
 *
 * Ceilings, per tier (PRD):
 *   free         fixed at 30 days, not editable
 *   pro          0 to 90 days
 *   enterprise   0 to the org's maximum, which defaults to 90 days. Only a
 *                Constellation admin raises it, per contract, in the Admin
 *                portal. This mock org is on the default (owner 2026-10-08:
 *                "use 90 for enterprise it's the default").
 * Every org starts at its ceiling.
 * ───────────────────────────────────────────────────────────────────────── */

export type RetentionTier = "free" | "pro" | "enterprise";

const MS_PER_DAY = 86_400_000;

/** Lowest window an editable tier accepts. 0 stores no content at all. */
export const RETENTION_FLOOR_DAYS = 0;

/** Free keeps a fixed 30-day window. */
export const FREE_RETENTION_DAYS = 30;

/** Highest window Pro accepts. */
export const PRO_RETENTION_CEILING_DAYS = 90;

/** This mock Enterprise org's ceiling: the Enterprise default, 90 days. Set
 *  by Constellation per contract (Admin portal), never by the org admin;
 *  the mock stays on the default (owner 2026-10-08). */
export const ENTERPRISE_CONTRACT_CEILING_DAYS = 90;

/** The deletion run fires once a day at this UTC hour (the PRD's run time). */
export const DELETION_RUN_UTC_HOUR = 3;

/** Highest window the tier accepts. On Free it is also the only window. */
export function retentionCeilingDays(tier: RetentionTier): number {
  switch (tier) {
    case "free":
      return FREE_RETENTION_DAYS;
    case "pro":
      return PRO_RETENTION_CEILING_DAYS;
    case "enterprise":
      return ENTERPRISE_CONTRACT_CEILING_DAYS;
    default:
      return FREE_RETENTION_DAYS;
  }
}

/** Aggregated usage metrics are kept for a fixed period per tier: Free 90
 *  days, Pro and Enterprise 180 (PRD "What the window governs": the
 *  pricing-page figures stay tier-fixed in v1). Nobody edits it, and the
 *  retention window and the deletion run never touch metrics, so a 0-day
 *  window still keeps them. */
export const FREE_METRICS_RETENTION_DAYS = 90;
export const PAID_METRICS_RETENTION_DAYS = 180;

/** How long the tier keeps aggregated usage metrics. */
export function metricsRetentionDays(tier: RetentionTier): number {
  return tier === "free"
    ? FREE_METRICS_RETENTION_DAYS
    : PAID_METRICS_RETENTION_DAYS;
}

/** The first deletion run strictly after `now`. */
export function nextDeletionRun(now: Date): Date {
  const run = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      DELETION_RUN_UTC_HOUR
    )
  );
  if (run.getTime() <= now.getTime()) {
    run.setUTCDate(run.getUTCDate() + 1);
  }
  return run;
}

/** The instant `days` whole days before `at`. Anything older falls outside
 *  a `days`-day window measured at `at`. */
export function retentionCutoff(at: Date, days: number): Date {
  return new Date(at.getTime() - days * MS_PER_DAY);
}

/* ─── Counts: the message curve ─────────────────────────────────────────── */

/** One known point: a `days`-day window holds `messages` messages. */
export type MessageCurveAnchor = { days: number; messages: number };

/** Messages a `days`-day window holds, read off a piecewise-linear curve
 *  through `anchors` (ascending by `days`, starting at (0, 0)). At or past
 *  the last anchor (the lifetime) the window holds every message. Rounded
 *  to a whole message. Zero-width segments are skipped, so two anchors on
 *  the same day cannot divide by zero. */
export function messagesInWindow(
  anchors: readonly MessageCurveAnchor[],
  days: number
): number {
  const last = anchors.at(-1);
  if (last === undefined || days <= 0) {
    return 0;
  }
  if (days >= last.days) {
    return last.messages;
  }
  for (let i = 1; i < anchors.length; i++) {
    const lo = anchors[i - 1];
    const hi = anchors[i];
    if (days > hi.days || hi.days === lo.days) {
      continue;
    }
    const t = (days - lo.days) / (hi.days - lo.days);
    return Math.round(lo.messages + t * (hi.messages - lo.messages));
  }
  return last.messages;
}

/* ─── Dates: the oldest message a window holds ──────────────────────────── */

/** The oldest of `records` inside a `days`-day window at `now`, or null when
 *  the window holds none (a 0-day window: the cutoff is `now` itself). */
export function oldestInWindow(
  records: readonly Date[],
  now: Date,
  days: number
): Date | null {
  const cutoff = retentionCutoff(now, days).getTime();
  let oldest: number | null = null;
  for (const record of records) {
    const t = record.getTime();
    if (t < cutoff || t > now.getTime()) {
      continue;
    }
    if (oldest === null || t < oldest) {
      oldest = t;
    }
  }
  return oldest === null ? null : new Date(oldest);
}

/* ─── Shorten preview ───────────────────────────────────────────────────── */

export type ShortenPreview = {
  /** Messages the current window holds that the shorter one does not. */
  count: number;
  /** Messages older than this fall outside the new window. */
  cutoff: Date;
  /** When the next run deletes them. */
  runAt: Date;
};

/** What shortening the window from `fromDays` to `toDays` deletes:
 *  inWindow(from) - inWindow(to), measured at `now`, the same curve and the
 *  same instant the card's stat rows use. So eligible + kept by the new
 *  window = held by the current one, exactly. */
export function shortenPreview(
  anchors: readonly MessageCurveAnchor[],
  now: Date,
  fromDays: number,
  toDays: number
): ShortenPreview {
  return {
    count: Math.max(
      0,
      messagesInWindow(anchors, fromDays) - messagesInWindow(anchors, toDays)
    ),
    cutoff: retentionCutoff(now, toDays),
    runAt: nextDeletionRun(now),
  };
}

/* ─── Input ─────────────────────────────────────────────────────────────── */

/** Keeps the digits a person typed and drops the rest, so "30 days",
 *  " 30" and "3,0" all read as 30. Leading zeros collapse ("007" is 7). */
export function normalizeDaysInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? "" : String(Number.parseInt(digits, 10));
}

export type DaysInputState =
  | { kind: "empty" }
  | { kind: "above-ceiling"; days: number }
  | { kind: "valid"; days: number };

/** Reads a normalized days field against the tier's ceiling. The floor is 0
 *  and the field holds digits only, so nothing can fall below it. */
export function readDaysInput(value: string, ceiling: number): DaysInputState {
  if (value === "") {
    return { kind: "empty" };
  }
  const days = Number.parseInt(value, 10);
  if (days > ceiling) {
    return { kind: "above-ceiling", days };
  }
  return { kind: "valid", days };
}

/* ─── Formatting ────────────────────────────────────────────────────────── */

/** "Oct 8, 2026, 03:00 UTC". The run is scheduled in UTC, so it reads in
 *  UTC on every machine instead of shifting with the viewer's zone. */
export function formatDeletionRun(runAt: Date): string {
  const day = formatDate(runAt, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = formatTime(runAt, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${day}, ${time} UTC`;
}

/** "30 days", "1 day", "0 days". */
export function formatDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}
