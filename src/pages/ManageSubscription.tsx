import { ArrowLeft, CircleCheck, Headset, OctagonAlert } from "lucide-react";
import { useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SparklesIcon } from "@/components/ui/sparkles";
import { Textarea } from "@/components/ui/textarea";
import {
  type PlanAction,
  type PlanCardData,
  type PlanId,
  type PlanTier,
  plansFor,
} from "@/data/plans";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { tierSuffixOf, withTierOf } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { CancelPlanDialog } from "@/pages/cancel-plan-dialog";

/* ─────────────────────────────────────────────────────────────────────────
 * Manage subscription: the plan ladder, as a nested PAGE
 * (routes: /billing/plans · /billing-free/plans · /billing-default/plans ·
 * /billing-enterprise/plans, sidebar: "Billing")
 *
 * Replaces the plan-comparison DIALOG that used to open off each Billing
 * page's "Manage subscription" button (2026-09-22). The card recipe below
 * is that dialog's, verbatim (same surfaces, same voices, same wash) with
 * three changes the page form requires:
 *
 *   1. THREE rungs, not two: Enterprise joins Free and Pro.
 *   2. Exactly ONE card is promoted: the next tier UP from the org's own
 *      plan. Everything else is plain (`border-border bg-card`, no badge,
 *      outline / ghost controls, muted icons), so the page answers "what
 *      would I move to" at a glance instead of shouting at every rung. An
 *      Enterprise org is already at the top, so it promotes nothing.
 *   3. The CTA block sits ABOVE the feature list and the four slots align
 *      across all three cards through CSS subgrid, so the buttons land on
 *      one line whatever the copy length.
 *
 * The tier comes from the pathname (`tierSuffixOf`), never from a prop:
 * `-default` is the Free plan, `-enterprise` is Enterprise, bare is Pro.
 * That keeps the four routes one component with no twin to drift.
 * ───────────────────────────────────────────────────────────────────────── */

const TIER_BY_SUFFIX: Record<ReturnType<typeof tierSuffixOf>, PlanTier> = {
  "": "pro",
  "-free": "free",
  // The Default workspace is on the Free plan.
  "-default": "free",
  "-enterprise": "enterprise",
};

/* ─── Contact / demo dialog preview states ───────────────────────────── */

/** The embed's four states. `?form=` is a one-way preview param, read and
 *  never written back, the same contract `?state=` has on Billing. */
type EmbedState = "ready" | "loading" | "error" | "done";

const parseEmbedState = (raw: string | null): EmbedState =>
  raw === "loading" || raw === "error" || raw === "done" ? raw : "ready";

type ContactKind = "contact" | "demo";

const DIALOG_TITLE: Record<ContactKind, string> = {
  contact: "Contact support",
  demo: "Book a demo",
};

const SUBMIT_LABEL: Record<ContactKind, string> = {
  contact: "Send",
  demo: "Book",
};

const PROMPT_LABEL: Record<ContactKind, string> = {
  contact: "How can we help?",
  demo: "What would you like to see?",
};

const CONFIRMATION: Record<ContactKind, string> = {
  // Draft copy, ticket supplies none; review.
  contact:
    "Thanks, we’ve got your details. Someone from Constellation will reach out within one business day.",
  // Draft copy, ticket supplies none; review.
  demo: "Your demo is booked. A calendar invite is on its way to your inbox.",
};

/* ─── Page ───────────────────────────────────────────────────────────── */

export function ManageSubscription() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [searchParams] = useSearchParams();
  const embedState = parseEmbedState(searchParams.get("form"));

  const tier = TIER_BY_SUFFIX[tierSuffixOf(pathname)];
  const plans = plansFor(tier);
  // One computation for the BackLink, the "Back to Billing" slot on the
  // org's own rung, and the post-upgrade landing.
  const billingHref = withTierOf(pathname, "/billing");

  // Cancelling Pro is the one destructive move on this page, so it keeps the
  // shared confirm dialog rather than acting on the press.
  const [cancelOpen, setCancelOpen] = useState(false);
  const [contactKind, setContactKind] = useState<ContactKind | null>(null);
  // Base UI restores focus to the previously focused element on close; the
  // ref makes that explicit, so Escape lands back on the exact button that
  // opened the dialog even if the ladder re-renders while it is open.
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const handleAction = (
    action: PlanAction,
    button: HTMLButtonElement | null
  ) => {
    if (action.intent === "cancel") {
      setCancelOpen(true);
      return;
    }
    if (action.intent === "contact") {
      // Build: fires contact_support_plans distinct from the pricing-page event; HubSpot contact + booking association per ticket.
      openerRef.current = button;
      setContactKind("contact");
      return;
    }
    if (action.intent === "demo") {
      // Build: fires book_a_demo_plans distinct from the pricing-page event; HubSpot contact + booking association per ticket.
      openerRef.current = button;
      setContactKind("demo");
      return;
    }
    if (action.intent === "upgrade") {
      // Checkout is out of scope for the mock, the same way the Billing
      // page's own upgrade path is: land the user back on Billing.
      navigate(billingHref);
    }
  };

  return (
    <DashboardChrome
      activeNavId="billing"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Same column contract as Billing: fluid, then capped by a CONTAINER
          query so the Ask AI panel narrows it without narrowing the window. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <BackLink href={billingHref} label="Billing" />

        <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
          <PageTitle>Manage subscription</PageTitle>
          <p className="type-copy-18 m-0 text-pretty text-muted-foreground">
            Choose the plan that fits your team.
          </p>
        </div>

        {/* FIVE explicit rows, and each card spans all five as a subgrid:
            header, price, rule, body, caption. Only the body is `1fr`, so it
            absorbs every length difference; the header, price, first rule
            and caption align across the ladder because they are shared rows.

            The buttons are NOT a shared row. They live inside the body and
            are pushed to its bottom edge (`mt-auto`), so each card's action
            band is sized by ITS OWN buttons: the last button of all three
            cards lands on one baseline and no card carries dead space under
            a single button. There is exactly ONE rule on the card, above the
            benefits label, and it is a shared row. Slot gap is the parent's
            `gap-4`; a subgrid inherits it.

            Three columns only from `@4xl` (56rem / 896px inline-size):
            896 - 2 x 16px gap = 864 / 3 = 288px per card, which is 256px of
            content inside the 16px padding, enough for the price line and
            the longest feature title to sit on one or two lines. Below that
            it is ONE column in ladder order, never two: a two-up step would
            orphan the third rung and break the Free → Pro → Enterprise
            reading order. At 200% zoom the column halves in CSS pixels and
            lands in the same single-column case. */}
        <div className="grid @4xl:grid-cols-3 grid-cols-1 grid-rows-[auto_auto_auto_1fr_auto] gap-4">
          {plans.map((plan) => (
            <PlanCard
              billingHref={billingHref}
              key={plan.id}
              onAction={handleAction}
              plan={plan}
            />
          ))}
        </div>
      </div>

      <CancelPlanDialog onOpenChange={setCancelOpen} open={cancelOpen} />
      <ContactDialog
        embedState={embedState}
        finalFocus={openerRef}
        kind={contactKind}
        onOpenChange={(next) => {
          if (!next) {
            setContactKind(null);
          }
        }}
      />
    </DashboardChrome>
  );
}

/* ─── Plan card ──────────────────────────────────────────────────────── */

/** The focal card wears ITS OWN tier's ink: Pro on the Free-org and Pro-org
 *  views, Enterprise on the Enterprise-org view. Both read the tier family
 *  (design.md §2 "Plan tier colours"); neither is a raw ramp step. The Free
 *  rung is never focal, so it has no entry here. */
const FOCAL_SURFACE: Partial<Record<PlanId, string>> = {
  pro: "border-tier-pro-border bg-[image:var(--tier-pro-surface-wash)]",
  enterprise:
    "border-tier-enterprise-border bg-[image:var(--tier-enterprise-surface-wash)]",
};

const FOCAL_ICON: Partial<Record<PlanId, string>> = {
  pro: "text-tier-pro",
  enterprise: "text-tier-enterprise",
};

function PlanCard({
  plan,
  billingHref,
  onAction,
}: {
  plan: PlanCardData;
  billingHref: string;
  onAction: (action: PlanAction, button: HTMLButtonElement | null) => void;
}) {
  const titleId = `plan-card-${plan.id}`;
  const promoted = plan.promoted === true;
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "row-span-5 grid grid-rows-subgrid rounded-md border p-4",
        promoted ? FOCAL_SURFACE[plan.id] : "border-border bg-card"
      )}
      // The one hook the ladder is addressed by (tests scope to it). There is
      // no mount animation: a dashboard surface does not animate on load.
      data-plan-card
    >
      {/* `min-h-7` (28px) reserves the header slot: it is the `type-heading-20`
          line box and it clears the 20px Badge, so a card without a badge
          keeps the same header height as the promoted one. */}
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <h2 className="type-heading-20 m-0 text-foreground" id={titleId}>
          {plan.title}
        </h2>
        {plan.badge ? (
          <Badge className="shrink-0" variant={plan.badge.tone}>
            {plan.badge.label}
          </Badge>
        ) : null}
      </div>

      {/* Not a heading: the card's heading is its title above. The unit is
          rendered only when the plan names one, so Enterprise reads as a bare
          "Custom" with nothing trailing it. */}
      <p className="type-heading-32 m-0 text-foreground tabular-nums tracking-tight">
        {plan.price}
        {plan.priceSuffix ? (
          <span className="type-copy-18 text-muted-foreground">
            {" "}
            {plan.priceSuffix}
          </span>
        ) : null}
      </p>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="type-label-12 m-0 text-foreground">
          {plan.benefitsLabel}
        </p>
        {/* `gap-4` BETWEEN rows, nothing between a title and its own detail
            line: the pair is one unit, and at `gap-3` the detail sat about
            as close to the next row's title as to its own. The `gap-3`
            inside each `<li>` is the icon-to-text gap and is unrelated. */}
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {plan.features.map(({ title, detail }) => (
            <li className="flex items-start gap-3" key={title}>
              {/* One glyph for every row (site precedent: `copy-button.tsx`,
                  `ask-ai-message.tsx`). A per-feature icon made the column
                  read as a legend of unrelated symbols; a single check reads
                  as "included", which is what the list is saying. */}
              <CircleCheck
                aria-hidden
                className={cn(
                  "mt-1 size-4 shrink-0",
                  promoted ? FOCAL_ICON[plan.id] : "text-muted-foreground"
                )}
                strokeWidth={1.75}
              />
              {/* `gap-1` (4px) between the title and its own detail line.
                  Row-to-row is `gap-4` above, so the pair still groups four
                  times more tightly than it separates. */}
              <div className="flex min-w-0 flex-col gap-1">
                <span className="type-copy-14 text-foreground">{title}</span>
                <span className="type-copy-12 text-pretty text-muted-foreground">
                  {detail}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* `mt-auto` hands every pixel of slack in this `1fr` row to the
            feature list above and pins the buttons to the row's bottom edge,
            so the LAST button of each card shares a baseline whether the
            card offers one control or two. `pt-6` (24px) opens the band off
            the list; it compounds with the parent's `gap-4`, so the tightest
            card still clears 40px. */}
        <div className="mt-auto flex flex-col gap-2 pt-6">
          {plan.actions.map((action) => (
            <PlanActionButton
              action={action}
              billingHref={billingHref}
              key={action.label}
              onAction={onAction}
            />
          ))}
        </div>
      </div>

      <p className="type-copy-12 m-0 text-pretty text-center text-muted-foreground">
        {plan.ctaCaption}
      </p>
    </article>
  );
}

/** `variant="outline"` ships an opaque `bg-card`, which is correct on the
 *  page background but reads as a darker patch when it sits on the featured
 *  Pro card's tier wash. On this page an outline control is a true outline:
 *  the surface behind it shows through. `bg-transparent` is the only thing
 *  overridden, so the border, the `hover:bg-muted` fill and the focus ring
 *  still come from the primitive. Call-site scoped on purpose (user
 *  direction 2026-09-22): the primitive is unchanged for the rest of the
 *  app, where an outline button sits on `--background` and wants its fill.
 *  If a second surface ever needs this, it becomes a Button variant. */
const OUTLINE_ON_TINT = "bg-transparent";

function PlanActionButton({
  action,
  billingHref,
  onAction,
}: {
  action: PlanAction;
  billingHref: string;
  onAction: (action: PlanAction, button: HTMLButtonElement | null) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const surface = action.variant === "outline" ? OUTLINE_ON_TINT : undefined;

  // The org's own rung links back to Billing, so it renders a real anchor
  // (cmd-click, middle-click, "Copy link address") rather than a button.
  // `ArrowLeft`, not the `ChevronLeft` BackLink uses: the chevron is the
  // breadcrumb's glyph and the site's only button uses of it are icon-only
  // (Pagination previous, Calendar nav). The Arrow family is what a LABELLED
  // button takes here, mirroring `ArrowRight data-icon="inline-end"` on
  // SignIn / SignUp / onboarding.
  if (action.intent === "billing") {
    return (
      <Button
        className={cn("w-full", surface)}
        nativeButton={false}
        render={<Link to={billingHref} />}
        size="default"
        variant={action.variant}
      >
        <ArrowLeft
          aria-hidden
          data-icon="inline-start"
          size={16}
          strokeWidth={1.75}
        />
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      aria-label={action.ariaLabel}
      className={cn("w-full", surface)}
      onClick={() => onAction(action, ref.current)}
      ref={ref}
      size="default"
      type="button"
      variant={action.variant}
    >
      {action.icon === "sparkles" ? (
        <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
      ) : null}
      {action.icon === "headset" ? (
        <Headset
          aria-hidden
          data-icon="inline-start"
          size={16}
          strokeWidth={1.75}
        />
      ) : null}
      {action.label}
    </Button>
  );
}

/* ─── Contact support / Book a demo ──────────────────────────────────────
 * ONE dialog serves both actions; `kind` picks the title, the prompt and
 * the submit verb. The bordered frame inside is a PLACEHOLDER for the
 * embedded HubSpot form (contact) and scheduler (demo) the build will drop
 * in. It renders no network call and no analytics. Its four states are
 * previewable through `?form=loading|error|done` so the states can be
 * reviewed from a link, exactly the way `?state=` works on Billing.
 * ───────────────────────────────────────────────────────────────────── */

function ContactDialog({
  kind,
  embedState,
  onOpenChange,
  finalFocus,
}: {
  kind: ContactKind | null;
  embedState: EmbedState;
  onOpenChange: (next: boolean) => void;
  finalFocus: React.RefObject<HTMLButtonElement | null>;
}) {
  // Submitting the mock form moves the frame to its confirmation without
  // touching the URL: the preview param stays whatever was pasted.
  const [submitted, setSubmitted] = useState(false);
  const open = kind !== null;
  const state: EmbedState = submitted ? "done" : embedState;
  // The dialog keeps rendering through its 120ms close animation, after
  // which `kind` is already null, so hold the last kind for that frame.
  const resolvedKind = kind ?? "contact";

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          setSubmitted(false);
        }
        onOpenChange(next);
      }}
      open={open}
    >
      {/* 560px cap. The `!` is needed because the primitive's own
          `data-[size=default]:sm:max-w-sm` would otherwise win; `w-[calc(…)]`
          restores the 16px gutters the important cap takes away on a phone. */}
      <DialogContent
        className="!max-w-[560px] w-[calc(100%-2rem)] gap-4"
        finalFocus={finalFocus}
      >
        <DialogHeader>
          <DialogTitle className="type-heading-20 text-foreground">
            {DIALOG_TITLE[resolvedKind]}
          </DialogTitle>
        </DialogHeader>

        <EmbedFrame kind={resolvedKind} state={state} />

        <DialogFooter>
          {state === "done" ? (
            <DialogClose render={<Button size="sm" type="button" />}>
              Done
            </DialogClose>
          ) : (
            <>
              <DialogClose
                render={<Button size="sm" type="button" variant="ghost" />}
              >
                Cancel
              </DialogClose>
              <Button
                disabled={state !== "ready"}
                onClick={() => setSubmitted(true)}
                size="sm"
                type="button"
              >
                {SUBMIT_LABEL[resolvedKind]}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The third-party embed's footprint. `aria-busy` is on the frame rather
 *  than the dialog: the rest of the surface is ready, only this region is
 *  waiting. `rounded-md` (8px) steps the radius down one rung from the
 *  dialog shell's `rounded-xl` (16px), per the concentric ladder. */
function EmbedFrame({ kind, state }: { kind: ContactKind; state: EmbedState }) {
  const nameId = `${kind}-name`;
  const emailId = `${kind}-email`;
  const promptId = `${kind}-prompt`;

  return (
    <div
      aria-busy={state === "loading"}
      className="rounded-md border border-border p-4"
    >
      {state === "loading" ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {state === "error" ? (
        <div className="flex items-start gap-2" role="alert">
          <span aria-hidden className="flex h-5 shrink-0 items-center">
            <OctagonAlert
              aria-hidden
              className="size-4 text-danger-800 dark:text-danger-300"
              strokeWidth={1.75}
            />
          </span>
          <div className="flex min-w-0 flex-col gap-4">
            <p className="type-copy-14 m-0 text-pretty text-danger-800 dark:text-danger-300">
              The form didn&rsquo;t load. Try again or email support.
            </p>
            {/* No-op: there is nothing to retry in the mock. */}
            <Button
              className="self-start"
              size="sm"
              type="button"
              variant="outline"
            >
              Try again
            </Button>
          </div>
        </div>
      ) : null}

      {state === "done" ? (
        <p
          className="type-copy-14 m-0 text-pretty text-foreground"
          role="status"
        >
          {CONFIRMATION[kind]}
        </p>
      ) : null}

      {state === "ready" ? (
        <FieldGroup>
          <Field>
            <FieldLabel className="text-muted-foreground" htmlFor={nameId}>
              Name
            </FieldLabel>
            <Input
              autoComplete="name"
              id={nameId}
              name="name"
              placeholder="Ada Lovelace"
              type="text"
            />
          </Field>
          <Field>
            <FieldLabel className="text-muted-foreground" htmlFor={emailId}>
              Work email
            </FieldLabel>
            <Input
              autoComplete="email"
              id={emailId}
              name="email"
              placeholder="you@company.com"
              spellCheck={false}
              type="email"
            />
          </Field>
          <Field>
            <FieldLabel className="text-muted-foreground" htmlFor={promptId}>
              {PROMPT_LABEL[kind]}
            </FieldLabel>
            <Textarea id={promptId} name="message" rows={3} />
          </Field>
        </FieldGroup>
      ) : null}
    </div>
  );
}
