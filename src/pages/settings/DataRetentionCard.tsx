import { Info } from "lucide-react";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailList, DetailRow } from "@/components/ui/detail-list";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SparklesIcon } from "@/components/ui/sparkles";
import { TextLink } from "@/components/ui/text-link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type ContactKind, contactFlowTitle } from "@/data/plans";
import { signedInMember } from "@/data/team-members";
import { formatDate, formatNumber } from "@/lib/formatters";
import { withTierOf } from "@/lib/plan";
import {
  clampDate,
  formatDays,
  formatDeletionRun,
  type MessageCurveAnchor,
  messagesInWindow,
  metricsRetentionDays,
  nextDeletionRun,
  normalizeDaysInput,
  oldestInWindow,
  PRO_RETENTION_CEILING_DAYS,
  RETENTION_FLOOR_DAYS,
  type RetentionTier,
  readDaysInput,
  retentionCeilingDays,
  shortenPreview,
} from "@/lib/retention";
import { cn } from "@/lib/utils";
import { ContactDialog } from "@/pages/ManageSubscription";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";
import { MESSAGE_TIMES, messageCurve } from "@/pages/settings/retention-data";

/* ─────────────────────────────────────────────────────────────────────────
 * Data retention card (PRD "Configurable data retention v1", AG-1018).
 *
 * Built to the PRD mockups (docs/retention-prd-mockups/ 01 Enterprise,
 * 02 shorten confirmation, 03 Free; owner 2026-10-08: "follow the prd 100%",
 * styled in our design language). Copy is the mockups' and the PRD's own.
 *
 * Card, top to bottom:
 *   1. CardHeader: "Retention window" + the PRD description, reordered
 *      (hashes, proofs and fingerprints kept; then deleted within 24 hours,
 *      cannot be recovered).
 *   2. The field (Pro and Enterprise): "Choose how long to keep records",
 *      the input (screen-reader name "Retention window in days"), then the
 *      helper naming the range and the way past it, with a link that opens
 *      the contact dialog in place (owner 2026-10-09: Pro mirrors
 *      Enterprise). Above the ceiling: the inline FieldError with the fix
 *      only, never a toast. At 0 days: what 0 turns off. Free: no field;
 *      the details title carries a subtitle with the fixed 30 days and
 *      what Pro unlocks.
 *   3. The readout list, the shared DetailList flush variant (the design
 *      the owner approved 2026-10-08) with the mockup 01 rows: Current window, Oldest retained record,
 *      Records in window, Next deletion run, Last changed (Pro and
 *      Enterprise), then Usage metrics (owner addition 2026-10-08, tier-fixed
 *      90 / 180, PRD "What the window governs") with its Info tooltip.
 *   4. Footer. Pro and Enterprise: "Every change is recorded on the audit
 *      trail." + Reset + Save changes. Free: the outline "Upgrade to Pro"
 *      alone, right-aligned, opening the plan comparison (owner 2026-10-08,
 *      PRD mockup 03 "the footer action is the upgrade"; it replaced the Free
 *      plan banner under the card, a page-wide promo for one locked setting).
 *      Its note moved up to the Free field slot (owner 2026-10-09).
 * Enterprise's helper is the PRD's "one-line note of the ceiling and a
 * Contact support link" (the superseded Extended retention card). Its link
 * opens the plans page's own Contact support dialog in place (owner
 * 2026-10-08); Pro's "contact us" opens the same dialog titled "Contact us".
 *
 * Save, by direction: lower opens the shorten AlertDialog (mockup 02);
 * higher saves at once and the toast says deleted records are not restored.
 *
 * Numbers (data-model.md §5.1): counts come from MESSAGE_TOTALS through
 * `messageCurve`; dates come from the Messages rows. No backend: confirming
 * updates local state and fires the house toast, like Erase stored data.
 * ───────────────────────────────────────────────────────────────────────── */

const FIELD_ID = "settings-retention-days";
const DESCRIPTION_ID = "settings-retention-days-description";
const ERROR_ID = "settings-retention-days-error";
const FORM_ID = "settings-retention-form";
const DETAILS_TITLE_ID = "settings-retention-details-title";

/** The details section's title names the plan whose facts the list gives. */
const PLAN_NAME: Record<RetentionTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

/** What a 0-day window turns off, and what still works (PRD Experience
 *  requirements and Release outcome 9). Shared by the card and the dialog
 *  so the two can never describe it differently. */
const ZERO_DAYS_NOTE =
  "At 0 days, Gate stores no prompt or response content, turns off the response cache, and keeps no Gate Chat history. Requests are still billed, listed on Messages without content, and their audit hashes still verify.";

/** What the Enterprise ceiling note's link opens: the plans page's contact
 * dialog, titled by the site's one contact-label rule, so it reads "Contact
 * support" like the link. Module-level, so the dialog sees one stable value. */
const SUPPORT_CONTACT: { kind: ContactKind; title: string } = {
  kind: "contact",
  title: contactFlowTitle("enterprise", "contact"),
};

/** Pro's helper link opens the same dialog in place, titled "Contact us" (the
 *  label the plans page's Enterprise card carries for a Pro org). Owner
 *  2026-10-09: Pro mirrors the Enterprise helper. */
const SALES_CONTACT: { kind: ContactKind; title: string } = {
  kind: "contact",
  title: contactFlowTitle("pro", "contact"),
};

type LastChange = { at: Date; by: string };

/** The shorten dialog's subject. `from` and `to` are snapshotted when it
 *  opens, so the copy does not change under the close animation once the
 *  confirm has already moved the saved window. */
type ShortenRequest = { open: boolean; from: number; to: number };

export function DataRetentionCard({
  tier,
  clampPreview = false,
}: {
  tier: RetentionTier;
  /** Free only: the `/settings-free/clamp` preview of a pending clamp. */
  clampPreview?: boolean;
}) {
  const { pathname } = useLocation();
  // One clock per mount: the readouts, the dialog and the next-run time all
  // measure from the same instant, so they cannot disagree.
  const [now] = useState(() => new Date());
  const ceiling = retentionCeilingDays(tier);
  const editable = tier !== "free";
  // Pending clamp (PRD "Clamp to the new ceiling on downgrade ... after a
  // 3-day grace period, with the date shown in Settings"): the org has just
  // downgraded from Pro, so during the grace it still holds Pro's window,
  // and on the clamp date it drops to Free's.
  const clamping = tier === "free" && clampPreview;
  const clampAt = useMemo(() => clampDate(now), [now]);

  // Every org starts at its ceiling (PRD); during a clamp, at the old one.
  const startDays = clamping ? PRO_RETENTION_CEILING_DAYS : ceiling;
  const [saved, setSaved] = useState(startDays);
  const [draft, setDraft] = useState(String(startDays));
  const [lastChange, setLastChange] = useState<LastChange | null>(null);
  const [shorten, setShorten] = useState<ShortenRequest>({
    open: false,
    from: ceiling,
    to: ceiling,
  });
  // Focus returns to the field when the dialog closes or Reset runs.
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Pro and Enterprise: the contact dialog the helper's link opens, and the
  // link that opened it, so closing it returns focus there
  // (ManageSubscription's opener pattern).
  const [contactOpen, setContactOpen] = useState(false);
  const contactOpenerRef = useRef<HTMLButtonElement | null>(null);
  // Free: the footer's Upgrade to Pro opens the plan comparison, the dialog
  // the Free plan banner opened before the footer replaced it.
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);

  const input = readDaysInput(draft, ceiling);
  const canSave = editable && input.kind === "valid" && input.days !== saved;
  const dirty = editable && draft !== String(saved);
  const overCeiling = input.kind === "above-ceiling";
  const showZeroNote = editable && input.kind === "valid" && input.days === 0;

  const curve = useMemo(() => messageCurve(now), [now]);
  const held = messagesInWindow(curve, saved);
  const oldest = useMemo(
    () => oldestInWindow(MESSAGE_TIMES, now, saved),
    [now, saved]
  );
  const runAt = useMemo(() => nextDeletionRun(now), [now]);

  function handleReset() {
    setDraft(String(saved));
    inputRef.current?.focus();
  }

  function commit(days: number) {
    setSaved(days);
    setDraft(String(days));
    setLastChange({ at: new Date(), by: signedInMember().name });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || input.kind !== "valid") {
      return;
    }
    if (input.days < saved) {
      setShorten({ open: true, from: saved, to: input.days });
      return;
    }
    commit(input.days);
    // PRD: lengthening shows at save that records already deleted are not
    // restored, and every deletion statement says the fingerprints are kept.
    toast(`Retention set to ${formatDays(input.days)}`, {
      description:
        "Records already deleted are not restored. Their fingerprints remain verifiable.",
    });
  }

  function handleConfirmShorten() {
    commit(shorten.to);
    setShorten((s) => ({ ...s, open: false }));
    toast(`Retention set to ${formatDays(shorten.to)}`);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Retention window</CardTitle>
          {/* The PRD's two sentences, kept-first, and the site's UI term
              "fingerprints" for the PRD's "anchors" (owner 2026-10-08). */}
          <CardDescription className="text-pretty">
            Audit hashes, proofs, and fingerprints are kept, so the record stays
            verifiable after the content is gone. Records older than the window
            are deleted within 24 hours of expiry and cannot be recovered.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {editable ? (
            <form
              className="flex flex-col gap-4 border-border border-t pt-4"
              id={FORM_ID}
              onSubmit={handleSave}
            >
              {/* The field row we had (owner 2026-10-08: "use what we had,
                just keep the label"): shadcn's responsive Field, label and
                helper on the left, the compact input on the right once the
                card is wide enough, the same shape as the Passkey row in the
                Security card above. Stacks on a narrow card. */}
              <FieldGroup>
                <Field
                  data-invalid={overCeiling || undefined}
                  orientation="responsive"
                >
                  <FieldContent>
                    {/* An action that leads (owner 2026-10-08): the label
                        says what the input decides; the plan's limits are
                        in the helper. Same string on Pro and Enterprise. */}
                    <FieldLabel htmlFor={FIELD_ID}>
                      Choose how long to keep records
                    </FieldLabel>
                    <FieldDescription id={DESCRIPTION_ID}>
                      <WindowHelper
                        ceiling={ceiling}
                        onContact={(opener) => {
                          contactOpenerRef.current = opener;
                          setContactOpen(true);
                        }}
                        tier={tier}
                      />
                    </FieldDescription>
                    {overCeiling ? (
                      <FieldError id={ERROR_ID}>
                        <CeilingError ceiling={ceiling} />
                      </FieldError>
                    ) : null}
                  </FieldContent>
                  <div className="flex shrink-0 items-center gap-2">
                    <Input
                      aria-describedby={
                        overCeiling
                          ? `${DESCRIPTION_ID} ${ERROR_ID}`
                          : DESCRIPTION_ID
                      }
                      aria-invalid={overCeiling || undefined}
                      aria-label="Retention window in days"
                      className="w-20"
                      id={FIELD_ID}
                      inputMode="numeric"
                      onChange={(e) =>
                        setDraft(normalizeDaysInput(e.target.value))
                      }
                      ref={inputRef}
                      value={draft}
                    />
                    <span className="type-copy-14 text-muted-foreground">
                      days
                    </span>
                  </div>
                </Field>
              </FieldGroup>
              {showZeroNote ? <Callout>{ZERO_DAYS_NOTE}</Callout> : null}
            </form>
          ) : null}
          {/* The details section, the same on every tier (owner 2026-10-08,
              Stripe's property list under a short heading): a hairline, the
              "(Plan) plan details" title, then the framed list. Paid tiers
              have the action section above it; Free has nothing to adjust,
              so this is its only section, and its subtitle (moved up from
              the footer, owner 2026-10-09) says what Pro unlocks. During a
              clamp, upgrading keeps the window (PRD: "On upgrade the ceiling
              rises and the window stays"). */}
          <section
            aria-labelledby={DETAILS_TITLE_ID}
            className="flex flex-col gap-3 border-border border-t pt-4"
          >
            <FieldContent>
              <FieldTitle id={DETAILS_TITLE_ID}>
                {PLAN_NAME[tier]} plan details
              </FieldTitle>
              {editable ? null : (
                <FieldDescription>
                  {clamping ? (
                    "Pro plan keeps your current window."
                  ) : (
                    <WindowHelper ceiling={ceiling} tier={tier} />
                  )}
                </FieldDescription>
              )}
            </FieldContent>
            {/* The readouts: the shared DetailList, flush variant (owner
              2026-10-08, after Stripe's horizontal PropertyList), with the
              PRD mockup's rows and labels, wrapped in its own card (owner
              2026-10-08): the boxed DetailList's frame (`rounded-md border
              border-border`), so the list's own top hairline is dropped and
              the frame pads the last row. The rows carry the side padding so
              their dividers run the full width of the frame (owner
              2026-10-08). */}
            <div className="rounded-md border border-border pb-3">
              <DetailList
                // Values flush right in tabular figures once label and
                // value share a row (owner 2026-10-09, trial); stacked on a
                // narrow list they stay left under their label.
                className="border-t-0 [&>[data-slot=detail-row]]:px-4 @md/detail-list:[&_dd]:text-right [&_dd]:tabular-nums"
                variant="flush"
              >
                {/* Free's window is set by the plan, so its value says so
                  (owner 2026-10-08: "30 days (fixed)"); during a clamp it
                  still holds Pro's window, so no "(fixed)". */}
                <DetailRow
                  label="Current window"
                  value={
                    <FactValue mono>
                      {editable || clamping
                        ? formatDays(saved)
                        : `${formatDays(saved)} (fixed)`}
                    </FactValue>
                  }
                />
                {clamping ? (
                  <DetailRow
                    label="Scheduled change"
                    value={
                      <FactValue mono>
                        {formatDays(ceiling)} on {formatDate(clampAt)}
                      </FactValue>
                    }
                  />
                ) : null}
                <DetailRow
                  label="Oldest retained record"
                  value={
                    oldest ? (
                      <FactValue mono>{formatDate(oldest)}</FactValue>
                    ) : (
                      <FactValue muted>None</FactValue>
                    )
                  }
                />
                <DetailRow
                  label="Records in window"
                  value={<FactValue mono>{formatNumber(held)}</FactValue>}
                />
                <DetailRow
                  label="Next deletion run"
                  value={<FactValue mono>{formatDeletionRun(runAt)}</FactValue>}
                />
                {/* Mockup 03: Free has no Last changed row (nobody can change it). */}
                {editable ? (
                  <DetailRow
                    label="Last changed"
                    value={
                      lastChange ? (
                        <FactValue>
                          {formatDate(lastChange.at)} by {lastChange.by}
                        </FactValue>
                      ) : (
                        <FactValue muted>Never</FactValue>
                      )
                    }
                  />
                ) : null}
                <DetailRow
                  label={
                    <TipLabel
                      label="Usage metrics"
                      tip="Set by your plan, separate from the retention window."
                    />
                  }
                  value={
                    <FactValue mono>
                      {formatDays(metricsRetentionDays(tier))}
                    </FactValue>
                  }
                />
              </DetailList>
            </div>
          </section>
        </CardContent>
        {/* Pro and Enterprise: the audit-trail note, Reset and Save. */}
        {editable ? (
          <CardFooter className="flex-wrap justify-between gap-2 border-border border-t py-2">
            <p className="type-copy-14 m-0 text-muted-foreground">
              Every change is recorded on the audit trail.
            </p>
            <div className="flex gap-2">
              <Button
                disabled={!dirty}
                onClick={handleReset}
                size="sm"
                type="button"
                variant="outline"
              >
                Reset
              </Button>
              <Button
                disabled={!canSave}
                form={FORM_ID}
                size="sm"
                type="submit"
                variant="default"
              >
                Save changes
              </Button>
            </div>
          </CardFooter>
        ) : (
          // Free: the plan is this window's only lever, so its footer action
          // is the upgrade (PRD mockup 03), alone on the right: its note moved
          // up to the Free section above the details (owner 2026-10-09).
          // Outline, not the promo fill; the sparkle marks it as the site's
          // upgrade action.
          <CardFooter className="justify-end border-border border-t py-2">
            <Button
              onClick={() => setCompareOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <SparklesIcon aria-hidden data-icon="inline-start" size={14} />
              <span>Upgrade to Pro</span>
            </Button>
          </CardFooter>
        )}
      </Card>
      {editable ? null : (
        <PlanComparisonDialog
          onOpenChange={setCompareOpen}
          onUpgrade={() => navigate("/billing")}
          open={compareOpen}
        />
      )}
      {editable ? (
        <ShortenDialog
          curve={curve}
          finalFocus={inputRef}
          now={now}
          onConfirm={handleConfirmShorten}
          onOpenChange={(open) => setShorten((s) => ({ ...s, open }))}
          pathname={pathname}
          request={shorten}
          tier={tier}
        />
      ) : null}
      {editable ? (
        <ContactDialog
          embedState="ready"
          finalFocus={contactOpenerRef}
          onOpenChange={(next) => {
            if (!next) {
              setContactOpen(false);
            }
          }}
          opened={
            contactOpen
              ? tier === "enterprise"
                ? SUPPORT_CONTACT
                : SALES_CONTACT
              : null
          }
        />
      ) : null}
    </>
  );
}

/* ─── Readouts ──────────────────────────────────────────────────────────── */

/** One readout's value inside its DetailRow. Numbers and dates take the mono
 *  tabular voice, worded values stay sans; an absent value ("None",
 *  "Never") goes quiet in the muted tone. */
function FactValue({
  children,
  mono = false,
  muted = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        mono ? "type-mono-14" : "type-copy-14",
        muted ? "text-muted-foreground" : "text-foreground"
      )}
    >
      {children}
    </span>
  );
}

/** A readout label with an Info glyph that opens its explanation on hover
 *  or keyboard focus: BudgetFact's trigger verbatim
 *  (`teams/budget.tsx:243-261`). */
function TipLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <span
              {...props}
              aria-label={`About ${label}`}
              className="-m-1 inline-flex shrink-0 cursor-help rounded-sm p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip trigger must be focusable or its explanation is keyboard-unreachable (WCAG 2.1.1)
              tabIndex={0}
            >
              <Info aria-hidden className="size-3.5" strokeWidth={1.75} />
            </span>
          )}
        />
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </span>
  );
}

/* ─── Field copy ────────────────────────────────────────────────────────── */

/** The helper under the label: the range, then the way past it (PRD mockup
 *  01, "the ceiling and floor named under it"); on Free, what Pro unlocks.
 *  Plain muted text under the foreground label. */
function WindowHelper({
  tier,
  ceiling,
  onContact,
}: {
  tier: RetentionTier;
  ceiling: number;
  /** Pro and Enterprise: opens the contact dialog from the helper's link. */
  onContact?: (opener: HTMLButtonElement) => void;
}) {
  if (tier === "free") {
    // The subtitle under the shared title, moved up from the footer (owner
    // 2026-10-09, the owner's copy). The next plan up only (owner 2026-10-08:
    // "no one jumps from free to enterprise"). No "Upgrade to": the footer
    // button says it.
    return (
      <>
        Retention on the Free plan is fixed at {formatDays(ceiling)}. Pro plan
        lets you shorten the window or extend it to{" "}
        {formatDays(PRO_RETENTION_CEILING_DAYS)}.
      </>
    );
  }
  if (tier === "pro") {
    // The range, then the way past it, the same shape as the Enterprise
    // helper (owner 2026-10-09: "If Enterprise already does this, Pro can
    // match it"; PRD: "sees the ceiling and the Enterprise path inline").
    // The link opens the Contact us dialog in place. The above-ceiling error
    // states only the fix.
    return (
      <>
        Your plan allows any window from {RETENTION_FLOOR_DAYS} to{" "}
        {formatDays(ceiling)}. For a longer window,{" "}
        <TextLink onClick={(e) => onContact?.(e.currentTarget)}>
          contact us
        </TextLink>{" "}
        about an Enterprise contract.
      </>
    );
  }
  // Enterprise: the range the contract sets, then where it lifts. This line
  // IS the PRD's "one-line note of the ceiling and a Contact support link"
  // (mockup 01 caption), so there is no separate note card: that would give
  // the ceiling a second home (owner 2026-10-08, every string earns its
  // place). The link opens the Contact support dialog in place.
  return (
    <>
      Your contract allows any window from {RETENTION_FLOOR_DAYS} to{" "}
      {formatDays(ceiling)}. To raise the ceiling,{" "}
      <TextLink onClick={(e) => onContact?.(e.currentTarget)}>
        contact support
      </TextLink>
      .
    </>
  );
}

/** The above-ceiling error: the fix only, on Pro and Enterprise alike
 *  (owner 2026-10-09; GOV.UK: an error never says what the user is not
 *  eligible for). The way past the ceiling is in each tier's helper above
 *  it. Inline, never a toast. */
function CeilingError({ ceiling }: { ceiling: number }) {
  return <>Enter {ceiling} or less.</>;
}

/* ─── Shorten confirmation (PRD mockup 02) ─────────────────────────────────
 * Opened by Save when the new window is lower. Two steps, nothing deleted on
 * a single click. Same frame as Erase stored data: 500px, a destructive
 * confirm, and `mt-2` on the footer so it sits 24px below the body. The
 * mockup's inset box is the boxed DetailList.
 * ───────────────────────────────────────────────────────────────────────── */

function ShortenDialog({
  request,
  curve,
  now,
  tier,
  pathname,
  finalFocus,
  onOpenChange,
  onConfirm,
}: {
  request: ShortenRequest;
  /** The card's own curve, so the dialog's count is the card's count. */
  curve: readonly MessageCurveAnchor[];
  now: Date;
  tier: RetentionTier;
  pathname: string;
  finalFocus: RefObject<HTMLInputElement | null>;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { from, to } = request;
  const preview = useMemo(
    () => shortenPreview(curve, now, from, to),
    [curve, now, from, to]
  );
  const total = messagesInWindow(curve, from);
  const count = formatNumber(preview.count);

  return (
    <AlertDialog onOpenChange={onOpenChange} open={request.open}>
      <AlertDialogContent
        className="data-[size=default]:sm:max-w-[500px]"
        finalFocus={finalFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            Shorten retention to {formatDays(to)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {/* Only what the list below does not hold: the cutoff, the run
                and irreversibility. The count is the list's "Records
                eligible for deletion" row (owner 2026-10-08, no repeats). */}
            Records older than {formatDate(preview.cutoff)} are deleted on the
            next run, {formatDeletionRun(preview.runAt)}. This cannot be undone,
            and raising the window later does not restore them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DetailList>
          <DetailRow
            label="Current window"
            labelClassName="w-52"
            value={<span className="type-mono-14">{formatDays(from)}</span>}
          />
          {/* No "New window" row: the title already says it. */}
          <DetailRow
            label="Records eligible for deletion"
            labelClassName="w-52"
            value={
              <span className="type-mono-14">
                {count} of {formatNumber(total)}
              </span>
            }
          />
          <DetailRow
            label="Audit hashes and fingerprints"
            labelClassName="w-52"
            value="Kept"
          />
        </DetailList>
        {to === 0 ? <Callout>{ZERO_DAYS_NOTE}</Callout> : null}
        {/* A Callout, not a muted line, so the export path stands out before
            the confirm (owner 2026-10-08: it "reads as a sentence"). */}
        <Callout>
          Need the content? Export CSV from{" "}
          <TextLink to={withTierOf(pathname, "/messages")}>Messages</TextLink>
          {tier === "enterprise" ? ", or push to your SIEM," : ""} before the
          run.
        </Callout>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Shorten to {formatDays(to)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
