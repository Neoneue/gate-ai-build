import { KeyRound, Shield, UserRound } from "lucide-react";
import { type ComponentType, type SVGProps, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
// KPI rail hidden for now — see commented KpiSection below.
// import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
// import { KpiRail } from '@/components/ui/kpi-rail';
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";
import { TYPE_META } from "./security-data";

// Title-icon colors mirror the Security events type palette (TYPE_META) so the
// two surfaces stay in sync. Keyed by policy id.
const ICON_COLOR: Record<string, string> = {
  "prompt-injection": TYPE_META.injection.color,
  pii: TYPE_META.pii.color,
  secrets: TYPE_META.credential.color,
};

/** Active (selected) action border tone: Flag amber, Redact gray-600, Block
 *  red — mirrors the finding-card action tones. */
const ACTION_ACTIVE_BORDER: Record<string, string> = {
  flag: "border-warning-500",
  redact: "border-neutral-600",
  block: "border-destructive",
};

/** Checked radio fill/border per action — matches ACTION_ACTIVE_BORDER so the
 *  radio dot and the card border read as one tone. Dot stays white. */
const ACTION_ACTIVE_RADIO: Record<string, string> = {
  flag: "data-checked:border-warning-600 data-checked:bg-warning-600",
  redact: "data-checked:border-neutral-700 data-checked:bg-neutral-700",
  block: "data-checked:border-danger-700 data-checked:bg-danger-700",
};

/* ─────────────────────────────────────────────────────────────────────────
 * Policies
 *
 * The three inline scans that run on every routed request. Each policy is
 * an enable/disable Switch plus, when on, a settings body split into
 * "Action on detection" (left) and "Sensitivity"/"Scan direction" (right).
 *
 * Reconciliation: the "Active Policies" KPI numerator derives from the
 * single `policies` state array — `enabled` is the sole source of truth.
 * Detections / Block rate / Avg latency are static
 * constants (no live data wired yet) and are commented as such.
 *
 * Composed entirely from existing primitives — no new components extracted.
 * Color palette: ink-* / chart-1..8 / success only. No raw hex.
 * ───────────────────────────────────────────────────────────────────────── */

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

type ActionOption = {
  value: string;
  name: string;
  description: string;
};

type SegmentedOption = { value: string; label: string };

/** Static per-policy config — identity, copy, and the option sets for the
 *  expanded body. Seeded defaults for the per-policy local state live in
 *  `INITIAL_POLICIES` below. */
type PolicyConfig = {
  id: string;
  name: string;
  scanTag: string;
  icon: LucideIcon;
  description: string;
  /** Left-half control: a sensitivity Segmented (prompt-injection only) or
   *  a scan-direction Segmented (pii / secrets). Exactly one is set. */
  sensitivity?: {
    options: SegmentedOption[];
    /** Caption rendered below the Segmented; `{value}` is interpolated. */
    caption: (value: string) => string;
  };
  scanDirection?: {
    options: SegmentedOption[];
    caption: string;
  };
  /** Right-half "Action on detection" radio group. */
  action: {
    helper: string;
    options: ActionOption[];
  };
};

const POLICIES: PolicyConfig[] = [
  {
    id: "prompt-injection",
    name: "Prompt injection detection",
    scanTag: "Input scan",
    icon: Shield,
    description:
      "Detects direct injection, indirect injection, jailbreak attempts, and obfuscated attacks across every LLM input.",
    sensitivity: {
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
      caption: (value) => {
        if (value === "low") {
          return "Flags only high-confidence attacks. Fewest false positives.";
        }
        if (value === "high") {
          return "Catches subtle, obfuscated attacks. Expect more false positives.";
        }
        return "Balanced detection for typical production traffic. Default.";
      },
    },
    action: {
      helper: "What to do when a request scores above threshold",
      options: [
        {
          value: "block",
          name: "Block",
          description: "Reject the request before it reaches the model.",
        },
        {
          value: "flag",
          name: "Flag",
          description:
            "Request proceeds. Trace is annotated with the detection. Alert fired.",
        },
      ],
    },
  },
  {
    id: "pii",
    name: "PII / PHI scanner",
    scanTag: "Output scan",
    icon: UserRound,
    description:
      "Scans LLM outputs for personally identifiable information (PII) and protected health information (PHI).",
    scanDirection: {
      options: [
        { value: "output", label: "Output only" },
        { value: "input", label: "Input only" },
        { value: "both", label: "Both" },
      ],
      caption:
        "Output scanning is on by default. Input scanning catches data leaving your perimeter, but agents often legitimately include user data in prompts.",
    },
    action: {
      helper: "What to do when PII is detected",
      options: [
        {
          value: "redact",
          name: "Redact",
          description:
            "Strip PII from the payload, forward the cleaned request.",
        },
        {
          value: "flag",
          name: "Flag",
          description:
            "Response proceeds. Trace is annotated with the detection. Alert fired.",
        },
        {
          value: "block",
          name: "Block",
          description:
            "Reject the entire request. Use for high-sensitivity environments.",
        },
      ],
    },
  },
  {
    id: "secrets",
    name: "Credential & secrets scanner",
    scanTag: "Input + Output scan",
    icon: KeyRound,
    description:
      "Detects cloud keys, access tokens, and high-entropy secrets in both user prompts and LLM responses.",
    scanDirection: {
      options: [
        { value: "output", label: "Output only" },
        { value: "input", label: "Input only" },
        { value: "both", label: "Both" },
      ],
      caption:
        "Scanning both directions catches secrets in prompts and secrets leaked by the model.",
    },
    action: {
      helper: "What to do when a credential is found",
      options: [
        {
          value: "redact",
          name: "Redact",
          description:
            "Replace the credential with a placeholder and forward the cleaned payload.",
        },
        {
          value: "flag",
          name: "Flag",
          description:
            "Response proceeds. Trace is annotated with the detection. Alert fired.",
        },
        {
          value: "block",
          name: "Block",
          description:
            "Reject the request before it reaches the upstream model.",
        },
      ],
    },
  },
];

/** Per-policy mutable state. `sensitivity` / `scanDirection` track whichever
 *  Segmented the policy renders; `action` tracks the radio group. Seeded so
 *  all three policies start enabled with their default selections. */
type PolicyState = {
  id: string;
  enabled: boolean;
  sensitivity?: string;
  scanDirection?: string;
  action: string;
};

const INITIAL_POLICIES: PolicyState[] = [
  {
    id: "prompt-injection",
    enabled: true,
    sensitivity: "medium",
    action: "flag",
  },
  { id: "pii", enabled: true, scanDirection: "output", action: "flag" },
  { id: "secrets", enabled: true, scanDirection: "output", action: "flag" },
];

// The "DEFAULT" badge marks each policy's shipped default action, derived from
// the seed above so it always matches (was hardcoded onto the flag option).
const DEFAULT_ACTION: Record<string, string> = Object.fromEntries(
  INITIAL_POLICIES.map((p) => [p.id, p.action])
);

// Static KPI constants — kept for when the rail is restored. Detections /
// block rate / avg latency are not wired to live data yet; only the
// "Active Policies" tile reconciles (its numerator = activeCount).
// const DETECTIONS_7D = 1;
// const BLOCK_RATE_PCT = 14;
// const AVG_LATENCY_MS = 31;

export function Policies() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  const [policies, setPolicies] = useState<PolicyState[]>(INITIAL_POLICIES);

  // const activeCount = policies.filter((p) => p.enabled).length;

  const toggleEnabled = (id: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  const setSensitivity = (id: string, value: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, sensitivity: value } : p))
    );
  const setScanDirection = (id: string, value: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, scanDirection: value } : p))
    );
  const setAction = (id: string, value: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, action: value } : p))
    );

  const visiblePolicies = (() => {
    const byId = new Map(policies.map((p) => [p.id, p]));
    return POLICIES.map((cfg) => ({
      cfg,
      state: byId.get(cfg.id)!,
    }));
  })();

  return (
    <DashboardChrome
      activeNavId="policies"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      {/* KPI rail hidden for now — restore <KpiSection /> when wired. */}
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
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex max-w-1/2 flex-col gap-2">
      <PageTitle>Policies</PageTitle>
      <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-tight">
        Three inline scans run on every routed request. Each has its own
        settings — tune sensitivity, pick what to detect, choose how to respond.
      </p>
    </div>
  );
}

/* ─── KPI rail (hidden for now) ─────────────────────────────────────────
 * Restore by uncommenting this block, the CompactKpi/CompactSpark/KpiRail
 * imports, the KPI constants, the `activeCount` derivation, and the
 * <KpiSection /> render line.
 *
 * function KpiSection({
 *   activeCount,
 *   totalCount,
 * }: {
 *   activeCount: number;
 *   totalCount: number;
 * }) {
 *   return (
 *     <KpiRail columns={4}>
 *       <CompactKpi
 *         flat
 *         title="Active Policies"
 *         value={String(activeCount)}
 *         valueSuffix={`/ ${totalCount}`}
 *         spark={
 *           <CompactSpark colorVar="var(--color-chart-1)" data={[2, 2, 3, 3, 2, 3, 3]} />
 *         }
 *       />
 *       <CompactKpi
 *         flat
 *         title="Detections (7d)"
 *         value={String(DETECTIONS_7D)}
 *         delta="+0.0%"
 *         spark={
 *           <CompactSpark colorVar="var(--color-chart-2)" data={[0, 0, 1, 0, 0, 1, 0]} />
 *         }
 *       />
 *       <CompactKpi
 *         flat
 *         title="Block Rate"
 *         value={String(BLOCK_RATE_PCT)}
 *         valueSuffix="%"
 *         delta="+0.0%"
 *         spark={
 *           <CompactSpark colorVar="var(--color-chart-4)" data={[12, 14, 13, 15, 14, 14, 14]} />
 *         }
 *       />
 *       <CompactKpi
 *         flat
 *         title="Avg Policy Latency"
 *         value={String(AVG_LATENCY_MS)}
 *         valueSuffix="ms"
 *         delta="+0.0%"
 *         deltaInverted
 *         spark={
 *           <CompactSpark colorVar="var(--color-chart-3)" data={[34, 32, 33, 30, 31, 31, 31]} />
 *         }
 *       />
 *     </KpiRail>
 *   );
 * }
 * ───────────────────────────────────────────────────────────────────────── */

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

  return (
    // When expanded, the neutral-50 body tray runs full-bleed to the card's
    // bottom edge — drop the Card's bottom padding so there's no white
    // gutter below the tray. Must match the `data-[density=default]:`
    // variant or tailwind-merge won't override the Card's `py-4`.
    // Collapsed cards keep the default py-4.
    <Card className={state.enabled ? "data-[density=default]:pb-0" : undefined}>
      {/* Header row — always visible. */}
      <div className="flex items-start gap-3 px-4">
        {/* Bare lucide icon — no wrapper box. Centered on the title line. */}
        <span className="flex h-6 shrink-0 items-center">
          <Icon
            aria-hidden
            className="size-5"
            style={{ color: ICON_COLOR[config.id] }}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-medium font-sans text-base/6 text-neutral-900">
              {config.name}
            </h3>
          </div>
          <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
            {config.description}
          </p>
        </div>
        <Switch
          aria-label={`${config.name} — ${state.enabled ? "enabled" : "disabled"}`}
          checked={state.enabled}
          className="mt-1 shrink-0"
          onCheckedChange={onToggle}
        />
      </div>

      {/* Expanded settings body — only when the policy is enabled. The
          neutral-50 tray + nested white Cards group the two columns so they
          read as panels, not free-floating controls. */}
      {state.enabled ? (
        <div className="grid grid-cols-2 items-start gap-4 border-border border-t bg-card p-4">
          <Card className="border border-border bg-transparent shadow-none">
            <CardContent>
              <ActionHalf
                config={config}
                onChange={onActionChange}
                value={state.action}
              />
            </CardContent>
          </Card>
          <Card className="border border-border bg-transparent shadow-none">
            <CardContent>
              <SettingsHalf
                config={config}
                onScanDirectionChange={onScanDirectionChange}
                onSensitivityChange={onSensitivityChange}
                state={state}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
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
    const value = state.sensitivity ?? config.sensitivity.options[0].value;
    return (
      <div className="flex flex-col">
        <div className="flex flex-col gap-1">
          <SectionHeading as="h4">Sensitivity</SectionHeading>
          <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
            How aggressive to be when scoring inputs
          </p>
        </div>
        <Segmented
          aria-label="Sensitivity"
          className="mt-4"
          onChange={onSensitivityChange}
          options={config.sensitivity.options}
          size="default"
          value={value}
          variant="pill"
        />
        <p className="m-0 mt-3 text-pretty font-sans text-neutral-500 text-xs tracking-tight">
          {config.sensitivity.caption(value)}
        </p>
      </div>
    );
  }

  // scanDirection is set when sensitivity is not.
  const scan = config.scanDirection!;
  const value = state.scanDirection ?? scan.options[0].value;
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1">
        <SectionHeading as="h4">Scan direction</SectionHeading>
        <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
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
      <p className="m-0 mt-3 text-pretty font-sans text-neutral-500 text-xs tracking-tight">
        {scan.caption}
      </p>
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
        <SectionHeading as="h4" id={headingId}>
          Action on detection
        </SectionHeading>
        <p className="m-0 text-pretty font-sans text-neutral-500 text-sm">
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
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors duration-150 ease-out",
                selected
                  ? cn("bg-neutral-50", ACTION_ACTIVE_BORDER[opt.value])
                  : "border-border bg-transparent hover:bg-neutral-50"
              )}
              key={opt.value}
            >
              <RadioGroupItem
                aria-describedby={descId}
                aria-labelledby={nameId}
                className={cn("mt-1", ACTION_ACTIVE_RADIO[opt.value])}
                value={opt.value}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className="font-medium font-sans text-neutral-900 text-sm"
                    id={nameId}
                  >
                    {opt.name}
                  </span>
                  {opt.value === DEFAULT_ACTION[config.id] ? (
                    <Badge variant="neutral">DEFAULT</Badge>
                  ) : null}
                </div>
                <span
                  className="text-pretty font-sans text-neutral-500 text-xs tracking-tight"
                  id={descId}
                >
                  {opt.description}
                </span>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
