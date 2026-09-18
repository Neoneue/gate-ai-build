import type { ComponentType, SVGProps } from "react";
import { BRAND_COLORS, MONO_MARK_COLOR } from "./brand-colors";
import { AlibabaIcon, OpenRouterIcon, VertexIcon } from "./gateway-providers";
import {
  AnthropicIcon,
  CohereIcon,
  DeepSeekIcon,
  GeminiIcon,
  GrokIcon,
  MetaIcon,
  MistralIcon,
  MoonshotAIIcon,
  OpenAIIcon,
  QwenIcon,
} from "./model-providers";

/* ─────────────────────────────────────────────────────────────────────────
 * Vendor meta — canonical mapping of model providers to brand color, icon,
 * icon color, and label. Shared across surfaces that show provider badges
 * AND across charts where vendors render as data series.
 *
 * Brand colours come from `brand-colors.ts`, the one file in `src` that
 * holds raw hex: external brand marks are not design-system colors (same
 * exception CMP-009 makes). Every other color in the app traces to a
 * semantic token in src/index.css.
 *
 * The single `color` field is used for both chips (avatars, swatches, badges)
 * and chart series (bars, lines, legends). Twin-hue pairs (Meta + DeepSeek
 * both blue; Anthropic + Mistral both orange) are accepted as the design —
 * each brand shows up in charts as its own brand color, full strength.
 * ───────────────────────────────────────────────────────────────────────── */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type Vendor =
  | "anthropic"
  | "xai"
  | "google"
  | "openai"
  | "meta"
  | "mistral"
  | "deepseek"
  | "cohere"
  | "moonshotai"
  | "qwen";

/** Any `owned_by` slug the catalog feed can carry. Known vendors narrow to
 *  `Vendor` and get a brand mark; unknown ones fall back to initials. */
export type VendorSlug = Vendor | (string & {});

export function isKnownVendor(slug: VendorSlug): slug is Vendor {
  return Object.hasOwn(VENDOR_META, slug);
}

export function vendorMeta(slug: VendorSlug): VendorMeta | undefined {
  return isKnownVendor(slug) ? VENDOR_META[slug] : undefined;
}

/** Brand label for known vendors; a humanized slug ("z-ai" -> "Z Ai") for
 *  the rest, so aria labels and filter menus never show a raw slug. */
export function vendorLabel(slug: VendorSlug): string {
  const meta = vendorMeta(slug);
  if (meta) {
    return meta.label;
  }
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface VendorMeta {
  color: string;
  icon: IconType;
  label: string;
}

// `openai`, `meta`, `mistral`, `xai`, and `cohere` are not in the Models
// catalog (2026-08-03 prod rebuild). After the Messages/Conversations catalog
// reconciliation later the same day, only `openai` still keys anything: the
// BYOK surfaces on DashboardDefault, where a Codex/ChatGPT subscription is a
// real thing to route. The other four are unreferenced and CAN now be deleted
// — this comment is the record that the mock rows which used to block it are
// gone. Deleting them is one edit here plus VENDOR_ENDPOINT in
// `pages/requests/data.ts` (a `Record<Vendor, string>`, so the two move
// together) and would strand GrokIcon/MetaIcon, which DashboardDefault's
// "Works with" footer still imports directly. Left in deliberately: an
// unreferenced union member costs nothing and the BYOK story may want them.
export const VENDOR_META: Record<Vendor, VendorMeta> = {
  anthropic: {
    color: BRAND_COLORS.anthropic.primary,
    icon: AnthropicIcon,
    label: "Anthropic",
  },
  xai: { color: MONO_MARK_COLOR, icon: GrokIcon, label: "xAI" },
  google: {
    color: BRAND_COLORS.google.primary,
    icon: GeminiIcon,
    label: "Google",
  },
  openai: { color: MONO_MARK_COLOR, icon: OpenAIIcon, label: "OpenAI" },
  meta: { color: BRAND_COLORS.meta.primary, icon: MetaIcon, label: "Meta" },
  mistral: {
    color: BRAND_COLORS.mistral.primary,
    icon: MistralIcon,
    label: "Mistral",
  },
  deepseek: {
    color: BRAND_COLORS.deepseek.primary,
    icon: DeepSeekIcon,
    label: "DeepSeek",
  },
  cohere: {
    color: BRAND_COLORS.cohere.primary,
    icon: CohereIcon,
    label: "Cohere",
  },
  moonshotai: {
    color: MONO_MARK_COLOR,
    icon: MoonshotAIIcon,
    label: "MoonshotAI",
  },
  // Gradient-filled mark, so `color` never paints it; the value is kept for
  // parity with the other entries and for any future non-icon use.
  qwen: { color: BRAND_COLORS.qwen.primary, icon: QwenIcon, label: "Qwen" },
};

/**
 * Provider glyph rendered in its native brand color — no chip wrapper,
 * no mono override. SVGs in `model-providers.tsx` use `fill="currentColor"`,
 * so setting CSS color on the icon paints the glyph in the brand hex
 * from VENDOR_META. One treatment everywhere: KPI anchors, modal
 * headers, top-key lists, data-table model columns.
 *
 * Iteration history (kept here so future sessions don't re-prosecute):
 * (1) brand chip everywhere → too rainbow on stacked tables.
 * (2) mono neutral-800 icon-only → felt heavy.
 * (3) brand-tinted bare icon → contrast too low at the time.
 * (4) split treatment (neutral table / brand standalone) → too much
 *     black in tables.
 * (5) brand chip everywhere again — locked for a stretch.
 * (6) mono neutral-600 icon-only — quieter, but lost brand identity.
 * (7) brand-tinted bare icon — current state. Same shape as (3) with
 *     a clear reference (Stacklane competitor table) showing this is
 *     the convention for product/competitor lists. Trade-off accepted:
 *     low-contrast brands (Cohere coral) sit lighter on white than
 *     high-contrast ones (xAI ink); the brand identity is the
 *     payoff.
 */
/** Avatar size keys. `sm` (size-4 = 16px) is the default in tables / row
 *  cells. `md` (size-5 = 20px) pairs with `text-xl` titles. `lg` (size-6
 *  = 24px) pairs with `text-2xl` titles. Stay on the icon ladder. */
/* ─────────────────────────────────────────────────────────────────────────
 * Gateway providers — the three upstreams Constellation Gate routes
 * through. Distinct from `Vendor` (the model creator); a model may be
 * created by Anthropic and served by Google Vertex or OpenRouter. Both meta
 * maps share the same shape so consumers can dispatch on context (creator
 * vs. host) without restructuring rendering code.
 *
 * Replaced `MarketplaceProvider` / `MARKETPLACE_META` on 2026-08-03. The
 * old First-party / Marketplace split does not exist in prod — there is one
 * flat provider list — so a name carrying that split was describing
 * something real code no longer does.
 *
 * THREE label fields, because prod uses three different strings for the
 * same provider and all three are real:
 *   `label`       row cells + the providers-stack tooltip  ("Google Vertex")
 *   `filterLabel` the "All providers" dropdown             ("Alibaba Direct")
 *   `detailLabel` the model detail page's providers table  ("Google Vertex AI")
 *
 * Brand colours read from `brand-colors.ts`, same exception VENDOR_META
 * documents: external brand colors are not design-system tokens. OpenRouter is deliberately
 * `var(--foreground)` and not its lime brand hex — prod renders the mark
 * monochrome, so it flips with the theme.
 * ───────────────────────────────────────────────────────────────────────── */

export type ProviderId = "alibaba" | "vertex" | "openrouter";

export interface ProviderMeta {
  color: string;
  detailLabel: string;
  filterLabel: string;
  icon: IconType;
  label: string;
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  alibaba: {
    color: BRAND_COLORS.alibaba.primary,
    icon: AlibabaIcon,
    label: "Alibaba",
    filterLabel: "Alibaba Direct",
    detailLabel: "Alibaba",
  },
  vertex: {
    color: BRAND_COLORS.google.primary,
    icon: VertexIcon,
    label: "Google Vertex",
    filterLabel: "Google Vertex",
    detailLabel: "Google Vertex AI",
  },
  openrouter: {
    color: MONO_MARK_COLOR,
    icon: OpenRouterIcon,
    label: "OpenRouter",
    filterLabel: "OpenRouter",
    detailLabel: "OpenRouter",
  },
};

/** Canonical provider order for the filter dropdown. Alphabetical, which is
 *  the order prod renders. Per-model provider order is NOT this — it comes
 *  from each model's own `providers[]` and varies row to row. */
export const PROVIDER_ORDER: ProviderId[] = ["alibaba", "vertex", "openrouter"];

/**
 * Gateway-provider glyph rendered in its native brand color — same locked
 * treatment as VendorAvatar: bare icon at size-4, no chip wrapper, no tone
 * prop, sr-only label unless `decorative`. Multi-color SVGs (Vertex's
 * Google-blue tonal stack, Alibaba's pinned orange) ignore wrapper
 * `style.color` because their fills are pinned. Mono SVGs (OpenRouter) are
 * painted by the wrapper.
 */
