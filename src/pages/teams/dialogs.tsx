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
  budgetWindows,
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
  const isValid = name.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) {
          onCreate(name.trim());
        }
      }}
    >
      <DialogHeader>
        <DialogTitle className="type-heading-18 text-foreground">
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
        <Input
          autoComplete="off"
          className="type-copy-14"
          id="team-create-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Platform"
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
}: {
  onSave: (budget: TeamBudget) => void;
  title: string;
  defaultName: string;
  scope: string;
  budget: TeamBudget | null;
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

  // A hard budget blocks at each window's cap itself — there is no second
  // threshold to validate, so what is left is a name, at least one window,
  // a positive cap on every selected window, and a warn percentage inside
  // 1–100.
  const warnValue = Number(warn);
  const inPercentRange = (n: number) => Number.isFinite(n) && n > 0 && n <= 100;
  const capsValid = windows.every((w) => {
    const n = Number(amounts[w]);
    return Number.isFinite(n) && n > 0;
  });
  const isValid =
    name.trim().length > 0 &&
    windows.length > 0 &&
    capsValid &&
    inPercentRange(warnValue);

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
        });
      }}
    >
      <DialogScrollHeader>
        <DialogTitle className="type-heading-18 text-foreground">
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
              htmlFor={`${scope}-budget-name`}
            >
              Name
            </Label>
            <Input
              autoComplete="off"
              className="type-copy-14"
              id={`${scope}-budget-name`}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
              type="text"
              value={name}
            />
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
          {windows.map((w) => (
            <div className="flex flex-col gap-2" key={w}>
              <Label
                className="type-label-14 text-muted-foreground"
                htmlFor={`${scope}-budget-amount-${w}`}
              >
                {BUDGET_WINDOW_LABEL[w]} amount (USD)
              </Label>
              <div>
                <Input
                  autoComplete="off"
                  className="type-mono-14"
                  id={`${scope}-budget-amount-${w}`}
                  min={1}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [w]: e.target.value }))
                  }
                  step={1}
                  type="number"
                  value={amounts[w] ?? ""}
                />
                <p className="type-input-helper">{BUDGET_WINDOW_HELP[w]}</p>
              </div>
            </div>
          ))}

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
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="type-label-14 text-muted-foreground"
              htmlFor={`${scope}-budget-warn`}
            >
              Warn threshold (% of budget)
            </Label>
            <Input
              autoComplete="off"
              className="type-mono-14"
              id={`${scope}-budget-warn`}
              max={100}
              min={1}
              onChange={(e) => setWarn(e.target.value)}
              step={1}
              type="number"
              value={warn}
            />
          </div>
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
        <DialogTitle className="type-heading-18 text-foreground">
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
        <DialogTitle className="type-heading-18 text-foreground">
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
      <DialogContent className="p-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {teamName}?</DialogTitle>
          <DialogDescription>
            Members and keys on this team move to the default team. The team and
            its history are removed. This can&rsquo;t be undone.
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
            Delete team
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
      <DialogContent className="p-4 sm:max-w-sm">
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
      <DialogContent className="p-4 sm:max-w-sm">
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
