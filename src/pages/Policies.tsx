import {
  ArrowLeftRight,
  ArrowRightFromLine,
  ArrowRightToLine,
  Check,
  ChevronDown,
  Info,
  KeyRound,
  Shield,
  UserRound,
} from "lucide-react";
import { type ComponentType, type SVGProps, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// KPI rail hidden for now — see commented KpiSection below.
// import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
// import { KpiRail } from '@/components/ui/kpi-rail';
import { PageTitle } from "@/components/ui/page-title";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { SparklesIcon } from "@/components/ui/sparkles";
import { Switch } from "@/components/ui/switch";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";
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

/** Detail-card title per scan direction — parallel to "{level} sensitivity".
 *  Descriptive rather than echoing the pill label. */
const SCAN_DIRECTION_TITLE: Record<string, string> = {
  output: "Output scanning",
  input: "Input scanning",
  both: "Bidirectional scanning",
};

/** Detail-card icon per scan direction — horizontal arrows reading as traffic
 *  flowing through the gateway: into the boundary (input), out of it (output),
 *  or both ways. */
const SCAN_DIRECTION_ICON: Record<string, LucideIcon> = {
  output: ArrowRightFromLine,
  input: ArrowRightToLine,
  both: ArrowLeftRight,
};

/** Active (selected) action fill — the lightest -25 tint of the action's
 *  tone so the card reads colored, not gray. Redact has no color scale, so it
 *  keeps the neutral surface. */
const ACTION_ACTIVE_FILL: Record<string, string> = {
  flag: "bg-warning-25",
  redact: "bg-neutral-50",
  block: "bg-danger-25",
};

/** Hover preview for an unselected action — a lighter tone of the active
 *  border plus the -25 fill, so hovering previews the selected color rather
 *  than going gray. */
const ACTION_HOVER: Record<string, string> = {
  flag: "hover:border-warning-200 hover:bg-warning-25",
  redact: "hover:border-neutral-300 hover:bg-neutral-50",
  block: "hover:border-danger-200 hover:bg-danger-25",
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
    /** Caption rendered in the detail card; varies by selected direction. */
    caption: (value: string) => string;
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
      caption: (value) => {
        if (value === "input") {
          return "Scans incoming prompts for PII. Catches data leaving your perimeter, but agents often legitimately include user data in prompts.";
        }
        if (value === "both") {
          return "Scans prompts and responses. Widest coverage, with more false positives on user data legitimately sent in prompts.";
        }
        return "Scans model responses for PII before they reach the caller. On by default.";
      },
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
    scanTag: "Output scan",
    icon: KeyRound,
    description:
      "Scans LLM outputs for cloud keys, access tokens, and high-entropy secrets the model may leak.",
    scanDirection: {
      options: [
        { value: "output", label: "Output only" },
        { value: "input", label: "Input only" },
        { value: "both", label: "Both" },
      ],
      caption: (value) => {
        if (value === "input") {
          return "Scans incoming prompts for secrets before they reach the model. Agents often include keys in tool calls.";
        }
        if (value === "both") {
          return "Scans both directions — catches secrets in prompts and secrets leaked by the model.";
        }
        return "Scans model responses for secrets the model leaks before they reach the caller. On by default.";
      },
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

/** Free-tier in-body toggle card pinned atop each policy's settings body.
 *  Replaces the header enable switch on the Free page — prompt-injection gets
 *  the branded "Free plan screening" copy; PII / secrets get a plain enable
 *  toggle. Keyed by policy id. */
const FREE_TOGGLE_CARD: Record<
  string,
  { title: string; freeTitle?: string; description?: string; badge?: string }
> = {
  "prompt-injection": {
    title: "Enable Prompt injection detection",
    // Free runs only the regex layer, so it's labeled for what it is.
    freeTitle: "Basic protection",
    description:
      "Lightweight free-tier scanning that checks for common prompt injection patterns.",
    badge: "Free",
  },
  pii: { title: "Enable PII / PHI scanning" },
  secrets: { title: "Enable Credentials scanning" },
};

const PRO_PROMPT_INJECTION_BENEFITS = [
  {
    title: "Indirect injection detection",
    description: "Attacks hidden in retrieved emails, PDFs, web pages, tickets",
  },
  {
    title: "Obfuscated attack detection",
    description: "Encoded payloads, unicode tricks, base64 smuggling",
  },
  {
    title: "Goal hijacking",
    description: "Mid-task redirects and tool-call hijacks",
  },
  {
    title: "Jailbreak pattern coverage",
    description: "DAN-style unlocks, role-play bypass, refusal-bypass",
  },
  {
    title: "Choose what happens when caught",
    description: "Block the request or flag and let it through",
  },
  {
    title: "Tunable sensitivity",
    description: "Low, Medium, or High sensitivity per workspace",
  },
] as const;

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

export function Policies({ variant = "pro" }: { variant?: "pro" | "free" }) {
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
      {/* Content stays fluid up to xl, then caps tighter so the cards don't
          stretch across ultrawide displays. */}
      <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
        <PageHeader />
        {variant === "free" ? <FreePlanNoticeBanner /> : null}
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
              variant={variant}
            />
          ))}
        </div>
      </div>
    </DashboardChrome>
  );
}

function FreePlanNoticeBanner() {
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <>
      <Card className="rounded-sm border border-blue-200 bg-blue-25 shadow-none">
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="type-copy-14 m-0 text-pretty text-neutral-700">
                <span className="type-label-14 text-neutral-900">
                  You&apos;re on the Free plan.
                </span>{" "}
                Pro unlocks full prompt-injection protection with advanced
                detection and tunable controls.
              </p>
            </div>
            <Button
              className="shrink-0 bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800"
              onClick={() => setCompareOpen(true)}
              size="sm"
              type="button"
            >
              <SparklesIcon aria-hidden data-icon="inline-start" size={14} />
              <span>Upgrade to Pro</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      <PlanComparisonDialog
        onOpenChange={setCompareOpen}
        onUpgrade={() => navigate("/billing")}
        open={compareOpen}
      />
    </>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <PageTitle>Policies</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-neutral-500 tracking-snug">
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
  variant = "pro",
}: {
  config: PolicyConfig;
  state: PolicyState;
  onToggle: () => void;
  onSensitivityChange: (value: string) => void;
  onScanDirectionChange: (value: string) => void;
  onActionChange: (value: string) => void;
  variant?: "pro" | "free";
}) {
  const Icon = config.icon;
  const isFree = variant === "free";

  // Both tiers: the header is a collapse chevron and the enable toggle lives
  // in the body's first card. `expanded` controls visibility; `state.enabled`
  // (the in-body toggle) controls whether the option panels are active.
  // The `variant` seam currently only gates the "BASIC" badge (Free only);
  // Free diverges further later.
  const [expanded, setExpanded] = useState(true);
  const bodyOpen = expanded;
  const toggleCard = FREE_TOGGLE_CARD[config.id];

  // Free prompt-injection drops the Action + Sensitivity panels (a replacement
  // card lands here soon); every other case shows them.
  const showOptionPanels = !(isFree && config.id === "prompt-injection");
  const showProBenefits = isFree && config.id === "prompt-injection";

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
            <h3 className="type-heading-16 m-0 text-balance text-neutral-900">
              {config.name}
            </h3>
          </div>
          <p className="type-copy-14 m-0 text-pretty text-neutral-500">
            {config.description}
          </p>
        </div>
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${config.name} settings`}
          className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 ease-out will-change-transform after:absolute after:-inset-2 after:content-[''] hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.96]"
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-5 transition-transform duration-150 ease-out motion-reduce:transition-none",
              expanded && "rotate-180"
            )}
            strokeWidth={1.75}
          />
        </button>
      </div>

      {/* Expanded settings body. The panels (enable toggle, Action,
          Sensitivity) are flat siblings. The "BASIC" badge is Free-only. */}
      {bodyOpen ? (
        <div className="flex flex-col gap-3 border-border border-t bg-card p-4">
          <FreeToggleCard
            badge={isFree ? toggleCard.badge : undefined}
            description={toggleCard.description}
            enabled={state.enabled}
            onToggle={onToggle}
            title={
              isFree
                ? (toggleCard.freeTitle ?? toggleCard.title)
                : toggleCard.title
            }
          />
          {showProBenefits ? <ProBenefitsCard /> : null}
          {showOptionPanels ? (
            <>
              {actionPanel}
              {settingsPanel}
            </>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function ProBenefitsCard() {
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <>
      <Card className="rounded-sm border border-blue-200 bg-gradient-to-b from-blue-50 to-blue-25 shadow-none">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SectionHeading as="h4" className="type-heading-16">
                  Pro plan protection
                </SectionHeading>
                <Badge variant="info">Pro</Badge>
              </div>
              <p className="type-copy-14 m-0 text-pretty text-neutral-500">
                Catches advanced prompt-injection patterns beyond free Regex
                checks.
              </p>
            </div>
            <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-6 gap-y-4 p-0 md:grid-cols-2">
              {PRO_PROMPT_INJECTION_BENEFITS.map((benefit) => (
                <li className="flex items-start gap-3" key={benefit.title}>
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check aria-hidden className="size-3.5" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="type-label-14 text-neutral-900">
                      {benefit.title}
                    </span>
                    <span className="type-copy-12 text-pretty text-neutral-500">
                      {benefit.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Button
                className="bg-blue-700 text-white shadow-blue-700/30 shadow-sm hover:bg-blue-800"
                onClick={() => setCompareOpen(true)}
                type="button"
              >
                <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
                <span>Upgrade to Pro</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <PlanComparisonDialog
        onOpenChange={setCompareOpen}
        onUpgrade={() => navigate("/billing")}
        open={compareOpen}
      />
    </>
  );
}

/* ─── Free-tier in-body toggle card ─────────────────────────────────────
 * Full-width card pinned atop each policy's Action/Sensitivity grid on the
 * Free page — the enable toggle that the header chevron no longer carries.
 * prompt-injection reads "Free plan screening" with descriptive copy; PII /
 * secrets read a plain "Enable …" title. Off by default; local state only. */

function FreeToggleCard({
  title,
  description,
  badge,
  enabled,
  onToggle,
}: {
  title: string;
  description?: string;
  badge?: string;
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
              {badge ? <Badge variant="neutral">{badge}</Badge> : null}
            </div>
            {description ? (
              <p className="type-copy-14-tight m-0 text-pretty text-neutral-500">
                {description}
              </p>
            ) : null}
          </div>
          <Switch
            aria-label={`${title} — ${enabled ? "enabled" : "disabled"}`}
            checked={enabled}
            className="shrink-0"
            onCheckedChange={onToggle}
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
          <p className="type-copy-14 m-0 text-pretty text-neutral-500">
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
              className="absolute top-1/2 left-2 h-1 -translate-y-1/2 rounded-full bg-neutral-400 transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `calc((100% - 1rem) * ${fillFraction})` }}
            />
            {/* Sliding thumb — glides between stops on the strong ease-out
                curve instead of jumping. Decorative; clicks pass through to
                the dots below via pointer-events-none. */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-primary shadow-xs transition-[left] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${fillFraction})` }}
            />
            {options.map((opt, i) => (
              <RadioGroupItem
                aria-label={opt.label}
                className={cn(
                  // Hide the inner check dot — the floating thumb above is the
                  // handle. Grow + darken on hover so stops read as clickable.
                  "relative z-10 transition-[colors,transform] duration-150 ease-out hover:scale-110 hover:border-neutral-500 motion-reduce:transform-none [&_[data-slot=radio-group-indicator]]:hidden",
                  // Stops up to and including the selection read as "passed".
                  i <= selectedIndex && "border-neutral-400 bg-neutral-400"
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
                  opt.value === value ? "text-neutral-900" : "text-neutral-500"
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
        <p className="type-copy-14 m-0 text-pretty text-neutral-500">
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
    <div className="mt-4 flex items-center gap-3 rounded-xs border border-border bg-neutral-50 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-border bg-card">
        <Icon
          aria-hidden
          className={cn(
            "size-4",
            Icon === Info ? "text-neutral-500" : "text-blue-700"
          )}
        />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        {title ? (
          <span className="type-label-14 text-neutral-900">{title}</span>
        ) : null}
        <p className="type-copy-14-tight m-0 text-pretty text-neutral-500">
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
        <p className="type-copy-14 m-0 text-pretty text-neutral-500">
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
                "flex cursor-pointer items-start gap-3 rounded-xs border p-3 transition-colors duration-150 ease-out",
                selected
                  ? cn(
                      ACTION_ACTIVE_FILL[opt.value],
                      ACTION_ACTIVE_BORDER[opt.value]
                    )
                  : cn("border-border bg-transparent", ACTION_HOVER[opt.value])
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
                  <span className="type-label-14 text-neutral-900" id={nameId}>
                    {opt.name}
                  </span>
                  {opt.value === DEFAULT_ACTION[config.id] ? (
                    <Badge variant="neutral">DEFAULT</Badge>
                  ) : null}
                </div>
                <span
                  className="type-copy-14 text-pretty text-neutral-500"
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
