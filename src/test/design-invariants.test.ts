/**
 * Pure design / data invariants. Node environment (the vitest default) — no
 * component is mounted here, only the modules that own the numbers.
 *
 * Each case names the rule it enforces, because the point is the product
 * fact, not the current value: "Compression % always one decimal", "Range
 * selectors default to All", "Revoked keys are never selectable", "Charts
 * must reconcile: the KPI total equals the sum of its bars".
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { ASSIGNABLE_KEYS, TEAM_SEED_ROWS } from "@/data/teams";
import { RANGE_OPTIONS } from "@/lib/range";
import { TOKENS_TOTALS_7D, TOTAL_7D_BASE_TOKENS } from "@/pages/activity-data";
import { rangeStore } from "@/pages/requests/range-store";
import {
  allocate,
  attackTypeCounts,
  buildEventsChartView,
  type EventsRange,
  eventsTotal,
  splitEventMix,
} from "@/pages/security/events-data";
import { teamSavingsKpis } from "@/pages/teams/savings-data";
import { RANGE_OPTIONS as SAVINGS_RANGE_OPTIONS } from "@/pages/token-savings-data";
import { allocateTenths, summaryFor } from "@/pages/token-savings-summary";

const PRESET_RANGES: EventsRange[] = ["all", "24h", "7d", "30d"];

/* ─── Compression % always one decimal ──────────────────────────────────── */

describe("compression % renders with exactly one decimal", () => {
  const authored = REQUEST_ROWS_ALL.filter((r) => r.compression);

  it("the seed actually carries compression overrides to check", () => {
    expect(authored.length).toBeGreaterThan(0);
  });

  it.each(
    authored.map((r) => [r.compression as string])
  )("%s is a one-decimal percentage", (value) => {
    expect(value).toMatch(/^\d+\.\d%$/);
  });

  /* EXPECTED TO FAIL — see the report. `compressionValue` in
   * RequestDetailBody.tsx returns `${Math.round(pct)}%` for every row without
   * an authored override, so the detail KPI prints "27%" where the rule says
   * "27.3%". The function is module-private, so the invariant is asserted
   * against the source it is written in. */
  it("the derived fallback also prints one decimal, not a rounded integer", () => {
    const source = readFileSync(
      resolve(import.meta.dirname, "../pages/requests/RequestDetailBody.tsx"),
      "utf8"
    );
    const fn = source.slice(
      source.indexOf("function compressionValue"),
      source.indexOf("function KpiRail")
    );
    expect(fn).toContain("toFixed(1)");
    expect(fn).not.toContain("Math.round(pct)");
  });
});

/* ─── Range selectors default to "All" ──────────────────────────────────── */

describe('range selectors default to "All"', () => {
  it("lib/range RANGE_OPTIONS leads with All", () => {
    expect(RANGE_OPTIONS[0]).toEqual({ value: "all", label: "All" });
  });

  it("token-savings RANGE_OPTIONS leads with All", () => {
    expect(SAVINGS_RANGE_OPTIONS[0]).toEqual({ value: "all", label: "All" });
  });

  it("the Messages range store starts on all", () => {
    expect(rangeStore.current).toBe("all");
    expect(rangeStore.customRange).toBeNull();
  });
});

/* ─── Revoked keys are never selectable ─────────────────────────────────── */

describe("revoked API keys never appear in a scope list", () => {
  const revoked = API_KEY_SEED_ROWS.filter((k) => k.revoked);

  it("the seed actually carries a revoked key to exclude", () => {
    expect(revoked.length).toBeGreaterThan(0);
  });

  it("ASSIGNABLE_KEYS excludes every revoked key", () => {
    expect(ASSIGNABLE_KEYS.some((k) => k.revoked)).toBe(false);
    for (const key of revoked) {
      expect(ASSIGNABLE_KEYS.map((k) => k.id)).not.toContain(key.id);
    }
  });

  it("no seeded team holds a revoked key", () => {
    const revokedIds = new Set(revoked.map((k) => k.id));
    for (const team of TEAM_SEED_ROWS) {
      for (const id of team.keyIds) {
        expect(revokedIds.has(id)).toBe(false);
      }
    }
  });
});

/* ─── Charts must reconcile ─────────────────────────────────────────────── */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("charts reconcile: the KPI total equals the sum of its bars", () => {
  it.each(
    PRESET_RANGES
  )("%s: the action mix sums to the events total", (range) => {
    const total = eventsTotal(range, null);
    const { blocked, flagged, redacted } = splitEventMix(total);
    expect(blocked + flagged + redacted).toBe(total);
  });

  it.each(
    PRESET_RANGES
  )("%s: the attack-type counts sum to the events total", (range) => {
    const total = eventsTotal(range, null);
    expect(sum(attackTypeCounts(range, null).map((c) => c.count))).toBe(total);
  });

  it.each(
    PRESET_RANGES
  )("%s: every chart point's total is its three action series", (range) => {
    const view = buildEventsChartView(range, null);
    expect(view.data.length).toBeGreaterThan(0);
    for (const p of view.data) {
      expect(p.requests).toBe(p.blocked + p.flagged + p.redacted);
    }
  });

  it.each(
    PRESET_RANGES
  )("%s: the chart series sums back to the events total", (range) => {
    const view = buildEventsChartView(range, null);
    expect(sum(view.data.map((p) => p.requests))).toBe(
      eventsTotal(range, null)
    );
  });

  it("allocate() distributes an integer total with no loss", () => {
    for (const total of [0, 1, 7, 12, 117, 562, 1215, 4789]) {
      expect(sum(allocate(total, [8, 5, 3]))).toBe(total);
    }
  });

  it("allocateTenths() keeps one-decimal parts summing to the whole", () => {
    for (const tenths of [1000, 997, 123, 10]) {
      expect(sum(allocateTenths(tenths, [0.5, 0.3, 0.2]))).toBe(tenths);
    }
  });

  it("Activity's tokens KPI equals the sum of its model bars", () => {
    expect(TOTAL_7D_BASE_TOKENS).toBe(
      sum(Object.values(TOKENS_TOTALS_7D.model))
    );
  });

  it.each([
    "all",
    "7d",
    "30d",
    "24h",
  ] as const)("%s: the savings summary's mechanism shares sum to 100%%", (range) => {
    const model = summaryFor(range, null, { plan: "pro" });
    const tenths = sum(model.mechanisms.map((m) => Math.round(m.share * 10)));
    expect(tenths).toBe(1000);
  });

  it.each([
    "all",
    "7d",
    "30d",
    "24h",
  ] as const)("%s: a team's Total saved spark is Caching + Compression per point", (range) => {
    const team = TEAM_SEED_ROWS[0];
    const [total, caching, compression] = teamSavingsKpis(
      team,
      TEAM_SEED_ROWS,
      range
    );
    expect(total.spark.length).toBe(caching.spark.length);
    total.spark.forEach((v, i) => {
      expect(v).toBeCloseTo(caching.spark[i] + compression.spark[i], 2);
    });
  });
});

/* ─── Chart tooltips render in a body portal and position themselves ────── */

describe("chart tooltips escape their Card through a body portal", () => {
  const chartSrc = readFileSync(
    resolve(process.cwd(), "src/components/ui/chart.tsx"),
    "utf8"
  );

  it("ChartTooltip passes a document.body portal to Recharts", () => {
    expect(chartSrc).toMatch(/function ChartTooltip\(/);
    expect(chartSrc).toMatch(/document\.body/);
    expect(chartSrc).toMatch(/<RechartsPrimitive\.Tooltip[^>]*\bportal=\{/);
  });

  it("ChartTooltipContent owns its position (Recharts gives a portal none)", () => {
    expect(chartSrc).toMatch(/usePortalPosition/);
    expect(chartSrc).toMatch(/position:\s*["']fixed["']/);
  });

  it("no call site pins or escapes the tooltip by hand", () => {
    const files = [
      "src/pages/Security.tsx",
      "src/pages/Dashboard.tsx",
      "src/pages/activity/TrendCard.tsx",
      "src/pages/requests/HeroMetric.tsx",
      "src/pages/teams/SecurityOverviewPane.tsx",
      "src/components/ui/compact-kpi.tsx",
    ];
    for (const f of files) {
      const src = readFileSync(resolve(process.cwd(), f), "utf8");
      expect(src, f).toMatch(/<ChartTooltip\b/);
      expect(src, f).not.toMatch(/wrapperStyle=|allowEscapeViewBox/);
      expect(src, f).not.toMatch(
        /import\s*\{[^}]*\bTooltip\b[^}]*\}\s*from\s*["']recharts["']/
      );
      const tooltipBlocks = src.split(/<ChartTooltip\b/).slice(1);
      for (const block of tooltipBlocks) {
        const props = block.slice(
          0,
          block.indexOf("/>") === -1 ? 600 : block.indexOf("/>")
        );
        expect(props, `${f} ChartTooltip props`).not.toMatch(/\bposition=\{/);
      }
    }
  });
});

/* ─── Nothing is clipped by an ancestor's bounding box ───────────────────── */

/* design.md §"Focus ring" / Clipping (2026-09-22). The rule spans three
 * things a single check cannot: rings, floating layers, and shadows on raised
 * surfaces. What is asserted here is the SOURCE shape of each remedy applied
 * on 2026-09-22: the geometry itself is `npm run lint:clipping`'s job,
 * because only a real browser can measure a slack of 0. Each `it` below fails
 * against the code as it stood before that date. */
describe("nothing is clipped by an ancestor's bounding box", () => {
  const read = (f: string) => readFileSync(resolve(process.cwd(), f), "utf8");

  it("the contact dialog's scroll body reserves the 4px ring gutter", () => {
    // The reported bug: a bare `min-h-0 overflow-y-auto overscroll-contain`
    // around four full-width fields, so all 4px of the ring was cut on both
    // edges. `p-1` reserves it, `-m-1` puts the content back where it was.
    const src = read("src/pages/ManageSubscription.tsx");
    expect(src).toMatch(
      /className="-m-1 min-h-0 overflow-y-auto overscroll-contain p-1"/
    );
    expect(src).not.toMatch(
      /className="min-h-0 overflow-y-auto overscroll-contain"/
    );
  });

  it("both plan-comparison dialogs reserve it around the plan cards", () => {
    // The cards are direct children of the scrollport, so their `shadow-xs`
    // met the clip edge with nothing between.
    for (const f of [
      "src/pages/plan-comparison-dialog.tsx",
      "src/pages/plan-comparison-dialog-pro.tsx",
    ]) {
      const src = read(f);
      expect(src, f).toMatch(/-mx-1[^"]*grid[^"]*overflow-y-auto[^"]*px-1/);
    }
  });

  it("every floating primitive portals its popup out of the clip chain", () => {
    // A popup left in the trigger's DOM position is clipped by every
    // overflow-hidden Card and every scrollport above it. Mirrors lint:design
    // check 9, which scans all of src/components/ui.
    for (const f of [
      "src/components/ui/tooltip.tsx",
      "src/components/ui/popover.tsx",
      "src/components/ui/menu.tsx",
      "src/components/ui/select.tsx",
    ]) {
      const src = read(f);
      expect(src, f).toMatch(/<[A-Z][\w.]*\.Positioner\b/);
      expect(src, f).toMatch(/<[A-Z][\w.]*\.Portal\b/);
    }
  });

  it("the tab trigger's whole focus treatment is inset", () => {
    // The `line` tab list is a scrollport and all 11 call sites pass `px-0`,
    // so the first trigger is flush against the clip edge. The ring was
    // already inset; the 1px outline at offset 0 was not, and was cut.
    const src = read("src/components/ui/tabs.tsx");
    expect(src).toMatch(/focus-visible:ring-inset/);
    expect(src).toMatch(/focus-visible:-outline-offset-1/);
  });

  it("every focusable table row rings inset", () => {
    // A row is full-bleed inside the table scrollport AND the Card's
    // overflow-hidden, so an outset ring loses both inline edges. Same
    // remedy SortableTableHead already carried.
    for (const f of [
      "src/pages/AuditTrail.tsx",
      "src/pages/security/EventsTable.tsx",
      "src/components/ui/table.tsx",
    ]) {
      const src = read(f);
      const rows = src.split(/focus-visible:ring-2/).slice(1);
      expect(rows.length, `${f} has a ring to check`).toBeGreaterThan(0);
      for (const block of rows) {
        expect(block.slice(0, 200), f).toMatch(/focus-visible:ring-inset/);
      }
    }
  });

  it("scrollports that park a focused control at their edge allow for it", () => {
    // scroll-padding, not padding: the clip on the block axis only happens
    // once Tab has scrolled the control flush, so the allowance has to be on
    // the scroll, not the box.
    const pairs: [string, string][] = [
      ["src/layouts/DashboardChrome.tsx", "lg:scroll-py-1"],
      ["src/components/ui/sidebar.tsx", "scroll-py-1"],
      ["src/pages/conversations/ConversationDetail.tsx", "scroll-py-1"],
      ["src/pages/conversations/RequestTracePanel.tsx", "scroll-py-1"],
    ];
    for (const [f, cls] of pairs) {
      expect(read(f), f).toContain(cls);
    }
  });

  it("no raised-on-hover surface exists to be clipped", () => {
    // Recorded as a fact, not a gap: the site has no `hover:shadow-*` at all,
    // and every scale is the shrinking `active:scale-[0.98]`. If either
    // changes, the new surface has to be measured against this rule, which
    // is what this assertion forces.
    // src/test is excluded: this file quotes the patterns it bans.
    const files = walkSrc(resolve(process.cwd(), "src")).filter(
      (f) => !f.includes("/src/test/")
    );
    const raised: string[] = [];
    const grown: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (/hover:shadow-/.test(src)) {
        raised.push(f);
      }
      for (const m of src.matchAll(/hover:scale-(\d+)/g)) {
        if (Number(m[1]) > 100) {
          grown.push(`${f} (${m[0]})`);
        }
      }
    }
    expect(raised, "hover:shadow-* sites").toEqual([]);
    // The two growing hover states are the Policies slider stops, measured
    // clear (they sit mid-track, nowhere near a clip edge).
    expect(grown.length, grown.join(", ")).toBeLessThanOrEqual(2);
  });
});

function walkSrc(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      out.push(...walkSrc(p));
    } else if (
      /\.tsx?$/.test(e.name) &&
      !/^(request-bodies|models-catalog)\./.test(e.name)
    ) {
      out.push(p);
    }
  }
  return out;
}
