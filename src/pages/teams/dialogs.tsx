import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUDGET_ENFORCEMENT_LABEL,
  BUDGET_PRESETS_HELPER_COPY,
  BUDGET_WINDOW_DEFAULT_AMOUNT,
  BUDGET_WINDOW_HELP,
  BUDGET_WINDOW_OPTIONS,
  type BudgetEnforcement,
  type BudgetWindow,
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
      <DialogContent className="gap-4 sm:max-w-lg">
        <BudgetBody
          budget={budget}
          defaultName={defaultName}
          onSave={onSave}
          scope={scope}
          title={title}
        />
      </DialogContent>
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
  const initialWindow: BudgetWindow = budget?.window ?? "monthly";
  const [window, setWindow] = useState<BudgetWindow>(initialWindow);
  const [amount, setAmount] = useState(
    String(budget?.amount ?? BUDGET_WINDOW_DEFAULT_AMOUNT[initialWindow])
  );
  const [enforcement, setEnforcement] = useState<BudgetEnforcement>(
    budget?.enforcement ?? "soft"
  );
  const [warn, setWarn] = useState(
    String(budget?.warnThreshold ?? DEFAULT_WARN_THRESHOLD)
  );

  // A hard budget blocks at the amount itself — there is no second threshold
  // to validate, so what is left is a name, a positive cap, and a warn
  // percentage inside 1–100.
  const amountValue = Number(amount);
  const warnValue = Number(warn);
  const inPercentRange = (n: number) => Number.isFinite(n) && n > 0 && n <= 100;
  const isValid =
    name.trim().length > 0 &&
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    inPercentRange(warnValue);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) {
          return;
        }
        onSave({
          name: name.trim(),
          window,
          amount: amountValue,
          enforcement,
          warnThreshold: warnValue,
        });
      }}
    >
      <DialogHeader>
        <DialogTitle className="type-heading-18 text-foreground">
          {title}
        </DialogTitle>
        <DialogDescription>{BUDGET_PRESETS_HELPER_COPY}</DialogDescription>
      </DialogHeader>

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
        <Label className="type-label-14 text-muted-foreground">
          Budget window
        </Label>
        {/* Plain wrapper, not another gap-2 sibling: `type-input-helper`
            already owns its 8px offset from the control above it. */}
        <div>
          <Segmented
            aria-label="Budget window"
            onChange={(v) => {
              const next = v as BudgetWindow;
              if (next === window) {
                return;
              }
              // Picking a window is picking a PRESET: the amount refills from
              // that window's default (5h $25 / weekly $200 / monthly $500),
              // still editable before saving. Guarded on an actual change so
              // re-selecting the current window never clobbers an edited cap.
              setWindow(next);
              setAmount(String(BUDGET_WINDOW_DEFAULT_AMOUNT[next]));
            }}
            options={BUDGET_WINDOW_OPTIONS}
            size="sm"
            value={window}
            variant="pill"
          />
          <p className="type-input-helper">{BUDGET_WINDOW_HELP[window]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="type-label-14 text-muted-foreground"
          htmlFor={`${scope}-budget-amount`}
        >
          Budget amount (USD)
        </Label>
        <Input
          autoComplete="off"
          className="type-mono-14"
          id={`${scope}-budget-amount`}
          min={1}
          onChange={(e) => setAmount(e.target.value)}
          step={1}
          type="number"
          value={amount}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="type-label-14 text-muted-foreground"
          htmlFor={`${scope}-budget-enforcement`}
        >
          Enforcement
        </Label>
        <Select
          onValueChange={(v: string) => setEnforcement(v as BudgetEnforcement)}
          value={enforcement}
        >
          <SelectTrigger className="w-full" id={`${scope}-budget-enforcement`}>
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

      <DialogFooter>
        <DialogClose
          render={<Button size="default" type="button" variant="outline" />}
        >
          Cancel
        </DialogClose>
        <Button disabled={!isValid} size="default" type="submit">
          Save budget
        </Button>
      </DialogFooter>
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
          <div>
            <MultiSelect
              aria-label={copy.fieldLabel}
              onValueChange={setSelected}
              options={options}
              placeholder={copy.placeholder}
              searchable
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
    "Only existing org members can be added. This doesn’t send invites.",
  fieldLabel: "Members",
  placeholder: "Select members",
  submitLabel: "Add members",
  emptyNote: "Every org member is already on this team.",
  // PRD 3 / 8.1: a user belongs to exactly one team, so this is a move, not
  // a second assignment. The picker names the team each candidate is leaving.
  helper:
    "Someone already on another team moves here — they can only be on one.",
};

const ADD_KEYS_COPY: AddEntitiesCopy = {
  title: "Add keys",
  description:
    "Only active keys can be assigned. A key belongs to one team at a time.",
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
            Members and keys on this team move to the default team. This
            can&rsquo;t be undone.
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
            This key moves to the default team. It keeps working, and only its
            team attribution changes.
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
