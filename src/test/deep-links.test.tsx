// @vitest-environment happy-dom
/**
 * Deep-link query-param contract (`data-model.md` §7).
 *
 * Every surface in `src/pages` that calls `useSearchParams`, and what the
 * contract says about its param. Enumerated by grepping `useSearchParams`
 * across `src/pages` (14 surfaces, 2026-09-20):
 *
 * | surface                         | param        | contract                          |
 * | ------------------------------- | ------------ | --------------------------------- |
 * | `Conversations.tsx`             | `?open=`     | opens dialog; stripped on CLOSE   |
 * | `security/EventsTable.tsx`      | `?open=`     | opens dialog; stripped on CLOSE   |
 * | `Limits.tsx`                    | `?create=1`  | opens dialog; stripped on CLOSE   |
 * | `LimitsFree.tsx`                | `?create=1`  | opens dialog; stripped on CLOSE   |
 * | `BillingFree.tsx`               | `?manage=1`  | opens dialog; stripped on CLOSE   |
 * | `Notifications.tsx`             | `?tab=`      | selects Archive; strip on TAB CLICK|
 * | `Notifications.tsx`             | `?view=feed` | stripped on LOAD                  |
 * | `Billing.tsx`                   | `?state=`    | preview param, KEPT               |
 * | `BillingEnterprise.tsx`         | `?state=`    | preview param, KEPT               |
 * | `Activity.tsx`                  | `?range=`    | one-way: read on mount, KEPT      |
 * | `TokenSavings.tsx`              | `?range=`    | one-way: read on mount, KEPT      |
 * | `TokenSavingsEnterprise.tsx`    | `?range=`    | one-way: read on mount, KEPT      |
 * | `Dashboard.tsx`                 | `?metric=`   | two-way, KEPT                     |
 * | `ApiKeys.tsx`                   | `?tab=`      | read-only, KEPT                   |
 * | `SetupManual.tsx`               | `?bill=`     | content selector, KEPT            |
 *
 * The strip is NOT on load for `?open=` / `?create=1`: the contract is
 * "stripped via `onOpenChangeComplete` so the back button doesn't reopen".
 * These tests assert that shape — present while open, gone after close.
 */

import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { EVENT_ROWS } from "@/pages/security-data";
import { mountRoute } from "./mount-with-location";
import { resetViewRole } from "./render";

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  errorSpy.mockRestore();
});

const params = (search: string) => new URLSearchParams(search);

/** Lazy route chunks + a Base UI dialog mount run well past vitest's 5s
 *  default when the whole suite is in flight; these cases pass in isolation
 *  at ~1s. */
const SLOW = 30_000;

describe("`?open=` opens the dialog, then the URL is cleaned on close", () => {
  const cases: [string, string][] = [
    ["/conversations", CONVERSATION_ROWS[0].conversationId],
    ["/security", EVENT_ROWS[0].requestId],
  ];

  it.each(cases)(
    "%s?open=… opens a dialog",
    async (path, id) => {
      await mountRoute(`${path}?open=${id}`);
      await waitFor(() => {
        expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0);
      });
    },
    SLOW
  );

  it.each(cases)(
    "%s keeps ?open= while the dialog is open",
    async (p, id) => {
      const { location } = await mountRoute(`${p}?open=${id}`);
      await waitFor(() => {
        expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0);
      });
      expect(params(location().search).get("open")).toBe(id);
    },
    SLOW
  );

  it.each(cases)(
    "%s strips ?open= once dismissed",
    async (p, id) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { location } = await mountRoute(`${p}?open=${id}`);
      await waitFor(() => {
        expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0);
      });
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(params(location().search).has("open")).toBe(false);
      });
    },
    SLOW
  );
});

describe("`?create=1` / `?manage=1` open a dialog and are stripped on close", () => {
  const cases: [string, string][] = [
    ["/limits", "create"],
    ["/limits-free", "create"],
    ["/billing-free", "manage"],
  ];

  it.each(cases)(
    "%s?%s=1 opens a dialog",
    async (path, key) => {
      await mountRoute(`${path}?${key}=1`);
      await waitFor(() => {
        expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0);
      });
    },
    SLOW
  );

  it.each(cases)(
    "%s strips ?%s= once dismissed",
    async (path, key) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { location } = await mountRoute(`${path}?${key}=1`);
      await waitFor(() => {
        expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0);
      });
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(params(location().search).has(key)).toBe(false);
      });
    },
    SLOW
  );
});

describe("Notifications producer params", () => {
  it("?view=feed is consumed on load once the feed is scrolled to", async () => {
    const { location } = await mountRoute("/notifications?view=feed");
    await waitFor(() => {
      expect(params(location().search).has("view")).toBe(false);
    });
  });

  it("?tab=archive selects Archive and is kept until a manual tab click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { location } = await mountRoute("/notifications?tab=archive");
    const archive = await screen.findByRole("tab", { name: /Archive/ });
    await waitFor(() => {
      expect(archive.getAttribute("aria-selected")).toBe("true");
    });
    expect(params(location().search).get("tab")).toBe("archive");

    await user.click(screen.getByRole("tab", { name: /Inbox/ }));
    await waitFor(() => {
      expect(params(location().search).has("tab")).toBe(false);
    });
  });
});

describe("`?range=` is one-way: read into state, never written back", () => {
  const cases = [
    "/activity",
    "/token-savings",
    "/token-savings-enterprise",
  ] as const;

  it.each(cases)("%s?range=30d survives the mount verbatim", async (path) => {
    const { location } = await mountRoute(`${path}?range=30d`);
    expect(location().search).toBe("?range=30d");
  });

  it.each(
    cases
  )("%s: picking a different range does not write ?range=", async (path) => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { location } = await mountRoute(`${path}?range=30d`);
    const seven = screen.getAllByRole("button", { name: "7D" })[0];
    await user.click(seven);
    expect(location().search).toBe("?range=30d");
  });
});

describe("Billing `?state=` is a preview param and is KEPT", () => {
  it.each([
    ["/billing?state=revoked", "revoked"],
    ["/billing-enterprise?state=past_due", "past_due"],
  ])("%s keeps state=%s", async (path, value) => {
    const { location } = await mountRoute(path);
    expect(params(location().search).get("state")).toBe(value);
  });
});
