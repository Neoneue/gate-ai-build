/**
 * Demo clock: shifts every AUTHORED mock date forward by whole days so the
 * site reads as if the org used it through yesterday, on every load, forever.
 *
 * The mock data was authored against a fixed calendar whose latest activity
 * day is 2026-06-06 (the "today" of the Messages table, the unread
 * notification band, and the newest key usage). This module maps that
 * authored today onto REAL yesterday and exposes one offset that every data
 * constructor applies via `authoredDate(...)` / `shiftAuthored(...)`.
 *
 * Rules:
 * - Shift at CONSTRUCTION, never at the formatter. Runtime-created dates
 *   (new key, team move, limit reset) are real now and must not move.
 * - Whole days only, applied with `setDate`, so H:M:S is preserved and DST
 *   never moves a wall clock.
 * - Charts RE-ANCHOR to `DEMO_NOW` / `DEMO_TODAY` instead of shifting.
 * - Real API data (`models.ts` releasedAt) and transcript bodies stay put.
 *
 * Rollback: `__setDemoShiftDaysForTests(0)` restores the authored calendar.
 */

const MS_PER_DAY = 86_400_000;

/** Latest authored activity day, local midnight. */
export const AUTHORED_TODAY = new Date(2026, 5, 6);

/** Time of day of the newest authored instant (design-agent lastUsed). */
const AUTHORED_NOW_PARTS = { hour: 18, minute: 30, second: 12 } as const;

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar days from `a` to `b` (both local midnights), DST-safe. */
function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

function computeDemoToday(): Date {
  const today = startOfDay(new Date());
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
}

let shiftOverride: number | null = null;

/** Real yesterday, local midnight. Authored today maps here. */
export const DEMO_TODAY: Date = computeDemoToday();

/** Whole-day offset applied to every authored date. Always an integer. */
export const DEMO_SHIFT_DAYS: number = daysBetween(AUTHORED_TODAY, DEMO_TODAY);

function currentShiftDays(): number {
  return shiftOverride ?? DEMO_SHIFT_DAYS;
}

/** Returns a new Date moved forward by the demo offset, H:M:S preserved. */
export function shiftAuthored(d: Date): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + currentShiftDays());
  return out;
}

/** Drop-in for `new Date(y, m, d, h, mi, s)` on authored mock rows. */
export function authoredDate(
  y: number,
  m: number,
  d: number,
  h = 0,
  mi = 0,
  s = 0
): Date {
  return shiftAuthored(new Date(y, m, d, h, mi, s));
}

/** Newest authored instant, shifted: yesterday 18:30:12. Chart 24H anchor. */
export const DEMO_NOW: Date = authoredDate(
  AUTHORED_TODAY.getFullYear(),
  AUTHORED_TODAY.getMonth(),
  AUTHORED_TODAY.getDate(),
  AUTHORED_NOW_PARTS.hour,
  AUTHORED_NOW_PARTS.minute,
  AUTHORED_NOW_PARTS.second
);

/** Parses a stored `YYYY-MM-DD HH:MM:SS` string (security feeds) and shifts it. */
export function parseAuthoredEventTime(stored: string): Date {
  const [datePart, timePart = "00:00:00"] = stored.split(" ");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi, s] = timePart.split(":").map(Number);
  return authoredDate(y, mo - 1, d, h, mi, s);
}

/** Parses a RequestRow `day: "Jun 6"` + `time: "00:50:51"` pair (year 2026)
 *  and shifts it. */
export function parseAuthoredDayTime(day: string, time: string): Date {
  const [mon, dom] = day.split(" ");
  const [h, m, s] = time.split(":").map(Number);
  return authoredDate(2026, MONTHS[mon] ?? 0, Number(dom), h, m, s);
}

/** "Aug 31" label for an already-shifted date. Pinned en-US to match the
 *  authored `day` string shape exactly (short month, numeric day). */
export function authoredDayLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}

/** DEMO_NOW broken into the parts the synthetic chart anchors consume. */
export function demoAnchorFields(): {
  month: number;
  day: number;
  hour: number;
  minute: number;
  date: Date;
} {
  const date = shiftAuthored(
    new Date(
      AUTHORED_TODAY.getFullYear(),
      AUTHORED_TODAY.getMonth(),
      AUTHORED_TODAY.getDate(),
      AUTHORED_NOW_PARTS.hour,
      AUTHORED_NOW_PARTS.minute,
      AUTHORED_NOW_PARTS.second
    )
  );
  return {
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    date,
  };
}

/** Test hook: force the offset (0 restores the authored calendar). Pass null
 *  to return to the computed value. Module-level constants (`DEMO_TODAY`,
 *  `DEMO_NOW`, `DEMO_SHIFT_DAYS`) are NOT affected; only the functions are. */
export function __setDemoShiftDaysForTests(n: number | null): void {
  shiftOverride = n;
}
