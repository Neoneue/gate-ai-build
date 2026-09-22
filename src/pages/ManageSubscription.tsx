import { CircleCheck, OctagonAlert } from "lucide-react";
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
import { Button, type ButtonVariant } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SparklesIcon } from "@/components/ui/sparkles";
import { Textarea } from "@/components/ui/textarea";
import {
  type ContactKind,
  type PlanAction,
  type PlanActionIntent,
  type PlanCardData,
  type PlanId,
  plansFor,
  planTierOf,
} from "@/data/plans";
import { signedInMember, WORKSPACE_NAME } from "@/data/team-members";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { withTierOf } from "@/lib/plan";
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
 * The tier comes from the pathname (`planTierOf`), never from a prop:
 * `-default` is the Free plan, `-enterprise` is Enterprise, bare is Pro.
 * That keeps the four routes one component with no twin to drift.
 *
 * Everything that NAVIGATES renders as a real anchor through one
 * `hrefByIntent` map ("Go to Overview", "Upgrade to Pro"). The contact and
 * demo flows open a surface IN PLACE, so they are buttons onto the dialog at
 * the bottom of this file: a short form is not a detail surface. A nested
 * page conversion was tried on 2026-09-22 and reverted the same day.
 * ───────────────────────────────────────────────────────────────────────── */

/* ─── Contact / demo dialog preview states ───────────────────────────── */

/** The embed's four states. `?form=` is a one-way preview param, read on
 *  every render and never written back, the same contract `?state=` has on
 *  BillingEnterprise. */
type EmbedState = "ready" | "loading" | "error" | "done";

const parseEmbedState = (raw: string | null): EmbedState =>
  raw === "loading" || raw === "error" || raw === "done" ? raw : "ready";

/** Only the contact flow has a submit of OURS. The demo's confirm control
 *  lives inside the vendor scheduler and is not ours to label, so that flow
 *  shows no submit at all. */
const SUBMIT_LABEL: Record<ContactKind, string | null> = {
  contact: "Submit form",
  demo: null,
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
  const plans = plansFor(planTierOf(pathname));

  /**
   * Where each navigating action goes, in this tier. `cancel` is absent on
   * purpose: it is the one action that acts rather than navigates, so it
   * falls through to a real `<button>`.
   *
   * Build: the contact and demo links fire contact_plans and
   * book_a_demo_plans, tagged with the label ("Contact us" sales vs
   * "Contact support"), distinct from the pricing-page event; HubSpot
   * contact + booking association per ticket.
   */
  const hrefByIntent: Partial<Record<PlanActionIntent, string>> = {
    overview: withTierOf(pathname, "/overview"),
    // Checkout is out of scope for the mock, the same way the Billing page's
    // own upgrade path is: land the user back on Billing.
    upgrade: withTierOf(pathname, "/billing"),
  };

  const [searchParams] = useSearchParams();
  const embedState = parseEmbedState(searchParams.get("form"));

  // Cancelling Pro is the one destructive move on this page, so it keeps the
  // shared confirm dialog rather than acting on the press.
  const [cancelOpen, setCancelOpen] = useState(false);
  // The dialog carries the LABEL of the button that opened it. That label is
  // `contactFlowTitle(tier, flow)`, so the heading and the control say the
  // same string by construction rather than by wiring.
  const [contact, setContact] = useState<{
    kind: ContactKind;
    title: string;
  } | null>(null);
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
    // Build: fires contact_plans / book_a_demo_plans, tagged with the label
    // ("Contact us" sales vs "Contact support"), distinct from the
    // pricing-page event; HubSpot contact + booking association per ticket.
    openerRef.current = button;
    setContact({
      kind: action.intent === "demo" ? "demo" : "contact",
      title: action.label,
    });
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
        <BackLink href={withTierOf(pathname, "/billing")} label="Billing" />

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
              hrefByIntent={hrefByIntent}
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
        onOpenChange={(next) => {
          if (!next) {
            setContact(null);
          }
        }}
        opened={contact}
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
  hrefByIntent,
  onAction,
}: {
  plan: PlanCardData;
  hrefByIntent: Partial<Record<PlanActionIntent, string>>;
  onAction: (action: PlanAction, button: HTMLButtonElement | null) => void;
}) {
  const titleId = `plan-card-${plan.id}`;
  const promoted = plan.promoted === true;
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        // Card / surface tier (design.md §5.1): `border-border` plus
        // `shadow-xs`, the same rung the `Card` primitive carries. These
        // cards are a hand-rolled grid item rather than a `<Card>`, because
        // they subgrid across the ladder, so the tier's elevation has to be
        // named here rather than inherited.
        "row-span-5 grid grid-rows-subgrid rounded-md border p-4 shadow-xs",
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
              hrefByIntent={hrefByIntent}
              key={action.label}
              onAction={onAction}
              variant={liftVariant(action.variant, plan)}
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

/**
 * Plan-card buttons use the Button primitive's LIFT family rather than
 * `outline` / `ghost`: those two hover to an opaque `bg-muted` that covers a
 * tinted card instead of lifting it. The family is transparent-filled and
 * hovers to `bg-lift-8`, so every button on the page behaves identically on
 * hover and differs only in edge and ink.
 *
 * Which edge is decided HERE rather than in the data, because it depends on
 * the card the button sits on: the focal card's button wears that card's
 * tier, everything else is neutral. The data keeps saying what a control
 * MEANS (`outline` for a normal action, `ghost` for the paired secondary)
 * and this maps meaning to treatment in one place.
 */
const liftVariant = (
  variant: PlanAction["variant"],
  plan: PlanCardData
): ButtonVariant => {
  if (variant === "ghost") {
    return "lift-ghost";
  }
  if (variant !== "outline") {
    // `promo` and `default` are filled; they have no tint to protect.
    return variant;
  }
  if (plan.promoted !== true) {
    return "lift";
  }
  return plan.id === "enterprise" ? "lift-enterprise" : "lift-pro";
};

function PlanActionButton({
  action,
  variant,
  hrefByIntent,
  onAction,
}: {
  action: PlanAction;
  variant: ButtonVariant;
  hrefByIntent: Partial<Record<PlanActionIntent, string>>;
  onAction: (action: PlanAction, button: HTMLButtonElement | null) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const href = action.intent ? hrefByIntent[action.intent] : undefined;

  // An action that NAVIGATES renders a real anchor, so cmd-click,
  // middle-click and "Copy link address" work. The two that open a surface
  // in place, the contact dialog and the downgrade confirm, stay buttons.
  if (href !== undefined) {
    return (
      <Button
        aria-label={action.ariaLabel}
        className="w-full"
        nativeButton={false}
        render={<Link to={href} />}
        size="default"
        variant={variant}
      >
        {/* The one glyph left on a plan-card button: it marks the promoted
            action, so at most one per view. */}
        {action.icon === "sparkles" ? (
          <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
        ) : null}
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      aria-label={action.ariaLabel}
      className="w-full"
      onClick={() => onAction(action, ref.current)}
      ref={ref}
      size="default"
      type="button"
      variant={variant}
    >
      {action.label}
    </Button>
  );
}

/* ─── Contact / Book a demo dialog ───────────────────────────────────────
 * ONE dialog serves both actions. It carries the LABEL of the button that
 * opened it, and that label came from `contactFlowTitle(tier, flow)` in
 * `data/plans.ts`, so the heading is by construction the same string the
 * control says: "Contact us" on the Free, Default and Pro views, "Contact
 * support" on the Enterprise view, "Book a demo" from either. There is no
 * second title map to drift.
 *
 * TWO bodies, and the BORDER is the difference. The contact body is OUR own
 * form on our own dialog, so it carries no inner frame. The demo body is a
 * vendor-rendered scheduler we cannot style, so it keeps a visible edge as a
 * PLACEHOLDER for the embed the build will drop in. This repo is a design
 * mockup: it renders no network call and no analytics. The four states are
 * previewable through `?form=loading|error|done`, read on every render and
 * never written back, exactly the way `?state=` works on BillingEnterprise.
 * ───────────────────────────────────────────────────────────────────────── */

function ContactDialog({
  opened,
  embedState,
  onOpenChange,
  finalFocus,
}: {
  /** The action that opened the dialog: its `kind` picks the form, its
   *  `title` is the label of the button pressed. `null` when closed. */
  opened: { kind: ContactKind; title: string } | null;
  embedState: EmbedState;
  onOpenChange: (next: boolean) => void;
  finalFocus: React.RefObject<HTMLButtonElement | null>;
}) {
  // Submitting the mock form moves the frame to its confirmation without
  // touching the URL: the preview param stays whatever was pasted.
  const [submitted, setSubmitted] = useState(false);
  const open = opened !== null;
  const state: EmbedState = submitted ? "done" : embedState;
  // The dialog keeps rendering through its 120ms close animation, by which
  // point `opened` is already null, so hold the last values for that frame.
  // Storing them in state and adjusting it during render (React's own
  // "adjusting state when a prop changes" pattern) means a reopen swaps the
  // heading and body in the same render, never a frame late.
  const [last, setLast] = useState(opened);
  if (opened !== null && opened !== last) {
    setLast(opened);
  }
  const resolvedKind = last?.kind ?? "contact";
  const resolvedTitle = last?.title ?? "Contact us";

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
          `data-[size=default]:sm:max-w-sm` would otherwise win; `w-[calc(...)]`
          restores the 16px gutters the important cap takes away on a phone.
          `finalFocus` returns focus to the exact button that opened this,
          so Escape lands back on the control the user pressed.

          `max-h-[90vh]` with an `auto 1fr auto` row template is what lets
          the body carry content of an UNKNOWN height: the header and the
          footer stay put, the middle row takes the slack and scrolls. The
          popup can therefore never grow past the viewport, whatever the
          embed turns out to measure. */}
      <DialogContent
        className="!max-w-[560px] max-h-[90vh] w-[calc(100%-2rem)] grid-rows-[auto_1fr_auto] gap-4"
        finalFocus={finalFocus}
      >
        <DialogHeader>
          <DialogTitle className="type-heading-20 text-foreground">
            {resolvedTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {resolvedKind === "demo" ? (
            <SchedulerFrame state={state} />
          ) : (
            <ContactBody state={state} />
          )}
        </div>

        <DialogFooter>
          {state === "done" ? (
            <DialogClose render={<Button size="sm" type="button" />}>
              Done
            </DialogClose>
          ) : (
            <>
              <DialogClose
                render={<Button size="sm" type="button" variant="outline" />}
              >
                Cancel
              </DialogClose>
              {SUBMIT_LABEL[resolvedKind] === null ? null : (
                <Button
                  disabled={state !== "ready"}
                  onClick={() => setSubmitted(true)}
                  size="sm"
                  type="button"
                >
                  {SUBMIT_LABEL[resolvedKind]}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Contact form ───────────────────────────────────────────────────────
 * OUR form, not a vendor embed. On a signed-in surface the guidance is to
 * build the form in our own framework and submit to HubSpot's Forms
 * Submission API, so it wears our tokens, our type voices and our own
 * submit button.
 *
 * Four fields and no more. Work email is the only one HubSpot requires by
 * default and it is what links a later demo booking to the same contact
 * record. Name and Company are prefilled because we already hold them and
 * sales needs Company to route. Notes is the one thing we cannot know: it
 * is where the customer states the intent the ticket says we have no way to
 * capture today, private cloud deployment, custom retention or procurement
 * support. No phone, country, job title or employee count.
 *
 * Every prefilled value stays EDITABLE. The person filling this in may be
 * correcting a value or handing the enquiry to a colleague.
 * ───────────────────────────────────────────────────────────────────────── */

type ContactField = "name" | "email" | "company" | "notes";

const REQUIRED_FIELDS: ContactField[] = ["name", "email", "company"];

/** Format only. Deliverability and MX are HubSpot's server-side job and
 *  this is a mockup; a regex that pretends otherwise would lie. */
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldError = (field: ContactField, value: string): string | null => {
  const trimmed = value.trim();
  if (REQUIRED_FIELDS.includes(field) && trimmed.length === 0) {
    return "This field is required.";
  }
  if (field === "email" && trimmed.length > 0 && !EMAIL_FORMAT.test(trimmed)) {
    return "Enter an email address in the form name@company.com.";
  }
  return null;
};

/** Label row: the name on the left, a short note on the right, the shape
 *  `ApiKeys.tsx` already uses for a labelled field. The required marker is
 *  the WORD "Required" in that slot, never colour alone. */
function ContactFieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <FieldLabel className="text-muted-foreground" htmlFor={htmlFor}>
        {children}
      </FieldLabel>
      {required ? (
        <span className="type-copy-12 text-muted-foreground">Required</span>
      ) : null}
    </div>
  );
}

function ContactForm() {
  // Prefilled from the signed-in user and the current workspace, both read
  // from the roster seed rather than re-typed here.
  const me = signedInMember();
  const [values, setValues] = useState<Record<ContactField, string>>({
    name: me.name,
    email: me.email,
    company: WORKSPACE_NAME,
    notes: "",
  });
  // Validation fires on BLUR and on submit, never per keystroke, so a
  // half-typed address is not flagged mid-entry.
  const [touched, setTouched] = useState<Partial<Record<ContactField, true>>>(
    {}
  );

  const set = (field: ContactField, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));
  const blur = (field: ContactField) =>
    setTouched((prev) => ({ ...prev, [field]: true }));
  const errorFor = (field: ContactField) =>
    touched[field] === true ? fieldError(field, values[field]) : null;

  const field = (id: ContactField) => {
    const error = errorFor(id);
    return {
      "aria-describedby": error === null ? undefined : `contact-${id}-error`,
      "aria-invalid": error !== null,
      id: `contact-${id}`,
      onBlur: () => blur(id),
      value: values[id],
    };
  };

  return (
    <FieldGroup>
      <Field data-invalid={errorFor("name") !== null}>
        <ContactFieldLabel htmlFor="contact-name" required>
          Name
        </ContactFieldLabel>
        <Input
          {...field("name")}
          autoComplete="name"
          name="name"
          onChange={(e) => set("name", e.target.value)}
          type="text"
        />
        <ContactFieldError field="name" message={errorFor("name")} />
      </Field>

      <Field data-invalid={errorFor("email") !== null}>
        <ContactFieldLabel htmlFor="contact-email" required>
          Work email
        </ContactFieldLabel>
        <Input
          {...field("email")}
          autoComplete="email"
          name="email"
          onChange={(e) => set("email", e.target.value)}
          spellCheck={false}
          type="email"
        />
        <ContactFieldError field="email" message={errorFor("email")} />
      </Field>

      <Field data-invalid={errorFor("company") !== null}>
        <ContactFieldLabel htmlFor="contact-company" required>
          Company
        </ContactFieldLabel>
        <Input
          {...field("company")}
          autoComplete="organization"
          name="company"
          onChange={(e) => set("company", e.target.value)}
          type="text"
        />
        <ContactFieldError field="company" message={errorFor("company")} />
      </Field>

      <Field>
        <ContactFieldLabel htmlFor="contact-notes">Notes</ContactFieldLabel>
        <Textarea
          {...field("notes")}
          name="notes"
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
        />
      </Field>
    </FieldGroup>
  );
}

/** The site's inline error pattern, verbatim from `BillingFree.tsx`:
 *  `FieldError` under its own field, `id` wired to the input's
 *  `aria-describedby`, danger ink and `role="alert"` from the primitive. No
 *  summary block at the top. */
function ContactFieldError({
  field,
  message,
}: {
  field: ContactField;
  message: string | null;
}) {
  if (message === null) {
    return null;
  }
  return <FieldError id={`contact-${field}-error`}>{message}</FieldError>;
}

/* ─── The two bodies ─────────────────────────────────────────────────────
 * The BORDER marks a boundary we do not own. The demo modal really does
 * host a vendor-rendered scheduler in an isolated iframe, so its region is
 * a visible surface: the edge says "this is theirs, not ours". The contact
 * modal is OUR form on OUR dialog, so there is no boundary to mark and no
 * border: a card inside a card is chrome with nothing to say. If someone
 * ever re-adds a frame to the contact body, that is the test it fails.
 *
 * `aria-busy` lives on whichever region wraps the content, so the loading
 * state is announced in both.
 * ───────────────────────────────────────────────────────────────────────── */

/** Our own form, sitting directly on the dialog surface. */
function ContactBody({ state }: { state: EmbedState }) {
  return (
    <div aria-busy={state === "loading"} className="flex flex-col gap-4">
      {state === "loading" ? <FieldSkeletons rows={4} /> : null}
      {state === "error" ? <FrameError /> : null}
      {state === "done" ? <Confirmation kind="contact" /> : null}
      {state === "ready" ? <ContactForm /> : null}
    </div>
  );
}

/**
 * The scheduler's footprint. Bordered because it is a vendor surface. Its
 * booking form always collects first name, last name and email, HubSpot's
 * documented default and not ours to change, so we draw none of our own
 * fields in here.
 *
 * THE 480px IS A PLACEHOLDER, NOT A MEASUREMENT. It is reasoned from the
 * widget's four-screen flow (calendar, time slots, a short booking form,
 * confirmation); the real height is not controllable by the host and has
 * never been measured, because no scheduling link exists yet. Size the
 * container against the live scheduling page. It is a `min-h`, never a
 * fixed height, so a shorter embed cannot leave a gap it does not fill and
 * a taller one grows the region and scrolls inside the dialog.
 */
function SchedulerFrame({ state }: { state: EmbedState }) {
  return (
    <div
      aria-busy={state === "loading"}
      className="flex min-h-[480px] flex-col rounded-md border border-border p-4"
    >
      {state === "loading" ? <FieldSkeletons rows={3} /> : null}
      {state === "error" ? <FrameError /> : null}
      {state === "done" ? <Confirmation kind="demo" /> : null}
      {state === "ready" ? (
        <p className="type-copy-14 m-auto text-pretty text-center text-muted-foreground">
          Scheduler loads here.
        </p>
      ) : null}
    </div>
  );
}

const FieldSkeletons = ({ rows }: { rows: number }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: rows }, (_, i) => `row-${i}`).map((key, i) => (
      <Skeleton
        className={i === rows - 1 ? "h-24 w-full" : "h-16 w-full"}
        key={key}
      />
    ))}
  </div>
);

/** FRAME-level failure, distinct from the per-field errors in the form: the
 *  embed did not load at all. Kept for the demo too, because a blocked
 *  scheduler script renders an empty container with no message of its own. */
const FrameError = () => (
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
      <Button className="self-start" size="sm" type="button" variant="outline">
        Try again
      </Button>
    </div>
  </div>
);

const Confirmation = ({ kind }: { kind: ContactKind }) => (
  <p className="type-copy-14 m-0 text-pretty text-foreground" role="status">
    {CONFIRMATION[kind]}
  </p>
);
