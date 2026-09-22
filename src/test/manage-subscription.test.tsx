// @vitest-environment happy-dom
/**
 * Manage subscription page: the ladder each tier sees.
 *
 * `renderToString` rather than a mount: the assertions are all about what
 * the four routes PUT ON THE PAGE (three cards, which one is promoted,
 * which rung is marked current), none of which needs an interaction. The
 * page reads its tier from the pathname, so a MemoryRouter at each of the
 * four paths is the whole fixture.
 *
 * The outlet context is supplied by a stand-in layout because
 * `DashboardChrome` and the page both read sidebar / Ask AI state from it
 * (`LayoutContext` in `src/App.tsx`); mounting the real route tree would
 * only render the lazy `Suspense` fallback under `renderToString`.
 *
 * `Date` is faked to 2026-09-17 by `src/test/setup.ts`.
 */

import { renderToString } from "react-dom/server";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AskAiThreadProvider } from "@/hooks/ask-ai-thread-provider";
import { ThemeProvider } from "@/hooks/use-theme";
import { ManageSubscription } from "@/pages/ManageSubscription";
import "./dom-polyfills";

const PLANS_PATHS = [
  "/billing/plans",
  "/billing-free/plans",
  "/billing-default/plans",
  "/billing-enterprise/plans",
] as const;

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

const html = (path: string) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
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

/** The three plan cards' markup, in ladder order. Scoped so a sidebar promo
 *  or any other `<article>` in the chrome cannot satisfy an assertion. */
const planCards = (markup: string): string[] =>
  markup
    .split("<article")
    .filter((chunk) => chunk.includes("data-plan-card"))
    .map((chunk) => chunk.slice(0, chunk.indexOf("</article>")));

const cardFor = (markup: string, id: "free" | "pro" | "enterprise") => {
  const card = planCards(markup).find((chunk) =>
    chunk.includes(`id="plan-card-${id}"`)
  );
  if (card === undefined) {
    throw new Error(`no ${id} plan card in the rendered ladder`);
  }
  return card;
};

/** `variant="default"` and `variant="promo"` are the only filled buttons;
 *  outline and ghost never emit either fill. */
const hasFilledCta = (card: string) =>
  card.includes("bg-primary") || card.includes("bg-promo-cta");

/** The focal card wears its own tier's border; nothing else is tinted. */
const isTinted = (card: string) =>
  card.includes("border-tier-pro-border") ||
  card.includes("border-tier-enterprise-border");

const badges = (markup: string) =>
  planCards(markup).flatMap((card) =>
    [...card.matchAll(/data-slot="badge"[^>]*>([^<]*)</g)].map((m) => m[1])
  );

/** The tier family the card's badge is painted in. `pro` and `enterprise`
 *  are the Badge primitive's own variants, used unchanged. */
const badgeTone = (card: string) =>
  card.includes("bg-tier-pro-wash")
    ? "pro"
    : card.includes("bg-tier-enterprise-wash")
      ? "enterprise"
      : card.includes('data-slot="badge"')
        ? "neutral"
        : "none";

describe("Manage subscription renders the three-rung ladder", () => {
  it.each(PLANS_PATHS)("%s renders three plan cards", (path) => {
    expect(planCards(html(path))).toHaveLength(3);
  });

  it.each(PLANS_PATHS)("%s titles the page once", (path) => {
    expect(html(path)).toContain("Manage subscription");
  });
});

describe("the org's own rung links back to Billing", () => {
  it.each([
    ["/billing/plans", "pro", "/billing"],
    ["/billing-free/plans", "free", "/billing-free"],
    ["/billing-default/plans", "free", "/billing-default"],
    ["/billing-enterprise/plans", "enterprise", "/billing-enterprise"],
  ] as const)("%s: the %s card links to %s", (path, id, href) => {
    const markup = html(path);
    expect(cardFor(markup, id)).toContain(`href="${href}"`);
    expect(
      planCards(markup).filter((card) => card.includes("Back to Billing"))
    ).toHaveLength(1);
  });

  it.each(PLANS_PATHS)("%s: no disabled control on the page", (path) => {
    for (const card of planCards(html(path))) {
      // The attribute, not the `disabled:` variants in the Button recipe.
      expect(card).not.toContain('disabled=""');
      expect(card).not.toContain("aria-disabled");
      expect(card).not.toContain("Your current plan");
    }
  });
});

describe("the support route has one label and one glyph", () => {
  it.each(
    PLANS_PATHS
  )("%s: every support control says Contact support", (path) => {
    const markup = html(path);
    expect(markup).not.toContain("Contact us");
    for (const card of planCards(markup)) {
      if (!card.includes("Contact support")) {
        continue;
      }
      // Headset in the inline-start slot, the site's support glyph.
      expect(card).toContain("lucide-headset");
    }
  });
});

describe("the Enterprise price row and its caption", () => {
  it.each([
    "/billing/plans",
    "/billing-free/plans",
  ] as const)("%s: bare Custom, and the seat basis rides in the caption", (path) => {
    const enterprise = cardFor(html(path), "enterprise");
    expect(enterprise).toContain("Custom");
    expect(enterprise).not.toContain("per seat<");
    expect(enterprise).toContain(
      "Billed per seat, changes go through Support."
    );
  });

  it("Enterprise org: the Pro rung routes to Support too", () => {
    const pro = cardFor(html("/billing-enterprise/plans"), "pro");
    expect(pro).toContain("Available through Support.");
    expect(pro).not.toContain("Constellation");
  });

  it("Enterprise org: the caption drops the seat half", () => {
    const enterprise = cardFor(html("/billing-enterprise/plans"), "enterprise");
    expect(enterprise).toContain("Plan changes go through Support.");
    expect(enterprise).not.toContain("Billed per seat");
  });

  it.each(PLANS_PATHS)("%s: nothing trails Custom in the price row", (path) => {
    const enterprise = cardFor(html(path), "enterprise");
    // The unit span is the only `type-copy-18` inside a card.
    expect(enterprise).not.toContain("type-copy-18");
  });
});

describe("every benefits row uses the one shared glyph", () => {
  it.each(PLANS_PATHS)("%s: four CircleCheck marks per card", (path) => {
    for (const card of planCards(html(path))) {
      const list = card.slice(card.indexOf("<ul"), card.indexOf("</ul>"));
      expect([...list.matchAll(/lucide-circle-check/g)]).toHaveLength(4);
      expect([...list.matchAll(/<svg/g)]).toHaveLength(4);
    }
  });
});

describe("exactly one focal card per view, and it is never Free", () => {
  /** One badge per rung the view has something to say about: the current
   *  plan always, plus the upsell where there still is one. That is two on
   *  the Free and Default views and one on the other two. */
  it.each([
    ["/billing/plans", ["Current plan"]],
    ["/billing-free/plans", ["Current plan", "Most popular"]],
    ["/billing-default/plans", ["Current plan", "Most popular"]],
    ["/billing-enterprise/plans", ["Current plan"]],
  ] as const)("%s: badges read %j, in ladder order", (path, expected) => {
    expect(badges(html(path))).toEqual([...expected]);
  });

  /** The badge is painted in its CARD's tier family, never neutral grey, so
   *  the pill belongs to the surface it sits on. Both variants come from
   *  `badge.tsx` unchanged. */
  it.each([
    ["/billing/plans", "pro", "pro"],
    ["/billing-free/plans", "pro", "pro"],
    ["/billing-default/plans", "pro", "pro"],
    ["/billing-enterprise/plans", "enterprise", "enterprise"],
  ] as const)("%s: the %s card's badge is %s-toned", (path, id, tone) => {
    const markup = html(path);
    expect(badgeTone(cardFor(markup, id))).toBe(tone);
    // A tier-toned badge always rides the focal card, so tone and tint agree.
    expect(isTinted(cardFor(markup, id))).toBe(true);
  });

  /** Free has no tier colour of its own, so its badge is the neutral pill
   *  on a plain card. It is the only non-tier badge on the page. */
  it.each([
    "/billing-free/plans",
    "/billing-default/plans",
  ] as const)("%s: the Free card wears the neutral Current plan pill", (path) => {
    const free = cardFor(html(path), "free");
    expect(free).toContain("Current plan");
    expect(badgeTone(free)).toBe("neutral");
    expect(isTinted(free)).toBe(false);
  });

  it.each([
    "/billing/plans",
    "/billing-enterprise/plans",
  ] as const)("%s: the Free card is unbadged, it is not the current plan", (path) => {
    expect(badgeTone(cardFor(html(path), "free"))).toBe("none");
  });

  it.each(PLANS_PATHS)("%s: one tinted card", (path) => {
    expect(planCards(html(path)).filter(isTinted)).toHaveLength(1);
  });

  /** One filled control on the three views that still have something to
   *  sell; none on the Enterprise-org view, where the violet tint and the
   *  "Current plan" badge already mark the card and a fill would be a third
   *  signal saying the same thing. */
  it.each([
    ["/billing/plans", 1],
    ["/billing-free/plans", 1],
    ["/billing-default/plans", 1],
    ["/billing-enterprise/plans", 0],
  ] as const)("%s: %i filled control(s)", (path, count) => {
    expect(planCards(html(path)).filter(hasFilledCta)).toHaveLength(count);
  });

  it.each(PLANS_PATHS)("%s: the Free card is never focal", (path) => {
    const free = cardFor(html(path), "free");
    expect(free).toContain("border-border bg-card");
    expect(isTinted(free)).toBe(false);
  });

  it.each(
    [["/billing/plans", "/billing-free/plans", "/billing-default/plans"]].flat()
  )("%s: the Enterprise card is plain", (path) => {
    const enterprise = cardFor(html(path), "enterprise");
    expect(enterprise).toContain("border-border bg-card");
    expect(enterprise).not.toContain("tier-enterprise");
  });
});

describe("slot order inside a card", () => {
  it.each(
    PLANS_PATHS
  )("%s: the CTA band sits below the feature list", (path) => {
    for (const card of planCards(html(path))) {
      const listEnd = card.indexOf("</ul>");
      // A control may be a <button> or the "Back to Billing" <a>.
      const control = card.slice(listEnd).search(/<(button|a)\b/);
      const caption = card.lastIndexOf("text-center");
      expect(listEnd).toBeGreaterThan(-1);
      expect(control).toBeGreaterThan(-1);
      expect(caption).toBeGreaterThan(listEnd + control);
    }
  });

  it.each(
    PLANS_PATHS
  )("%s: exactly one rule, above the benefits block", (path) => {
    for (const card of planCards(html(path))) {
      expect([...card.matchAll(/data-slot="separator"/g)]).toHaveLength(1);
      expect(card.indexOf('data-slot="separator"')).toBeLessThan(
        card.indexOf("<ul")
      );
    }
  });

  it.each(PLANS_PATHS)("%s: each card spans all five subgrid rows", (path) => {
    for (const card of planCards(html(path))) {
      expect(card).toContain("row-span-5 grid grid-rows-subgrid");
    }
  });

  /** The action band is bottom-anchored INSIDE the `1fr` body row rather
   *  than being a shared row of its own; that is what puts the last button
   *  of every card on one baseline whether it offers one control or two. */
  it.each(PLANS_PATHS)("%s: the action band is bottom-anchored", (path) => {
    for (const card of planCards(html(path))) {
      const band = card.lastIndexOf("mt-auto flex flex-col gap-2");
      expect(band).toBeGreaterThan(card.indexOf("</ul>"));
    }
  });
});

describe("the featured rung is Pro, on both views that have one", () => {
  it("Free: the Pro card is tinted and carries the one filled CTA", () => {
    const markup = html("/billing-free/plans");
    expect(cardFor(markup, "pro")).toContain("Upgrade to Pro");
    expect(isTinted(cardFor(markup, "pro"))).toBe(true);
    expect(planCards(markup).filter(hasFilledCta)).toHaveLength(1);
    expect(hasFilledCta(cardFor(markup, "pro"))).toBe(true);
  });

  it.each([
    "/billing-free/plans",
    "/billing-default/plans",
  ] as const)("%s: the upsell badge sits on the Pro rung", (path) => {
    const markup = html(path);
    expect(cardFor(markup, "pro")).toContain("Most popular");
    // The other badge on these views names the current plan, on Free.
    expect(cardFor(markup, "free")).toContain("Current plan");
    expect(cardFor(markup, "enterprise")).not.toContain("Most popular");
  });

  it("Free: the Enterprise card is plain and has no filled CTA", () => {
    const enterprise = cardFor(html("/billing-free/plans"), "enterprise");
    expect(enterprise).toContain("Contact support");
    expect(hasFilledCta(enterprise)).toBe(false);
    expect(isTinted(enterprise)).toBe(false);
  });

  it("Default is the Free plan, so it features Pro the same way", () => {
    const markup = html("/billing-default/plans");
    expect(cardFor(markup, "pro")).toContain("Upgrade to Pro");
    expect(isTinted(cardFor(markup, "pro"))).toBe(true);
    expect(hasFilledCta(cardFor(markup, "enterprise"))).toBe(false);
  });

  it("Pro: Pro stays the featured card even though it is current", () => {
    const markup = html("/billing/plans");
    expect(isTinted(cardFor(markup, "pro"))).toBe(true);
    expect(cardFor(markup, "pro")).toContain("Back to Billing");
    expect(cardFor(markup, "free")).toContain("Downgrade plan");
    expect(cardFor(markup, "free")).toContain(
      'aria-label="Downgrade to the Free plan"'
    );
  });

  it("Pro: the one fill is Contact support, on an untinted Enterprise", () => {
    const markup = html("/billing/plans");
    const filled = planCards(markup).filter(hasFilledCta);
    expect(filled).toHaveLength(1);
    const enterprise = cardFor(markup, "enterprise");
    expect(hasFilledCta(enterprise)).toBe(true);
    expect(enterprise).toContain("Contact support");
    // Fill is weight, not focus: the card stays plain and unbadged.
    expect(isTinted(enterprise)).toBe(false);
    expect(badges(markup)).toEqual(["Current plan"]);
  });

  it("Pro: the badge names the rung rather than selling it", () => {
    const markup = html("/billing/plans");
    expect(badges(markup)).toEqual(["Current plan"]);
    expect(cardFor(markup, "pro")).toContain("Current plan");
    expect(markup).not.toContain("Most popular");
  });
});

describe("an Enterprise org is already at the top of the ladder", () => {
  const markup = () => html("/billing-enterprise/plans");

  it("offers no upgrade anywhere in the ladder", () => {
    for (const card of planCards(markup())) {
      expect(card).not.toContain("Upgrade");
    }
  });

  it("carries one badge, naming Enterprise as the current plan", () => {
    expect(badges(markup())).toEqual(["Current plan"]);
    expect(cardFor(markup(), "enterprise")).toContain("Current plan");
    // The upsell badge has nothing to sell here.
    expect(markup()).not.toContain("Most popular");
  });

  it("gives the Enterprise rung the way back rather than a dead label", () => {
    const enterprise = cardFor(markup(), "enterprise");
    expect(enterprise).toContain("Back to Billing");
    expect(enterprise).toContain('href="/billing-enterprise"');
  });

  it("makes its own plan the focal card, in Enterprise violet", () => {
    const enterprise = cardFor(markup(), "enterprise");
    expect(enterprise).toContain("border-tier-enterprise-border");
    expect(enterprise).toContain("--tier-enterprise-surface-wash");
    // Glyph ink follows the tier, like the Pro card's does on its views.
    const list = enterprise.slice(
      enterprise.indexOf("<ul"),
      enterprise.indexOf("</ul>")
    );
    expect([...list.matchAll(/text-tier-enterprise/g)]).toHaveLength(4);
  });

  it("fills nothing: the tint and the badge already mark the card", () => {
    const cards = planCards(markup());
    expect(cards.filter(hasFilledCta)).toHaveLength(0);
    const enterprise = cardFor(markup(), "enterprise");
    expect(enterprise).toContain("Back to Billing");
    expect(cardFor(markup(), "free")).toContain("Contact support");
    expect(cardFor(markup(), "pro")).toContain("Contact support");
  });

  it("routes the other two rungs to Support, never to a checkout", () => {
    const markup_ = markup();
    expect(cardFor(markup_, "free")).toContain("Contact support");
    expect(cardFor(markup_, "pro")).toContain("Contact support");
    // Its own rung offers the way back instead.
    expect(cardFor(markup_, "enterprise")).toContain("Back to Billing");
    expect(cardFor(markup_, "enterprise")).not.toContain("Contact support");
  });
});
