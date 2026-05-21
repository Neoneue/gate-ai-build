import { useState, type ComponentType, type SVGProps } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Shield, ShieldAlert, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
// KPI rail hidden for now — see commented KpiSection below.
// import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
// import { KpiRail } from '@/components/ui/kpi-rail';
import { PageTitle } from '@/components/ui/page-title';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SectionHeading } from '@/components/ui/section-heading';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* ─────────────────────────────────────────────────────────────────────────
 * Policies
 *
 * The three inline scans that run on every routed request. Each policy is
 * an enable/disable Switch plus, when on, a settings body split into
 * "Sensitivity"/"Scan direction" (left) and "Action on detection" (right).
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
  /** Small all-caps qualifier rendered beside the option name. */
  flag?: 'DEFAULT';
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
    id: 'prompt-injection',
    name: 'Prompt injection detection',
    scanTag: 'Input scan',
    icon: Shield,
    description:
      'Detects direct injection, indirect injection, jailbreak attempts, and obfuscated attacks across every LLM input.',
    sensitivity: {
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      caption: (value) => {
        if (value === 'low')
          return 'Flags only high-confidence attacks. Fewest false positives.';
        if (value === 'high')
          return 'Catches subtle, obfuscated attacks. Expect more false positives.';
        return 'Balanced detection for typical production traffic. Default.';
      },
    },
    action: {
      helper: 'What to do when a request scores above threshold',
      options: [
        {
          value: 'block',
          name: 'Block',
          flag: 'DEFAULT',
          description: 'Reject the request before it reaches the model.',
        },
        {
          value: 'flag',
          name: 'Flag',
          description:
            'Request proceeds. Trace is annotated with the detection. Alert fired.',
        },
      ],
    },
  },
  {
    id: 'pii',
    name: 'PII / PHI scanner',
    scanTag: 'Output scan',
    icon: UserRound,
    description:
      'Scans LLM outputs for personally identifiable information (PII) and protected health information (PHI).',
    scanDirection: {
      options: [
        { value: 'output', label: 'Output only' },
        { value: 'input', label: 'Input only' },
        { value: 'both', label: 'Both' },
      ],
      caption:
        'Output scanning is on by default. Input scanning catches data leaving your perimeter, but agents often legitimately include user data in prompts.',
    },
    action: {
      helper: 'What to do when PII is detected',
      options: [
        {
          value: 'redact',
          name: 'Redact',
          flag: 'DEFAULT',
          description:
            'Strip PII from the payload, forward the cleaned request.',
        },
        {
          value: 'flag',
          name: 'Flag',
          description:
            'Response proceeds. Trace is annotated with the detection. Alert fired.',
        },
        {
          value: 'block',
          name: 'Block',
          description:
            'Reject the entire request. Use for high-sensitivity environments.',
        },
      ],
    },
  },
  {
    id: 'secrets',
    name: 'Credential & secrets scanner',
    scanTag: 'Input + Output scan',
    icon: ShieldAlert,
    description:
      'Detects cloud keys, access tokens, and high-entropy secrets in both user prompts and LLM responses.',
    scanDirection: {
      options: [
        { value: 'output', label: 'Output only' },
        { value: 'input', label: 'Input only' },
        { value: 'both', label: 'Both' },
      ],
      caption:
        'Scanning both directions catches secrets in prompts and secrets leaked by the model.',
    },
    action: {
      helper: 'What to do when a credential is found',
      options: [
        {
          value: 'redact',
          name: 'Redact',
          flag: 'DEFAULT',
          description:
            'Replace the credential with a placeholder and forward the cleaned payload.',
        },
        {
          value: 'flag',
          name: 'Flag',
          description:
            'Response proceeds. Trace is annotated with the detection. Alert fired.',
        },
        {
          value: 'block',
          name: 'Block',
          description:
            'Reject the request before it reaches the upstream model.',
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
  { id: 'prompt-injection', enabled: true, sensitivity: 'medium', action: 'block' },
  { id: 'pii', enabled: true, scanDirection: 'output', action: 'redact' },
  { id: 'secrets', enabled: true, scanDirection: 'output', action: 'redact' },
];

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
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  const setSensitivity = (id: string, value: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, sensitivity: value } : p)),
    );
  const setScanDirection = (id: string, value: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, scanDirection: value } : p)),
    );
  const setAction = (id: string, value: string) =>
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, action: value } : p)),
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
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      {/* KPI rail hidden for now — restore <KpiSection /> when wired. */}
      <div className="flex flex-col gap-4">
        {visiblePolicies.map(({ cfg, state }) => (
          <PolicyCard
            key={cfg.id}
            config={cfg}
            state={state}
            onToggle={() => toggleEnabled(cfg.id)}
            onSensitivityChange={(v) => setSensitivity(cfg.id, v)}
            onScanDirectionChange={(v) => setScanDirection(cfg.id, v)}
            onActionChange={(v) => setAction(cfg.id, v)}
          />
        ))}
      </div>
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 max-w-1/2">
      <PageTitle>Policies</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
        Three inline scans run on every routed request. Each has its own
        settings — tune sensitivity, pick what to detect, choose how to
        respond.
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
    <Card
      className={state.enabled ? 'data-[density=default]:pb-0' : undefined}
    >
      {/* Header row — always visible. */}
      <div className="flex items-start gap-3 px-4">
        {/* Bare lucide icon — no wrapper box. */}
        <Icon className="size-5 text-neutral-700 mt-1 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-sans text-base/6 font-medium text-neutral-900 m-0">
              {config.name}
            </h3>
            <Badge variant="neutral">{config.scanTag}</Badge>
          </div>
          <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
            {config.description}
          </p>
        </div>
        <Switch
          checked={state.enabled}
          onCheckedChange={onToggle}
          aria-label={`${config.name} — ${state.enabled ? 'enabled' : 'disabled'}`}
          className="mt-1 shrink-0"
        />
      </div>

      {/* Expanded settings body — only when the policy is enabled. The
          neutral-50 tray + nested white Cards group the two columns so they
          read as panels, not free-floating controls. */}
      {state.enabled ? (
        <div className="grid grid-cols-2 items-start gap-4 border-t border-border bg-card p-4">
          <Card className="shadow-none border border-border bg-transparent">
            <CardContent>
              <SettingsHalf config={config} state={state} onSensitivityChange={onSensitivityChange} onScanDirectionChange={onScanDirectionChange} />
            </CardContent>
          </Card>
          <Card className="shadow-none border border-border bg-transparent">
            <CardContent>
              <ActionHalf config={config} value={state.action} onChange={onActionChange} />
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
          <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
            How aggressive to be when scoring inputs
          </p>
        </div>
        <Segmented
          variant="pill"
          size="default"
          options={config.sensitivity.options}
          value={value}
          onChange={onSensitivityChange}
          className="mt-4"
        />
        <p className="font-sans text-xs text-neutral-500 m-0 mt-3 tracking-tight text-pretty">
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
        <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
          Which side of the request to scan
        </p>
      </div>
      <Segmented
        variant="pill"
        size="default"
        options={scan.options}
        value={value}
        onChange={onScanDirectionChange}
        className="mt-4"
      />
      <p className="font-sans text-xs text-neutral-500 m-0 mt-3 tracking-tight text-pretty">
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
        <SectionHeading as="h4" id={headingId}>Action on detection</SectionHeading>
        <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
          {config.action.helper}
        </p>
      </div>
      <RadioGroup aria-labelledby={headingId} value={value} onValueChange={onChange} className="mt-4 gap-2">
        {config.action.options.map((opt) => {
          const selected = opt.value === value;
          const nameId = `action-${config.id}-${opt.value}-name`;
          const descId = `action-${config.id}-${opt.value}-desc`;
          return (
            <label
              key={opt.value}
              className={
                'flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors duration-150 ease-out ' +
                (selected
                  ? 'border-foreground bg-neutral-50'
                  : 'border-border bg-transparent hover:bg-neutral-50')
              }
            >
              <RadioGroupItem
                value={opt.value}
                aria-labelledby={nameId}
                aria-describedby={descId}
                className="mt-1"
              />
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span id={nameId} className="font-sans text-sm font-medium text-neutral-900">
                    {opt.name}
                  </span>
                  {opt.flag ? (
                    <span className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-500">
                      {opt.flag}
                    </span>
                  ) : null}
                </div>
                <span id={descId} className="font-sans text-xs text-neutral-500 tracking-tight text-pretty">
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
