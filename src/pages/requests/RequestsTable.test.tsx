// @vitest-environment happy-dom
/**
 * `RequestsTableSection` behaviour.
 *
 * Product facts asserted (not "what the DOM happens to do"):
 * - rows key on `requestRowId(row)`, so a sort reorders the SAME row set;
 * - the drill-in is a real `<a href>` per row, and every href is unique;
 * - `TableRow` carries the 48px floor (`h-12`) — memory rule, table.tsx:148;
 * - the pagination footer advances a page.
 *
 * Mounted directly under a `MemoryRouter` (its props are `range` +
 * `customRange`; everything else is internal state) so a table test does not
 * pay for the whole chrome.
 */

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/test/dom-polyfills";
import { RequestsTableSection } from "./RequestsTable";

const mount = () =>
  render(
    <MemoryRouter initialEntries={["/messages"]}>
      <RequestsTableSection customRange={null} range="all" />
    </MemoryRouter>
  );

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLTableRowElement>("tbody tr"));

/** Row identity as the DOM exposes it: the drill-in anchor's href carries
 *  `requestRowId(row)`, which is the very key the table renders rows with. */
const rowIds = () =>
  bodyRows().map(
    (tr) => tr.querySelector("a[href]")?.getAttribute("href") ?? ""
  );

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  errorSpy.mockRestore();
});

describe("RequestsTableSection", () => {
  it("renders at least one row", () => {
    mount();
    expect(bodyRows().length).toBeGreaterThan(0);
  });

  it("every row carries a unique drill-in href (rows key on requestRowId)", () => {
    mount();
    const ids = rowIds();
    expect(ids.every((id) => id.includes("/messages-findings/"))).toBe(true);
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
    await user.click(screen.getByRole("button", { name: /^Model/ }));
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
    const head = screen.getByRole("button", { name: /^Model/ });
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
    const next = screen.getByRole("button", { name: "Go to next page" });
    await user.click(next);
    await waitFor(() => {
      expect(rowIds().join("|")).not.toBe(first.join("|"));
    });
    for (const id of rowIds()) {
      expect(first).not.toContain(id);
    }
  });

  /* Guards smk-3 (audit-9-20): the toolbar search must actually filter. */
  it("a search that matches nothing shows the empty state", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();
    await user.type(
      screen.getByRole("searchbox", { name: "Search messages" }),
      "zzzzz-no-such-message"
    );
    await waitFor(() => {
      expect(bodyRows().length).toBe(0);
    });
    expect(within(document.body).getByText("No messages")).toBeDefined();
  });
});
