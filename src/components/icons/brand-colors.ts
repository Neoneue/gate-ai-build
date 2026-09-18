/* ─────────────────────────────────────────────────────────────────────────
 * Brand colours — the ONE file in `src` allowed to hold a raw hex.
 *
 * Every value here is an external brand's published colour (Anthropic clay,
 * Google blue, Mistral's gradient stops). They are deliberately NOT design
 * tokens: a brand mark must not shift with the theme or a reskin, and none
 * of these may ever paint a surface, border, text or chart series
 * (design.md §2 "Vendor brand colors", "Do not use"). Consumers are the
 * vendor / provider SVG marks and `VENDOR_META` / `PROVIDER_META`.
 *
 * Shape: one key per brand, one named colour per fill the brand's marks
 * use. `primary` is the swatch a single-hue mark paints with (and what
 * `VENDOR_META.color` exposes); the rest are the pinned fills of
 * multi-colour marks. Names are the brand's own where published, else a
 * plain hue word. Adding a vendor = one entry here + one mark in
 * `model-providers.tsx` / `gateway-providers.tsx` + one `VENDOR_META` row.
 *
 * Kept separate from `vendor-meta.tsx` so the icon files can import colours
 * without an import cycle (vendor-meta imports the icons).
 * ───────────────────────────────────────────────────────────────────────── */

type Hex = `#${string}`;

export const BRAND_COLORS = {
  alibaba: { primary: "#FF6003" },
  anthropic: { primary: "#D97757" },
  cohere: { primary: "#FF7759", green: "#39594D", lilac: "#C18BD9" },
  deepseek: { primary: "#4D6BFE" },
  google: {
    /** Google blue. Also the Vertex mark's primary tone. */
    primary: "#4285F4",
    blueMid: "#669DF6",
    blueLight: "#AECBFA",
    /** Gemini mark: blue base + three fading gradient tints. */
    geminiBlue: "#3186FF",
    geminiGreen: "#08B962",
    geminiRed: "#F94543",
    geminiYellow: "#FABC12",
    /** Sign-in "G" mark, four solid quadrants. */
    gYellow: "#FFC107",
    gRed: "#FF3D00",
    gGreen: "#4CAF50",
    gBlue: "#1976D2",
  },
  meta: { primary: "#0064E0" },
  mistral: {
    primary: "#FA520F",
    /** Five-band gradient, top to bottom. */
    yellow: "#FFE008",
    amber: "#FFAF00",
    orange: "#FA7A00",
    red: "#FF4F0F",
    crimson: "#E10500",
  },
  qwen: { primary: "#6336E7", violetLight: "#6F69F7" },
} as const satisfies Record<string, { primary: Hex } & Record<string, Hex>>;

export type BrandId = keyof typeof BRAND_COLORS;

/** Theme-following ink for monochrome marks (OpenAI, xAI, MoonshotAI,
 *  OpenRouter). Not a brand colour; listed so `VENDOR_META` has one word
 *  for "paint me with the current foreground". */
export const MONO_MARK_COLOR = "var(--foreground)";
