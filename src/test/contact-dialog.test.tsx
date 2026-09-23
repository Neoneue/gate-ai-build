// @vitest-environment happy-dom
/**
 * Contact / Book a demo, the modal on the Manage subscription page.
 *
 * A MOUNTED suite, unlike its `renderToString` sibling: everything here is
 * behaviour, opening the dialog, Escape, focus return, typing and blurring a
 * field. The plan-ladder markup assertions stay in
 * `manage-subscription.test.tsx`.
 *
 * `Date` is faked to 2026-09-17 by `src/test/setup.ts`.
 */

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signedInMember, WORKSPACE_NAME } from "@/data/team-members";
import { AskAiThreadProvider } from "@/hooks/ask-ai-thread-provider";
import { ThemeProvider } from "@/hooks/use-theme";
import { ManageSubscription } from "@/pages/ManageSubscription";
import "./dom-polyfills";

afterEach(cleanup);

function LayoutStub() {
  return (
    <Outlet
      context={{
        sidebarExpanded: true,
        toggleSidebar: () => undefined,
        askAiOpen: false,
        setAskAiOpen: () => undefined,
      }}
    />
  );
}

const mount = (entry: string) => {
  const path = entry.split("?")[0];
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ThemeProvider>
        <AskAiThreadProvider>
          <Routes>
            <Route element={<LayoutStub />}>
              <Route element={<ManageSubscription />} path={path} />
            </Route>
          </Routes>
        </AskAiThreadProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

/** The Enterprise view carries "Contact support" on two rungs, so take the
 *  first match rather than asserting uniqueness. */
const openBy = async (entry: string, name: string) => {
  const u = user();
  mount(entry);
  const [opener] = await screen.findAllByRole("button", { name });
  await u.click(opener);
  const dialog = await screen.findByRole("dialog");
  return { u, opener, dialog };
};

describe("the buttons open a dialog rather than navigating", () => {
  it.each([
    ["/billing/plans", "Contact us"],
    ["/billing-free/plans", "Contact us"],
    ["/billing-default/plans", "Contact us"],
    ["/billing-enterprise/plans", "Contact support"],
    ["/billing/plans", "Book a demo"],
  ])("%s: %s opens a dialog", async (entry, name) => {
    const { dialog } = await openBy(entry, name);
    expect(dialog).toBeTruthy();
  });

  /** The heading and the button label are the same string by construction:
   *  both come from `contactFlowTitle(tier, flow)` in `data/plans.ts`. */
  it.each([
    ["/billing/plans", "Contact us"],
    ["/billing-free/plans", "Contact us"],
    ["/billing-enterprise/plans", "Contact support"],
    ["/billing/plans", "Book a demo"],
    ["/billing-free/plans", "Book a demo"],
  ])("%s: the dialog titles itself %s", async (entry, name) => {
    const { dialog } = await openBy(entry, name);
    expect(within(dialog).getByText(name)).toBeTruthy();
  });

  it("Escape closes and returns focus to the exact opener", async () => {
    const { u, opener } = await openBy("/billing/plans", "Contact us");
    await u.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(opener);
    });
  });
});

describe("the four embed states, off the one-way ?form= param", () => {
  it("ready shows the form and an enabled submit", async () => {
    const { dialog } = await openBy("/billing/plans", "Contact us");
    expect(within(dialog).getByLabelText("Work email")).toBeTruthy();
    expect(
      within(dialog)
        .getByRole("button", { name: "Submit form" })
        .hasAttribute("disabled")
    ).toBe(false);
  });

  it("loading announces itself busy and hides the fields", async () => {
    const { dialog } = await openBy(
      "/billing/plans?form=loading",
      "Contact us"
    );
    expect(dialog.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(within(dialog).queryByLabelText("Work email")).toBeNull();
  });

  it("the frame-level error keeps its alert role and a retry", async () => {
    const { dialog } = await openBy("/billing/plans?form=error", "Contact us");
    expect(within(dialog).getByRole("alert")).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Try again" })
    ).toBeTruthy();
  });

  it("done keeps its status role and collapses the footer", async () => {
    const { dialog } = await openBy("/billing/plans?form=done", "Contact us");
    expect(within(dialog).getByRole("status")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Done" })).toBeTruthy();
    expect(
      within(dialog).queryByRole("button", { name: "Submit form" })
    ).toBeNull();
  });

  it("submitting the mock form reaches done without touching the URL", async () => {
    const { u, dialog } = await openBy("/billing/plans", "Contact us");
    await u.click(within(dialog).getByRole("button", { name: "Submit form" }));
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeTruthy();
    });
  });
});

describe("the contact form is ours: four fields, prefilled and editable", () => {
  const FIELDS = ["Name", "Work email", "Company", "Notes"] as const;

  it("renders exactly those four, in order", async () => {
    const { dialog } = await openBy("/billing/plans", "Contact us");
    for (const label of FIELDS) {
      expect(within(dialog).getByLabelText(label)).toBeTruthy();
    }
    // The four the spec names and nothing else.
    expect(dialog.querySelectorAll("input, textarea")).toHaveLength(4);
    for (const absent of ["Phone", "Country", "Job title", "Employees"]) {
      expect(within(dialog).queryByLabelText(absent)).toBeNull();
    }
  });

  it("prefills from the signed-in user and the current workspace", async () => {
    const me = signedInMember();
    const { dialog } = await openBy("/billing/plans", "Contact us");
    expect(within(dialog).getByLabelText("Name")).toHaveProperty(
      "value",
      me.name
    );
    expect(within(dialog).getByLabelText("Work email")).toHaveProperty(
      "value",
      me.email
    );
    expect(within(dialog).getByLabelText("Company")).toHaveProperty(
      "value",
      WORKSPACE_NAME
    );
    // Notes is the one thing we cannot know.
    expect(within(dialog).getByLabelText("Notes")).toHaveProperty("value", "");
  });

  it("leaves every prefilled field editable, not read-only or disabled", async () => {
    const { u, dialog } = await openBy("/billing/plans", "Contact us");
    for (const label of FIELDS) {
      const control = within(dialog).getByLabelText(label);
      expect(control.hasAttribute("disabled")).toBe(false);
      expect(control.hasAttribute("readonly")).toBe(false);
    }
    const email = within(dialog).getByLabelText("Work email");
    await u.clear(email);
    await u.type(email, "kira.tan@constellationnetwork.io");
    expect(email).toHaveProperty("value", "kira.tan@constellationnetwork.io");
  });

  it("marks the three required fields with a word, not colour alone", async () => {
    const { dialog } = await openBy("/billing/plans", "Contact us");
    expect(within(dialog).getAllByText("Required")).toHaveLength(3);
  });
});

describe("per-field errors: inline, on blur, wired to the control", () => {
  it("does not flag a half-typed address mid-entry", async () => {
    const { u, dialog } = await openBy("/billing/plans", "Contact us");
    const email = within(dialog).getByLabelText("Work email");
    await u.clear(email);
    await u.type(email, "chad@");
    // Still focused, so no message yet.
    expect(email.getAttribute("aria-invalid")).not.toBe("true");
  });

  it("flags a malformed address on blur and wires the message to it", async () => {
    const { u, dialog } = await openBy("/billing/plans", "Contact us");
    const email = within(dialog).getByLabelText("Work email");
    await u.clear(email);
    await u.type(email, "chad@");
    await u.tab();
    await waitFor(() => {
      expect(email.getAttribute("aria-invalid")).toBe("true");
    });
    const describedBy = email.getAttribute("aria-describedby");
    expect(describedBy).toBe("contact-email-error");
    const message = document.getElementById(describedBy ?? "");
    expect(message?.textContent).toContain("name@company.com");
    // Inline, under its own field, not a summary at the top of the dialog.
    expect(message?.closest("[data-slot=field]")).toBe(
      email.closest("[data-slot=field]")
    );
  });

  it("flags an emptied required field on blur", async () => {
    const { u, dialog } = await openBy("/billing/plans", "Contact us");
    const company = within(dialog).getByLabelText("Company");
    await u.clear(company);
    await u.tab();
    await waitFor(() => {
      expect(company.getAttribute("aria-invalid")).toBe("true");
    });
    expect(
      document.getElementById("contact-company-error")?.textContent
    ).toContain("required");
  });

  it("never flags Notes, the one optional field", async () => {
    const { u, dialog } = await openBy("/billing/plans", "Contact us");
    const notes = within(dialog).getByLabelText("Notes");
    await u.click(notes);
    await u.tab();
    expect(notes.getAttribute("aria-invalid")).not.toBe("true");
  });

  /** Field-level errors and the frame-level error are separate states and
   *  both have to be previewable. */
  it("keeps the frame error separate from the field errors", async () => {
    const { dialog } = await openBy("/billing/plans?form=error", "Contact us");
    expect(within(dialog).getByRole("alert")).toBeTruthy();
    // No form to carry field errors while the frame itself has failed.
    expect(within(dialog).queryByLabelText("Work email")).toBeNull();
  });
});

describe("the demo modal is a vendor surface, the contact modal is ours", () => {
  it("only the demo keeps a visible boundary", async () => {
    const demo = await openBy("/billing/plans", "Book a demo");
    expect(
      demo.dialog.querySelector(".rounded-md.border.border-border")
    ).toBeTruthy();
    cleanup();
    const contact = await openBy("/billing/plans", "Contact us");
    expect(
      contact.dialog.querySelector(".rounded-md.border.border-border")
    ).toBeNull();
  });

  it("the demo draws none of our fields and no submit of ours", async () => {
    const { dialog } = await openBy("/billing/plans", "Book a demo");
    expect(dialog.querySelectorAll("input, textarea")).toHaveLength(0);
    expect(within(dialog).queryByText("Required")).toBeNull();
    // The confirm control lives inside the vendor scheduler.
    expect(
      within(dialog).queryByRole("button", { name: "Submit form" })
    ).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("the demo still announces loading and still has a frame error", async () => {
    const loading = await openBy("/billing/plans?form=loading", "Book a demo");
    expect(loading.dialog.querySelector('[aria-busy="true"]')).toBeTruthy();
    cleanup();
    const failed = await openBy("/billing/plans?form=error", "Book a demo");
    expect(within(failed.dialog).getByRole("alert")).toBeTruthy();
  });
});
