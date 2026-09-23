// @vitest-environment happy-dom
/**
 * Conversations — the headline count and the table describe the same rows,
 * and the range pills move both together.
 *
 * The page advertised 850 conversations over a table that owned 8: a module
 * constant `CONVERSATIONS_TOTAL = 100` multiplied by `scope.requestShare` and
 * `RANGE_SCALE.all` (8.5). `CONVERSATION_ROWS` holds exactly 8 seeds and
 * `requests.ts` references those 8 ids and no others, so the figure described
 * nothing on the page (user direction 2026-09-23: keep the 8 real
 * conversations, drop the fabricated headline).
 *
 * Product facts asserted:
 * - with no range narrowing, the KPI value IS `CONVERSATION_ROWS.length`;
 * - the pagination footer counts the same rows, so "of N" agrees with the KPI;
 * - the table renders that many rows, so all three numbers are one number;
 * - that identity holds INSIDE every range pill, and the pills disagree with
 *   each other. The range is a filter on each conversation's real `updated`
 *   date now, not a `RANGE_SCALE` multiplier. Both halves are regression
 *   vectors: re-multiplying would put 850 back on an "All" press, and dropping
 *   the filter would make every pill report the same 8.
 *
 * Expected counts are derived from `DEMO_NOW` at run time, never written as a
 * calendar date. `demo-clock.ts` shifts every authored date one further day per
 * real day, so a hardcoded "Sep 22" would pass today and fail tomorrow. Under
 * vitest `Date` is faked to 2026-09-17, which pins the shift, but the
 * derivation is what keeps this test honest rather than the fake.
 *
 * `ConversationsFree` renders `<Conversations />` verbatim, so /conversations
 * and /conversations-free are the same tree; `ConversationsDefault` is a
 * separate empty-state page with no count to pin.
 */

import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { DEMO_NOW } from "@/lib/demo-clock";
import { renderRoute, resetViewRole } from "./render";

/** Route mounts pay a lazy chunk's transform; matches the sibling helpers. */
const MOUNT_TIMEOUT = 20_000;

const SEED_COUNT = CONVERSATION_ROWS.length;

/** The window each pill selects, rebuilt here from `DEMO_NOW` rather than
 *  imported from `lib/range`, so the page and the test derive the expectation
 *  independently and a bug in `rangeWindow` cannot hide inside both. */
function expectedCount(label: string): number {
  if (label === "All") {
    return SEED_COUNT;
  }
  const from = new Date(DEMO_NOW);
  if (label === "24H") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - (label === "30D" ? 30 : 7));
  }
  return CONVERSATION_ROWS.filter(
    (c) =>
      c.updated.getTime() >= from.getTime() &&
      c.updated.getTime() <= DEMO_NOW.getTime()
  ).length;
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  errorSpy.mockRestore();
});

/** The value a `CompactKpi` shows under `title`. The tile is
 *  `[eyebrow row, value row, spark?]`, so the value row is child index 1 —
 *  the eyebrow's `data-slot` is the only stable hook the primitive exposes. */
function kpiValue(title: string): string {
  const eyebrow = screen.getByText(title, {
    selector: '[data-slot="eyebrow"]',
  });
  const tile = eyebrow.closest(".bg-card");
  const valueRow = tile?.children[1];
  if (!valueRow) {
    throw new Error(`no KPI tile rendered for "${title}"`);
  }
  return (valueRow.textContent ?? "").trim();
}

/** "Showing 1–8 of 8" → 8. Reads the footer's own total, not the row count. */
function footerTotal(): number {
  const line = screen.getByText(/^Showing/).textContent ?? "";
  const total = line.split(" of ").at(-1)?.replace(/[^\d]/g, "");
  return Number(total);
}

const tableRowCount = () => document.querySelectorAll("main tbody tr").length;

/** A range pill inside the Overview bar's SegmentedPill. Queried by the
 *  group's `aria-label` rather than by role, because the pill wraps Base UI's
 *  ToggleGroup and the item's implicit role is an implementation detail. */
function rangePill(label: string): HTMLElement {
  const group = document.querySelector('[aria-label="Time range"]');
  const pill = [...(group?.querySelectorAll("button") ?? [])].find(
    (b) => (b.textContent ?? "").trim() === label
  );
  if (!pill) {
    throw new Error(`no range pill labelled "${label}"`);
  }
  return pill as HTMLElement;
}

describe("the headline count is the conversations that exist", () => {
  it(
    "the KPI value is CONVERSATION_ROWS.length",
    async () => {
      await renderRoute("/conversations");
      await waitFor(() => {
        expect(kpiValue("Conversations")).toBe(String(SEED_COUNT));
      });
    },
    MOUNT_TIMEOUT
  );

  it(
    "the KPI, the footer total and the rendered rows are one number",
    async () => {
      await renderRoute("/conversations");
      await waitFor(() => {
        expect(tableRowCount()).toBe(SEED_COUNT);
      });
      expect(kpiValue("Conversations")).toBe(String(SEED_COUNT));
      expect(footerTotal()).toBe(SEED_COUNT);
    },
    MOUNT_TIMEOUT
  );

  it(
    "each range pill reports its own count, and the KPI, rows and footer agree inside it",
    async () => {
      const user = userEvent.setup();
      await renderRoute("/conversations");
      await waitFor(() => {
        expect(kpiValue("Conversations")).toBe(String(SEED_COUNT));
      });

      const seen: number[] = [];
      for (const label of ["24H", "7D", "30D", "All"]) {
        const expected = expectedCount(label);
        await user.click(rangePill(label));
        await waitFor(() => {
          expect(kpiValue("Conversations")).toBe(String(expected));
        });
        expect(footerTotal()).toBe(expected);
        expect(tableRowCount()).toBe(expected);
        seen.push(expected);
      }

      // The pills must NOT all agree — that was the old behaviour, when the
      // range changed nothing about which rows existed.
      expect(new Set(seen).size).toBeGreaterThan(1);
      // ...and a narrower window can never hold more than a wider one.
      expect(seen).toEqual([...seen].sort((a, b) => a - b));
    },
    MOUNT_TIMEOUT
  );
});
