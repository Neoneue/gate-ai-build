// @vitest-environment happy-dom
/**
 * `TablePaginationFooter`'s two visibility gates.
 *
 * `table-pagination.test.ts` covers the pure helpers; the gates are render
 * decisions, so they need the component.
 *
 * Product facts asserted:
 * - the page-link strip renders only when `totalPages > 1` (user direction
 *   2026-09-23) — a one-page list rendered a fully disabled Prev / 1 / Next;
 * - the gate is `totalPages`, not a row count, so the same 40-row list shows
 *   the strip at 10 per page and hides it at "All";
 * - the "Showing" count line survives both gates, because it is information
 *   rather than a control and it holds the bar's height steady;
 * - the rows-per-page select still drops out under the smallest step
 *   (user direction 2026-09-07) while the count line stays.
 *
 * An empty table never reaches here: `table-empty-state.tsx` swaps the table
 * AND the footer for the empty state.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@/test/dom-polyfills";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";

afterEach(cleanup);

const mount = (total: number, rowsPerPage: string, page = 1) =>
  render(
    <TablePaginationFooter
      onPageChange={() => {
        /* controlled by the consumer; these are visibility assertions */
      }}
      onRowsPerPageChange={() => {
        /* see above */
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      total={total}
    />
  );

const pageStrip = () =>
  screen.queryByRole("navigation", { name: "pagination" });

describe("TablePaginationFooter page-strip gate", () => {
  it("hides the strip when the whole list fits one page", () => {
    mount(2, "10");
    expect(pageStrip()).toBeNull();
    expect(screen.queryByLabelText("Go to previous page")).toBeNull();
    expect(screen.queryByLabelText("Go to next page")).toBeNull();
  });

  it("shows the strip when the list runs past one page", () => {
    mount(40, "10");
    expect(pageStrip()).not.toBeNull();
    expect(screen.getByLabelText("Go to previous page")).toBeTruthy();
    expect(screen.getByLabelText("Go to next page")).toBeTruthy();
    // 40 rows at 10 per page: a numbered page button to click. `PaginationLink`
    // renders a <button>, so the role is button, not link.
    expect(screen.getByRole("button", { name: "2" })).toBeTruthy();
  });

  it("keys on totalPages, not on a row count", () => {
    // Same 40 rows. "All" collapses them to one page, so the strip goes.
    mount(40, "All");
    expect(pageStrip()).toBeNull();
    cleanup();
    mount(40, "25");
    expect(pageStrip()).not.toBeNull();
  });

  it("keeps the count line on both sides of the gate", () => {
    mount(2, "10");
    expect(screen.getByText(/Showing/).textContent).toContain("1–2");
    cleanup();
    mount(40, "10");
    expect(screen.getByText(/Showing/).textContent).toContain("1–10");
  });
});

describe("TablePaginationFooter rows-select gate", () => {
  it("drops the select under the smallest step and keeps the count line", () => {
    mount(2, "10");
    expect(screen.queryByLabelText("Rows per page")).toBeNull();
    expect(screen.queryByText("Rows")).toBeNull();
    expect(screen.getByText(/Showing/)).toBeTruthy();
  });

  it("keeps the select once a step fits the list", () => {
    mount(40, "10");
    expect(screen.getByLabelText("Rows per page")).toBeTruthy();
  });
});
