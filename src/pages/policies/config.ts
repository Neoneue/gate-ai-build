/**
 * Policies page config + data: title-icon colors, per-action style maps, the
 * PolicyConfig/PolicyState types, the POLICIES catalog, INITIAL_POLICIES seed,
 * and the free-tier copy. Extracted from Policies.tsx so the page file holds
 * the components. Consumed by Policies.tsx.
 */
import {
  ArrowLeftRight,
  ArrowRightFromLine,
  ArrowRightToLine,
  KeyRound,
  Shield,
  UserRound,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { TYPE_META } from "../security-data";

// Title-icon colors mirror the Security events type palette (TYPE_META) so the
// two surfaces stay in sync. Keyed by policy id.
export const ICON_COLOR: Record<string, string> = {
  "prompt-injection": TYPE_META.injection.color,
  pii: TYPE_META.pii.color,
  secrets: TYPE_META.credential.color,
};

/** Active (selected) action border tone: Flag amber, Redact gray-600, Block
 *  red — mirrors the finding-card action tones. */
export const ACTION_ACTIVE_BORDER: Record<string, string> = {
  flag: "border-warning-500",
  redact: "border-muted-foreground",
  block: "border-destructive",
};

/** Detail-card title per scan direction — parallel to "{level} sensitivity".
 *  Descriptive rather than echoing the pill label. */
export const SCAN_DIRECTION_TITLE: Record<string, string> = {
  output: "Output scanning",
  input: "Input scanning",
  both: "Bidirectional scanning",
};

/** Detail-card icon per scan direction — horizontal arrows reading as traffic
 *  flowing through the gateway: into the boundary (input), out of it (output),
 *  or both ways. */
export const SCAN_DIRECTION_ICON: Record<string, LucideIcon> = {
  output: ArrowRightFromLine,
  input: ArrowRightToLine,
  both: ArrowLeftRight,
};

/** Active (selected) action fill — the lightest -25 tint of the action's
 *  tone so the card reads colored, not gray. Redact has no color scale, so it
 *  keeps the neutral surface. */
export const ACTION_ACTIVE_FILL: Record<string, string> = {
  flag: "bg-warning-25 dark:bg-warning-500/10",
  redact: "bg-muted",
  block: "bg-danger-25 dark:bg-danger-500/10",
};

/** Hover preview for an unselected action — a lighter tone of the active
 *  border plus the -25 fill, so hovering previews the selected color rather
 *  than going gray. */
export const ACTION_HOVER: Record<string, string> = {
  flag: "hover:border-warning-200 hover:bg-warning-25 dark:hover:border-warning-500/30 dark:hover:bg-warning-500/15",
  redact: "hover:border-input hover:bg-accent",
  block:
    "hover:border-danger-200 hover:bg-danger-25 dark:hover:border-danger-500/30 dark:hover:bg-danger-500/15",
};

/** Checked radio fill/border per action — matches ACTION_ACTIVE_BORDER so the
 *  radio dot and the card border read as one tone. Dot stays white. */
export const ACTION_ACTIVE_RADIO: Record<string, string> = {
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

export type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type ActionOption = {
  value: string;
  name: string;
  description: string;
};

export type SegmentedOption = { value: string; label: string };

/** Static per-policy config — identity, copy, and the option sets for the
 *  expanded body. Seeded defaults for the per-policy local state live in
 *  `INITIAL_POLICIES` below. */
export type PolicyConfig = {
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

export const POLICIES: PolicyConfig[] = [
  {
    id: "prompt-injection",
    name: "Prompt injection detection",
    scanTag: "Input scan",
    icon: Shield,
    description:
      "Detects direct injection, indirect injection, jailbreaks, and obfuscated attacks across every LLM input.",
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
          description:
            "Request rejected before it reaches the model. Trace annotated. Alert fired.",
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
export const FREE_TOGGLE_CARD: Record<
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

export const PRO_PROMPT_INJECTION_BENEFITS = [
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
export type PolicyState = {
  id: string;
  enabled: boolean;
  sensitivity?: string;
  scanDirection?: string;
  action: string;
};

export const INITIAL_POLICIES: PolicyState[] = [
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
export const DEFAULT_ACTION: Record<string, string> = Object.fromEntries(
  INITIAL_POLICIES.map((p) => [p.id, p.action])
);
