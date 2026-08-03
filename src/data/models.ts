/**
 * Model catalog for the Models page.
 *
 * REBUILT 2026-08-03 from the live Constellation Gate production API
 * (`GET /api/v1/available-models`, gate-v1.27.1), filtered to the 25 models
 * prod's page 1 renders in its default "Most popular" order. Every field
 * below is verbatim from that payload — nothing is authored, estimated, or
 * rounded here. The previous 23-model / 14-provider catalog was invented and
 * has been removed wholesale.
 *
 * Two deliberate divergences from prod, both bug fixes:
 *  1. Prod's `family` field is inconsistently cased and carries the literal
 *     string "system" for Qwen, which its avatar renders as "SsystemQwen3
 *     Next 80B A3B Instruct". We normalize to lowercase vendor slugs and
 *     render the real Qwen mark.
 *  2. Prod's footer still names `bedrock/…` as the pin example. Bedrock is
 *     not one of the three providers; ours uses `openrouter/…`.
 *
 * Consumed by Models.tsx (list + detail) and SetupManual.tsx (MODEL_OPTIONS).
 */
import {
  Braces,
  Brain,
  Database,
  Eye,
  FileText,
  Globe,
  Headphones,
  Mic,
  Video,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { ProviderId, Vendor } from "@/components/icons/vendor-meta";
import { formatCurrency } from "@/lib/formatters";

export type { ProviderId } from "@/components/icons/vendor-meta";

/* ─── Type model ─────────────────────────────────────────────────────────── */

/** Every model in prod's catalog is `text`. Embeddings / audio / rerank
 *  modalities were removed with the invented catalog; prod's tab strip is
 *  "All types" + "Text" and nothing else. */
export type Modality = "text";

/** The API exposes 13 capability flags. `systemMessages` and
 *  `parallelToolCalls` are deliberately absent: prod's table renders 11 and
 *  has no icon for those two. */
export type Capability =
  | "tools"
  | "vision"
  | "reasoning"
  | "promptCaching"
  | "responseSchema"
  | "streaming"
  | "webSearch"
  | "audioInput"
  | "pdfInput"
  | "videoInput"
  | "audioOutput";

export type CapabilityMeta = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Labels are prod's own strings, which are the accessible names on the
 *  capability icons — changing them would change what a screen reader
 *  announces relative to production. */
export const CAPABILITY_META: Record<Capability, CapabilityMeta> = {
  tools: { label: "Tool use", icon: Wrench },
  vision: { label: "Vision", icon: Eye },
  reasoning: { label: "Reasoning", icon: Brain },
  promptCaching: { label: "Prompt caching", icon: Database },
  responseSchema: { label: "JSON mode", icon: Braces },
  streaming: { label: "Streaming", icon: Zap },
  webSearch: { label: "Web search", icon: Globe },
  audioInput: { label: "Audio in", icon: Mic },
  pdfInput: { label: "PDF in", icon: FileText },
  videoInput: { label: "Video in", icon: Video },
  audioOutput: { label: "Audio out", icon: Headphones },
};

/** Canonical render order, reverse-engineered from prod's own rows and
 *  verified to reproduce all 25 capability strips exactly. Cross-row
 *  scanning lands on the same icon in the same x-slot. */
export const CAPABILITY_ORDER: Capability[] = [
  "tools",
  "vision",
  "reasoning",
  "promptCaching",
  "responseSchema",
  "streaming",
  "webSearch",
  "audioInput",
  "pdfInput",
  "videoInput",
  "audioOutput",
];

export type ModelPricing = {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputReadPer1M: number | null;
  cachedInputWritePer1M: number | null;
};

export type ModelProvider = {
  id: ProviderId;
  /** The id this provider knows the model by upstream, e.g. Vertex calls
   *  Qwen3 Next `qwen/qwen3-next-80b-a3b-instruct-maas`. */
  nativeModelId: string;
  /** Gateway markup applied on top of list price for this provider.
   *  OpenRouter is 1.1; Alibaba and Vertex are 1.0. */
  paygMarkup: number;
  /** Null until the model has actually been called through this provider.
   *  Most rows are null and that is real, not missing data. */
  latencyP50Ms: number | null;
  throughputTps: number | null;
  sampleCount: number;
};

export type Model = {
  /** Canonical `vendor/model` id — this IS the handle you pass to the
   *  gateway, and what the Model ID column renders. */
  id: string;
  vendor: Vendor;
  name: string;
  description: string;
  modality: Modality;
  /** Null on Qwen3 Next, which prod renders as an em dash. */
  contextWindow: number | null;
  maxOutputTokens: number | null;
  pricing: ModelPricing;
  /** Model-level markup baked into the price the table shows. Only the two
   *  DeepSeek rows carry 1.1; everything else is 1. */
  pricingMarkup: number;
  capabilities: Capability[];
  /** Only 3 of 25 have one. Models without a release date sink to the
   *  bottom of the "Newest" sort — same as prod with the same payload. */
  releasedAt: string | null;
  providers: ModelProvider[];
};

/* ─── Formatting + derivation ────────────────────────────────────────────── */

export const EM_DASH = "—";

/**
 * Token counts, formatted the way prod formats them — including what looks
 * like an inconsistency but is not. Anthropic reports a decimal 1,000,000
 * context and renders "1M"; Google and DeepSeek report a binary 1,048,576
 * and render "1.0M". Same function, different inputs. Do not "fix" this by
 * rounding 1,048,576 down to 1M: the two numbers are genuinely different and
 * prod shows them differently.
 */
export function formatTokenCount(value: number | null): string {
  if (value === null || value === 0) {
    return EM_DASH;
  }
  if (value >= 1_000_000) {
    return value % 1_000_000 === 0
      ? `${value / 1_000_000}M`
      : `${(value / 1_000_000).toFixed(1)}M`;
  }
  return value % 1000 === 0
    ? `${value / 1000}K`
    : `${(value / 1000).toFixed(1)}K`;
}

/** `null` (no such price) renders as an em dash; a real `0` renders as
 *  `$0.00/M`, because free is a price and absent is not.
 *
 *  Sub-cent rates widen to 4 decimals. At two, DeepSeek V4 Pro's real
 *  `cachedInputReadPer1M` of `0.003625` truncated to `$0.00/M` — visually
 *  identical to free, when it is $3.63 per billion cached tokens. A rate that
 *  rounds away is not the same fact as a rate that is zero, and the column
 *  must not say they are. Only values in `(0, 0.01)` widen, so every other
 *  price keeps prod's 2-decimal shape. */
export function formatPricePerM(value: number | null): string {
  if (value === null) {
    return EM_DASH;
  }
  const frac = value > 0 && value < 0.01 ? 4 : 2;
  return `${formatCurrency(value, { maxFrac: frac, minFrac: frac })}/M`;
}

type PriceKey = keyof ModelPricing;

/** The price the list table shows: raw upstream price × the model's own
 *  markup. */
export function listPrice(model: Model, key: PriceKey): number | null {
  const raw = model.pricing[key];
  return raw === null ? null : raw * model.pricingMarkup;
}

/** The price a single provider row shows: list price × that provider's
 *  markup. OpenRouter's 1.1 is why its row reads 10% above Vertex's on the
 *  same model, and why its row carries a +10% badge. Never hardcode these —
 *  they are computed so the badge and the number cannot drift apart. */
export function providerPrice(
  model: Model,
  provider: ModelProvider,
  key: PriceKey
): number | null {
  const list = listPrice(model, key);
  return list === null ? null : list * provider.paygMarkup;
}

/** Provider-pinned handle, e.g. `openrouter/claude-haiku-4-5`. */
export function providerHandle(model: Model, providerId: ProviderId): string {
  return `${providerId}/${model.id.split("/")[1]}`;
}

/** True when at least one provider has been called enough to report
 *  numbers. Drives the "No telemetry yet" empty state. */
export function hasTelemetry(model: Model): boolean {
  return model.providers.some(
    (p) => p.latencyP50Ms !== null || p.throughputTps !== null
  );
}

export type ModelSort = "popular" | "newest" | "cheapest" | "largest-context";

/**
 * Ported from prod's own `sortModels()`. Four cases:
 *
 *  popular         prod ranks by real 30d traffic volume, then provider
 *                  count, then name. We have no traffic data, and MODELS is
 *                  already stored in prod's popular order, so this is the
 *                  identity — which is exactly what makes it the default.
 *  newest          releasedAt descending; the 22 models without one sink to
 *                  the bottom and resolve alphabetically.
 *  cheapest        effective (marked-up) input price ascending, so the order
 *                  matches the number the eye actually reads in the column.
 *  largest-context contextWindow descending, null/0 last.
 */
export function sortModels(rows: Model[], sort: ModelSort): Model[] {
  const byName = (a: Model, b: Model) => a.name.localeCompare(b.name);
  const sorted = rows.slice();
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => {
        const at = a.releasedAt ? Date.parse(a.releasedAt) : null;
        const bt = b.releasedAt ? Date.parse(b.releasedAt) : null;
        if (at === bt) {
          return byName(a, b);
        }
        if (at === null) {
          return 1;
        }
        if (bt === null) {
          return -1;
        }
        return bt - at;
      });
    case "cheapest":
      return sorted.sort((a, b) => {
        const av = listPrice(a, "inputPer1M") ?? Number.POSITIVE_INFINITY;
        const bv = listPrice(b, "inputPer1M") ?? Number.POSITIVE_INFINITY;
        return av === bv ? byName(a, b) : av - bv;
      });
    case "largest-context":
      return sorted.sort((a, b) => {
        const av = a.contextWindow ?? 0;
        const bv = b.contextWindow ?? 0;
        return av === bv ? byName(a, b) : bv - av;
      });
    default:
      return sorted;
  }
}

/* ─── Catalog ────────────────────────────────────────────────────────────── */

export const MODELS: Model[] = [
  {
    id: "qwen/qwen3-next-80b-a3b-instruct",
    vendor: "qwen",
    name: "Qwen3 Next 80B A3B Instruct",
    description:
      "Qwen3-Next-80B-A3B-Instruct is an instruction-tuned chat model in the Qwen3-Next series optimized for fast, stable responses without “thinking” traces. It targets complex tasks across reasoning, code generation, knowledge QA, and multilingual use, while remaining robust on alignment and formatting. Compared with prior Qwen3 instruct variants, it focuses on higher throughput and stability on ultra-long inputs and multi-turn dialogues, making it well-suited for RAG, tool use, and agentic workflows that require consistent final answers rather than visible chain-of-thought.\n\nThe model employs scaling-efficient training and decoding to improve parameter efficiency and inference speed, and has been validated on a broad set of public benchmarks where it reaches or approaches larger Qwen3 systems in several categories while outperforming earlier mid-sized baselines. It is best used as a general assistant, code helper, and long-context task solver in production settings where deterministic, instruction-following outputs are preferred.",
    modality: "text",
    contextWindow: null,
    maxOutputTokens: null,
    pricing: {
      inputPer1M: 0.15,
      outputPer1M: 1.2,
      cachedInputReadPer1M: 0.03,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [],
    releasedAt: "2025-12-30T06:06:31.000Z",
    providers: [
      {
        id: "alibaba",
        nativeModelId: "qwen3-next-80b-a3b-instruct",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "qwen/qwen3-next-80b-a3b-instruct",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "qwen/qwen3-next-80b-a3b-instruct-maas",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-fable-5",
    vendor: "anthropic",
    name: "Claude Fable 5",
    description:
      "Claude Fable 5 is a Mythos-class model from Anthropic, built for autonomous knowledge work and coding. It supports text, image, and file inputs with text output, with reasoning support and a 1M-token context window. It is suited for long-running, complex, and asynchronous tasks that previously required frequent human check-ins.\n\nIt is particularly strong at end-to-end work that would otherwise take a person hours, days, or weeks - taking on problems that are long-running, ambiguous, or highly multi-step. It executes well-scoped tasks with few mistakes, automatically self-correcting through verification loops, and ships with robust safeguards.",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: {
      inputPer1M: 10,
      outputPer1M: 50,
      cachedInputReadPer1M: 1,
      cachedInputWritePer1M: 12.5,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-fable-5",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-fable-5",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-haiku-4-5",
    vendor: "anthropic",
    name: "Claude Haiku 4.5",
    description:
      "Claude Haiku 4.5 is Anthropic’s fastest and most efficient model, delivering near-frontier intelligence at a fraction of the cost and latency of larger Claude models. Matching Claude Sonnet 4’s performance across reasoning, coding, and computer-use tasks, Haiku 4.5 brings frontier-level capability to real-time and high-volume applications.\n\nIt introduces extended thinking to the Haiku line; enabling controllable reasoning depth, summarized or interleaved thought output, and tool-assisted workflows with full support for coding, bash, web search, and computer-use tools. Scoring u003e73% on SWE-bench Verified, Haiku 4.5 ranks among the world’s best coding models while maintaining exceptional responsiveness for sub-agents, parallelized execution, and scaled deployment.",
    modality: "text",
    contextWindow: 200_000,
    maxOutputTokens: 8192,
    pricing: {
      inputPer1M: 1,
      outputPer1M: 5,
      cachedInputReadPer1M: 0.1,
      cachedInputWritePer1M: 1.25,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "streaming",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-haiku-4-5",
        paygMarkup: 1,
        latencyP50Ms: 5155,
        throughputTps: null,
        sampleCount: 77,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-haiku-4.5",
        paygMarkup: 1.1,
        latencyP50Ms: 1672,
        throughputTps: 2.391_634_641_165_430_3,
        sampleCount: 2,
      },
    ],
  },
  {
    id: "anthropic/claude-opus-4-1",
    vendor: "anthropic",
    name: "Claude Opus 4.1",
    description:
      "Claude Opus 4.1 is an updated version of Anthropic’s flagship model, offering improved performance in coding, reasoning, and agentic tasks. It achieves 74.5% on SWE-bench Verified and shows notable gains in multi-file code refactoring, debugging precision, and detail-oriented reasoning. The model supports extended thinking up to 64K tokens and is optimized for tasks involving research, data analysis, and tool-assisted reasoning.",
    modality: "text",
    contextWindow: 200_000,
    maxOutputTokens: 32_000,
    pricing: {
      inputPer1M: 15,
      outputPer1M: 75,
      cachedInputReadPer1M: 1.5,
      cachedInputWritePer1M: 18.75,
    },
    pricingMarkup: 1,
    capabilities: ["tools", "vision"],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-opus-4-1",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-opus-4.1",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-opus-4-5",
    vendor: "anthropic",
    name: "Claude Opus 4.5",
    description:
      "Claude Opus 4.5 is Anthropic’s frontier reasoning model optimized for complex software engineering, agentic workflows, and long-horizon computer use. It offers strong multimodal capabilities, competitive performance across real-world coding and reasoning benchmarks, and improved robustness to prompt injection. The model is designed to operate efficiently across varied effort levels, enabling developers to trade off speed, depth, and token usage depending on task requirements. It comes with a new parameter to control token efficiency, which can be accessed using the OpenRouter Verbosity parameter with low, medium, or high.\n\nOpus 4.5 supports advanced tool use, extended context management, and coordinated multi-agent setups, making it well-suited for autonomous research, debugging, multi-step planning, and spreadsheet/browser manipulation. It delivers substantial gains in structured reasoning, execution reliability, and alignment compared to prior Opus generations, while reducing token overhead and improving performance on long-running tasks.",
    modality: "text",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    pricing: {
      inputPer1M: 5,
      outputPer1M: 25,
      cachedInputReadPer1M: 0.5,
      cachedInputWritePer1M: 6.25,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-opus-4-5",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-opus-4.5",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-opus-4-6",
    vendor: "anthropic",
    name: "Claude Opus 4.6",
    description:
      "Opus 4.6 is Anthropic’s strongest model for coding and long-running professional tasks. It is built for agents that operate across entire workflows rather than single prompts, making it especially effective for large codebases, complex refactors, and multi-step debugging that unfolds over time. The model shows deeper contextual understanding, stronger problem decomposition, and greater reliability on hard engineering tasks than prior generations.\n\nBeyond coding, Opus 4.6 excels at sustained knowledge work. It produces near-production-ready documents, plans, and analyses in a single pass, and maintains coherence across very long outputs and extended sessions. This makes it a strong default for tasks that require persistence, judgment, and follow-through, such as technical design, migration planning, and end-to-end project execution.\n\nFor users upgrading from earlier Opus versions, see our [official migration guide here](https://openrouter.ai/docs/guides/guides/model-migrations/claude-4-6-opus)",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: {
      inputPer1M: 5,
      outputPer1M: 25,
      cachedInputReadPer1M: 0.5,
      cachedInputWritePer1M: 6.25,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-opus-4-6",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-opus-4.6",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-opus-4-7",
    vendor: "anthropic",
    name: "Claude Opus 4.7",
    description:
      "Opus 4.7 is the next generation of Anthropic's Opus family, built for long-running, asynchronous agents. Building on the coding and agentic strengths of Opus 4.6, it delivers stronger performance on complex, multi-step tasks and more reliable agentic execution across extended workflows. It is especially effective for asynchronous agent pipelines where tasks unfold over time - large codebases, multi-stage debugging, and end-to-end project orchestration.\n\nBeyond coding, Opus 4.7 brings improved knowledge work capabilities - from drafting documents and building presentations to analyzing data. It maintains coherence across very long outputs and extended sessions, making it a strong default for tasks that require persistence, judgment, and follow-through.\n\nFor users upgrading from earlier Opus versions, see our [official migration guide here](https://openrouter.ai/docs/guides/evaluate-and-optimize/model-migrations/claude-4-7)",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: {
      inputPer1M: 5,
      outputPer1M: 25,
      cachedInputReadPer1M: 0.5,
      cachedInputWritePer1M: 6.25,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-opus-4-7",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-opus-4.7",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-opus-4-8",
    vendor: "anthropic",
    name: "Claude Opus 4.8",
    description:
      "Claude Opus 4.8 is Anthropic's most capable generally available model in the Opus family. It supports text, image, and file inputs with text output, with reasoning support and a 1M-token context window. It is suited for highly autonomous agents, long-horizon agentic work, knowledge work, and memory-driven tasks where coherence over extended sessions matters.\n\nIt is particularly strong on multi-step reasoning, complex coding, and end-to-end project orchestration - large codebases, multi-stage debugging, and long-running asynchronous agent pipelines. Beyond coding, it handles knowledge work such as drafting documents, building presentations, and analyzing data, maintaining quality across very long outputs.",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: {
      inputPer1M: 5,
      outputPer1M: 25,
      cachedInputReadPer1M: 0.5,
      cachedInputWritePer1M: 6.25,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-opus-4-8",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-opus-4.8",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-opus-5",
    vendor: "anthropic",
    name: "Claude Opus 5",
    description:
      "Claude Opus 5 is Anthropic’s flagship model for demanding reasoning, coding, and long-horizon agentic work. It is particularly strong at end-to-end software tasks, code review and bug finding, visual analysis of charts and documents, complex office deliverables, and coordinating parallel subagents.\n\nThe model maintains strong instruction following and tool use across extended tasks, while remaining effective at lower effort settings for workloads that prioritize latency and token efficiency.",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: {
      inputPer1M: 5,
      outputPer1M: 25,
      cachedInputReadPer1M: 0.5,
      cachedInputWritePer1M: 6.25,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-opus-5",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-opus-5",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    vendor: "anthropic",
    name: "Claude Sonnet 4.5",
    description:
      "Claude Sonnet 4.5 is Anthropic’s most advanced Sonnet model to date, optimized for real-world agents and coding workflows. It delivers state-of-the-art performance on coding benchmarks such as SWE-bench Verified, with improvements across system design, code security, and specification adherence. The model is designed for extended autonomous operation, maintaining task continuity across sessions and providing fact-based progress tracking.\n\nSonnet 4.5 also introduces stronger agentic capabilities, including improved tool orchestration, speculative parallel execution, and more efficient context and memory management. With enhanced context tracking and awareness of token usage across tool calls, it is particularly well-suited for multi-context and long-running workflows. Use cases span software engineering, cybersecurity, financial analysis, research agents, and other domains requiring sustained reasoning and tool use.",
    modality: "text",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    pricing: {
      inputPer1M: 3,
      outputPer1M: 15,
      cachedInputReadPer1M: 0.3,
      cachedInputWritePer1M: 3.75,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-sonnet-4-5",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-sonnet-4.5",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-sonnet-4-6",
    vendor: "anthropic",
    name: "Claude Sonnet 4.6",
    description:
      "Sonnet 4.6 is Anthropic's most capable Sonnet-class model yet, with frontier performance across coding, agents, and professional work. It excels at iterative development, complex codebase navigation, end-to-end project management with memory, polished document creation, and confident computer use for web QA and workflow automation.",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 64_000,
    pricing: {
      inputPer1M: 3,
      outputPer1M: 15,
      cachedInputReadPer1M: 0.3,
      cachedInputWritePer1M: 3.75,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-sonnet-4-6",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-sonnet-4.6",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "anthropic/claude-sonnet-5",
    vendor: "anthropic",
    name: "Claude Sonnet 5",
    description:
      "Sonnet 5 is Anthropic's most capable Sonnet-class model, with frontier performance across coding, agents, and professional work. It supports adaptive thinking with selectable reasoning effort levels (low, medium, high, max, and x-high), a 1M-token context window, and text, image, and file inputs. Sonnet 5 uses an updated tokenizer and includes real-time cyber safeguards that block certain high-risk dual-use activities.",
    modality: "text",
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: {
      inputPer1M: 2,
      outputPer1M: 10,
      cachedInputReadPer1M: 0.2,
      cachedInputWritePer1M: 2.5,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "anthropic/claude-sonnet-5",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "anthropic/claude-sonnet-5",
        paygMarkup: 1.1,
        latencyP50Ms: 6379,
        throughputTps: 40.403_018_237_994_3,
        sampleCount: 680,
      },
    ],
  },
  {
    id: "deepseek/deepseek-v4-flash",
    vendor: "deepseek",
    name: "DeepSeek V4 Flash",
    description:
      "DeepSeek V4 Flash is an efficiency-optimized Mixture-of-Experts model from DeepSeek with 284B total parameters and 13B activated parameters, supporting a 1M-token context window. It is designed for fast inference and high-throughput workloads, while maintaining strong reasoning and coding performance.\n\nThe model includes hybrid attention for efficient long-context processing. Reasoning efforts `high` and `xhigh` are supported; `xhigh` maps to max reasoning. It is well suited for applications such as coding assistants, chat systems, and agent workflows where responsiveness and cost efficiency are important.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 393_216,
    pricing: {
      inputPer1M: 0.14,
      outputPer1M: 0.28,
      cachedInputReadPer1M: 0.028,
      cachedInputWritePer1M: 0,
    },
    pricingMarkup: 1.1,
    capabilities: [
      "tools",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "streaming",
    ],
    releasedAt: "2026-04-24T03:17:46.000Z",
    providers: [
      {
        id: "openrouter",
        nativeModelId: "deepseek/deepseek-v4-flash",
        paygMarkup: 1.1,
        latencyP50Ms: 5052,
        throughputTps: 43.653_316_380_589_104,
        sampleCount: 91,
      },
      {
        id: "alibaba",
        nativeModelId: "deepseek-v4-flash",
        paygMarkup: 1,
        latencyP50Ms: 2549,
        throughputTps: 38.054_138_877_991_37,
        sampleCount: 1,
      },
    ],
  },
  {
    id: "deepseek/deepseek-v4-pro",
    vendor: "deepseek",
    name: "DeepSeek V4 Pro",
    description:
      "DeepSeek V4 Pro is a large-scale Mixture-of-Experts model from DeepSeek with 1.6T total parameters and 49B activated parameters, supporting a 1M-token context window. It is designed for advanced reasoning, coding, and long-horizon agent workflows, with strong performance across knowledge, math, and software engineering benchmarks.\n\nBuilt on the same architecture as DeepSeek V4 Flash, it introduces a hybrid attention system for efficient long-context processing. Reasoning efforts `high` and `xhigh` are supported; `xhigh` maps to max reasoning. It is well suited for complex workloads such as full-codebase analysis, multi-step automation, and large-scale information synthesis, where both capability and efficiency are critical.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 384_000,
    pricing: {
      inputPer1M: 0.435,
      outputPer1M: 0.87,
      cachedInputReadPer1M: 0.003_625,
      cachedInputWritePer1M: 0,
    },
    pricingMarkup: 1.1,
    capabilities: [
      "tools",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "streaming",
    ],
    releasedAt: "2026-04-24T03:17:59.000Z",
    providers: [
      {
        id: "openrouter",
        nativeModelId: "deepseek/deepseek-v4-pro",
        paygMarkup: 1.1,
        latencyP50Ms: 2118,
        throughputTps: 9.915_014_164_305_95,
        sampleCount: 1,
      },
      {
        id: "alibaba",
        nativeModelId: "deepseek-v4-pro",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-2-5-flash",
    vendor: "google",
    name: "Gemini 2.5 Flash",
    description:
      'Gemini 2.5 Flash is Google\'s state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling. \n\nAdditionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).',
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 8192,
    pricing: {
      inputPer1M: 0.3,
      outputPer1M: 2.5,
      cachedInputReadPer1M: null,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: ["tools", "vision", "responseSchema", "audioOutput"],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-2.5-flash",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-2.5-flash",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-2-5-flash-lite",
    vendor: "google",
    name: "Gemini 2.5 Flash Lite",
    description:
      'Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the [Reasoning API parameter](https://openrouter.ai/docs/use-cases/reasoning-tokens) to selectively trade off cost for intelligence.',
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_535,
    pricing: {
      inputPer1M: 0.1,
      outputPer1M: 0.4,
      cachedInputReadPer1M: 0.01,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "webSearch",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-2.5-flash-lite",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-2.5-flash-lite",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-2-5-pro",
    vendor: "google",
    name: "Gemini 2.5 Pro",
    description:
      "Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 8192,
    pricing: {
      inputPer1M: 1.25,
      outputPer1M: 10,
      cachedInputReadPer1M: null,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: ["tools", "vision", "responseSchema", "audioOutput"],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-2.5-pro",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-2.5-pro",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-flash-preview",
    vendor: "google",
    name: "Gemini 3 Flash Preview",
    description:
      "Gemini 3 Flash Preview is a high speed, high value thinking model designed for agentic workflows, multi turn chat, and coding assistance. It delivers near Pro level reasoning and tool use performance with substantially lower latency than larger Gemini variants, making it well suited for interactive development, long running agent loops, and collaborative coding tasks. Compared to Gemini 2.5 Flash, it provides broad quality improvements across reasoning, multimodal understanding, and reliability.\n\nThe model supports a 1M token context window and multimodal inputs including text, images, audio, video, and PDFs, with text output. It includes configurable reasoning via thinking levels (minimal, low, medium, high), structured output, tool use, and automatic context caching. Gemini 3 Flash Preview is optimized for users who want strong reasoning and agentic behavior without the cost or latency of full scale frontier models.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_535,
    pricing: {
      inputPer1M: 0.5,
      outputPer1M: 3,
      cachedInputReadPer1M: 0.05,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "webSearch",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3-flash-preview",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-3-flash-preview",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-1-flash-lite",
    vendor: "google",
    name: "Gemini 3.1 Flash Lite",
    description:
      "Gemini 3.1 Flash Lite is Google’s GA high-efficiency multimodal model optimized for low-latency, high-volume workloads. It supports text, image, video, audio, and PDF inputs, and is designed for lightweight agentic workflows, simple data extraction, and applications where responsiveness and API cost are the primary constraints.\n\nSupports full thinking levels (minimal, low, medium, high) for fine-grained cost/performance trade-offs. Priced at half the cost of Gemini 3 Flash.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: {
      inputPer1M: 0.25,
      outputPer1M: 1.5,
      cachedInputReadPer1M: 0.025,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "webSearch",
      "audioInput",
      "pdfInput",
      "videoInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3.1-flash-lite",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-3.1-flash-lite",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-1-flash-lite-preview",
    vendor: "google",
    name: "Gemini 3.1 Flash Lite Preview",
    description:
      "Gemini 3.1 Flash Lite Preview is Google's high-efficiency model optimized for high-volume use cases. It outperforms Gemini 2.5 Flash Lite on overall quality and approaches Gemini 2.5 Flash performance across key capabilities. Improvements span audio input/ASR, RAG snippet ranking, translation, data extraction, and code completion. Supports full thinking levels (minimal, low, medium, high) for fine-grained cost/performance trade-offs. Priced at half the cost of Gemini 3 Flash.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: {
      inputPer1M: 0.25,
      outputPer1M: 1.5,
      cachedInputReadPer1M: 0.025,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "webSearch",
      "audioInput",
      "pdfInput",
      "videoInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "google/gemini-3.1-flash-lite-preview",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3.1-flash-lite-preview",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-1-pro-preview",
    vendor: "google",
    name: "Gemini 3.1 Pro Preview",
    description:
      "Gemini 3.1 Pro Preview is Google’s frontier reasoning model, delivering enhanced software engineering performance, improved agentic reliability, and more efficient token usage across complex workflows. Building on the multimodal foundation of the Gemini 3 series, it combines high-precision reasoning across text, image, video, audio, and code with a 1M-token context window. Reasoning Details must be preserved when using multi-turn tool calling, see our docs here: https://openrouter.ai/docs/use-cases/reasoning-tokens#preserving-reasoning. The 3.1 update introduces measurable gains in SWE benchmarks and real-world coding environments, along with stronger autonomous task execution in structured domains such as finance and spreadsheet-based workflows.\n\nDesigned for advanced development and agentic systems, Gemini 3.1 Pro Preview improves long-horizon stability and tool orchestration while increasing token efficiency. It introduces a new medium thinking level to better balance cost, speed, and performance. The model excels in agentic coding, structured planning, multimodal analysis, and workflow automation, making it well-suited for autonomous agents, financial modeling, spreadsheet automation, and high-context enterprise tasks.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: {
      inputPer1M: 2,
      outputPer1M: 12,
      cachedInputReadPer1M: 0.2,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "audioInput",
      "pdfInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3.1-pro-preview",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-3.1-pro-preview",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-5-flash",
    vendor: "google",
    name: "Gemini 3.5 Flash",
    description:
      "Gemini 3.5 Flash is Google's high-efficiency multimodal model, bringing near-Pro level coding and reasoning at Flash-tier cost and speed. It is highly optimized for coding proficiency and parallel agentic execution loops, supporting text, image, video, audio, and PDF inputs.\n\nDefaults to medium thinking effort for faster and more cost-efficient responses, with full support for thinking levels (minimal, low, medium, high) for fine-grained cost/performance trade-offs.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_535,
    pricing: {
      inputPer1M: 1.5,
      outputPer1M: 9,
      cachedInputReadPer1M: 0.15,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "streaming",
      "webSearch",
      "audioInput",
      "pdfInput",
      "videoInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3.5-flash",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "google/gemini-3.5-flash",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-5-flash-lite",
    vendor: "google",
    name: "Gemini 3.5 Flash Lite",
    description:
      "Gemini 3.5 Flash Lite is a high-efficiency model from Google with upgraded agentic capabilities. It is suited for subagents that execute focused tasks within complex, multi-agent workflows.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: {
      inputPer1M: 0.3,
      outputPer1M: 2.5,
      cachedInputReadPer1M: 0.03,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "streaming",
      "webSearch",
      "audioInput",
      "pdfInput",
      "videoInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "google/gemini-3.5-flash-lite",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3.5-flash-lite",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "google/gemini-3-6-flash",
    vendor: "google",
    name: "Gemini 3.6 Flash",
    description:
      "Gemini 3.6 Flash is a high-efficiency model from Google for coding, agentic workflows, and web and app development. It is designed to produce polished outputs with fewer unnecessary edits and less hedging, while reducing token use and the number of model calls needed to complete a task.",
    modality: "text",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: {
      inputPer1M: 1.5,
      outputPer1M: 7.5,
      cachedInputReadPer1M: 0.15,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: [
      "tools",
      "vision",
      "reasoning",
      "promptCaching",
      "responseSchema",
      "streaming",
      "webSearch",
      "audioInput",
      "pdfInput",
      "videoInput",
    ],
    releasedAt: null,
    providers: [
      {
        id: "vertex",
        nativeModelId: "google/gemini-3.6-flash",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "openrouter",
        nativeModelId: "google/gemini-3.6-flash",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
  {
    id: "moonshotai/kimi-k2-thinking",
    vendor: "moonshotai",
    name: "MoonshotAI: Kimi K2 Thinking",
    description:
      "Kimi K2 Thinking is Moonshot AI’s most advanced open reasoning model to date, extending the K2 series into agentic, long-horizon reasoning. Built on the trillion-parameter Mixture-of-Experts (MoE) architecture introduced in Kimi K2, it activates 32 billion parameters per forward pass and supports 256 k-token context windows. The model is optimized for persistent step-by-step thought, dynamic tool invocation, and complex reasoning workflows that span hundreds of turns. It interleaves step-by-step reasoning with tool use, enabling autonomous research, coding, and writing that can persist for hundreds of sequential actions without drift.\n\nIt sets new open-source benchmarks on HLE, BrowseComp, SWE-Multilingual, and LiveCodeBench, while maintaining stable multi-agent behavior through 200–300 tool calls. Built on a large-scale MoE architecture with MuonClip optimization, it combines strong reasoning depth with high inference efficiency for demanding agentic and analytical tasks.",
    modality: "text",
    contextWindow: 256_000,
    maxOutputTokens: 256_000,
    pricing: {
      inputPer1M: 0.6,
      outputPer1M: 2.5,
      cachedInputReadPer1M: null,
      cachedInputWritePer1M: null,
    },
    pricingMarkup: 1,
    capabilities: ["tools", "webSearch"],
    releasedAt: null,
    providers: [
      {
        id: "openrouter",
        nativeModelId: "moonshotai/kimi-k2-thinking",
        paygMarkup: 1.1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
      {
        id: "vertex",
        nativeModelId: "moonshotai/kimi-k2-thinking-maas",
        paygMarkup: 1,
        latencyP50Ms: null,
        throughputTps: null,
        sampleCount: 0,
      },
    ],
  },
];

/* ─── Static derivations ─────────────────────────────────────────────────── */

// Computed once at module load from MODELS, so the page header, the tab
// counts, and the table can never disagree with the catalog.

/** Lands on 3. Derived, not asserted — if a provider ever stops serving
 *  every model in the catalog, the header number follows. */
export const TOTAL_PROVIDERS = (() => {
  const set = new Set<ProviderId>();
  for (const m of MODELS) {
    for (const p of m.providers) {
      set.add(p.id);
    }
  }
  return set.size;
})();

export const MODALITY_COUNTS: Record<Modality, number> = (() => {
  const counts: Record<Modality, number> = { text: 0 };
  for (const m of MODELS) {
    counts[m.modality]++;
  }
  return counts;
})();

/** Flat (handle, label, vendor) list — exported for the PAYG Manual setup
 *  model picker so it stays in sync with the catalog. The canonical id IS
 *  the handle. */
export type ModelOption = { handle: string; label: string; vendor: Vendor };

export const MODEL_OPTIONS: ModelOption[] = MODELS.map((m) => ({
  handle: m.id,
  label: m.name,
  vendor: m.vendor,
}));

/* ─── Catalog lookup ─────────────────────────────────────────────────────── */

const MODEL_BY_ID: ReadonlyMap<string, Model> = new Map(
  MODELS.map((m) => [m.id, m])
);

/**
 * The catalog is the single source for model naming across the app.
 *
 * Every surface that names a model stores the canonical `vendor/model` id —
 * the same string the gateway takes as a handle — and renders the human label
 * through `modelName()`. Before 2026-08-03 each surface carried its own
 * spelling (`claude-opus-4.7` in Messages, "Claude Opus 4.7" in Activity,
 * "GPT-5.2" in Setup), which is how Messages, Activity, and Models ended up
 * describing three different fleets. Look the name up; never re-type it.
 */
export function modelById(id: string): Model | undefined {
  return MODEL_BY_ID.get(id);
}

/** Display name for a canonical id ("anthropic/claude-opus-4-8" → "Claude
 *  Opus 4.8"). Falls back to the bare model segment so an unknown id degrades
 *  to something readable instead of blank — `models-catalog.test.ts` is what
 *  guarantees no shipped id ever takes that branch. */
export function modelName(id: string): string {
  const model = MODEL_BY_ID.get(id);
  if (model) {
    return model.name;
  }
  const [, bare] = id.split("/");
  return bare ?? id;
}

/** Every canonical id in the catalog. Used by the coverage test that pins
 *  every model reference in the app to a real catalog entry. */
export const MODEL_IDS: readonly string[] = MODELS.map((m) => m.id);

/**
 * The seven models the PAYG pricing table (`/setup-models-default`) quotes —
 * five vendors, a full price spread from Opus at the top to Qwen3 Next at the
 * bottom. Ids only: the page reads name, vendor, and both per-1M rates back
 * through `modelById` + `listPrice`, so it cannot quote a figure the Models
 * page disagrees with.
 *
 * It lives here rather than in the page because the page module exports only
 * components (react-refresh), and because a list of catalog ids is catalog
 * business. Until 2026-08-03 the page hand-typed all four columns and four of
 * its seven rows named models that do not exist.
 */
export const PAYG_PRICING_MODEL_IDS: readonly string[] = [
  "anthropic/claude-opus-4-8",
  "anthropic/claude-sonnet-4-6",
  "deepseek/deepseek-v4-pro",
  "moonshotai/kimi-k2-thinking",
  "google/gemini-2-5-pro",
  "deepseek/deepseek-v4-flash",
  "qwen/qwen3-next-80b-a3b-instruct",
];
