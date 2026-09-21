// @vitest-environment happy-dom
/**
 * `EventsTableSection` behaviour.
 *
 * Product facts asserted:
 * - rows key on `verdictKey(row)` (`${requestId}-${type}`), so a sort
 *   reorders the SAME row set rather than rebuilding it;
 * - `TableRow` carries the 48px floor (`h-12`) — table.tsx:148;
 * - the pagination footer advances a page;
 * - a query that matches nothing shows the "No security events" empty state.
 *
 * The section exposes no filter props (`range` + `customRange` only); the
 * search box IS its filter API, so the empty-state case drives it.
 *
 * NOTE: unlike Requests, an events row renders no id-bearing attribute or
 * anchor — `verdictKey` lives only in the React key. Row identity here is the
 * row's rendered text, which is the strongest handle the DOM offers today.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/test/dom-polyfills";
import { EventsTableSection } from "./EventsTable";

const mount = () =>
  render(
    <MemoryRouter initialEntries={["/security"]}>
      <EventsTableSection customRange={null} range="all" />
    </MemoryRouter>
  );

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLTableRowElement>("tbody tr"));

const rowIds = () =>
  bodyRows().map((tr) => (tr.textContent ?? "").replace(/\s+/g, " ").trim());

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  errorSpy.mockRestore();
});

describe("EventsTableSection", () => {
  it("renders at least one row", () => {
    mount();
    expect(bodyRows().length).toBeGreaterThan(0);
  });

  it("every rendered row is distinct (rows key on verdictKey)", () => {
    mount();
    const ids = rowIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("table rows are 48px minimum — TableRow carries h-12", () => {
    mount();
    for (const tr of bodyRows()) {
      expect(tr.className).toContain("h-12");
    }
  });

  it("clicking a sort header reorders the page without losing or duplicating rows", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();
    const before = rowIds();
    await user.click(screen.getByRole("button", { name: /^Type/ }));
    await waitFor(() => {
      expect(rowIds().join("|")).not.toBe(before.join("|"));
    });
    const after = rowIds();
    expect(after.length).toBe(before.length);
    expect(new Set(after).size).toBe(after.length);
  });

  it("the sort cycle asc → desc → none returns the authored row set", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();
    const before = rowIds();
    const head = screen.getByRole("button", { name: /^Type/ });
    await user.click(head);
    await user.click(head);
    await user.click(head);
    await waitFor(() => {
      expect(rowIds()).toEqual(before);
    });
  });

  it("the pagination footer advances to page 2 with different rows", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();
    const first = rowIds();
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    await waitFor(() => {
      expect(rowIds().join("|")).not.toBe(first.join("|"));
    });
    for (const id of rowIds()) {
      expect(first).not.toContain(id);
    }
  });

  it("a search that matches nothing shows the empty state", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();
    await user.type(
      screen.getByRole("searchbox", { name: "Search events" }),
      "zzzzz-no-such-event"
    );
    await waitFor(() => {
      expect(bodyRows().length).toBe(0);
    });
    expect(screen.getByText("No security events")).toBeDefined();
  });
});
