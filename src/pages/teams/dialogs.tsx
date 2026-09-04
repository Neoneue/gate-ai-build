import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  BUDGET_ENFORCEMENT_LABEL,
  BUDGET_HARD_ENFORCEMENT_HELP,
  BUDGET_PRESETS_HELPER_COPY,
  BUDGET_WINDOW_DEFAULT_AMOUNT,
  BUDGET_WINDOW_HELP,
  BUDGET_WINDOW_LABEL,
  BUDGET_WINDOW_OPTIONS,
  BUDGET_WINDOW_ORDER,
  type BudgetEnforcement,
  type BudgetWindow,
  budgetAlertRecipients,
  budgetWindows,
  DEFAULT_BLOCK_THRESHOLD,
  type TeamBudget,
} from "@/data/teams";

/* ─────────────────────────────────────────────────────────────────────────
 * Teams dialogs — the seven modal surfaces the Teams list and detail pages
 * share. Base UI `Dialog` throughout; every one is a controlled
 * open/onOpenChange pair whose submit hands a plain value back to the page,
 * which owns the state. No dialog mutates data itself.
 *
 * Copy is transcribed from the staging build (gate-v2.12.0-rc.5) — do not
 * reword. Staging only prints the window helper line for Monthly; the other
 * two are stated in `BUDGET_WINDOW_HELP` so no window is left unexplained.
 *
 * **Form state lives in a `*Body` child of `DialogContent`, never in the
 * shell.** Base UI's portal unmounts its children on close (`keepMounted`
 * defaults to false), so the body remounts on every open and its `useState`
 * initialisers re-seed from the current props for free. That is why none of
 * these forms carries a reset effect — an effect that calls `setState` in its
 * body is both a lint failure and a cascading render.
 * ───────────────────────────────────────────────────────────────────────── */

/* ─── 1. Create team ────────────────────────────────────────────────────── */

/* Validation copy. Shared where the rule is shared: the name rule is the same
 * sentence in both forms, and the two percent fields state the same integer
 * range. Errors surface only after the field has been blurred (`touched`);
 * Save stays disabled while anything is invalid. */
const ERROR_NAME = "Enter a name.";
const ERROR_AMOUNT = "Enter an amount above $0.";
const ERROR_PERCENT = "Enter a whole number from 1 to 100.";
const ERROR_BLOCK_ABOVE_WARN = "Block must be above the warn threshold.";

export function CreateTeamDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <CreateTeamBody onCreate={onCreate} />
      </DialogContent>
    </Dialog>
  );
}

function CreateTeamBody({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  // Blur gating: a dialog that opens with a red empty field is scolding the
  // user for not having typed yet. `touched` flips on the field's own blur.
  const [touched, setTouched] = useState(false);
  const isValid = name.trim().length > 0;
  const nameError = isValid ? null : ERROR_NAME;
  const showNameError = nameError !== null && touched;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) {
          return;
        }
        onCreate(name.trim());
      }}
    >
      <DialogHeader>
        <DialogTitle className="type-heading-20 text-foreground">
          Create team
        </DialogTitle>
        <DialogDescription>
          Members and keys can be assigned to the new team afterward.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label
          className="type-label-14 text-muted-foreground"
          htmlFor="team-create-name"
        >
          Name
        </Label>
        {/* Plain wrapper, not another gap-2 sibling: `FieldError` carries its
            own 8px offset from the control, matching `type-input-helper`. */}
        <div>
          <Input
            aria-describedby={
              showNameError ? "team-create-name-error" : undefined
            }
            aria-invalid={showNameError}
            autoComplete="off"
            className="type-copy-14"
            id="team-create-name"
            onBlur={() => setTouched(true)}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Data science"
            spellCheck={false}
            type="text"
            value={name}
          />
          {showNameError ? (
            <FieldError className="mt-2" id="team-create-name-error">
              {nameError}
            </FieldError>
          ) : null}
        </div>
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button size="default" type="button" variant="outline" />}
        >
          Cancel
        </DialogClose>
        <Button disabled={!isValid} size="default" type="submit">
          Create team
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ─── 2. Set budget (org + team share one form) ─────────────────────────── */

const DEFAULT_WARN_THRESHOLD = 80;

export function BudgetDialog({
  open,
  onOpenChange,
  onSave,
  title,
  defaultName,
  scope,
  budget,
  hasManager,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSave: (budget: TeamBudget) => void;
  /** "Set org budget" / "Set team budget", or the "Edit …" twin once a
   *  budget exists. Decided at the call site. */
  title: string;
  /** Pre-filled name for a first-time budget. */
  defaultName: string;
  /** Disambiguates the field ids when the org form and a team form are both
   *  reachable from one page. */
  scope: string;
  /** Existing budget to edit; null seeds the form with the defaults. */
  budget: TeamBudget | null;
  /** Whether the team has a manager: decides the alert-recipient line. */
  hasManager: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {/* Scroll shell, not the plain content box: a budget can configure three
          windows at once, and three cap fields on top of name / enforcement /
          warn runs the form past the viewport. Header and the Cancel / Save
          band stay fixed; only the fields scroll. */}
      <DialogScrollContent className="sm:max-w-lg">
        <BudgetBody
          budget={budget}
          defaultName={defaultName}
          hasManager={hasManager}
          onSave={onSave}
          scope={scope}
          title={title}
        />
      </DialogScrollContent>
    </Dialog>
  );
}

function BudgetBody({
  onSave,
  title,
  defaultName,
  scope,
  budget,
  hasManager,
}: {
  onSave: (budget: TeamBudget) => void;
  title: string;
  defaultName: string;
  scope: string;
  budget: TeamBudget | null;
  hasManager: boolean;
}) {
  const [name, setName] = useState(budget?.name ?? defaultName);
  // One budget, several windows: the picker owns WHICH windows are on, and a
  // parallel map owns each one's cap. Amounts are kept as strings so a
  // half-typed field is never coerced to NaN mid-edit.
  const initialWindows: BudgetWindow[] = budget
    ? budgetWindows(budget)
    : ["monthly"];
  const [windows, setWindows] = useState<BudgetWindow[]>(initialWindows);
  const seedAmount = (w: BudgetWindow) =>
    String(budget?.caps[w] ?? BUDGET_WINDOW_DEFAULT_AMOUNT[w]);
  const [amounts, setAmounts] = useState<Partial<Record<BudgetWindow, string>>>(
    () => {
      const seed: Partial<Record<BudgetWindow, string>> = {};
      for (const w of initialWindows) {
        seed[w] = seedAmount(w);
      }
      return seed;
    }
  );
  const [enforcement, setEnforcement] = useState<BudgetEnforcement>(
    budget?.enforcement ?? "soft"
  );
  const [warn, setWarn] = useState(
    String(budget?.warnThreshold ?? DEFAULT_WARN_THRESHOLD)
  );
  const [block, setBlock] = useState(
    String(budget?.blockThreshold ?? DEFAULT_BLOCK_THRESHOLD)
  );
  // Per-budget opt-out for the warning alert's admin copies (PRD 8.2 budget
  // alert recipients; CTO 2026-09-03). Applies to every window of the budget,
  // and only to a SOFT one: a hard budget blocks traffic, and a block is
  // never optional. The manager is always alerted, and the warning badge and
  // amber bar are unaffected — this changes WHO hears, not WHETHER it shows.
  const [notifyAdmins, setNotifyAdmins] = useState(
    budget?.notifyAdmins ?? true
  );
  // Error gating, same contract as Create team: a field's message appears once
  // that field has been blurred. The map is keyed by field, so the three cap
  // rows gate independently. Save stays disabled while anything is invalid.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (key: string) =>
    setTouched((prev) => ({ ...prev, [key]: true }));
  const shows = (key: string) => touched[key] === true;

  // Picking a window is picking a PRESET: a newly selected window arrives
  // pre-filled with its default cap (5h $25 / weekly $200 / monthly $500), or
  // with the saved cap when one exists. Dropping a window drops its row and
  // its edit, so re-adding it starts from the preset again.
  const handleWindows = (next: string[]) => {
    const picked = BUDGET_WINDOW_ORDER.filter((w) => next.includes(w));
    setWindows(picked);
    setAmounts((prev) => {
      const kept: Partial<Record<BudgetWindow, string>> = {};
      for (const w of picked) {
        kept[w] = prev[w] ?? seedAmount(w);
      }
      return kept;
    });
  };

  // Name, at least one window, a positive cap on every selected window, a
  // warn percentage inside 1–100 and, on a hard budget, a block percentage
  // above it (PRD 3 / 8.2 / 11: "warn and block thresholds", "warn at 80%,
  // block at 100%"). Removed 2026-09-02, restored 2026-09-03 on the PRD
  // gut-check: the PRD makes both thresholds configurable. A soft budget
  // never blocks, so its block value is the model default and unvalidated.
  const warnValue = Number(warn);
  const blockValue =
    enforcement === "hard" ? Number(block) : DEFAULT_BLOCK_THRESHOLD;
  // A percentage is a WHOLE number 1–100. `Number.isInteger` also rejects
  // NaN / Infinity, so it subsumes the old `Number.isFinite` guard — 80.5
  // used to validate and save, which no threshold UI in the app can display.
  const inPercentRange = (n: number) =>
    Number.isInteger(n) && n > 0 && n <= 100;
  const amountValid = (w: BudgetWindow) => {
    const n = Number(amounts[w]);
    return Number.isFinite(n) && n > 0;
  };
  const capsValid = windows.every(amountValid);
  const blockValid =
    enforcement !== "hard" ||
    (inPercentRange(blockValue) && blockValue > warnValue);
  const isValid =
    name.trim().length > 0 &&
    windows.length > 0 &&
    capsValid &&
    inPercentRange(warnValue) &&
    blockValid;

  // One message per field, independent of whether it is being shown yet.
  const nameError = name.trim().length > 0 ? null : ERROR_NAME;
  const amountError = (w: BudgetWindow) =>
    amountValid(w) ? null : ERROR_AMOUNT;
  const warnError = inPercentRange(warnValue) ? null : ERROR_PERCENT;
  const blockError = blockValid
    ? null
    : inPercentRange(blockValue)
      ? ERROR_BLOCK_ABOVE_WARN
      : ERROR_PERCENT;

  // Budget windows has no error UI by design: MultiSelect's `minSelected={1}`
  // makes an empty selection unreachable.
  const nameId = `${scope}-budget-name`;
  const warnId = `${scope}-budget-warn`;
  const blockId = `${scope}-budget-block`;
  const amountId = (w: BudgetWindow) => `${scope}-budget-amount-${w}`;
  const notifyId = `${scope}-budget-notify`;
  // Off states the consequence rather than the setting: who is left on the
  // alert, and that the in-app warning does not go anywhere either way.
  const notifyHelp = notifyAdmins
    ? "Org admins and owner are alerted when a window passes its warn threshold."
    : `${hasManager ? "Only the team's manager is alerted." : "No one is alerted."} The warning badge and bar still show.`;
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) {
          return;
        }
        const caps: Partial<Record<BudgetWindow, number>> = {};
        for (const w of windows) {
          caps[w] = Number(amounts[w]);
        }
        onSave({
          name: name.trim(),
          caps,
          enforcement,
          warnThreshold: warnValue,
          blockThreshold: blockValue,
          notifyAdmins,
        });
      }}
    >
      <DialogScrollHeader>
        <DialogTitle className="type-heading-20 text-foreground">
          {title}
        </DialogTitle>
        <DialogDescription>{BUDGET_PRESETS_HELPER_COPY}</DialogDescription>
      </DialogScrollHeader>

      {/* The fields keep their own gap-4 column; the body owns the padding
          and the scrolling. */}
      <DialogScrollBody>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor={nameId}
            >
              Name
            </Label>
            {/* Plain wrapper: `FieldError` owns its own 8px offset from the
                control, exactly as `type-input-helper` does. */}
            <div>
              <Input
                aria-describedby={
                  nameError && shows("name") ? `${nameId}-error` : undefined
                }
                aria-invalid={nameError !== null && shows("name")}
                autoComplete="off"
                className="type-copy-14"
                id={nameId}
                onBlur={() => touch("name")}
                onChange={(e) => setName(e.target.value)}
                spellCheck={false}
                type="text"
                value={name}
              />
              {nameError && shows("name") ? (
                <FieldError className="mt-2" id={`${nameId}-error`}>
                  {nameError}
                </FieldError>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* No `htmlFor`: MultiSelect's trigger is a button that names itself
            through `aria-label`, matching the Add members / Add keys pickers
            this control is shaped after. */}
            <Label className="type-label-14 text-muted-foreground">
              Budget windows
            </Label>
            {/* Plain wrapper, not another gap-2 sibling: `type-input-helper`
            already owns its 8px offset from the control above it. */}
            <div>
              <MultiSelect
                aria-label="Budget windows"
                commitMode
                maxVisibleOptions={4}
                minSelected={1}
                onValueChange={handleWindows}
                options={BUDGET_WINDOW_OPTIONS}
                placeholder="Select windows"
                selectAll={false}
                showSelectedLabels
                value={windows}
              />
              <p className="type-input-helper">
                Pick at least one window. Each window gets its own cap.
              </p>
            </div>
          </div>

          {/* One cap per selected window, in canonical order — a team can run a
          5-hour, a weekly, and a monthly limit at once, and each is its own
          number. Name, enforcement and warn percent stay shared below. */}
          {windows.map((w) => {
            const id = amountId(w);
            const error = amountError(w);
            const showError = error !== null && shows(`amount-${w}`);
            return (
              <div className="flex flex-col gap-2" key={w}>
                <Label
                  className="type-label-14 text-muted-foreground"
                  htmlFor={id}
                >
                  {BUDGET_WINDOW_LABEL[w]} amount (USD)
                </Label>
                <div>
                  <Input
                    aria-describedby={
                      showError ? `${id}-error ${id}-helper` : `${id}-helper`
                    }
                    aria-invalid={showError}
                    autoComplete="off"
                    className="type-mono-14"
                    id={id}
                    min={1}
                    onBlur={() => touch(`amount-${w}`)}
                    onChange={(e) =>
                      setAmounts((prev) => ({ ...prev, [w]: e.target.value }))
                    }
                    step={1}
                    type="number"
                    value={amounts[w] ?? ""}
                  />
                  {/* Error sits directly under the control, above the window
                      helper: the blocking sentence reads first, and the
                      helper stays as standing context rather than being
                      swapped out. */}
                  {showError ? (
                    <FieldError className="mt-2" id={`${id}-error`}>
                      {error}
                    </FieldError>
                  ) : null}
                  <p className="type-input-helper" id={`${id}-helper`}>
                    {BUDGET_WINDOW_HELP[w]}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor={`${scope}-budget-enforcement`}
            >
              Enforcement
            </Label>
            <div>
              <Select
                onValueChange={(v: string) =>
                  setEnforcement(v as BudgetEnforcement)
                }
                value={enforcement}
              >
                <SelectTrigger
                  className="w-full"
                  id={`${scope}-budget-enforcement`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--anchor-width)]">
                  <SelectItem value="soft">
                    {BUDGET_ENFORCEMENT_LABEL.soft}
                  </SelectItem>
                  <SelectItem value="hard">
                    {BUDGET_ENFORCEMENT_LABEL.hard}
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Hard is a production-blocking choice, not a minor toggle
              (AG-695). Warning note card, the same shape the API-key reveal
              and cancel-plan dialogs use for pre-confirm consequences; red is
              reserved for the over-budget / blocked state itself. */}
              {enforcement === "hard" ? (
                <div
                  className="mt-2 rounded-md border border-warning-200 bg-warning-50 p-3 dark:border-warning-500/30 dark:bg-warning-500/15"
                  role="note"
                >
                  <p className="type-copy-14 m-0 text-warning-700 dark:text-warning-300">
                    {BUDGET_HARD_ENFORCEMENT_HELP}
                  </p>
                </div>
              ) : null}
              {/* Soft only: the warning's admin copies are opt-out per budget
              (CTO 2026-09-03). Hard gets no counterpart — the block is the
              enforcement, so it is never optional. Label left / Switch right
              at gap-3, the Notifications channel-row pairing. */}
              {enforcement === "soft" ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      className="type-label-14 text-muted-foreground"
                      htmlFor={notifyId}
                    >
                      Notify org admins on warnings
                    </Label>
                    <Switch
                      aria-describedby={`${notifyId}-helper`}
                      checked={notifyAdmins}
                      className="shrink-0"
                      id={notifyId}
                      onCheckedChange={(next) => setNotifyAdmins(next === true)}
                    />
                  </div>
                  <p className="type-input-helper" id={`${notifyId}-helper`}>
                    {notifyHelp}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor={warnId}
            >
              Warn threshold (% of budget)
            </Label>
            <div>
              <Input
                aria-describedby={
                  warnError && shows("warn") ? `${warnId}-error` : undefined
                }
                aria-invalid={warnError !== null && shows("warn")}
                autoComplete="off"
                className="type-mono-14"
                id={warnId}
                max={100}
                min={1}
                onBlur={() => touch("warn")}
                onChange={(e) => setWarn(e.target.value)}
                step={1}
                type="number"
                value={warn}
              />
              {warnError && shows("warn") ? (
                <FieldError className="mt-2" id={`${warnId}-error`}>
                  {warnError}
                </FieldError>
              ) : null}
              {/* PRD 3 "Budget alert recipients": the one place the person
                  choosing the warn line is told who hears about it. */}
              <p className="type-input-helper" id={`${warnId}-recipients`}>
                {budgetAlertRecipients(
                  hasManager,
                  enforcement === "soft" ? notifyAdmins : true
                )}
              </p>
            </div>
          </div>

          {/* Block threshold, hard budgets only (PRD 8.2 "warn and block
              thresholds"; AG-695 design task "warn and block threshold
              entry"). Soft budgets never block, so the field is absent rather
              than disabled. */}
          {enforcement === "hard" ? (
            <div className="flex flex-col gap-2">
              <Label
                className="type-label-14 text-muted-foreground"
                htmlFor={blockId}
              >
                Block threshold (% of budget)
              </Label>
              <div>
                <Input
                  aria-describedby={
                    blockError && shows("block")
                      ? `${blockId}-error`
                      : undefined
                  }
                  aria-invalid={blockError !== null && shows("block")}
                  autoComplete="off"
                  className="type-mono-14"
                  id={blockId}
                  max={100}
                  min={1}
                  onBlur={() => touch("block")}
                  onChange={(e) => setBlock(e.target.value)}
                  step={1}
                  type="number"
                  value={block}
                />
                {blockError && shows("block") ? (
                  <FieldError className="mt-2" id={`${blockId}-error`}>
                    {blockError}
                  </FieldError>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </DialogScrollBody>

      <DialogScrollFooter>
        <DialogClose
          render={<Button size="default" type="button" variant="outline" />}
        >
          Cancel
        </DialogClose>
        <Button disabled={!isValid} size="default" type="submit">
          Save budget
        </Button>
      </DialogScrollFooter>
    </form>
  );
}

/* ─── 3 + 4. Add members / Add keys (one picker, two labels) ────────────── */

type AddEntitiesCopy = {
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  submitLabel: string;
  /** Shown in place of the picker when nothing is left to add. */
  emptyNote: string;
  /** Optional line under the picker, in the same `type-input-helper` voice
   *  the budget-window field uses. */
  helper?: string;
};

function AddEntitiesDialog({
  open,
  onOpenChange,
  onAdd,
  options,
  copy,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onAdd: (ids: string[]) => void;
  options: MultiSelectOption[];
  copy: AddEntitiesCopy;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <AddEntitiesBody copy={copy} onAdd={onAdd} options={options} />
      </DialogContent>
    </Dialog>
  );
}

function AddEntitiesBody({
  onAdd,
  options,
  copy,
}: {
  onAdd: (ids: string[]) => void;
  options: MultiSelectOption[];
  copy: AddEntitiesCopy;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const hasOptions = options.length > 0;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (selected.length > 0) {
          onAdd(selected);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle className="type-heading-20 text-foreground">
          {copy.title}
        </DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        {/* No `htmlFor`: MultiSelect's trigger is a button that names itself
            through `aria-label`, matching the Audit Trail filter fields. */}
        <Label className="type-label-14 text-muted-foreground">
          {copy.fieldLabel}
        </Label>
        {hasOptions ? (
          // Plain wrapper, not another gap-2 sibling: `type-input-helper`
          // owns its 8px offset from the control above it.
          // Picker shape (2026-09-01, both Add dialogs — this body serves
          // members AND keys, so they cannot drift): 4 rows before the list
          // scrolls, no (Select All) row, and selection STAGED behind the
          // popup's Apply / Cancel footer. Cancel, Escape and click-away all
          // discard, so the trigger count only ever reads applied state.
          <div>
            <MultiSelect
              aria-label={copy.fieldLabel}
              commitMode
              maxVisibleOptions={4}
              onValueChange={setSelected}
              options={options}
              placeholder={copy.placeholder}
              searchable
              selectAll={false}
              value={selected}
            />
            {copy.helper ? (
              <p className="type-input-helper">{copy.helper}</p>
            ) : null}
          </div>
        ) : (
          <p className="type-copy-14 m-0 text-muted-foreground">
            {copy.emptyNote}
          </p>
        )}
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button size="default" type="button" variant="outline" />}
        >
          Cancel
        </DialogClose>
        <Button disabled={selected.length === 0} size="default" type="submit">
          {copy.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

const ADD_MEMBERS_COPY: AddEntitiesCopy = {
  title: "Add members",
  description:
    "Only existing org members can be added, and their keys move with them. This doesn’t send invites.",
  fieldLabel: "Members",
  placeholder: "Select members",
  submitLabel: "Add members",
  emptyNote: "Every org member is already on this team.",
  // PRD 3 / 8.1: a user belongs to exactly one team, so this is a move, not
  // a second assignment. The picker names the team each candidate is leaving.
  helper:
    "Someone already on another team moves here. Their past requests stay with that team; only new traffic counts here.",
};

const ADD_KEYS_COPY: AddEntitiesCopy = {
  title: "Add keys",
  description:
    "Only active keys can be assigned. A key belongs to one team at a time. A key already on another team moves here; its past requests stay with that team.",
  fieldLabel: "API keys",
  placeholder: "Select keys",
  submitLabel: "Add keys",
  emptyNote: "Every active key is already assigned to a team.",
};

export function AddMembersDialog(props: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onAdd: (ids: string[]) => void;
  options: MultiSelectOption[];
}) {
  return <AddEntitiesDialog copy={ADD_MEMBERS_COPY} {...props} />;
}

export function AddKeysDialog(props: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onAdd: (ids: string[]) => void;
  options: MultiSelectOption[];
}) {
  return <AddEntitiesDialog copy={ADD_KEYS_COPY} {...props} />;
}

/* ─── 5. Rename team ────────────────────────────────────────────────────── */

export function RenameTeamDialog({
  open,
  onOpenChange,
  onRename,
  currentName,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onRename: (name: string) => void;
  currentName: string;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <RenameTeamBody currentName={currentName} onRename={onRename} />
      </DialogContent>
    </Dialog>
  );
}

function RenameTeamBody({
  currentName,
  onRename,
}: {
  currentName: string;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const trimmed = name.trim();
  // Save stays inert until the name actually changes — renaming to the same
  // string is a no-op the user shouldn't be able to "confirm".
  const isValid = trimmed.length > 0 && trimmed !== currentName;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) {
          onRename(trimmed);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle className="type-heading-20 text-foreground">
          Rename team
        </DialogTitle>
        <DialogDescription>
          Members and keys stay where they are. Only the name changes.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label
          className="type-label-14 text-muted-foreground"
          htmlFor="team-rename-name"
        >
          Name
        </Label>
        <Input
          autoComplete="off"
          className="type-copy-14"
          id="team-rename-name"
          onChange={(e) => setName(e.target.value)}
          spellCheck={false}
          type="text"
          value={name}
        />
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button size="default" type="button" variant="outline" />}
        >
          Cancel
        </DialogClose>
        <Button disabled={!isValid} size="default" type="submit">
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ─── 6. Delete team ────────────────────────────────────────────────────── */

export function DeleteTeamDialog({
  open,
  onOpenChange,
  onDelete,
  teamName,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onDelete: () => void;
  teamName: string;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="p-4 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Archive {teamName}?</DialogTitle>
          <DialogDescription>
            Members and keys on this team move to the default team. The team
            moves to Archived teams with its usage history. This can&rsquo;t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={onDelete}
            size="default"
            type="button"
            variant="destructive"
          >
            Archive team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 7. Remove key from team ───────────────────────────────────────────── */

/** Removing a key never detaches it — it moves to the default team, so its
 *  spend keeps rolling up somewhere. The confirm exists because the row's
 *  trash glyph reads as "revoke" at a glance, and this is not that. */
export function RemoveTeamKeyDialog({
  open,
  onOpenChange,
  keyLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** `name (sk-gw-…NNNN)` — the same two-part form the table cell shows. */
  keyLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="p-4 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Remove {keyLabel} from this team?</DialogTitle>
          <DialogDescription>
            This key moves to the default team and keeps working. Its past
            requests stay with this team; only new traffic counts toward the
            default team.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={onConfirm}
            size="default"
            type="button"
            variant="destructive"
          >
            Remove key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── 8. Remove member from team ────────────────────────────────────────── */

/** Same contract as the key dialog: a member is never left without a team
 *  (PRD 3 / 8.1, one team per user), so removing them here moves them to the
 *  default team. Confirmed because the trash glyph reads as "remove from the
 *  org" at a glance, and this is not that. */
export function RemoveTeamMemberDialog({
  open,
  onOpenChange,
  memberName,
  keyCount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  memberName: string;
  /** Keys this member owns on the team; they move with them. */
  keyCount: number;
  onConfirm: () => void;
}) {
  const withKeys =
    keyCount === 0
      ? ""
      : ` along with their ${keyCount} ${keyCount === 1 ? "key" : "keys"}`;
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="p-4 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Remove {memberName} from this team?</DialogTitle>
          <DialogDescription>
            They move to the default team{withKeys}, where you can reassign
            them. Their org access is unchanged. Past requests stay with this
            team; only new traffic counts toward the default team.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={onConfirm}
            size="default"
            type="button"
            variant="destructive"
          >
            Remove member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
