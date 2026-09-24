import { tierSuffixOf } from "@/lib/plan";

/* ─────────────────────────────────────────────────────────────────────────
 * Plan ladder data: Free, Pro, Enterprise.
 *
 * Lifted VERBATIM out of `src/pages/plan-comparison-dialog.tsx` (Free org)
 * and `src/pages/plan-comparison-dialog-pro.tsx` (Pro org) on 2026-09-22,
 * when the plan-comparison dialog became the nested Manage subscription
 * page (`/billing/plans` and its three tier twins).
 * Every Free and Pro string, icon, caption and aria-label below is what one
 * of those two dialogs already rendered; nothing was reworded in the move.
 *
 * The two dialogs disagreed on a few labels because each spoke to a
 * different org ("Included in your Free plan:" to a Free org vs "Included
 * with the Free plan:" to a Pro org). That is preserved as PER-TIER
 * variants keyed by the viewing org's plan, so each org still reads exactly
 * the copy it read before.
 *
 * ENTERPRISE is new here: seat-based billing and the Support-granted
 * entitlement come from `src/data/billing-enterprise.ts` and H2 PRD §3 /
 * §8.5 / §10; nothing self-serve, so its actions are Contact us and Book a
 * demo rather than a checkout.
 * ───────────────────────────────────────────────────────────────────────── */

/** The viewing organization's own plan. `-default` maps to `free` (the
 *  Default workspace is on the Free plan), matching `lib/plan.ts`. */
export type PlanTier = "free" | "pro" | "enterprise";

/** Which contact flow a surface is in. Both are placeholders for a
 *  third-party embed: `contact` for the HubSpot form, `demo` for the
 *  scheduler. */
export type ContactKind = "contact" | "demo";

/**
 * The ONE rule for what a contact route is called, used both for the button
 * label on the plan ladder and for the heading of the page that button
 * opens, so the two cannot drift. A Free or Pro org looking at Enterprise is
 * a prospect reaching sales; an Enterprise org is an existing customer
 * routing to Support.
 */
export const contactFlowTitle = (tier: PlanTier, flow: ContactKind): string => {
  if (flow === "demo") {
    return "Book a demo";
  }
  return tier === "enterprise" ? "Contact support" : "Contact us";
};

const TIER_BY_SUFFIX: Record<
  "" | "-default" | "-free" | "-enterprise",
  PlanTier
> = {
  "": "pro",
  "-free": "free",
  // The Default workspace is on the Free plan.
  "-default": "free",
  "-enterprise": "enterprise",
};

/** The org's plan, read off the pathname rather than passed as a prop, so
 *  every surface under `/billing*` agrees without a twin to keep in sync. */
export const planTierOf = (pathname: string): PlanTier =>
  TIER_BY_SUFFIX[tierSuffixOf(pathname)];

/** A rung on the ladder. Always rendered in this order: free, pro, enterprise. */
export type PlanId = "free" | "pro" | "enterprise";

/** One row of a plan's benefits list. No per-row glyph: every row renders
 *  the same `CircleCheck`, so a feature is a title and a sentence. */
export type PlanFeature = { title: string; detail: string };

/** What the page should DO when an action is pressed. The data stays pure;
 *  the page owns the handlers, the same way the dialogs did. */
export type PlanActionIntent =
  | "upgrade"
  | "cancel"
  | "contact"
  | "demo"
  /** Into the product, at the tier's Overview. The card the org is already
   *  on has no plan action to offer, so its slot carries the way forward. */
  | "overview";

export type PlanAction = {
  label: string;
  /**
   * `ghost` is FENCED to a paired secondary: a control sitting directly
   * under a bordered sibling in the same slot, where the pair reads as
   * primary-then-quieter. Its only use is "Book a demo" under "Contact
   * support". A ghost on a LONE button was tried and rejected (2026-09-22):
   * with nothing to anchor it, an unbordered control floats in an otherwise
   * empty slot and stops reading as a button. A second `ghost` needs the
   * same justification, in writing, here.
   */
  variant: "default" | "outline" | "ghost" | "promo";
  intent?: PlanActionIntent;
  /** Leading glyph, and the ONLY one left on a plan-card button. The cards
   *  already carry a `CircleCheck` per feature row, so a glyph on every
   *  control read as decoration; a glyph now means "this is the promoted
   *  action", at most one per view. `sparkles` is the animated upgrade mark
   *  used site-wide. */
  icon?: "sparkles";
  ariaLabel?: string;
};

export type PlanCardData = {
  id: PlanId;
  /** Header-slot pill. It says one of two things: "Most popular" where the
   *  view still has an upsell to make, or "Current plan" where it names the
   *  rung the org is already on. Per view:
   *
   *    Free-org / Default  "Current plan" on Free + "Most popular" on Pro
   *    Pro-org             "Current plan" on Pro
   *    Enterprise-org      "Current plan" on Enterprise
   *
   *  The tone is the CARD's tier, so the pill reads as part of the surface
   *  under it: `pro` on the Pro rung, `enterprise` on the Enterprise rung,
   *  and `neutral` on Free, which has no tier colour of its own and sits on
   *  a plain card. A card with no badge keeps the header height anyway
   *  (`min-h-7`). */
  badge?: { label: string; tone: "neutral" | "pro" | "enterprise" };
  title: string;
  price: string;
  /** Unit beside the price, rendered only when present. Free and Pro name
   *  one; Enterprise deliberately does not, because "Custom" has no unit to
   *  qualify. Its seat basis lives in the caption instead. */
  priceSuffix?: string;
  benefitsLabel: string;
  features: PlanFeature[];
  /** Primary first, optional secondary second. Never empty: every rung
   *  offers the org at least one way forward, so no card shows a dead slot. */
  actions: PlanAction[];
  ctaCaption: string;
  /** The FOCAL card: tier tint, tier border and tier icon ink, exactly one
   *  per view. It is the Pro rung on the Free-org and Pro-org views (the
   *  upsell, and Pro keeps it even when Pro is the org's own plan), and the
   *  Enterprise rung on the Enterprise-org view, which has no rung above it
   *  and so marks the plan it is on. The Free card is never focal. */
  promoted?: boolean;
};

/* ─── Feature lists ──────────────────────────────────────────────────────
 * Identical in both dialogs, so they are declared once. */

const FREE_FEATURES: PlanFeature[] = [
  {
    title: "Multi-provider routing",
    detail: "One base URL for OpenAI, Anthropic, and more",
  },
  {
    title: "Immutable audit trail",
    detail:
      "Every request fingerprinted to Constellation Digital Evidence (30 day retention)",
  },
  {
    title: "Activity & request logs",
    detail: "Cost, tokens, and latency across the workspace",
  },
  {
    title: "Conversation threading",
    detail: "Follow agent runs and chats end-to-end.",
  },
];

const PRO_FEATURES: PlanFeature[] = [
  {
    title: "Prompt injection scanning",
    detail: "Block or flag before tokens reach the model.",
  },
  {
    title: "PII, PHI & credential redaction",
    detail: "Redacted before the response returns.",
  },
  {
    title: "Spend, token & rate limits",
    detail: "Caps at the org, project, or key level.",
  },
  {
    title: "Token savings",
    detail:
      "20%+ tokens saved per request via lossless compression and cache injection.",
  },
];

/** Enterprise-only capabilities, the user's copy verbatim (2026-09-24). */
const ENTERPRISE_FEATURES: PlanFeature[] = [
  {
    title: "Private cloud deployment",
    detail: "Gate running inside your own cloud, with data isolation",
  },
  {
    title: "Custom limits and retention",
    detail:
      "Request volume, seats, rate limits, and retention set to your policy",
  },
  {
    title: "Security review and contracting",
    detail:
      "We complete your security questionnaire, sign a DPA, and invoice on your terms",
  },
  {
    title: "Premium support",
    detail: "A named contact, guided onboarding, and a committed response time",
  },
];

/* ─── Shared strings ─────────────────────────────────────────────────── */

/** The slot on the card the org is already on. That card has no plan action
 *  to offer, so the slot used to carry a dead "Your current plan" label and
 *  then a "Back to Billing" link that only duplicated the page's own
 *  BackLink. It now sends the user INTO the product instead, the v0 "Start
 *  Building" pattern. Outline on every view: naming the current plan is the
 *  badge's job, not a button's. */
const CURRENT_PLAN_ACTION: PlanAction = {
  label: "Go to Overview",
  variant: "outline",
  intent: "overview",
};
/** Upsell copy, not the plan's name: the Pro rung is the plan most orgs
 *  land on, which is the whole point of saying so. Only shown to an org
 *  that could still move there. */
const PRO_BADGE = { label: "Most popular", tone: "pro" } as const;
/** Names the rung the org is already on. The tone is the CARD's tier, not a
 *  neutral grey, so the pill belongs to the surface it sits on: it is always
 *  worn by the focal card, which is tinted in that same family. */
const CURRENT_PLAN_BADGE = (tone: "pro" | "enterprise") => ({
  label: "Current plan",
  tone,
});
const FREE_CAPTION = "Free to use, forever";
/** Both downgrade paths on the Enterprise-org view read alike, because
 *  neither is self-serve: the entitlement is granted and revoked by Support
 *  in the admin portal (org/team PRD, "no self-upgrade"). Lifted from the
 *  Pro rung's caption on that same view rather than written fresh. */
const SUPPORT_ROUTE_CAPTION = "Available through Support.";
const PRO_CAPTION = "$20/user/month after your 14-day trial ends";
/** Mirrors `src/data/billing-enterprise.ts`: Enterprise is a Support-granted
 *  entitlement, so no rung of the ladder is self-serve for that org. Scoped
 *  to this page; "Constellation Support" stays the wording everywhere else. */
const ENTERPRISE_CAPTION = "Plan changes go through Support.";
/** Same two facts on one line for an org that is not on Enterprise yet: the
 *  seat basis rides in the caption because "Custom" has no number for a
 *  "per seat" unit to qualify, and Support owns the change either way. An
 *  Enterprise org drops the seat half, its Billing page already shows the
 *  seat charge. */
const ENTERPRISE_PITCH_CAPTION = "Billed per seat, changes go through Support.";

/** The SUPPORT path: an existing customer routing to Support, not a
 *  prospect reaching sales (PRD scope, "Support routing in place of
 *  self-serve upgrade"). Its only home is the Enterprise-org view, on the
 *  Free and Pro rungs, which that org cannot act on directly. The sales
 *  twin is `CONTACT_ACTIONS` below and is labelled "Contact us". The dialog
 *  takes its title from whichever of the two opened it. */
const SUPPORT_ACTION = (): PlanAction => ({
  label: contactFlowTitle("enterprise", "contact"),
  variant: "outline",
  intent: "contact",
});

/** The one filled control on the whole page is "Upgrade to Pro", on the
 *  Free-org and Default views; the Pro-org and Enterprise-org views carry
 *  none. The contact primary is `outline` on every view: with "Book a demo"
 *  ghost beneath it the outline already carries the hierarchy, and a filled
 *  Enterprise CTA made that rung shout at a Pro customer who did not ask
 *  for it. "Book a demo" is the quieter twin directly beneath it:
 *  `ghost`, which is legible here precisely because the bordered sibling
 *  above anchors it (see the fence on `PlanAction.variant`), and label-only,
 *  the site having no precedent for a glyph on a scheduling action.
 *  Fill is weight, not focus: the Enterprise card stays untinted and
 *  unbadged on both of those views. */
const CONTACT_ACTIONS: PlanAction[] = [
  // The SALES path, and the ticket's own wording: a Free or Pro org looking
  // at Enterprise is a prospect, not a customer with a support case.
  {
    label: contactFlowTitle("pro", "contact"),
    variant: "outline",
    intent: "contact",
  },
  { label: contactFlowTitle("pro", "demo"), variant: "ghost", intent: "demo" },
];

/* ─── The three cards, per viewing org ───────────────────────────────── */

const freeCard = (tier: PlanTier): PlanCardData => {
  if (tier === "free") {
    return {
      id: "free",
      // Neutral, not a tier tone: Free has no tier colour of its own, and
      // the card it sits on is plain. It shares the view with the pro-toned
      // "Most popular" on the Pro rung, which is the one case where a view
      // carries two badges: one naming the current plan, one selling the
      // next.
      badge: { label: "Current plan", tone: "neutral" },
      title: "Free plan",
      price: "$0",
      // Explicit, not inherited from a render-time fallback: the card renders
      // a unit only when its data names one.
      priceSuffix: "per month",
      benefitsLabel: "Included in your Free plan:",
      features: FREE_FEATURES,
      actions: [CURRENT_PLAN_ACTION],
      ctaCaption: FREE_CAPTION,
    };
  }
  return {
    id: "free",
    title: "Free plan",
    price: "$0",
    priceSuffix: "per month",
    benefitsLabel: "Included with the Free plan:",
    features: FREE_FEATURES,
    // An Enterprise org cannot drop to Free from here: Support owns every
    // plan change, so that rung routes to Support instead of acting.
    actions:
      tier === "pro"
        ? [
            {
              // The ticket's wording, which is why this one string is not
              // the dialog's "Cancel Pro plan" it was lifted from, and it
              // names its TARGET the way every other button here does
              // ("Upgrade to Pro", "Go to Overview"): a bare "Downgrade
              // plan" read as an action against the Free card, not a move
              // to it.
              label: "Downgrade to Free",
              variant: "outline",
              intent: "cancel",
              ariaLabel: "Downgrade to the Free plan",
            },
          ]
        : [SUPPORT_ACTION()],
    // The Free-org, Default and Pro-org views keep "Free to use, forever";
    // an Enterprise org cannot take that route itself, so its Free rung
    // reads like its Pro rung.
    ctaCaption: tier === "pro" ? FREE_CAPTION : SUPPORT_ROUTE_CAPTION,
  };
};

const proCard = (tier: PlanTier): PlanCardData => {
  if (tier === "free") {
    return {
      id: "pro",
      promoted: true,
      badge: PRO_BADGE,
      title: "Pro plan",
      price: "$20",
      priceSuffix: "per user / month",
      benefitsLabel: "What you'll get going Pro:",
      features: PRO_FEATURES,
      actions: [
        {
          label: "Upgrade to Pro",
          variant: "promo",
          intent: "upgrade",
          icon: "sparkles",
        },
      ],
      ctaCaption: PRO_CAPTION,
    };
  }
  if (tier === "pro") {
    return {
      id: "pro",
      // The tint marks the RUNG and stays; the badge switches from selling
      // Pro to naming it, because this org is already on it.
      promoted: true,
      badge: CURRENT_PLAN_BADGE("pro"),
      title: "Pro plan",
      price: "$20",
      priceSuffix: "per user / month",
      benefitsLabel: "What you're getting with Pro plan:",
      features: PRO_FEATURES,
      actions: [CURRENT_PLAN_ACTION],
      ctaCaption: PRO_CAPTION,
    };
  }
  return {
    id: "pro",
    title: "Pro plan",
    price: "$20",
    priceSuffix: "per user / month",
    // Third-person twin of "Included with the Free plan:". An Enterprise
    // org is not on Pro, so neither dialog's second-person label fits.
    benefitsLabel: "Included with the Pro plan:",
    features: PRO_FEATURES,
    actions: [SUPPORT_ACTION()],
    // NOT the trial caption: an Enterprise org has no trial to end, and the
    // price line above already carries the rate.
    ctaCaption: SUPPORT_ROUTE_CAPTION,
  };
};

const enterpriseCard = (tier: PlanTier): PlanCardData => {
  if (tier === "enterprise") {
    return {
      id: "enterprise",
      // The focal card on this view: an Enterprise org has no rung above it,
      // so the tint marks what it is ON rather than what it could move to.
      promoted: true,
      badge: CURRENT_PLAN_BADGE("enterprise"),
      title: "Enterprise plan",
      price: "Custom",
      benefitsLabel: "Everything in Pro, plus what we scope with you:",
      features: ENTERPRISE_FEATURES,
      // The same control every current plan carries on every view, so "this
      // is the one you are on" reads identically across the ladder. Outline
      // like every other control here: this view has no upsell to sell, and
      // the violet tint plus the "Current plan" badge already mark the card,
      // so a filled button would be a third signal saying the same thing.
      actions: [CURRENT_PLAN_ACTION],
      ctaCaption: ENTERPRISE_CAPTION,
    };
  }
  return {
    id: "enterprise",
    title: "Enterprise plan",
    price: "Custom",
    benefitsLabel: "Everything in Pro, plus what we scope with you:",
    features: ENTERPRISE_FEATURES,
    actions: CONTACT_ACTIONS,
    // Seat-based Stripe billing, H2 PRD §3 / §10.
    ctaCaption: ENTERPRISE_PITCH_CAPTION,
  };
};

/**
 * The ladder for one org, always low to high. Exactly one card per view is
 * focal: the PRO rung on the Free-org and Pro-org views, the ENTERPRISE rung
 * on the Enterprise-org view, which has no plan above it to point at.
 */
export const plansFor = (tier: PlanTier): PlanCardData[] => [
  freeCard(tier),
  proCard(tier),
  enterpriseCard(tier),
];
