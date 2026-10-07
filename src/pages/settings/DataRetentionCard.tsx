import { type RefObject, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TextLink } from "@/components/ui/text-link";
import { signedInMember } from "@/data/team-members";
import { formatDate, formatNumber } from "@/lib/formatters";
import { withTierOf } from "@/lib/plan";
import {
  FREE_RETENTION_DAYS,
  formatDays,
  formatDeletionRun,
  type MessageCurveAnchor,
  messagesInWindow,
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
import { ConsequenceCallout } from "@/pages/cancel-plan-dialog";
import { FreePlanNoticeBanner } from "@/pages/free-plan-notice-banner";
import { MESSAGE_TIMES, messageCurve } from "@/pages/settings/retention-data";

/* ─────────────────────────────────────────────────────────────────────────
 * Data retention card (PRD "Configurable data retention v1", AG-1018).
 *
 * Shape follows the Profile card on the same page: data only (the section
 * title sits above the card), one form, and Save in a `border-t` / `py-2`
 * footer, right-aligned. Save is the card's one primary action; an outline
 * Cancel joins it only while an edit is unsaved, to restore the saved
 * window (owner, 2026-10-07; no permanent Reset). The card carries no danger
 * tone: shortening is the destructive direction, and its destructive
 * styling lives only on the confirm inside the dialog, so the card reads as
 * a setting, not a warning.
 *
 * Body, top to bottom:
 *   1. The window field. Ceiling and floor are named in its description;
 *      on Free, one line says upgrading lets you choose the window.
 *   2. At 0 days: an info Callout saying what 0 turns off.
 *   3. Four facts under a hairline, in the Teams budget fact grid
 *      (`teams/budget.tsx` BudgetFact: label over value, 1 / 2 / 4 columns
 *      by container width), so each label sits next to its own value
 *      instead of across a wide card: how far back content goes, how much
 *      is held, when deletion next runs, and who changed the window last.
 *
 * Save, by direction:
 *   lower    opens the shorten AlertDialog; nothing changes until confirmed
 *            (two steps, nothing deleted on a single click).
 *   higher   saves at once; the toast says deleted records stay deleted.
 *
 * Per tier: Free is read-only (fixed 30 days, disabled field, no footer),
 * with the shared Free plan banner under the card saying what Pro adds and
 * offering Upgrade to Pro (the Policies Free banner). Pro accepts 0 to 90; a value above 90 gets an inline error naming
 * the ceiling and the Enterprise path, never a toast. Enterprise accepts 0
 * to its contract ceiling (365 for this org) and names Contact support for
 * changing that ceiling, as plain text until a support destination exists.
 * No pricing language anywhere: pricing is deferred.
 *
 * Numbers (data-model.md §5.1): counts come from MESSAGE_TOTALS, the one
 * count of messages, through `messageCurve`, so a 30-day window prints the
 * Messages 30D pill and a lifetime window prints All. Dates come from the
 * Messages rows. No backend: confirming updates local state and fires the
 * house toast, like Erase stored data.
 * ───────────────────────────────────────────────────────────────────────── */

const FIELD_ID = "settings-retention-days";
const DESCRIPTION_ID = "settings-retention-days-description";
const ERROR_ID = "settings-retention-days-error";
const FORM_ID = "settings-retention-form";

/** What a 0-day window turns off, and what still works. Shared by the card
 *  and the dialog so the two can never describe it differently. */
const ZERO_DAYS_NOTE =
  "At 0 days, Gate stores no prompt or response content, turns off the response cache, and keeps no Gate Chat history. Messages are still billed and listed without content, and their audit hashes still verify.";

type LastChange = { at: Date; by: string };

/** The shorten dialog's subject. `from` and `to` are snapshotted when it
 *  opens, so the copy does not change under the 120ms close animation once
 *  the confirm has already moved the saved window. */
type ShortenRequest = { open: boolean; from: number; to: number };

export function DataRetentionCard({ tier }: { tier: RetentionTier }) {
  const { pathname } = useLocation();
  // One clock per mount: the stat rows, the dialog and the next-run time
  // all measure from the same instant, so they cannot disagree.
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
  // Focus returns to the field when the dialog closes: the dialog opens
  // from a submit, and after a confirm Save is disabled and cannot hold it.
  const inputRef = useRef<HTMLInputElement | null>(null);

  const input = readDaysInput(draft, ceiling);
  const canSave = editable && input.kind === "valid" && input.days !== saved;
  // An unsaved edit: the field no longer shows the saved window, and nothing
  // else on the card names it, so Cancel appears to bring it back.
  const dirty = editable && draft !== String(saved);

  function handleCancel() {
    setDraft(String(saved));
    inputRef.current?.focus();
  }
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
    toast(`Retention set to ${formatDays(input.days)}`, {
      // PRD: lengthening says deleted records are not restored, and every
      // deletion statement names the anchors (fingerprints in the UI).
      description:
        "Deleted messages stay deleted. You can still verify their fingerprints.",
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
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-4"
            id={FORM_ID}
            onSubmit={handleSave}
          >
            {/* shadcn's responsive Field: label and its limits on the left,
                the control on the right once the card is wide enough, the
                same shape as the Passkey row in the Security card above.
                Stacks on a narrow card. */}
            <FieldGroup>
              {/* No `data-disabled` on Free: it would dim the label below
                  the "Pro" / "Enterprise" lines under it. Only the Input is
                  disabled; the label stays the row's foreground title. */}
              <Field
                data-invalid={overCeiling || undefined}
                orientation="responsive"
              >
                <FieldContent>
                  <FieldLabel htmlFor={FIELD_ID}>Retention window</FieldLabel>
                  <FieldDescription id={DESCRIPTION_ID}>
                    <WindowDescription ceiling={ceiling} tier={tier} />
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
                {/* The plain shadcn Input, sized for three digits, with the
                    unit as quiet text beside it. Free is locked, so the field
                    is disabled (muted surface), not a live-looking box. */}
                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    aria-describedby={
                      overCeiling
                        ? `${DESCRIPTION_ID} ${ERROR_ID}`
                        : DESCRIPTION_ID
                    }
                    aria-invalid={overCeiling || undefined}
                    className="w-20"
                    disabled={!editable}
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
          {/* The hairline keeps the facts reading as data under the setting,
              not as more of it. The grid is the Teams budget fact grid, so
              each label sits on its own value at every width. */}
          <dl className="m-0 grid @3xl:grid-cols-4 @xl:grid-cols-2 grid-cols-1 gap-4 border-border border-t pt-4">
            <RetentionFact
              label="Oldest message"
              mono={oldest !== null}
              muted={oldest === null}
              value={oldest ? formatDate(oldest) : "None"}
            />
            <RetentionFact
              label="Messages in window"
              mono
              value={formatNumber(held)}
            />
            <RetentionFact
              label="Next deletion run"
              mono
              value={formatDeletionRun(runAt)}
            />
            {/* No change yet is an absence, not a value: it goes quiet in
                the muted tone, the same as Billing's "None yet". */}
            <RetentionFact
              label="Last change"
              muted={lastChange === null}
              value={
                lastChange
                  ? `${formatDate(lastChange.at)} by ${lastChange.by}`
                  : "Never"
              }
            />
          </dl>
        </CardContent>
        {/* Free has nothing to save, so no footer: its upgrade path is the
            Free plan banner below the card (owner, 2026-10-07). */}
        {editable ? (
          <CardFooter className="justify-end gap-2 border-border border-t py-2">
            {/* Only while there is an unsaved edit (owner, 2026-10-07): at
                rest the footer is Save alone. Outline, so Save stays the one
                primary. */}
            {dirty ? (
              <Button
                onClick={handleCancel}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            ) : null}
            <Button
              disabled={!canSave}
              form={FORM_ID}
              size="sm"
              type="submit"
              variant="default"
            >
              Save changes
            </Button>
          </CardFooter>
        ) : null}
      </Card>
      {editable ? null : (
        <FreePlanNoticeBanner>
          Pro lets you set your own retention window from {RETENTION_FLOOR_DAYS}{" "}
          to {PRO_RETENTION_CEILING_DAYS} days, where {RETENTION_FLOOR_DAYS}{" "}
          means Gate stores no prompts or responses.
        </FreePlanNoticeBanner>
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
    </>
  );
}

/* ─── Facts ─────────────────────────────────────────────────────────────── */

/** One fact: label over value. The Teams budget fact recipe (`BudgetFact`,
 *  `teams/budget.tsx`) without its tooltip, as a `dt` / `dd` pair so the
 *  `dl` stays a real description list. */
function RetentionFact({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: string;
  /** Numbers and dates take the mono tabular voice; worded ones stay sans. */
  mono?: boolean;
  /** Quiet tone for an absent value ("Never", "None"). */
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="type-label-12 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          mono ? "type-mono-14" : "type-copy-14",
          "m-0 text-pretty",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ─── Field copy ────────────────────────────────────────────────────────── */

/** Names the floor and the ceiling next to the field. */
function WindowDescription({
  tier,
  ceiling,
}: {
  tier: RetentionTier;
  ceiling: number;
}) {
  if (tier === "free") {
    // One line, not a plan comparison (owner, 2026-10-07: the per-plan list
    // was cognitive overload). What Pro adds is said once, in the Free plan
    // banner under the card.
    // States the 30 even though the field shows it (owner, 2026-10-07):
    // without it, users may not know to look at the field.
    return <>Fixed at {FREE_RETENTION_DAYS} days on the Free plan.</>;
  }
  if (tier === "enterprise") {
    // The admin sets the window here; only the contract ceiling goes through
    // support (PRD principle: the contract sets the ceiling, the admin sets
    // the window). Plain text: there is no support destination to link yet.
    return (
      <>
        From 0 to {ceiling} days. Your contract sets the ceiling; to raise it,
        contact support.
      </>
    );
  }
  return <>From 0 to {ceiling} days.</>;
}

/** The above-ceiling error: names the ceiling and, on Pro, the way past it. */
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
        Pro keeps up to {PRO_RETENTION_CEILING_DAYS} days. For a longer window,{" "}
        <TextLink to={plansHref}>move to Enterprise</TextLink>.
      </>
    );
  }
  return <>Your contract keeps up to {ceiling} days.</>;
}

/* ─── Shorten confirmation ─────────────────────────────────────────────────
 * Opened by Save when the new window is lower. A plain two-step confirm, no
 * type-to-confirm: the PRD asks only that nothing is deleted on a single
 * click, which Save then Shorten already guarantees. Typing a phrase is kept
 * for Erase stored data and Delete organization, which remove everything at
 * once; here the deletion is bounded to records past the new window, and
 * every record's audit hash and fingerprint survive it. Same frame as those
 * two dialogs: 500px, the shared warning callout, a destructive confirm, and
 * `mt-2` on the footer so it sits 24px below the body (content `gap-4`).
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
  const consequences = useMemo(() => {
    const items = [
      "Deletion is permanent, and raising the window later restores nothing. Audit hashes and fingerprints are kept and stay verifiable.",
    ];
    if (to === 0) {
      items.push(ZERO_DAYS_NOTE);
    }
    return items;
  }, [to]);

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
            <ShortenLead preview={preview} to={to} />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ConsequenceCallout items={consequences} />
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          To keep a copy, export a CSV from{" "}
          <TextLink to={withTierOf(pathname, "/messages")}>Messages</TextLink>
          {tier === "enterprise" ? " or push it to your SIEM" : ""} before the
          run.
        </p>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Keep {formatDays(from)}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Shorten to {formatDays(to)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The count, the cutoff and the run, with the audit-hash promise in the
 *  sentence that follows. */
function ShortenLead({
  preview,
  to,
}: {
  preview: ReturnType<typeof shortenPreview>;
  to: number;
}) {
  const cutoff = formatDate(preview.cutoff);
  const run = formatDeletionRun(preview.runAt);
  const { count } = preview;
  // The fingerprint promise is said once, in the callout sentence that
  // follows this one (PRD: same sentence or the one after).
  // Wording from the copywriter, approved by the owner 2026-10-07.
  if (count === 0) {
    return (
      <>
        None of your messages are from before {cutoff} yet. From {run}, messages
        are deleted daily once they are {formatDays(to)} old.
      </>
    );
  }
  const n = formatNumber(count);
  if (count === 1) {
    // At 0 days the cutoff is today, so it is left out.
    return to === 0 ? (
      <>Your 1 message will be deleted on {run}.</>
    ) : (
      <>
        Your 1 message from before {cutoff} will be deleted on {run}.
      </>
    );
  }
  return to === 0 ? (
    <>
      All {n} of your messages will be deleted on {run}.
    </>
  ) : (
    <>
      Your {n} messages from before {cutoff} will be deleted on {run}.
    </>
  );
}
