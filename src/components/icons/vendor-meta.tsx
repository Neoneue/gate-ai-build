import type { ComponentType, SVGProps } from 'react';
import {
  AnthropicIcon,
  CohereIcon,
  DeepSeekIcon,
  GeminiIcon,
  GrokIcon,
  MetaIcon,
  MistralIcon,
  OpenAIIcon,
} from './model-providers';
import {
  AzureIcon,
  BedrockIcon,
  FireworksIcon,
  GroqIcon,
  TogetherIcon,
  VertexIcon,
} from './marketplace-providers';

/* ─────────────────────────────────────────────────────────────────────────
 * Vendor meta — canonical mapping of model providers to brand color, icon,
 * icon color, and label. Shared across surfaces that show provider badges
 * AND across charts where vendors render as data series.
 *
 * Brand hex literals are intentional: they represent external brand colors
 * (Anthropic Sonnet orange, OpenAI ChatGPT green, Mistral orange, etc.) and
 * are not design-system colors. Same exception CMP-009 makes — every other
 * color in the app traces to ink-* / blue-* / semantic vars in src/index.css.
 *
 * The single `color` field is used for both chips (avatars, swatches, badges)
 * and chart series (bars, lines, legends). Twin-hue pairs (Meta + DeepSeek
 * both blue; Anthropic + Mistral both orange) are accepted as the design —
 * each brand shows up in charts as its own brand color, full strength.
 * ───────────────────────────────────────────────────────────────────────── */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type Vendor =
  | 'anthropic'
  | 'xai'
  | 'google'
  | 'openai'
  | 'meta'
  | 'mistral'
  | 'deepseek'
  | 'cohere';

export interface VendorMeta {
  color: string;
  icon: IconType;
  label: string;
}

export const VENDOR_META: Record<Vendor, VendorMeta> = {
  anthropic: { color: '#D97757', icon: AnthropicIcon, label: 'Anthropic' },
  xai:       { color: '#3D3D3D', icon: GrokIcon,      label: 'xAI' },
  google:    { color: '#4285F4', icon: GeminiIcon,    label: 'Google' },
  openai:    { color: '#3D3D3D', icon: OpenAIIcon,    label: 'OpenAI' },
  meta:      { color: '#0064E0', icon: MetaIcon,      label: 'Meta' },
  mistral:   { color: '#FA520F', icon: MistralIcon,   label: 'Mistral' },
  deepseek:  { color: '#4D6BFE', icon: DeepSeekIcon,  label: 'DeepSeek' },
  cohere:    { color: '#FF7759', icon: CohereIcon,    label: 'Cohere' },
};

export const PROVIDER_ORDER: Vendor[] = [
  'anthropic',
  'openai',
  'google',
  'xai',
  'meta',
  'mistral',
  'deepseek',
  'cohere',
];

/**
 * Provider glyph rendered in its native brand color — no chip wrapper,
 * no mono override. SVGs in `model-providers.tsx` use `fill="currentColor"`,
 * so setting CSS color on the icon paints the glyph in the brand hex
 * from VENDOR_META. One treatment everywhere: KPI anchors, modal
 * headers, top-key lists, data-table model columns.
 *
 * Iteration history (kept here so future sessions don't re-prosecute):
 * (1) brand chip everywhere → too rainbow on stacked tables.
 * (2) mono ink-800 icon-only → felt heavy.
 * (3) brand-tinted bare icon → contrast too low at the time.
 * (4) split treatment (neutral table / brand standalone) → too much
 *     black in tables.
 * (5) brand chip everywhere again — locked for a stretch.
 * (6) mono ink-600 icon-only — quieter, but lost brand identity.
 * (7) brand-tinted bare icon — current state. Same shape as (3) with
 *     a clear reference (Stacklane competitor table) showing this is
 *     the convention for product/competitor lists. Trade-off accepted:
 *     low-contrast brands (Cohere #FF7759) sit lighter on white than
 *     high-contrast ones (xAI #3D3D3D); the brand identity is the
 *     payoff.
 */
export function VendorAvatar({ vendor, decorative = false }: { vendor: Vendor; decorative?: boolean }) {
  const meta = VENDOR_META[vendor];
  const Icon = meta.icon;
  // Wrapper carries `shrink-0` so flex parents behave the same as when the
  // primitive returned a bare `<Icon shrink-0 />`. The sr-only label means
  // every consumer gets vendor identity announced without injecting custom
  // sr-only spans at the call site. Pass `decorative` when the surrounding
  // chrome already carries an aggregated label (e.g. a row of avatars
  // labeled "Anthropic, OpenAI, Mistral" at the cell level).
  return (
    <span className="inline-flex shrink-0 items-center">
      <Icon
        className="size-4"
        style={{ color: meta.color }}
        aria-hidden="true"
      />
      {!decorative ? <span className="sr-only">{meta.label}</span> : null}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Marketplace providers — AI-infrastructure hosts that serve other
 * vendors' models (AWS Bedrock, Azure OpenAI, Google Vertex, Together,
 * Fireworks, Groq). Distinct from `Vendor` (the model creator); a model
 * may be created by Anthropic and routed via Bedrock or Vertex. Both
 * meta maps share the same shape so consumers can dispatch on context
 * (creator vs. host) without restructuring rendering code.
 *
 * Brand hex literals carry the same exception VENDOR_META does: external
 * brand colors are not design-system tokens. Color picks below match each
 * brand's primary mark hue — the dominant fill in the `*-color.svg` mark
 * sourced from lobe-icons (mid-stop for gradients, primary fill otherwise).
 * Mono marks (Groq) take the brand's accent orange.
 * ───────────────────────────────────────────────────────────────────────── */

export type MarketplaceProvider =
  | 'bedrock'
  | 'azure'
  | 'vertex'
  | 'together'
  | 'fireworks'
  | 'groq';

export interface MarketplaceMeta {
  color: string;
  icon: IconType;
  label: string;
}

export const MARKETPLACE_META: Record<MarketplaceProvider, MarketplaceMeta> = {
  bedrock:   { color: '#3D8FFF', icon: BedrockIcon,   label: 'AWS Bedrock' },
  azure:     { color: '#0078D4', icon: AzureIcon,     label: 'Azure OpenAI' },
  vertex:    { color: '#4285F4', icon: VertexIcon,    label: 'Google Vertex' },
  together:  { color: '#EF2CC1', icon: TogetherIcon,  label: 'Together AI' },
  fireworks: { color: '#5019C5', icon: FireworksIcon, label: 'Fireworks AI' },
  groq:      { color: '#F55036', icon: GroqIcon,      label: 'Groq' },
};

/**
 * Marketplace-provider glyph rendered in its native brand color — same
 * locked treatment as VendorAvatar: bare icon at size-4, no chip wrapper,
 * no tone prop, sr-only label unless `decorative`. Multi-color SVGs
 * (Bedrock gradient, Azure four-layer, Vertex Google-blue tonal stack,
 * Together three-disk, Fireworks per-path) ignore wrapper `style.color`
 * because their fills are pinned. Mono SVGs (Groq) are painted by the
 * wrapper.
 */
export function MarketplaceAvatar({
  provider,
  decorative = false,
}: {
  provider: MarketplaceProvider;
  decorative?: boolean;
}) {
  const meta = MARKETPLACE_META[provider];
  const Icon = meta.icon;
  return (
    <span className="inline-flex shrink-0 items-center">
      <Icon
        className="size-4"
        style={{ color: meta.color }}
        aria-hidden="true"
      />
      {!decorative ? <span className="sr-only">{meta.label}</span> : null}
    </span>
  );
}
