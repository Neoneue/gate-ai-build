import { customRangeHours } from "@/data/message-totals";
import { formatChartTooltipDate } from "@/lib/formatters";
import type { CustomRange, HeroPoint, RangeKey } from "@/pages/requests/types";

/* ─── Phone demo Messages hero series ───────────────────────────────────────
 * The Pro Messages hero (`requests/hero-data.ts`) fed by every demo Gate Chat
 * message instead of mock traffic (owner 2026-10-12). Same buckets per range
 * as the Pro card, so the axis and grid match: All 240 x 6h, 24H 96 x 15m,
 * 7D 168 x 1h, 30D 120 x 6h, Custom hourly up to 7 days and 6-hourly beyond.
 * Each bucket counts the messages sent in it; the total is their sum. A
 * custom range that misses every send time reads 0 over a flat line. The
 * page draws this card only once a message is logged; before it, the Default
 * layout's "No messages yet" card stands in (owner 2026-10-12).
 *
 * Pro anchors its presets on the demo clock (yesterday 18:30); this page
 * anchors on real now, because the message was sent now. Pro caps a long
 * custom range at 168 buckets, which can leave the end of the range undrawn;
 * here the 6-hour bucket count is uncapped so every send time in range has a
 * bucket.
 * ───────────────────────────────────────────────────────────────────────── */

const MINUTE_MS = 60_000;

type PresetKey = Exclude<RangeKey, "custom">;

/** Bucket count, bucket size and tick count per preset (hero-data.ts). */
const PRESETS: Record<
  PresetKey,
  { count: number; minutes: number; tickCount: number }
> = {
  all: { count: 240, minutes: 360, tickCount: 7 },
  "24h": { count: 96, minutes: 15, tickCount: 6 },
  "7d": { count: 168, minutes: 60, tickCount: 7 },
  "30d": { count: 120, minutes: 360, tickCount: 7 },
};

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short" });

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** The Pro buckets' `time` keys: "14:15" on 24H, "Oct 12 14:00" elsewhere
 *  (the spark tick drops the trailing clock). */
function bucketTime(date: Date, clockOnly: boolean): string {
  if (clockOnly) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }
  return `${MONTH_FORMAT.format(date)} ${date.getDate()} ${pad2(date.getHours())}:00`;
}

/** hero-data.ts `deriveTicks`, verbatim: evenly spaced real data points,
 *  first and last always included, so every tick matches a `time` key. */
function deriveTicks(data: { time: string }[], tickCount = 7): string[] {
  const n = data.length;
  if (n === 0) {
    return [];
  }
  const count = Math.min(tickCount, Math.max(2, n));
  const ticks: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i * (n - 1)) / (count - 1));
    const t = data[idx]?.time;
    if (t && !ticks.includes(t)) {
      ticks.push(t);
    }
  }
  return ticks;
}

export type DemoMessagesHero = {
  total: number;
  success: number;
  errors: number;
  data: HeroPoint[];
  ticks: string[];
  domainTop: number;
};

function buildView(
  stamps: Date[],
  counts: number[],
  clockOnly: boolean,
  tickCount: number,
  tipRange: { start: Date; end: Date }
): DemoMessagesHero {
  const data = stamps.map((stamp, i) => {
    const requests = counts[i] ?? 0;
    return {
      time: bucketTime(stamp, clockOnly),
      label: formatChartTooltipDate(stamp, "hour", tipRange),
      requests,
      // Every scripted reply is status success and security allow, so each
      // message is a success and errors stay 0 on every point.
      success: requests,
      errors: 0,
    };
  });
  const total = counts.reduce((sum, n) => sum + n, 0);
  return {
    total,
    success: total,
    errors: 0,
    data,
    ticks: deriveTicks(data, tickCount),
    // hero-data.ts: the tallest bucket plus one.
    domainTop: Math.max(...counts, 1) + 1,
  };
}

/** The hero for one range selection. `sentAts` are the logged messages' send
 *  times (empty before the first); `now` is the page's clock (read once per
 *  mount). */
export function demoMessagesHero(
  range: RangeKey,
  customRange: CustomRange | null,
  sentAts: readonly Date[],
  now: Date
): DemoMessagesHero {
  if (range === "custom" && customRange) {
    const hours = customRangeHours(customRange);
    const sizeHours = hours <= 7 * 24 ? 1 : 6;
    const count = Math.max(24, Math.ceil(hours / sizeHours));
    const sizeMs = sizeHours * 60 * MINUTE_MS;
    const from = customRange.from.getTime();
    const stamps = Array.from(
      { length: count },
      (_, i) => new Date(from + i * sizeMs)
    );
    const counts = stamps.map(() => 0);
    for (const sentAt of sentAts) {
      const t = sentAt.getTime();
      if (t >= from && t <= customRange.to.getTime()) {
        counts[Math.min(count - 1, Math.floor((t - from) / sizeMs))] += 1;
      }
    }
    return buildView(stamps, counts, false, 7, {
      start: customRange.from,
      end: customRange.to,
    });
  }

  // A "custom" selection with no dates yet reads as All.
  const preset = PRESETS[range === "custom" ? "all" : range];
  const sizeMs = preset.minutes * MINUTE_MS;
  // Each bucket is stamped with its end instant, as in hero-data.ts: the
  // last one is the anchor itself. The messages were sent before the page
  // opened, but a reply can settle while it is open: take the latest instant
  // so no message can fall off the end.
  const anchor = Math.max(now.getTime(), ...sentAts.map((d) => d.getTime()));
  const stamps = Array.from(
    { length: preset.count },
    (_, i) => new Date(anchor - (preset.count - 1 - i) * sizeMs)
  );
  const counts = stamps.map(() => 0);
  for (const sentAt of sentAts) {
    const back = Math.floor((anchor - sentAt.getTime()) / sizeMs);
    if (back < preset.count) {
      counts[preset.count - 1 - back] += 1;
    }
  }
  return buildView(stamps, counts, range === "24h", preset.tickCount, {
    start: stamps[0],
    end: new Date(anchor),
  });
}
