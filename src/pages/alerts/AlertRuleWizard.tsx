import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogClose,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogTitleBlock,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InlineCode } from "@/components/ui/inline-code";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { OptionTile } from "@/components/ui/option-tile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stepper,
  StepperBody,
  StepperIndicator,
  StepperItem,
  StepperPanel,
  type StepperState,
  StepperTitle,
} from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  type ALERT_TEMPLATES,
  CONDITION_CATALOG,
  formatObservedValue,
  formatWindow,
  observedValue,
  validateChannelTarget,
  WINDOW_OPTIONS,
} from "./data";
import { ConditionIcon, SeverityIcon } from "./glyphs";
import type {
  AlertChannelType,
  AlertConditionType,
  AlertRule,
  AlertSeverity,
  AlertWindow,
  AlertWindowUnit,
} from "./types";
import {
  CONDITION_ORDER,
  DESCRIBED_TILE,
  newAlertRuleId,
  SEVERITY_TILE_SELECTED,
} from "./view";

/* ─── Alert rule create / edit wizard ───────────────────────────────────────
 * A CENTERED modal, not a Sheet. design.md's rule for the two: Sheet is for
 * INSPECTION (drill into a row and keep reading), Dialog is for a decision.
 * Creating a rule is a decision with a commit point, and the stepped form
 * wants the user's whole attention rather than a page still visible beside it.
 *
 * Three steps on a `<Stepper>`, modelled on Vercel's New Alert Rule flow, with
 * one deliberate divergence: the condition picker is SINGLE-select where
 * Vercel's is a checklist. That is the data contract, not a style choice —
 * `AlertRule.condition` is one `AlertConditionType`, one threshold, one window
 * (see `types.ts`). A multi-select picker would promise rules the model cannot
 * store.
 *
 * NO local form state survives a close: Base UI unmounts `Dialog.Popup` when
 * the dialog closes, so `<WizardForm>` remounts on every open and its
 * `useState` initialisers re-read the props. That is why there is no reset
 * effect and no `key` juggling here.
 * ───────────────────────────────────────────────────────────────────────── */

/** Derived rather than imported: `data.ts` publishes the array, not a name for
 *  its element type. `Alerts.tsx` derives the same one from the same source, so
 *  the two cannot drift. */
type AlertTemplate = (typeof ALERT_TEMPLATES)[number];

type StepIndex = 1 | 2 | 3;

const STEP_TITLES: Record<StepIndex, string> = {
  1: "Choose condition",
  2: "Configure rule",
  3: "Notification channels",
};

/** Subject of the live preview sentence. Not `CONDITION_CATALOG[c].label`: the
 *  labels name the RULE ("Spend threshold"), and a sentence needs the metric
 *  ("Spend"). Every subject is grammatically singular so "is currently" is
 *  always correct — "Guardrail events ... is" would not be. */
const PREVIEW_SUBJECT: Record<AlertConditionType, string> = {
  cost_threshold: "Spend",
  error_rate: "Error rate",
  tokens_per_hour: "Token throughput",
  security_events: "Guardrail event volume",
  latency_p95: "p95 latency",
};

const SEVERITY_OPTIONS: {
  value: AlertSeverity;
  label: string;
  description: string;
}[] = [
  {
    value: "info",
    label: "Info",
    description: "Awareness only. Nobody is expected to act.",
  },
  {
    value: "warning",
    label: "Warning",
    description: "Needs attention soon, but nothing is on fire.",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Act immediately. Page whoever is on call.",
  },
];

const CHANNEL_OPTIONS: { value: AlertChannelType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "slack", label: "Slack" },
  { value: "webhook", label: "Webhook" },
];

const CHANNEL_PLACEHOLDER: Record<AlertChannelType, string> = {
  email: "ops@example.com",
  slack: "#gateway-alerts",
  webhook: "https://…",
};

/** The rule's own window, in the sentence the operator reads under the window
 *  field. Two branches:
 *   • Inside the 7-day horizon → the real reading, phrased off the catalog's
 *     `accrual` ("Spend over the last 2 days is currently $X" for cumulative,
 *     "Error rate measured over the last 2 days is currently X%" for a rate).
 *   • Beyond it → `observedValue` returns null, so there is NO number to show;
 *     the sentence becomes the honest no-history line instead. This is the
 *     load-bearing rule: the preview never invents a figure for a window the
 *     workload has not covered yet. */
function previewSentence(
  condition: AlertConditionType,
  window: AlertWindow
): string {
  const observed = observedValue(condition, window);
  if (observed === null) {
    // Singular reads naturally with the article ("a full month"); plural keeps
    // the count ("a full 3 months"). No em dash, per the house writing style.
    const period =
      window.count === 1 ? window.unit : `${window.count} ${window.unit}s`;
    return `Not enough history yet. Measuring begins once a full ${period} has elapsed.`;
  }
  const measured =
    CONDITION_CATALOG[condition].accrual === "rate" ? " measured" : "";
  const current = formatObservedValue(condition, observed);
  return `${PREVIEW_SUBJECT[condition]}${measured} over the last ${formatWindow(window)} is currently ${current}`;
}

/* ─── Draft state ───────────────────────────────────────────────────────── */

/** A channel row while it is being edited. `uid` exists because rows are added
 *  and removed: keying blur/validation state by array index would move a typed
 *  error onto a different row the moment one above it is deleted. */
type ChannelDraft = {
  uid: string;
  type: AlertChannelType;
  target: string;
};

type Draft = {
  condition: AlertConditionType | null;
  name: string;
  /** Held as a string so the field can be empty or mid-entry ("2." ) without
   *  becoming `NaN`; converted once, on submit. */
  threshold: string;
  /** The window's COUNT, held as a string for the same reason as `threshold` —
   *  an empty or mid-entry field must not collapse to 0 or NaN. Composed with
   *  `windowUnit` into an `AlertWindow` at preview and submit time. */
  windowCount: string;
  windowUnit: AlertWindowUnit;
  severity: AlertSeverity;
  enabled: boolean;
  channels: ChannelDraft[];
};

function channelDraft(type: AlertChannelType, target: string): ChannelDraft {
  return { uid: crypto.randomUUID(), type, target };
}

function initialDraft(
  rule: AlertRule | null,
  template: AlertTemplate | null
): Draft {
  if (rule) {
    return {
      condition: rule.condition,
      name: rule.name,
      threshold: String(rule.threshold),
      windowCount: String(rule.window.count),
      windowUnit: rule.window.unit,
      severity: rule.severity,
      enabled: rule.enabled,
      channels: rule.channels.map((channel) =>
        channelDraft(channel.type, channel.target)
      ),
    };
  }
  if (template) {
    return {
      condition: template.condition,
      name: template.name,
      threshold: String(template.threshold),
      windowCount: String(template.window.count),
      windowUnit: template.window.unit,
      severity: template.severity,
      enabled: true,
      // The template picks the channel TYPE and leaves the target blank —
      // where the notification goes is the operator's to supply, and
      // `validateChannelTarget` gates it.
      channels: [channelDraft(template.channelType, "")],
    };
  }
  return {
    condition: null,
    name: "",
    threshold: "",
    // A one-day lookback: the shortest supported window, and the one that
    // always has real data behind it.
    windowCount: "1",
    windowUnit: "day",
    // The middle rung. A rule someone just built deliberately is not usually
    // pure FYI, and it is not usually a page-someone either.
    severity: "warning",
    enabled: true,
    channels: [channelDraft("email", "")],
  };
}

/** Strip everything except digits and at most one decimal point, so a pasted
 *  "$5,000" recovers a clean numeric string. Mirrors the same normalisation on
 *  the Limits create form; the display-grouping half is deliberately left out
 *  here because the trailing unit adornment already tells the reader what the
 *  number is. */
function normalizeThreshold(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
}

/** Digits only. The window count is a positive integer, so no decimal point,
 *  sign, or separator survives; an empty string is preserved for mid-entry. */
function normalizeCount(raw: string): string {
  return raw.replace(/\D/g, "");
}

/* ─── Shell ─────────────────────────────────────────────────────────────── */

export type AlertRuleWizardProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** The rule being edited, or `null` to create. */
  rule?: AlertRule | null;
  /** Pre-fill for a create started from a starter template. Ignored in edit. */
  template?: AlertTemplate | null;
  /** Fires once, with a complete rule, on a valid submit. */
  onSubmit: (rule: AlertRule) => void;
};

export function AlertRuleWizard({
  open,
  onOpenChange,
  rule = null,
  template = null,
  onSubmit,
}: AlertRuleWizardProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogScrollContent className="sm:max-w-[560px]">
        <WizardForm
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          rule={rule}
          template={template}
        />
      </DialogScrollContent>
    </Dialog>
  );
}

/* ─── Form ──────────────────────────────────────────────────────────────── */

function WizardForm({
  rule,
  template,
  onSubmit,
  onOpenChange,
}: {
  rule: AlertRule | null;
  template: AlertTemplate | null;
  onSubmit: (rule: AlertRule) => void;
  onOpenChange: (next: boolean) => void;
}) {
  const isEdit = rule !== null;
  const [draft, setDraft] = useState<Draft>(() => initialDraft(rule, template));
  const [step, setStep] = useState<StepIndex>(() => {
    if (isEdit) {
      return 1;
    }
    return template ? 2 : 1;
  });
  const [complete, setComplete] = useState<Record<StepIndex, boolean>>(() => {
    if (isEdit) {
      return { 1: true, 2: true, 3: true };
    }
    return { 1: Boolean(template), 2: false, 3: false };
  });
  // Errors appear only after the user has tried to leave a step (or has left a
  // channel field) — a form that turns red before you have typed in it is
  // reporting its own initial state, not your mistake.
  const [attempted, setAttempted] = useState<Record<StepIndex, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateDraft = (patch: Partial<Draft>) =>
    setDraft((previous) => ({ ...previous, ...patch }));

  /* ─── Validity ─────────────────────────────────────────────────────── */

  const thresholdNumber = Number(draft.threshold);
  const nameValid = draft.name.trim().length > 0;
  const thresholdValid =
    draft.threshold.trim() !== "" &&
    Number.isFinite(thresholdNumber) &&
    thresholdNumber > 0;
  // The window count is a positive integer. "0", "", "-2", "1.5" are all
  // rejected — a lookback of less than one unit is not a duration.
  const windowCountNumber = Number(draft.windowCount);
  const windowValid =
    draft.windowCount.trim() !== "" &&
    Number.isInteger(windowCountNumber) &&
    windowCountNumber >= 1;
  // The composed window, once the count is a legal integer — the one value the
  // preview and the submit both read, so they cannot disagree.
  const draftWindow: AlertWindow | null = windowValid
    ? { count: windowCountNumber, unit: draft.windowUnit }
    : null;
  const channelErrors = draft.channels.map((channel) =>
    validateChannelTarget(channel.type, channel.target)
  );
  const stepValid: Record<StepIndex, boolean> = {
    1: draft.condition !== null,
    2: nameValid && thresholdValid && windowValid,
    3:
      draft.channels.length > 0 &&
      channelErrors.every((error) => error === null),
  };

  /* ─── Navigation ───────────────────────────────────────────────────── */

  const stepState = (index: StepIndex): StepperState => {
    if (index === step) {
      return "active";
    }
    return complete[index] ? "complete" : "upcoming";
  };

  /** A finished step's title is a control that returns you to it. An upcoming
   *  one is not — jumping forward past a step you have not filled in is how a
   *  wizard ends up submitting a half-built rule. */
  const revisit = (index: StepIndex) =>
    complete[index] && index !== step ? () => setStep(index) : undefined;

  const advance = (from: StepIndex, to: StepIndex) => {
    setAttempted((previous) => ({ ...previous, [from]: true }));
    if (!stepValid[from]) {
      return;
    }
    setComplete((previous) => ({ ...previous, [from]: true }));
    setStep(to);
  };

  const handleSubmit = () => {
    setAttempted({ 1: true, 2: true, 3: true });
    // Reopen the step that is actually blocking, rather than failing where the
    // user is standing. A step behind you is COLLAPSED, so an invalid name on
    // step 2 would otherwise reject the submit with its error message hidden —
    // a dead button and no reason given.
    if (draft.condition === null) {
      setStep(1);
      return;
    }
    if (!stepValid[2]) {
      setStep(2);
      return;
    }
    // stepValid[2] already implies a legal window; this narrows the type and
    // is a no-op guard in practice.
    if (draftWindow === null) {
      setStep(2);
      return;
    }
    if (!stepValid[3]) {
      return;
    }
    onSubmit({
      id: rule?.id ?? newAlertRuleId(),
      name: draft.name.trim(),
      condition: draft.condition,
      threshold: Number(draft.threshold),
      window: draftWindow,
      severity: draft.severity,
      enabled: draft.enabled,
      channels: draft.channels.map((channel) => ({
        type: channel.type,
        target: channel.target.trim(),
      })),
      // An edit keeps the rule's history; a new rule has none yet.
      createdAt: rule?.createdAt ?? new Date(),
      lastFiredAt: rule?.lastFiredAt ?? null,
    });
    onOpenChange(false);
  };

  /* ─── Channels ─────────────────────────────────────────────────────── */

  const patchChannel = (uid: string, patch: Partial<ChannelDraft>) =>
    setDraft((previous) => ({
      ...previous,
      channels: previous.channels.map((channel) =>
        channel.uid === uid ? { ...channel, ...patch } : channel
      ),
    }));

  const addChannel = () =>
    setDraft((previous) => ({
      ...previous,
      channels: [...previous.channels, channelDraft("email", "")],
    }));

  const removeChannel = (uid: string) =>
    setDraft((previous) => ({
      ...previous,
      channels: previous.channels.filter((channel) => channel.uid !== uid),
    }));

  /* ─── Render ───────────────────────────────────────────────────────── */

  const conditionMeta = draft.condition
    ? CONDITION_CATALOG[draft.condition]
    : null;

  return (
    <>
      <DialogScrollHeader>
        <DialogTitleBlock
          meta={
            rule ? (
              <span className="inline-flex items-center gap-1">
                <InlineCode size="sm">{rule.id}</InlineCode>
                <CopyButton
                  label="alert rule ID"
                  mode="icon"
                  size="inline-xs"
                  value={rule.id}
                />
              </span>
            ) : undefined
          }
        >
          {isEdit ? "Edit alert rule" : "Create alert rule"}
        </DialogTitleBlock>
      </DialogScrollHeader>

      <DialogScrollBody>
        <Stepper>
          {/* ── Step 1 — condition ─────────────────────────────────── */}
          <StepperItem index={1} state={stepState(1)}>
            <StepperIndicator />
            <StepperBody>
              <StepperTitle onClick={revisit(1)}>{STEP_TITLES[1]}</StepperTitle>
              <StepperPanel>
                <div
                  aria-label="Condition"
                  className="grid gap-2"
                  role="radiogroup"
                >
                  {CONDITION_ORDER.map((condition) => {
                    const meta = CONDITION_CATALOG[condition];
                    return (
                      <OptionTile
                        className={DESCRIBED_TILE}
                        key={condition}
                        onClick={() => updateDraft({ condition })}
                        selected={draft.condition === condition}
                      >
                        {/* The glyph sits INSIDE the title row, before the
                            text, and takes no colour of its own — it inherits
                            the title's ink so it reads as part of the label
                            rather than as an icon column beside it. */}
                        <span className="type-label-14 flex items-center gap-2 text-foreground">
                          <ConditionIcon condition={condition} />
                          {meta.label}
                        </span>
                        <span className="type-copy-14 text-pretty text-muted-foreground">
                          {meta.description}
                        </span>
                      </OptionTile>
                    );
                  })}
                </div>
              </StepperPanel>
            </StepperBody>
          </StepperItem>

          {/* ── Step 2 — configure ─────────────────────────────────── */}
          <StepperItem index={2} state={stepState(2)}>
            <StepperIndicator />
            <StepperBody>
              <StepperTitle onClick={revisit(2)}>{STEP_TITLES[2]}</StepperTitle>
              <StepperPanel>
                <Field data-invalid={attempted[2] && !nameValid}>
                  <FieldLabel
                    className="text-muted-foreground"
                    htmlFor="alert-rule-name"
                  >
                    Name
                  </FieldLabel>
                  <Input
                    aria-invalid={attempted[2] && !nameValid}
                    id="alert-rule-name"
                    onChange={(event) =>
                      updateDraft({ name: event.target.value })
                    }
                    placeholder={template?.name ?? "e.g. Daily spend cap"}
                    value={draft.name}
                  />
                  {attempted[2] && !nameValid ? (
                    <FieldError>
                      Name the rule so you can find it in the table later.
                    </FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={attempted[2] && !thresholdValid}>
                  <FieldLabel
                    className="text-muted-foreground"
                    htmlFor="alert-rule-threshold"
                  >
                    Threshold
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      aria-invalid={attempted[2] && !thresholdValid}
                      className="type-mono-14"
                      id="alert-rule-threshold"
                      inputMode="decimal"
                      onChange={(event) =>
                        updateDraft({
                          threshold: normalizeThreshold(event.target.value),
                        })
                      }
                      placeholder="0"
                      type="text"
                      value={draft.threshold}
                    />
                    {conditionMeta ? (
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>
                          {conditionMeta.thresholdSuffix}
                        </InputGroupText>
                      </InputGroupAddon>
                    ) : null}
                  </InputGroup>
                  {attempted[2] && !thresholdValid ? (
                    <FieldError>Enter a threshold above 0.</FieldError>
                  ) : null}
                </Field>

                <div className="flex flex-col">
                  <Field data-invalid={attempted[2] && !windowValid}>
                    <FieldLabel
                      className="text-muted-foreground"
                      htmlFor="alert-rule-window-count"
                    >
                      Time window
                    </FieldLabel>
                    {/* A composed duration: a count + a unit. The count is a
                        narrow number field; the unit dropdown fills the rest of
                        the row. Reads straight into the preview below — "over
                        the last 2 days". */}
                    <div className="flex items-start gap-2">
                      <Input
                        aria-invalid={attempted[2] && !windowValid}
                        aria-label="Time window count"
                        className="type-mono-14 w-20 shrink-0"
                        id="alert-rule-window-count"
                        inputMode="numeric"
                        onChange={(event) =>
                          updateDraft({
                            windowCount: normalizeCount(event.target.value),
                          })
                        }
                        placeholder="1"
                        type="text"
                        value={draft.windowCount}
                      />
                      <Select
                        onValueChange={(value) =>
                          updateDraft({ windowUnit: value as AlertWindowUnit })
                        }
                        value={draft.windowUnit}
                      >
                        {/* No `htmlFor` on a Select's label — a `<label for>`
                            forwards clicks to its control, so the field label
                            sits on the count input and the unit trigger carries
                            its own accessible name (design.md §7 Selectors). */}
                        <SelectTrigger
                          aria-label="Time window unit"
                          className="flex-1"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WINDOW_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {attempted[2] && !windowValid ? (
                      <FieldError>
                        Enter a whole number of 1 or more.
                      </FieldError>
                    ) : null}
                  </Field>

                  {/* The live reading sits under the window row because it
                      depends on the window as much as the condition: it re-reads
                      the moment either changes. Inside the 7-day horizon it is
                      the real figure; beyond it (any month, any year, weeks or
                      days past a week) `previewSentence` returns the honest
                      no-history line, never a fabricated number. Hidden only
                      while the count is empty or below 1 — the FieldError above
                      already explains that. */}
                  {draft.condition && draftWindow ? (
                    <p className="type-input-helper">
                      {previewSentence(draft.condition, draftWindow)}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  {/* A label ABOVE a control group is a group label, not a
                      paired `<Label>` — quiet ink so the choices lead the eye
                      (design.md §7 "Field group label"). */}
                  <p className="type-label-14 m-0 text-muted-foreground">
                    Severity
                  </p>
                  <div
                    aria-label="Severity"
                    className="grid gap-2"
                    role="radiogroup"
                  >
                    {SEVERITY_OPTIONS.map((option) => (
                      <OptionTile
                        // Selected tiles carry their SEMANTIC tone, the same
                        // recipe the Policies action cards use. Unselected ones
                        // keep the primitive's neutral chrome, so the tinted
                        // border+fill is the selection signal rather than a
                        // permanent colour wash on all three.
                        className={cn(
                          DESCRIBED_TILE,
                          draft.severity === option.value &&
                            SEVERITY_TILE_SELECTED[option.value]
                        )}
                        key={option.value}
                        onClick={() => updateDraft({ severity: option.value })}
                        selected={draft.severity === option.value}
                      >
                        <span className="type-label-14 flex items-center gap-2 text-foreground">
                          <SeverityIcon severity={option.value} />
                          {option.label}
                        </span>
                        <span className="type-copy-14 text-pretty text-muted-foreground">
                          {option.description}
                        </span>
                      </OptionTile>
                    ))}
                  </div>
                </div>

                <Field orientation="horizontal">
                  <FieldLabel
                    className="text-muted-foreground"
                    htmlFor="alert-rule-enabled"
                  >
                    Enabled
                  </FieldLabel>
                  <Switch
                    checked={draft.enabled}
                    id="alert-rule-enabled"
                    onCheckedChange={(checked) =>
                      updateDraft({ enabled: checked })
                    }
                  />
                </Field>
              </StepperPanel>
            </StepperBody>
          </StepperItem>

          {/* ── Step 3 — channels ──────────────────────────────────── */}
          <StepperItem index={3} state={stepState(3)}>
            <StepperIndicator />
            <StepperBody>
              <StepperTitle onClick={revisit(3)}>{STEP_TITLES[3]}</StepperTitle>
              <StepperPanel>
                {draft.channels.map((channel, index) => {
                  const error = channelErrors[index];
                  const showError =
                    Boolean(error) && (touched[channel.uid] || attempted[3]);
                  return (
                    <Field data-invalid={showError} key={channel.uid}>
                      <div className="flex items-center gap-2">
                        <Select
                          onValueChange={(value) =>
                            patchChannel(channel.uid, {
                              type: value as AlertChannelType,
                            })
                          }
                          value={channel.type}
                        >
                          <SelectTrigger
                            aria-label={`Channel ${index + 1} type`}
                            className="w-32 shrink-0"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHANNEL_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          aria-invalid={showError}
                          aria-label={`Channel ${index + 1} target`}
                          autoComplete="off"
                          className="min-w-0 flex-1"
                          onBlur={() =>
                            setTouched((previous) => ({
                              ...previous,
                              [channel.uid]: true,
                            }))
                          }
                          onChange={(event) =>
                            patchChannel(channel.uid, {
                              target: event.target.value,
                            })
                          }
                          placeholder={CHANNEL_PLACEHOLDER[channel.type]}
                          spellCheck={false}
                          value={channel.target}
                        />
                        <Button
                          aria-label={`Remove channel ${index + 1}`}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => removeChannel(channel.uid)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2Icon aria-hidden />
                        </Button>
                      </div>
                      {showError ? <FieldError>{error}</FieldError> : null}
                    </Field>
                  );
                })}

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-fit"
                    onClick={addChannel}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PlusIcon aria-hidden data-icon="inline-start" />
                    Add channel
                  </Button>
                  {attempted[3] && draft.channels.length === 0 ? (
                    <FieldError>
                      Add at least one notification channel. A rule with nowhere
                      to send fires silently.
                    </FieldError>
                  ) : null}
                </div>
              </StepperPanel>
            </StepperBody>
          </StepperItem>
        </Stepper>
      </DialogScrollBody>

      <DialogScrollFooter>
        {step === 1 ? (
          <DialogClose
            render={<Button size="default" type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
        ) : (
          <Button
            onClick={() => setStep(step === 3 ? 2 : 1)}
            size="default"
            type="button"
            variant="outline"
          >
            Back
          </Button>
        )}
        {step === 3 ? (
          <Button onClick={handleSubmit} size="default" type="button">
            {isEdit ? "Save changes" : "Create alert"}
          </Button>
        ) : (
          <Button
            disabled={step === 1 && !stepValid[1]}
            onClick={() => advance(step, step === 1 ? 2 : 3)}
            size="default"
            type="button"
          >
            Next
          </Button>
        )}
      </DialogScrollFooter>
    </>
  );
}
