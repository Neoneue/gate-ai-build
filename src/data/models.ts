/**
 * Model catalog data for the Models page. Extracted verbatim from Models.tsx
 * (the ~940-line data literal + its types, config maps, and derived exports)
 * so the page file holds view code, not the catalog. Pure data + metadata;
 * consumed by Models.tsx and SetupManual.tsx (MODEL_OPTIONS).
 */
import { Braces, Database, Eye, Globe, Wrench, Zap } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { Vendor } from "@/components/icons/vendor-meta";

/* ─── Type model ─────────────────────────────────────────────────────────── */

export type Modality = "text" | "embeddings" | "audio" | "rerank";

export type Capability =
  | "vision"
  | "tools"
  | "json"
  | "streaming"
  | "cache"
  | "webSearch";

export type ProviderId =
  | "anthropic"
  | "openai"
  | "google"
  | "meta"
  | "mistral"
  | "xai"
  | "deepseek"
  | "cohere"
  | "bedrock"
  | "azure"
  | "vertex"
  | "together"
  | "fireworks"
  | "groq";

export type ProviderOffering = {
  provider: ProviderId;
  handle: string;
  contextK: number;
  maxOutputK: number;
  latencyP50Ms?: number;
  throughputTps?: number;
  inputPricePerM: number;
  outputPricePerM: number;
  cacheReadPerM?: number;
  cacheWritePerM?: number;
};

export type Model = {
  id: string;
  vendor: Vendor;
  name: string;
  description: string;
  modality: Modality;
  capabilities: Capability[];
  defaultHandle: string;
  offerings: ProviderOffering[];
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  mistral: "Mistral",
  xai: "xAI",
  deepseek: "DeepSeek",
  cohere: "Cohere",
  bedrock: "AWS Bedrock",
  azure: "Azure OpenAI",
  vertex: "Google Vertex",
  together: "Together AI",
  fireworks: "Fireworks AI",
  groq: "Groq",
};

// Marketplace providers don't carry a Vendor identity — VendorAvatar can't
// render them. Map provider → vendor for the cell-level avatar stack so the
// row reads "Anthropic + Bedrock + Vertex" with the correct three glyphs.
export const PROVIDER_VENDOR: Partial<Record<ProviderId, Vendor>> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  meta: "meta",
  mistral: "mistral",
  xai: "xai",
  deepseek: "deepseek",
  cohere: "cohere",
};

export type CapabilityMeta = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const CAPABILITY_META: Record<Capability, CapabilityMeta> = {
  vision: { label: "Vision", icon: Eye },
  tools: { label: "Tool use", icon: Wrench },
  json: { label: "JSON mode", icon: Braces },
  streaming: { label: "Streaming", icon: Zap },
  cache: { label: "Prompt caching", icon: Database },
  webSearch: { label: "Web search", icon: Globe },
};

export const CAPABILITY_ORDER: Capability[] = [
  "vision",
  "tools",
  "json",
  "streaming",
  "cache",
  "webSearch",
];

/* ─── Mock catalog ───────────────────────────────────────────────────────── */

export const MODELS: Model[] = [
  {
    id: "claude-opus-4-7",
    vendor: "anthropic",
    name: "Claude Opus 4.7",
    description:
      "Anthropic’s flagship reasoning model and the strongest pick when answer quality matters more than throughput. Excels at long-horizon code generation, multi-step agentic tool use, and tasks that require holding the full 200K context in working memory at once. Reaches for evidence inside long documents with high recall and produces structured output reliably enough that downstream parsers rarely need fallback paths. Choose Opus when a single mistake is expensive — code review, financial analysis, contract review — and pair it with prompt caching to keep the per-request bill bounded.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming", "cache"],
    defaultHandle: "anthropic/claude-opus-4-7",
    offerings: [
      {
        provider: "anthropic",
        handle: "anthropic/claude-opus-4-7",
        contextK: 200,
        maxOutputK: 16,
        latencyP50Ms: 820,
        throughputTps: 64,
        inputPricePerM: 15,
        outputPricePerM: 75,
        cacheReadPerM: 1.5,
        cacheWritePerM: 18.75,
      },
      {
        provider: "bedrock",
        handle: "bedrock/claude-opus-4-7",
        contextK: 200,
        maxOutputK: 16,
        latencyP50Ms: 880,
        throughputTps: 58,
        inputPricePerM: 15,
        outputPricePerM: 75,
        cacheReadPerM: 1.5,
        cacheWritePerM: 18.75,
      },
      {
        provider: "vertex",
        handle: "vertex/claude-opus-4-7",
        contextK: 200,
        maxOutputK: 16,
        latencyP50Ms: 905,
        throughputTps: 56,
        inputPricePerM: 15,
        outputPricePerM: 75,
      },
    ],
  },
  {
    id: "claude-sonnet-4-5",
    vendor: "anthropic",
    name: "Claude Sonnet 4.5",
    description:
      "The default pick for most production traffic. Sonnet 4.5 lands within striking distance of Opus on instruction-following and tool use while costing 5× less and answering roughly 2× faster, which is the trade-off most agentic workloads actually want. Vision input, prompt caching, and structured JSON output are all first-class, and the 200K context window is wide enough to inline mid-sized codebases or retrieved document sets without aggressive summarization. If you don’t already know that Opus is the right call, start here.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming", "cache"],
    defaultHandle: "anthropic/claude-sonnet-4-5",
    offerings: [
      {
        provider: "anthropic",
        handle: "anthropic/claude-sonnet-4-5",
        contextK: 200,
        maxOutputK: 8,
        latencyP50Ms: 410,
        throughputTps: 142,
        inputPricePerM: 3,
        outputPricePerM: 15,
        cacheReadPerM: 0.3,
        cacheWritePerM: 3.75,
      },
      {
        provider: "bedrock",
        handle: "bedrock/claude-sonnet-4-5",
        contextK: 200,
        maxOutputK: 8,
        latencyP50Ms: 460,
        throughputTps: 128,
        inputPricePerM: 3,
        outputPricePerM: 15,
        cacheReadPerM: 0.3,
        cacheWritePerM: 3.75,
      },
      {
        provider: "vertex",
        handle: "vertex/claude-sonnet-4-5",
        contextK: 200,
        maxOutputK: 8,
        latencyP50Ms: 485,
        throughputTps: 124,
        inputPricePerM: 3,
        outputPricePerM: 15,
      },
    ],
  },
  {
    id: "claude-haiku-4-5",
    vendor: "anthropic",
    name: "Claude Haiku 4.5",
    description:
      "The smallest and fastest model in the Claude family, sized for classification, routing, and cheap completions at production scale. Latency in the 200ms range and throughput north of 250 tokens-per-second make Haiku the right choice for hot paths where every added millisecond shows up in user experience. It still handles tool use, vision input, and prompt caching well enough to anchor lightweight agents — particularly first-pass triage that hands off to a larger model only when the question warrants it. Treat it as the baseline; reach for Sonnet only when Haiku visibly underperforms on your eval set.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming", "cache"],
    defaultHandle: "anthropic/claude-haiku-4-5",
    offerings: [
      {
        provider: "anthropic",
        handle: "anthropic/claude-haiku-4-5",
        contextK: 200,
        maxOutputK: 8,
        latencyP50Ms: 220,
        throughputTps: 280,
        inputPricePerM: 0.8,
        outputPricePerM: 4,
        cacheReadPerM: 0.08,
        cacheWritePerM: 1,
      },
      {
        provider: "bedrock",
        handle: "bedrock/claude-haiku-4-5",
        contextK: 200,
        maxOutputK: 8,
        latencyP50Ms: 245,
        throughputTps: 260,
        inputPricePerM: 0.8,
        outputPricePerM: 4,
      },
      {
        provider: "vertex",
        handle: "vertex/claude-haiku-4-5",
        contextK: 200,
        maxOutputK: 8,
        latencyP50Ms: 260,
        throughputTps: 248,
        inputPricePerM: 0.8,
        outputPricePerM: 4,
      },
    ],
  },
  {
    id: "gpt-5",
    vendor: "openai",
    name: "GPT-5",
    description:
      "OpenAI’s top-tier reasoning model and the natural counterweight to Claude Opus. GPT-5 brings native web search, a 256K context window, richer cache controls, and the deepest tool-calling reliability in the OpenAI lineup. Vision is genuinely good — chart understanding and multi-page document parsing both land cleanly — and structured-output mode rarely drifts from the requested schema. Pick GPT-5 when the workload mixes long documents, current-events lookups, and multi-tool orchestration, and when you’re already on the OpenAI ecosystem for the rest of your stack.",
    modality: "text",
    capabilities: [
      "vision",
      "tools",
      "json",
      "streaming",
      "cache",
      "webSearch",
    ],
    defaultHandle: "openai/gpt-5",
    offerings: [
      {
        provider: "openai",
        handle: "openai/gpt-5",
        contextK: 256,
        maxOutputK: 16,
        latencyP50Ms: 690,
        throughputTps: 88,
        inputPricePerM: 5,
        outputPricePerM: 20,
        cacheReadPerM: 0.5,
        cacheWritePerM: 6,
      },
      {
        provider: "azure",
        handle: "azure/gpt-5",
        contextK: 256,
        maxOutputK: 16,
        latencyP50Ms: 730,
        throughputTps: 84,
        inputPricePerM: 5,
        outputPricePerM: 20,
        cacheReadPerM: 0.5,
        cacheWritePerM: 6,
      },
    ],
  },
  {
    id: "gpt-4o",
    vendor: "openai",
    name: "GPT-4o",
    description:
      "The mid-tier OpenAI workhorse and the most-deployed model in this catalog. GPT-4o handles vision in, fast streaming out, function calling, and JSON-mode output well enough to anchor most general-purpose production traffic without a fallback. Pricing sits in the comfortable middle — under 1/6th of GPT-5 on input — and 380ms typical latency keeps it usable in synchronous chat. Reach for it when you want a known-good baseline that won’t surprise you on cost or behavior; reach past it only when the eval data tells you to.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming", "cache"],
    defaultHandle: "openai/gpt-4o",
    offerings: [
      {
        provider: "openai",
        handle: "openai/gpt-4o",
        contextK: 128,
        maxOutputK: 16,
        latencyP50Ms: 380,
        throughputTps: 156,
        inputPricePerM: 2.5,
        outputPricePerM: 10,
        cacheReadPerM: 1.25,
      },
      {
        provider: "azure",
        handle: "azure/gpt-4o",
        contextK: 128,
        maxOutputK: 16,
        latencyP50Ms: 405,
        throughputTps: 148,
        inputPricePerM: 2.5,
        outputPricePerM: 10,
      },
    ],
  },
  {
    id: "gpt-4o-mini",
    vendor: "openai",
    name: "GPT-4o-mini",
    description:
      "The cheapest vision-capable OpenAI model and a sensible default for high-volume agent loops where each call is small and structured. Classification, extraction, summarization of short documents, and the inner steps of multi-stage agents all run cleanly here for a fraction of GPT-4o’s spend. Vision is competent on screenshots and simple charts but should not be trusted on dense multi-page documents — escalate to GPT-4o or GPT-5 when the input is genuinely complex. Treat it as the “first pass” model in tiered routing setups.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming"],
    defaultHandle: "openai/gpt-4o-mini",
    offerings: [
      {
        provider: "openai",
        handle: "openai/gpt-4o-mini",
        contextK: 128,
        maxOutputK: 16,
        latencyP50Ms: 240,
        throughputTps: 320,
        inputPricePerM: 0.15,
        outputPricePerM: 0.6,
      },
      {
        provider: "azure",
        handle: "azure/gpt-4o-mini",
        contextK: 128,
        maxOutputK: 16,
        latencyP50Ms: 270,
        throughputTps: 300,
        inputPricePerM: 0.15,
        outputPricePerM: 0.6,
      },
    ],
  },
  {
    id: "gemini-3-pro",
    vendor: "google",
    name: "Gemini 3 Pro",
    description:
      "Google’s flagship long-context model and the model to pick when the input is large enough that everything else struggles. The 1M-token window changes what’s feasible — full repos, transcripts of multi-hour calls, or thousand-page PDFs fit without retrieval-shaped surgery. Multimodal reasoning is strong across image, audio, and video, and grounded web search returns citations with reliable URL resolution. Pricing scales with the input you actually send, so it’s economical on the low end and only gets expensive when you genuinely need the context. Choose Gemini 3 Pro for long-document QA, full-codebase analysis, and agents that need to keep the world model in their head.",
    modality: "text",
    capabilities: [
      "vision",
      "tools",
      "json",
      "streaming",
      "cache",
      "webSearch",
    ],
    defaultHandle: "google/gemini-3-pro",
    offerings: [
      {
        provider: "google",
        handle: "google/gemini-3-pro",
        contextK: 1000,
        maxOutputK: 8,
        latencyP50Ms: 540,
        throughputTps: 96,
        inputPricePerM: 1.25,
        outputPricePerM: 5,
        cacheReadPerM: 0.31,
      },
      {
        provider: "vertex",
        handle: "vertex/gemini-3-pro",
        contextK: 1000,
        maxOutputK: 8,
        latencyP50Ms: 580,
        throughputTps: 90,
        inputPricePerM: 1.25,
        outputPricePerM: 5,
        cacheReadPerM: 0.31,
      },
    ],
  },
  {
    id: "gemini-3-flash",
    vendor: "google",
    name: "Gemini 3 Flash",
    description:
      "Gemini Flash keeps the 1M-token context window of Pro but runs at half the latency and roughly 12× cheaper on input — the sweet spot for high-volume RAG and agent loops over large corpora. Vision and tool use both translate down from Pro cleanly, and prompt caching is well supported for repeat-prefix workloads. The accuracy gap shows up most on hard reasoning chains and ambiguous instructions, so wire an evaluation set before swapping it in for a Sonnet-class workload. For everything routine that needs long context, this is the cheapest serious option.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming", "cache"],
    defaultHandle: "google/gemini-3-flash",
    offerings: [
      {
        provider: "google",
        handle: "google/gemini-3-flash",
        contextK: 1000,
        maxOutputK: 8,
        latencyP50Ms: 280,
        throughputTps: 220,
        inputPricePerM: 0.1,
        outputPricePerM: 0.4,
      },
      {
        provider: "vertex",
        handle: "vertex/gemini-3-flash",
        contextK: 1000,
        maxOutputK: 8,
        latencyP50Ms: 305,
        throughputTps: 210,
        inputPricePerM: 0.1,
        outputPricePerM: 0.4,
      },
    ],
  },
  {
    id: "gemini-3-flash-lite",
    vendor: "google",
    name: "Gemini 3 Flash Lite",
    description:
      "The smallest, cheapest Gemini variant and one of the cheapest vision-capable models in this catalog at $0.05 per million input tokens. Built for ultra-high-volume routing, classification, and lightweight extraction where the work per call is small and the model pays for itself only at scale. Latency under 200ms makes it suitable for inline classification on user-facing flows, and it still preserves the 1M-token window — useful for occasional bursts that need long context without re-routing. Don’t expect strong multi-step reasoning; treat it as a structured-output dispatcher in front of bigger models.",
    modality: "text",
    capabilities: ["vision", "tools", "streaming"],
    defaultHandle: "google/gemini-3-flash-lite",
    offerings: [
      {
        provider: "google",
        handle: "google/gemini-3-flash-lite",
        contextK: 1000,
        maxOutputK: 8,
        latencyP50Ms: 180,
        throughputTps: 360,
        inputPricePerM: 0.05,
        outputPricePerM: 0.2,
      },
      {
        provider: "vertex",
        handle: "vertex/gemini-3-flash-lite",
        contextK: 1000,
        maxOutputK: 8,
        latencyP50Ms: 195,
        throughputTps: 348,
        inputPricePerM: 0.05,
        outputPricePerM: 0.2,
      },
    ],
  },
  {
    id: "llama-3-3-70b",
    vendor: "meta",
    name: "Llama 3.3 70B",
    description:
      "The strongest mid-size open-weights model in the Llama line, available across four inference providers with meaningfully different latency and price profiles — Groq lands the same weights at roughly 4× the throughput of Bedrock for similar input cost. Tool use, JSON output, and streaming are all reliable at this size, and the 128K context window is enough for most production needs. Pick on workload shape: Groq for synchronous chat, Together or Fireworks for batch and async, Bedrock when AWS data-residency or IAM policies make it the path of least resistance. Open weights also mean fine-tuning and self-hosting are real options when the math works out.",
    modality: "text",
    capabilities: ["tools", "json", "streaming"],
    defaultHandle: "meta/llama-3.3-70b",
    offerings: [
      {
        provider: "bedrock",
        handle: "bedrock/llama-3.3-70b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 480,
        throughputTps: 110,
        inputPricePerM: 0.65,
        outputPricePerM: 2.65,
      },
      {
        provider: "together",
        handle: "together/llama-3.3-70b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 320,
        throughputTps: 180,
        inputPricePerM: 0.6,
        outputPricePerM: 0.6,
      },
      {
        provider: "fireworks",
        handle: "fireworks/llama-3.3-70b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 310,
        throughputTps: 200,
        inputPricePerM: 0.55,
        outputPricePerM: 0.55,
      },
      {
        provider: "groq",
        handle: "groq/llama-3.3-70b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 120,
        throughputTps: 540,
        inputPricePerM: 0.59,
        outputPricePerM: 0.79,
      },
    ],
  },
  {
    id: "llama-3-3-405b",
    vendor: "meta",
    name: "Llama 3.3 405B",
    description:
      "The largest open-weights model Meta ships and the strongest pick when you need closed-model reasoning quality without the closed-model lock-in. Trade-off is real: throughput is roughly 1/4 of the 70B variant on the same provider, and total latency for medium-length completions runs into the seconds. Where it shines is hard reasoning chains, code generation on novel problems, and any setting where weight transparency matters — whether that’s fine-tuning rights, deployment on private infrastructure, or auditability. Use it for the work that justifies the cost; route everything else to 70B.",
    modality: "text",
    capabilities: ["tools", "json", "streaming"],
    defaultHandle: "meta/llama-3.3-405b",
    offerings: [
      {
        provider: "bedrock",
        handle: "bedrock/llama-3.3-405b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 1100,
        throughputTps: 42,
        inputPricePerM: 2,
        outputPricePerM: 6,
      },
      {
        provider: "together",
        handle: "together/llama-3.3-405b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 980,
        throughputTps: 56,
        inputPricePerM: 1.8,
        outputPricePerM: 1.8,
      },
      {
        provider: "fireworks",
        handle: "fireworks/llama-3.3-405b",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 940,
        throughputTps: 60,
        inputPricePerM: 1.75,
        outputPricePerM: 1.75,
      },
    ],
  },
  {
    id: "mistral-large",
    vendor: "mistral",
    name: "Mistral Large",
    description:
      "Mistral’s flagship and the strongest model in the catalog with European data-residency options on multiple inference providers. Tool use is reliable, multilingual quality is genuinely strong across French, German, Spanish, and Italian, and structured-output mode lands consistently. The model sits below the GPT-5 / Opus tier on pure reasoning benchmarks but matches or beats GPT-4o on European-language tasks at lower cost. Pick it when GDPR, multilingual coverage, or a preference for European AI infrastructure is part of the buying decision.",
    modality: "text",
    capabilities: ["tools", "json", "streaming"],
    defaultHandle: "mistral/mistral-large",
    offerings: [
      {
        provider: "mistral",
        handle: "mistral/mistral-large",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 520,
        throughputTps: 92,
        inputPricePerM: 2,
        outputPricePerM: 6,
      },
      {
        provider: "bedrock",
        handle: "bedrock/mistral-large",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 560,
        throughputTps: 86,
        inputPricePerM: 2,
        outputPricePerM: 6,
      },
      {
        provider: "together",
        handle: "together/mistral-large",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 500,
        throughputTps: 100,
        inputPricePerM: 1.95,
        outputPricePerM: 1.95,
      },
    ],
  },
  {
    id: "mistral-medium",
    vendor: "mistral",
    name: "Mistral Medium",
    description:
      "The mid-tier Mistral and the right entry point when Large is overkill. Mistral Medium keeps most of the tool-use and structured-output quality of Large at roughly 1/5 the input cost and noticeably lower latency, which adds up in high-volume agent loops. Multilingual coverage is preserved at this size — quality drops modestly versus Large on long-form generation but holds up well on classification, extraction, and short-form responses. Choose Medium for production traffic where Mistral is already the platform of record and the workload is tolerant of a smaller reasoning ceiling.",
    modality: "text",
    capabilities: ["tools", "json", "streaming"],
    defaultHandle: "mistral/mistral-medium",
    offerings: [
      {
        provider: "mistral",
        handle: "mistral/mistral-medium",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 360,
        throughputTps: 168,
        inputPricePerM: 0.4,
        outputPricePerM: 2,
      },
    ],
  },
  {
    id: "grok-2",
    vendor: "xai",
    name: "Grok 2",
    description:
      "xAI’s flagship and the only model in this catalog with first-party access to real-time signals from a major social platform. Reasoning quality is competitive with the top tier on common benchmarks, vision input handles screenshots and document images well, and tool use is reliable enough to build agents on. The distinctive characteristic is recency — Grok’s training and serving pipeline keeps it unusually current on news, conversations, and emerging events compared to the Claude / GPT / Gemini families. Available only via xAI direct; pick it when freshness is part of the answer or when the workload is built around X data.",
    modality: "text",
    capabilities: ["vision", "tools", "json", "streaming"],
    defaultHandle: "xai/grok-2",
    offerings: [
      {
        provider: "xai",
        handle: "xai/grok-2",
        contextK: 128,
        maxOutputK: 8,
        latencyP50Ms: 620,
        throughputTps: 96,
        inputPricePerM: 2,
        outputPricePerM: 10,
      },
    ],
  },
  {
    id: "deepseek-r1",
    vendor: "deepseek",
    name: "DeepSeek R1",
    description:
      "An open-weights reasoning model that punches well above its price tier on math, code, and multi-step problem solving. Available across three inference providers, so price and latency can be tuned to the workload — DeepSeek direct sits cheapest on input, Fireworks lands highest throughput. The model exposes its chain-of-thought, which is genuinely useful for debugging agent behavior and for downstream verification steps. Choose it when the work is reasoning-shaped, when cost matters, and when you’re comfortable with an open-weights model in the path.",
    modality: "text",
    capabilities: ["tools", "json", "streaming"],
    defaultHandle: "deepseek/deepseek-r1",
    offerings: [
      {
        provider: "deepseek",
        handle: "deepseek/deepseek-r1",
        contextK: 64,
        maxOutputK: 8,
        latencyP50Ms: 720,
        throughputTps: 72,
        inputPricePerM: 0.55,
        outputPricePerM: 2.19,
      },
      {
        provider: "together",
        handle: "together/deepseek-r1",
        contextK: 64,
        maxOutputK: 8,
        latencyP50Ms: 680,
        throughputTps: 80,
        inputPricePerM: 0.5,
        outputPricePerM: 2,
      },
      {
        provider: "fireworks",
        handle: "fireworks/deepseek-r1",
        contextK: 64,
        maxOutputK: 8,
        latencyP50Ms: 650,
        throughputTps: 88,
        inputPricePerM: 0.5,
        outputPricePerM: 2,
      },
    ],
  },
  {
    id: "command-r-plus",
    vendor: "cohere",
    name: "Command R+",
    description:
      "Cohere’s flagship enterprise model and the strongest pick when retrieval, citation, and grounded answers are the load-bearing parts of the workload. Command R+ is purpose-built for RAG: it cites sources reliably, declines to answer when retrieval comes back thin, and handles multi-document synthesis with low fabrication rates. Tool use and web search are first-class, and AWS Bedrock availability covers most enterprise procurement requirements. Choose it for customer-facing retrieval, knowledge-base assistants, and any agent where “show your work” matters more than raw IQ.",
    modality: "text",
    capabilities: ["tools", "json", "streaming", "webSearch"],
    defaultHandle: "cohere/command-r-plus",
    offerings: [
      {
        provider: "cohere",
        handle: "cohere/command-r-plus",
        contextK: 128,
        maxOutputK: 4,
        latencyP50Ms: 480,
        throughputTps: 104,
        inputPricePerM: 2.5,
        outputPricePerM: 10,
      },
      {
        provider: "bedrock",
        handle: "bedrock/command-r-plus",
        contextK: 128,
        maxOutputK: 4,
        latencyP50Ms: 520,
        throughputTps: 98,
        inputPricePerM: 2.5,
        outputPricePerM: 10,
      },
    ],
  },
  {
    id: "command-r",
    vendor: "cohere",
    name: "Command R",
    description:
      "The mid-tier Cohere and the right default for production retrieval pipelines that need to ship at predictable cost. Command R keeps the RAG-tuning and citation discipline of R+ at 1/5 the input price, with throughput high enough to back synchronous retrieval-grounded chat. Tool use, JSON output, and grounded web search all come along, and Bedrock availability mirrors R+ for procurement parity. Pick R for the workload, R+ for the headline answer when stakes are higher.",
    modality: "text",
    capabilities: ["tools", "json", "streaming", "webSearch"],
    defaultHandle: "cohere/command-r",
    offerings: [
      {
        provider: "cohere",
        handle: "cohere/command-r",
        contextK: 128,
        maxOutputK: 4,
        latencyP50Ms: 320,
        throughputTps: 184,
        inputPricePerM: 0.5,
        outputPricePerM: 1.5,
      },
      {
        provider: "bedrock",
        handle: "bedrock/command-r",
        contextK: 128,
        maxOutputK: 4,
        latencyP50Ms: 360,
        throughputTps: 168,
        inputPricePerM: 0.5,
        outputPricePerM: 1.5,
      },
    ],
  },

  /* ─── Embeddings ─── */
  {
    id: "text-embedding-3-large",
    vendor: "openai",
    name: "text-embedding-3-large",
    description:
      "OpenAI’s flagship embedding model. 3072-dim by default, MRL-truncatable.",
    modality: "embeddings",
    capabilities: [],
    defaultHandle: "openai/text-embedding-3-large",
    offerings: [
      {
        provider: "openai",
        handle: "openai/text-embedding-3-large",
        contextK: 8,
        maxOutputK: 0,
        latencyP50Ms: 90,
        throughputTps: 0,
        inputPricePerM: 0.13,
        outputPricePerM: 0,
      },
      {
        provider: "azure",
        handle: "azure/text-embedding-3-large",
        contextK: 8,
        maxOutputK: 0,
        latencyP50Ms: 110,
        throughputTps: 0,
        inputPricePerM: 0.13,
        outputPricePerM: 0,
      },
    ],
  },
  {
    id: "text-embedding-3-small",
    vendor: "openai",
    name: "text-embedding-3-small",
    description:
      "Smaller OpenAI embedding. 1536-dim by default, ~6× cheaper than -large.",
    modality: "embeddings",
    capabilities: [],
    defaultHandle: "openai/text-embedding-3-small",
    offerings: [
      {
        provider: "openai",
        handle: "openai/text-embedding-3-small",
        contextK: 8,
        maxOutputK: 0,
        latencyP50Ms: 70,
        throughputTps: 0,
        inputPricePerM: 0.02,
        outputPricePerM: 0,
      },
      {
        provider: "azure",
        handle: "azure/text-embedding-3-small",
        contextK: 8,
        maxOutputK: 0,
        latencyP50Ms: 85,
        throughputTps: 0,
        inputPricePerM: 0.02,
        outputPricePerM: 0,
      },
    ],
  },
  {
    id: "embed-v3",
    vendor: "cohere",
    name: "Embed v3",
    description:
      "Cohere’s multilingual embedding. Strong on retrieval; quantized variants available.",
    modality: "embeddings",
    capabilities: [],
    defaultHandle: "cohere/embed-v3",
    offerings: [
      {
        provider: "cohere",
        handle: "cohere/embed-v3",
        contextK: 0.5,
        maxOutputK: 0,
        latencyP50Ms: 65,
        throughputTps: 0,
        inputPricePerM: 0.1,
        outputPricePerM: 0,
      },
      {
        provider: "bedrock",
        handle: "bedrock/embed-v3",
        contextK: 0.5,
        maxOutputK: 0,
        latencyP50Ms: 80,
        throughputTps: 0,
        inputPricePerM: 0.1,
        outputPricePerM: 0,
      },
    ],
  },
  {
    id: "gemini-embedding",
    vendor: "google",
    name: "Gemini Embedding",
    description:
      "Google’s general-purpose embedding model. 2K context, 768-dim default.",
    modality: "embeddings",
    capabilities: [],
    defaultHandle: "google/gemini-embedding",
    offerings: [
      {
        provider: "google",
        handle: "google/gemini-embedding",
        contextK: 2,
        maxOutputK: 0,
        latencyP50Ms: 75,
        throughputTps: 0,
        inputPricePerM: 0.025,
        outputPricePerM: 0,
      },
      {
        provider: "vertex",
        handle: "vertex/gemini-embedding",
        contextK: 2,
        maxOutputK: 0,
        latencyP50Ms: 90,
        throughputTps: 0,
        inputPricePerM: 0.025,
        outputPricePerM: 0,
      },
    ],
  },

  /* ─── Audio ─── */
  {
    id: "whisper-large-v3",
    vendor: "openai",
    name: "Whisper Large v3",
    description:
      "OpenAI’s speech-to-text model. Multilingual, robust on noisy audio. Pricing is per minute, not per token.",
    modality: "audio",
    capabilities: ["streaming"],
    defaultHandle: "openai/whisper-large-v3",
    offerings: [
      {
        provider: "openai",
        handle: "openai/whisper-large-v3",
        contextK: 0,
        maxOutputK: 0,
        latencyP50Ms: 1200,
        throughputTps: 0,
        inputPricePerM: 6,
        outputPricePerM: 0,
      },
      {
        provider: "azure",
        handle: "azure/whisper-large-v3",
        contextK: 0,
        maxOutputK: 0,
        latencyP50Ms: 1320,
        throughputTps: 0,
        inputPricePerM: 6,
        outputPricePerM: 0,
      },
    ],
  },

  /* ─── Rerank ─── */
  {
    id: "rerank-v3",
    vendor: "cohere",
    name: "Rerank v3",
    description:
      "Cohere’s reranker for second-stage retrieval. Multilingual; priced per 1k searches.",
    modality: "rerank",
    capabilities: [],
    defaultHandle: "cohere/rerank-v3",
    offerings: [
      {
        provider: "cohere",
        handle: "cohere/rerank-v3",
        contextK: 4,
        maxOutputK: 0,
        latencyP50Ms: 110,
        throughputTps: 0,
        inputPricePerM: 2,
        outputPricePerM: 0,
      },
      {
        provider: "bedrock",
        handle: "bedrock/rerank-v3",
        contextK: 4,
        maxOutputK: 0,
        latencyP50Ms: 140,
        throughputTps: 0,
        inputPricePerM: 2,
        outputPricePerM: 0,
      },
    ],
  },
];

// Static derivations from the module-level MODELS constant — computed once at
// module load, no hook overhead.
export const TOTAL_PROVIDERS = (() => {
  const set = new Set<ProviderId>();
  for (const m of MODELS) {
    for (const o of m.offerings) {
      set.add(o.provider);
    }
  }
  return set.size;
})();

export const MODALITY_COUNTS: Record<Modality, number> = (() => {
  const counts: Record<Modality, number> = {
    text: 0,
    embeddings: 0,
    audio: 0,
    rerank: 0,
  };
  for (const m of MODELS) {
    counts[m.modality]++;
  }
  return counts;
})();

/** Flat (handle, label, vendor) list of the full catalog — exported for the
 *  PAYG Manual setup model picker so it stays in sync with the 23 models. */
export type ModelOption = { handle: string; label: string; vendor: Vendor };

// Derived from the local MODELS catalog (single source); relocating the whole
// catalog to satisfy react-refresh would be disproportionate for one constant.
 
export const MODEL_OPTIONS: ModelOption[] = MODELS.map((m) => ({
  handle: m.defaultHandle,
  label: m.name,
  vendor: m.vendor,
}));
