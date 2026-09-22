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

describe("the org's own rung sends the user into the product", () => {
  it.each([
    ["/billing/plans", "pro", "/overview"],
    ["/billing-free/plans", "free", "/overview-free"],
    ["/billing-default/plans", "free", "/overview-default"],
    ["/billing-enterprise/plans", "enterprise", "/overview-enterprise"],
  ] as const)("%s: the %s card links to %s", (path, id, href) => {
    const markup = html(path);
    const own = cardFor(markup, id);
    expect(own).toContain(`href="${href}"`);
    expect(own).toContain("Go to Overview");
    expect(
      planCards(markup).filter((card) => card.includes("Go to Overview"))
    ).toHaveLength(1);
  });

  it.each(PLANS_PATHS)("%s: no back-pointing arrow on a card", (path) => {
    // Forward navigation; the page's own BackLink returns to Billing.
    expect(html(path)).not.toContain("Back to Billing");
    for (const card of planCards(html(path))) {
      expect(card).not.toContain("lucide-arrow-left");
    }
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

/** Two paths, two labels. A Free or Pro org looking at Enterprise is a
 *  PROSPECT, so the sales action says "Contact us"; an Enterprise org is an
 *  existing customer, so its Free and Pro rungs route to "Contact support".
 *  The dialog titles itself from whichever button opened it. */
describe("sales says Contact us, support says Contact support", () => {
  it.each([
    "/billing/plans",
    "/billing-free/plans",
    "/billing-default/plans",
  ] as const)("%s: the Enterprise card sells, so Contact us", (path) => {
    const markup = html(path);
    expect(cardFor(markup, "enterprise")).toContain("Contact us");
    expect(markup).not.toContain("Contact support");
  });

  it("Enterprise org: an existing customer routes to Support", () => {
    const markup = html("/billing-enterprise/plans");
    expect(cardFor(markup, "free")).toContain("Contact support");
    expect(cardFor(markup, "pro")).toContain("Contact support");
    expect(markup).not.toContain("Contact us");
  });
});

/** The cards already carry a `CircleCheck` per feature row, so a glyph on
 *  every control read as decoration. A glyph on a BUTTON now means "this is
 *  the promoted action": at most one per view, and only the SparklesIcon.
 *  The slice below is the action band, everything after the feature list. */
/** "Book a demo" is the only `ghost` on the page, and it is legible because
 *  the bordered "Contact support" directly above anchors it. A ghost has
 *  neither `border-border` nor `shadow-xs`; outline has both. */
describe("the paired secondary is ghost, and nothing else is", () => {
  const controls = (card: string) =>
    card
      .slice(card.lastIndexOf("</ul>"))
      .split(/<(?:button|a)\b/)
      .slice(1);

  it.each([
    "/billing/plans",
    "/billing-free/plans",
  ] as const)("%s: Book a demo is ghost, directly under an anchoring sibling", (path) => {
    const band = controls(cardFor(html(path), "enterprise"));
    expect(band).toHaveLength(2);
    expect(band[0]).toContain("Contact us");
    expect(band[0]).toContain("border-border");
    expect(band[1]).toContain("Book a demo");
    expect(band[1]).not.toContain("border-border");
    expect(band[1]).not.toContain("shadow-xs");
  });

  it.each(PLANS_PATHS)("%s: no lone ghost anywhere", (path) => {
    for (const card of planCards(html(path))) {
      const band = controls(card);
      band.forEach((control, i) => {
        // The lift family carries an edge (`border-border` neutral,
        // `border-tier-*` tinted), default carries `bg-primary` and promo
        // `bg-promo-cta`; anything with none of those is the ghost.
        const ghost = !(
          control.includes("border-border") ||
          control.includes("border-tier-") ||
          control.includes("bg-primary") ||
          control.includes("bg-promo-cta")
        );
        // A ghost is only legible with a bordered sibling above it.
        expect(ghost && i === 0).toBe(false);
      });
    }
  });
});

/** Plan-card buttons use the Button primitive's LIFT family, not `outline` /
 *  `ghost`: those hover to an opaque `bg-muted` that would cover a tinted
 *  card. The focal card's button wears that card's tier edge and ink; every
 *  button on a plain card is neutral; all of them share one hover rung. */
/** The plan cards are a hand-rolled grid item rather than a `<Card>`, because
 *  they subgrid across the ladder, so they do not inherit the primitive's
 *  elevation and have to name it. Card / surface tier is `border-border`
 *  plus `shadow-xs` (design.md §5.1); it went missing once and this stops it
 *  going missing again. */
describe("the plan cards carry the Card tier elevation", () => {
  it.each(PLANS_PATHS)("%s: every card has border and shadow-xs", (path) => {
    const cards = planCards(html(path));
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      const open = card.slice(0, card.indexOf(">"));
      expect(open).toContain("shadow-xs");
      expect(open).toContain("rounded-md");
      // The tinted focal card too: a tier wash replaces the fill, not the
      // elevation.
      expect(open).toMatch(/border-(border|tier-(pro|enterprise)-border)/);
    }
  });

  it.each(
    PLANS_PATHS
  )("%s: the focal card is elevated like the rest", (path) => {
    const focal = planCards(html(path)).filter(isTinted);
    expect(focal).toHaveLength(1);
    expect(focal[0].slice(0, focal[0].indexOf(">"))).toContain("shadow-xs");
  });
});

describe("the lift treatment follows the card, per view", () => {
  const controls = (card: string) =>
    card
      .slice(card.lastIndexOf("</ul>"))
      .split(/<(?:button|a)\b/)
      .slice(1);

  it.each([
    ["/billing/plans", "pro"],
    ["/billing-enterprise/plans", "enterprise"],
  ] as const)("%s: the focal %s card takes its own tier edge", (path, id) => {
    const focal = controls(cardFor(html(path), id)).join("");
    expect(focal).toContain(`border-tier-${id}-border`);
    expect(focal).toContain(`text-tier-${id}-foreground`);
  });

  /** The Free and Default views are the exception, and deliberately so: the
   *  focal Pro card's one control there is "Upgrade to Pro", which keeps the
   *  filled `promo` variant. A fill has no tint to protect, so it takes no
   *  lift edge and the blue treatment has nothing to appear on. */
  it.each([
    "/billing-free/plans",
    "/billing-default/plans",
  ] as const)("%s: the focal card's one control is the untouched promo", (path) => {
    const focal = controls(cardFor(html(path), "pro"));
    expect(focal).toHaveLength(1);
    expect(focal[0]).toContain("bg-promo-cta");
    expect(focal[0]).not.toContain("border-tier-");
  });

  it.each([
    ["/billing/plans", ["free", "enterprise"]],
    ["/billing-free/plans", ["free", "enterprise"]],
    ["/billing-default/plans", ["free", "enterprise"]],
    ["/billing-enterprise/plans", ["free", "pro"]],
  ] as const)("%s: every plain card stays neutral", (path, ids) => {
    for (const id of ids) {
      const plain = controls(cardFor(html(path), id)).join("");
      expect(plain).not.toContain("border-tier-");
      expect(plain).not.toContain("text-tier-");
    }
  });

  it.each(PLANS_PATHS)("%s: one hover rung for every control", (path) => {
    for (const card of planCards(html(path))) {
      for (const control of controls(card)) {
        // The promo fill keeps its own hover; everything else lifts.
        if (control.includes("bg-promo-cta")) {
          continue;
        }
        expect(control).toContain("hover:bg-lift-8");
        // The opaque grey these variants exist to avoid.
        expect(control).not.toContain("hover:bg-muted");
      }
    }
  });

  it.each(PLANS_PATHS)("%s: no call-site fill override survives", (path) => {
    for (const card of planCards(html(path))) {
      expect(card.slice(card.lastIndexOf("</ul>"))).not.toContain(
        "bg-transparent"
      );
    }
  });
});

describe("only the promoted button wears a glyph", () => {
  const band = (card: string) => card.slice(card.lastIndexOf("</ul>"));

  it.each(PLANS_PATHS)("%s: no retired glyph on any control", (path) => {
    for (const card of planCards(html(path))) {
      for (const glyph of [
        "lucide-headset",
        "lucide-house",
        "lucide-arrow-left",
      ]) {
        expect(band(card)).not.toContain(glyph);
      }
    }
  });

  it.each([
    "/billing-free/plans",
    "/billing-default/plans",
  ] as const)("%s: the promoted Upgrade to Pro keeps its sparkles", (path) => {
    const pro = band(cardFor(html(path), "pro"));
    expect(pro).toContain("Upgrade to Pro");
    expect(pro).toContain("<svg");
  });

  it.each([
    "/billing/plans",
    "/billing-enterprise/plans",
  ] as const)("%s: nothing is promoted by glyph, so no button svg at all", (path) => {
    for (const card of planCards(html(path))) {
      expect(band(card)).not.toContain("<svg");
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

  /** The only fill on the whole page is "Upgrade to Pro", so only the two
   *  views that can still upgrade carry one. A Pro org has nowhere left to
   *  go and an Enterprise org is already at the top; on both, the tint and
   *  the badge mark the card and outline carries the rest. */
  it.each([
    ["/billing-free/plans", 1],
    ["/billing-default/plans", 1],
    ["/billing/plans", 0],
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
    expect(enterprise).toContain("Contact us");
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
    expect(cardFor(markup, "pro")).toContain("Go to Overview");
    expect(cardFor(markup, "free")).toContain("Downgrade to Free");
    expect(cardFor(markup, "free")).toContain(
      'aria-label="Downgrade to the Free plan"'
    );
  });

  it("Pro: nothing is filled, and Enterprise stays plain and unbadged", () => {
    const markup = html("/billing/plans");
    expect(planCards(markup).filter(hasFilledCta)).toHaveLength(0);
    const enterprise = cardFor(markup, "enterprise");
    expect(enterprise).toContain("Contact us");
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

  it("gives the Enterprise rung a way forward rather than a dead label", () => {
    const enterprise = cardFor(markup(), "enterprise");
    expect(enterprise).toContain("Go to Overview");
    expect(enterprise).toContain('href="/overview-enterprise"');
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
    expect(enterprise).toContain("Go to Overview");
    expect(cardFor(markup(), "free")).toContain("Contact support");
    expect(cardFor(markup(), "pro")).toContain("Contact support");
  });

  it("routes the other two rungs to Support, never to a checkout", () => {
    const markup_ = markup();
    expect(cardFor(markup_, "free")).toContain("Contact support");
    expect(cardFor(markup_, "pro")).toContain("Contact support");
    // Its own rung offers the way forward instead.
    expect(cardFor(markup_, "enterprise")).toContain("Go to Overview");
    expect(cardFor(markup_, "enterprise")).not.toContain("Contact support");
  });
});
