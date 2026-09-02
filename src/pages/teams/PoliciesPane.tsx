import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import type { TeamRow } from "@/data/teams";
import { cn } from "@/lib/utils";
import {
  ACTION_ACTIVE_BORDER,
  ACTION_ACTIVE_FILL,
  ACTION_ACTIVE_RADIO,
  ACTION_HOVER,
  DEFAULT_ACTION,
  FREE_TOGGLE_CARD,
  ICON_COLOR,
  type LucideIcon,
  POLICIES,
  type PolicyConfig,
  type PolicyState,
  SCAN_DIRECTION_ICON,
  SCAN_DIRECTION_TITLE,
} from "@/pages/policies/config";

/* ─────────────────────────────────────────────────────────────────────────
 * Team detail → Policies tab, ENTERPRISE ONLY (route:
 * /teams-enterprise/:teamId).
 *
 * The org Policies page's Pro body, scoped to one team (AG-624 / PRD 8.5:
 * team-level policies for security features). Same clone shape as the
 * Security tab: chrome (`DashboardChrome`, `PageTitle`, the intro copy) and
 * every Free-plan branch are dropped, the card stack itself is verbatim, so a
 * reader who knows the org page already knows this tab.
 *
 * State lives on the team row (`team.policies`, seeded from the org defaults
 * via `TEAM_POLICIES_SEED`); this pane is a controlled surface and every edit
 * hands the whole array back through `onChange`, the way `BudgetPane` hands
 * back `budget`.
 *
 * NOT in this phase (deliberately absent, do not infer them from the ticket):
 * org-level forced settings, the org → team lock cascade, the locked
 * read-only rendering with "who set this", and the not-entitled state. Every
 * control here is live and editable.
 * ───────────────────────────────────────────────────────────────────────── */

export function TeamPoliciesPane({
  team,
  onChange,
}: {
  team: TeamRow;
  onChange: (policies: PolicyState[]) => void;
}) {
  const policies = team.policies;

  const toggleEnabled = (id: string) =>
    onChange(
      policies.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  const setSensitivity = (id: string, value: string) =>
    onChange(
      policies.map((p) => (p.id === id ? { ...p, sensitivity: value } : p))
    );
  const setScanDirection = (id: string, value: string) =>
    onChange(
      policies.map((p) => (p.id === id ? { ...p, scanDirection: value } : p))
    );
  const setAction = (id: string, value: string) =>
    onChange(policies.map((p) => (p.id === id ? { ...p, action: value } : p)));

  const visiblePolicies = (() => {
    const byId = new Map(policies.map((p) => [p.id, p]));
    return POLICIES.map((cfg) => ({
      cfg,
      state: byId.get(cfg.id)!,
    }));
  })();

  return (
    <div className="flex flex-col gap-4">
      {visiblePolicies.map(({ cfg, state }) => (
        <PolicyCard
          config={cfg}
          key={cfg.id}
          onActionChange={(v) => setAction(cfg.id, v)}
          onScanDirectionChange={(v) => setScanDirection(cfg.id, v)}
          onSensitivityChange={(v) => setSensitivity(cfg.id, v)}
          onToggle={() => toggleEnabled(cfg.id)}
          state={state}
        />
      ))}
    </div>
  );
}

/* ─── Policy card ───────────────────────────────────────────────────── */

function PolicyCard({
  config,
  state,
  onToggle,
  onSensitivityChange,
  onScanDirectionChange,
  onActionChange,
}: {
  config: PolicyConfig;
  state: PolicyState;
  onToggle: () => void;
  onSensitivityChange: (value: string) => void;
  onScanDirectionChange: (value: string) => void;
  onActionChange: (value: string) => void;
}) {
  const Icon = config.icon;

  // The header is a collapse chevron and the enable toggle lives in the
  // body's first card. `expanded` controls visibility; `state.enabled` (the
  // in-body toggle) controls whether the option panels are active. Cards
  // start COLLAPSED on every load to keep the tab clean; the user opens the
  // ones they want to tune.
  const [expanded, setExpanded] = useState(false);
  const bodyOpen = expanded;
  const toggleCard = FREE_TOGGLE_CARD[config.id];

  // When the in-body enable toggle is off, dim + disable the option panels
  // below it (the enable card itself stays interactive).
  const optionsDim = state.enabled
    ? undefined
    : "pointer-events-none select-none opacity-50";
  const actionPanel = (
    <Card
      className={cn(
        "rounded-sm border border-border bg-transparent shadow-none",
        optionsDim
      )}
    >
      <CardContent>
        <ActionHalf
          config={config}
          onChange={onActionChange}
          value={state.action}
        />
      </CardContent>
    </Card>
  );
  const settingsPanel = (
    <Card
      className={cn(
        "rounded-sm border border-border bg-transparent shadow-none",
        optionsDim
      )}
    >
      <CardContent>
        <SettingsHalf
          config={config}
          onScanDirectionChange={onScanDirectionChange}
          onSensitivityChange={onSensitivityChange}
          state={state}
        />
      </CardContent>
    </Card>
  );

  return (
    // When expanded, the neutral-50 body tray runs full-bleed to the card's
    // bottom edge — drop the Card's bottom padding so there's no white
    // gutter below the tray. Must match the `data-[density=default]:`
    // variant or tailwind-merge won't override the Card's `py-4`.
    // Collapsed cards keep the default py-4.
    <Card className={bodyOpen ? "data-[density=default]:pb-0" : undefined}>
      {/* Header — top row (icon + title + badge + chevron), then the
          description on its own full-width row below. */}
      <div className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-3">
          {/* Bare lucide icon — no wrapper box. Centered on the title line. */}
          <span className="flex h-6 shrink-0 items-center">
            <Icon
              aria-hidden
              className="size-5"
              style={{ color: ICON_COLOR[config.id] }}
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h3 className="type-heading-16 m-0 text-balance text-foreground">
              {config.name}
            </h3>
          </div>
          <span className="flex h-6 shrink-0 items-center">
            <StatusBadge on={state.enabled} />
          </span>
          <IconActionButton
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${config.name} settings`}
            className="shrink-0"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown
              aria-hidden
              className={cn(
                "size-5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                expanded && "rotate-180"
              )}
              strokeWidth={1.75}
            />
          </IconActionButton>
        </div>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {config.description}
        </p>
      </div>

      {/* Expanded settings body. The panels (enable toggle, Action,
          Sensitivity) are flat siblings. */}
      {bodyOpen ? (
        <div className="flex flex-col gap-3 border-border border-t bg-card p-4">
          <PolicyEnableCard
            description={
              config.id === "prompt-injection"
                ? "Everything in basic, plus advanced detection that catches the sophisticated attacks pattern checks miss."
                : toggleCard.description
            }
            enabled={state.enabled}
            onToggle={onToggle}
            title={
              config.id === "prompt-injection"
                ? "Enable advanced protection"
                : toggleCard.title
            }
          />
          {actionPanel}
          {settingsPanel}
        </div>
      ) : null}
    </Card>
  );
}

/* ─── In-body enable card ───────────────────────────────────────────────
 * Full-width card pinned atop each policy's Action / Sensitivity stack — the
 * enable toggle the header chevron no longer carries. Same markup as the org
 * page's card; the Free-only `badge` slot is gone with the Free branches. */

function PolicyEnableCard({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="rounded-sm border border-border bg-transparent shadow-none">
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionHeading as="h4" className="type-heading-16">
                {title}
              </SectionHeading>
            </div>
            {description ? (
              <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Switch
            aria-label={`${title} — ${enabled ? "enabled" : "disabled"}`}
            checked={enabled}
            className="shrink-0"
            onCheckedChange={onToggle}
            size="lg"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Left half — Sensitivity / Scan direction ──────────────────────── */

function SettingsHalf({
  config,
  state,
  onSensitivityChange,
  onScanDirectionChange,
}: {
  config: PolicyConfig;
  state: PolicyState;
  onSensitivityChange: (value: string) => void;
  onScanDirectionChange: (value: string) => void;
}) {
  if (config.sensitivity) {
    const options = config.sensitivity.options;
    const value = state.sensitivity ?? options[0].value;
    const selectedIndex = Math.max(
      0,
      options.findIndex((o) => o.value === value)
    );
    // Filled rail span: 0 at the first stop, full at the last. Rail is inset
    // by half a dot (left-2/right-2 = 0.5rem each), so subtract 1rem.
    const fillFraction =
      options.length > 1 ? selectedIndex / (options.length - 1) : 0;
    return (
      <div className="flex flex-col">
        <div className="flex flex-col gap-1">
          <SectionHeading as="h4" className="type-heading-16">
            Sensitivity
          </SectionHeading>
          <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
            How aggressive to be when scoring inputs
          </p>
        </div>

        {/* Trade-off spectrum: a filled rail with one dot per level. Reads as
            a slider — fewer false positives at the lenient end, more coverage
            at the aggressive end. Keyboard nav comes from RadioGroup.
            Constrained to half the card width so the rail isn't overlong. */}
        <div className="mt-6 flex flex-col gap-2">
          <RadioGroup
            aria-label="Sensitivity"
            className="relative flex w-full items-center justify-between gap-0 py-1"
            onValueChange={onSensitivityChange}
            value={value}
          >
            {/* Rail (unfilled) + filled portion, behind the dots. */}
            <span
              aria-hidden
              className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border"
            />
            <span
              aria-hidden
              className="absolute top-1/2 left-2 h-1 -translate-y-1/2 rounded-full bg-muted-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `calc((100% - 1rem) * ${fillFraction})` }}
            />
            {/* Sliding thumb — glides between stops on the strong ease-out
                curve instead of jumping. Decorative; clicks pass through to
                the dots below via pointer-events-none. */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-muted-foreground bg-muted-foreground shadow-xs transition-[left] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${fillFraction})` }}
            />
            {options.map((opt, i) => (
              <RadioGroupItem
                aria-label={opt.label}
                className={cn(
                  // Hide the inner check dot — the floating thumb above is the
                  // handle. Grow + darken on hover so stops read as clickable.
                  // Solid fill in both modes — the radio primitive's
                  // translucent dark:bg-input/30 doesn't apply to slider stops.
                  "relative z-10 bg-muted transition-[colors,transform] duration-150 ease-out hover:scale-110 hover:border-ring motion-reduce:transform-none dark:bg-muted [&_[data-slot=radio-group-indicator]]:hidden",
                  // Stops up to and including the selection read as "passed".
                  // data-checked: qualifiers needed to out-specify the base
                  // primitive's own data-checked:bg-primary on the exact
                  // selected stop (plain classes lose that fight).
                  i <= selectedIndex &&
                    "border-muted-foreground bg-muted-foreground data-checked:border-muted-foreground data-checked:bg-muted-foreground dark:border-muted-foreground dark:bg-muted-foreground dark:data-checked:border-muted-foreground dark:data-checked:bg-muted-foreground"
                )}
                key={opt.value}
                value={opt.value}
              />
            ))}
          </RadioGroup>
          <div className="flex items-center justify-between">
            {options.map((opt) => (
              <span
                className={cn(
                  "type-label-14",
                  opt.value === value
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                key={opt.value}
              >
                {opt.label}
              </span>
            ))}
          </div>
        </div>

        <DetailCard
          description={config.sensitivity.caption(value)}
          title={`${options[selectedIndex].label} sensitivity`}
        />
      </div>
    );
  }

  // scanDirection is set when sensitivity is not.
  const scan = config.scanDirection!;
  const value = state.scanDirection ?? scan.options[0].value;
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1">
        <SectionHeading as="h4" className="type-heading-16">
          Scan direction
        </SectionHeading>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          Which side of the request to scan
        </p>
      </div>
      <Segmented
        aria-label="Scan direction"
        className="mt-4"
        onChange={onScanDirectionChange}
        options={scan.options}
        size="default"
        value={value}
        variant="pill"
      />
      <DetailCard
        description={scan.caption(value)}
        icon={SCAN_DIRECTION_ICON[value]}
        title={SCAN_DIRECTION_TITLE[value]}
      />
    </div>
  );
}

/* ─── Detail card — names the current selection + explains it ─────────────
 * Shared by the Sensitivity and Scan-direction halves. neutral-50 panel with
 * an info chip, so both read as one system. */

function DetailCard({
  title,
  description,
  icon: Icon = Info,
}: {
  title?: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xs border border-border bg-card-muted p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-border bg-card">
        <Icon aria-hidden className="size-4 text-blue-700 dark:text-blue-400" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        {title ? (
          <span className="type-label-14 text-foreground">{title}</span>
        ) : null}
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ─── Right half — Action on detection ──────────────────────────────── */

function ActionHalf({
  config,
  value,
  onChange,
}: {
  config: PolicyConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const headingId = `action-heading-${config.id}`;
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1">
        <SectionHeading as="h4" className="type-heading-16" id={headingId}>
          Action on detection
        </SectionHeading>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {config.action.helper}
        </p>
      </div>
      <RadioGroup
        aria-labelledby={headingId}
        className="mt-4 gap-2"
        onValueChange={onChange}
        value={value}
      >
        {config.action.options.map((opt) => {
          const selected = opt.value === value;
          const nameId = `action-${config.id}-${opt.value}-name`;
          const descId = `action-${config.id}-${opt.value}-desc`;
          return (
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xs border p-4 transition-colors duration-150 ease-out",
                selected
                  ? cn(
                      ACTION_ACTIVE_FILL[opt.value],
                      ACTION_ACTIVE_BORDER[opt.value]
                    )
                  : cn("border-border bg-transparent", ACTION_HOVER[opt.value])
              )}
              key={opt.value}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="type-label-14 text-foreground" id={nameId}>
                    {opt.name}
                  </span>
                  {opt.value === DEFAULT_ACTION[config.id] ? (
                    <Badge variant="neutral">DEFAULT</Badge>
                  ) : null}
                </div>
                <span
                  className="type-copy-14 text-pretty text-muted-foreground"
                  id={descId}
                >
                  {opt.description}
                </span>
              </div>
              <RadioGroupItem
                aria-describedby={descId}
                aria-labelledby={nameId}
                className={cn("shrink-0", ACTION_ACTIVE_RADIO[opt.value])}
                value={opt.value}
              />
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
