import { MESSAGE_TOTALS } from "@/data/message-totals";
import { REQUEST_ROWS_ALL, requestDate } from "@/data/requests";
import type { MessageCurveAnchor } from "@/lib/retention";

/* ─────────────────────────────────────────────────────────────────────────
 * Data adapter for the Data retention card: turns the Messages data into
 * the two inputs `lib/retention.ts` takes, so the lib stays data-free.
 *
 *   MESSAGE_TIMES   one instant per Messages row (demo-clock shifted by
 *                   `requestDate`, the date the Messages table shows under
 *                   All). Dates only: the oldest message a window holds,
 *                   and the account's lifetime.
 *   messageCurve    the count curve. Anchors are MESSAGE_TOTALS, the ONE
 *                   count of messages (data-model.md §5.1): (0d, 0),
 *                   (1d, 24h), (7d, 7d), (30d, 30d), (lifetime, all). So a
 *                   1 / 7 / 30-day or whole-lifetime window prints exactly
 *                   the Messages hero pill for that range (owner ruling
 *                   2026-10-07). The 153 rows give dates, never counts.
 * ───────────────────────────────────────────────────────────────────────── */

const MS_PER_DAY = 86_400_000;

/** The 30-day anchor is the last fixed one; the lifetime anchor must sit
 *  past it for the curve to stay ascending. */
const LAST_FIXED_ANCHOR_DAYS = 30;

/** One instant per Messages row. Computed once: the rows never change. */
export const MESSAGE_TIMES: readonly Date[] = REQUEST_ROWS_ALL.map(requestDate);

/** Age in days of the oldest Messages row at `now`: the span the Messages
 *  "All" pill covers. Fractional, so a window lands on it exactly. */
export function lifetimeDays(
  now: Date,
  records: readonly Date[] = MESSAGE_TIMES
): number {
  let oldest = Number.POSITIVE_INFINITY;
  for (const record of records) {
    oldest = Math.min(oldest, record.getTime());
  }
  if (!Number.isFinite(oldest)) {
    return 0;
  }
  return (now.getTime() - oldest) / MS_PER_DAY;
}

/** The message-count curve at `now`, anchored on MESSAGE_TOTALS. */
export function messageCurve(now: Date): MessageCurveAnchor[] {
  return [
    { days: 0, messages: 0 },
    { days: 1, messages: MESSAGE_TOTALS["24h"] },
    { days: 7, messages: MESSAGE_TOTALS["7d"] },
    { days: LAST_FIXED_ANCHOR_DAYS, messages: MESSAGE_TOTALS["30d"] },
    {
      days: Math.max(lifetimeDays(now), LAST_FIXED_ANCHOR_DAYS),
      messages: MESSAGE_TOTALS.all,
    },
  ];
}
