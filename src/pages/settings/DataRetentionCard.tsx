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
 *   2. The field: the plan name as its label ("Free plan", "Pro plan",
 *      "Enterprise plan"; owner 2026-10-08: the card title already names
 *      the window), the input (screen-reader name "Retention window in
 *      days"), then the helper naming the ceiling, the floor and that
 *      shortening cannot be undone (Free: the mockup's fixed-30 line). Above the ceiling: the
 *      inline FieldError, never a toast. At 0 days: what 0 turns off.
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
 *      No note: every candidate repeated the label, "(fixed)" or the button.
 * Enterprise also gets the one-line ceiling note with Contact support under
 * the card (PRD: the superseded Extended retention card "becomes a one-line
 * note of the ceiling and a Contact support link"). The link opens the plans
 * page's own Contact support dialog in place: on the Enterprise plans page
 * that label sits on the Free and Pro rungs, a downgrade route, not a ceiling
 * request (owner 2026-10-08).
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

/** The field label names the plan whose limits the helper gives. */
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

type LastChange = { at: Date; by: string };

/** The shorten dialog's subject. `from` and `to` are snapshotted when it
 *  opens, so the copy does not change under the close animation once the
 *  confirm has already moved the saved window. */
type ShortenRequest = { open: boolean; from: number; to: number };

export function DataRetentionCard({ tier }: { tier: RetentionTier }) {
  const { pathname } = useLocation();
  // One clock per mount: the readouts, the dialog and the next-run time all
  // measure from the same instant, so they cannot disagree.
  const [now] = useState(() => new Date());
  const ceiling = retentionCeilingDays(tier);
  const editable = tier !== "free";

  // Every org starts at its ceiling (PRD).
  const [saved, setSaved] = useState(ceiling);
  const [draft, setDraft] = useState(String(ceiling));
  const [lastChange, setLastChange] = useState<LastChange | null>(null);
  const [shorten, setShorten] = useState<ShortenRequest>({
    open: false,
    from: ceiling,
    to: ceiling,
  });
  // Focus returns to the field when the dialog closes or Reset runs.
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Enterprise: the Contact support dialog, and the link that opened it, so
  // closing it returns focus there (ManageSubscription's opener pattern).
  const [supportOpen, setSupportOpen] = useState(false);
  const supportOpenerRef = useRef<HTMLButtonElement | null>(null);
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
  const plansHref = withTierOf(pathname, "/billing/plans");

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
        "Records already deleted are not restored. Their Digital Evidence fingerprints remain verifiable.",
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
            Audit hashes, proofs, and Digital Evidence fingerprints are kept, so
            the record stays verifiable after the content is gone. Records older
            than the window are deleted within 24 hours of expiry and cannot be
            recovered.
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
                    <FieldLabel htmlFor={FIELD_ID}>
                      {PLAN_NAME[tier]} plan
                    </FieldLabel>
                    <FieldDescription id={DESCRIPTION_ID}>
                      <WindowHelper ceiling={ceiling} tier={tier} />
                    </FieldDescription>
                    {overCeiling ? (
                      <FieldError id={ERROR_ID}>
                        <CeilingError
                          ceiling={ceiling}
                          plansHref={plansHref}
                          tier={tier}
                        />
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
          ) : (
            // Free has no input (owner 2026-10-08: the disabled field was
            // dead UI and repeated "30 days (fixed)" below), so the plan name
            // is a title, not a label: FieldTitle in the same FieldContent
            // and hairline as the paid field row, so the tiers line up.
            <div className="border-border border-t pt-4">
              <FieldContent>
                <FieldTitle>Free plan details</FieldTitle>
                <FieldDescription>
                  <WindowHelper ceiling={ceiling} tier={tier} />
                </FieldDescription>
              </FieldContent>
            </div>
          )}
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
              className="border-t-0 [&>[data-slot=detail-row]]:px-4"
              variant="flush"
            >
              {/* Free's window is set by the plan, so its value says so
                  (owner 2026-10-08: "30 days (fixed)"). */}
              <DetailRow
                label="Current window"
                value={
                  <FactValue mono>
                    {editable
                      ? formatDays(saved)
                      : `${formatDays(saved)} (fixed)`}
                  </FactValue>
                }
              />
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
          // is the upgrade (PRD mockup 03). Outline, not the promo fill (owner
          // 2026-10-08); the sparkle marks it as the site's upgrade action.
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
      {tier === "enterprise" ? (
        <Card>
          <CardContent>
            <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
              Enterprise ceiling: {formatDays(ceiling)}. Your contract sets the
              ceiling; to raise it,{" "}
              <TextLink
                onClick={(e) => {
                  supportOpenerRef.current = e.currentTarget;
                  setSupportOpen(true);
                }}
              >
                contact support
              </TextLink>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}
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
      {tier === "enterprise" ? (
        <ContactDialog
          embedState="ready"
          finalFocus={supportOpenerRef}
          onOpenChange={(next) => {
            if (!next) {
              setSupportOpen(false);
            }
          }}
          opened={supportOpen ? SUPPORT_CONTACT : null}
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

/** The helper under the field: ceiling, floor, and that shortening cannot be
 *  undone (PRD mockup 01); Free is the mockup 03 line. Plain muted text: the
 *  plan-name label above it is the one foreground line (owner 2026-10-08,
 *  the bold limit under the label "conflicts visually"; it replaces the
 *  2026-10-07 emphasis). */
function WindowHelper({
  tier,
  ceiling,
}: {
  tier: RetentionTier;
  ceiling: number;
}) {
  if (tier === "free") {
    // PRD mockup 03's helper shape ("Upgrade to Pro to ..., or to Enterprise
    // to ..."), corrected (owner 2026-10-08): Pro goes shorter or longer than
    // the fixed 30, up to 90; Enterprise's default ceiling is also 90, so only
    // a contract extends further. The mockup's "Free plan: 30 days, fixed."
    // lives in the label and the Current window row ("30 days (fixed)"). No
    // "Upgrade to": the footer button says it (owner 2026-10-08, no repeats).
    return (
      <>
        Pro plan lets you shorten the window or extend it to{" "}
        {formatDays(PRO_RETENTION_CEILING_DAYS)}. On Enterprise, a contract can
        extend it further.
      </>
    );
  }
  return (
    <>
      Ceiling: {formatDays(ceiling)}. Minimum {formatDays(RETENTION_FLOOR_DAYS)}
      . Shortening deletes older records on the next run and cannot be undone.
    </>
  );
}

/** The above-ceiling error: names the ceiling and, on Pro, the Enterprise
 *  path (PRD: inline, not a toast). "can allow": the Enterprise default
 *  ceiling is also 90, so the contract, not the plan, lifts it (owner
 *  2026-10-08). "contact us" is the label the plans page's Enterprise card
 *  carries for a Pro org (`contactFlowTitle`). */
function CeilingError({
  tier,
  ceiling,
  plansHref,
}: {
  tier: RetentionTier;
  ceiling: number;
  plansHref: string;
}) {
  if (tier === "pro") {
    return (
      <>
        Pro keeps up to {PRO_RETENTION_CEILING_DAYS} days. An Enterprise
        contract can allow a longer window; to ask about one,{" "}
        <TextLink to={plansHref}>contact us</TextLink>.
      </>
    );
  }
  return <>Your contract keeps up to {ceiling} days.</>;
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
            {count} {preview.count === 1 ? "record" : "records"} older than{" "}
            {formatDate(preview.cutoff)}{" "}
            {preview.count === 1 ? "becomes" : "become"} eligible for deletion
            on the next run, {formatDeletionRun(preview.runAt)}. This cannot be
            undone, and raising the window later does not restore them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DetailList>
          <DetailRow
            label="Current window"
            labelClassName="w-52"
            value={<span className="type-mono-14">{formatDays(from)}</span>}
          />
          <DetailRow
            label="New window"
            labelClassName="w-52"
            value={<span className="type-mono-14">{formatDays(to)}</span>}
          />
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
