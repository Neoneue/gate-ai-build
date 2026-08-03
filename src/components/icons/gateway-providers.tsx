import type { SVGProps } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * Gateway upstream-provider icons — the three services Constellation Gate
 * actually routes through: Alibaba Direct, Google Vertex, and OpenRouter.
 * Distinct concept from `model-providers.tsx`, which holds the model-creator
 * vendor marks (Anthropic, Google, DeepSeek, …). A model is *created* by a
 * vendor and *served* by one or more of these providers.
 *
 * Replaced the former "marketplace providers" set (Bedrock, Azure, Together,
 * Fireworks, Groq) on 2026-08-03: the gateway never routed through those, and
 * prod has no First-party / Marketplace split to justify the concept. See
 * `data-model.md` §3.6.
 *
 * Sourced from lobe-icons, same library as the vendor glyphs. 24×24 viewBox,
 * no embedded width/height — sized via Tailwind on the consumer (`size-4`).
 * Multi-color brands carry per-path fills so the wrapper's `style.color` is
 * ignored. Mono brands use `fill="currentColor"` so the wrapper paints them.
 *
 * Brand hex literals are intentional and are NOT design-system colors: they
 * are external brand marks (Alibaba orange, Google Vertex blues), reproduced
 * at their published values because a recolored logo is a wrong logo. Same
 * exception `vendor-meta.tsx` documents for the model-creator marks. Every
 * other color in the app traces to a semantic token in `src/index.css`.
 * The design-token guard passes; the impeccable hook flags these two files
 * and that finding is a known false positive, confirmed 2026-08-03.
 * ───────────────────────────────────────────────────────────────────────── */

type IconProps = SVGProps<SVGSVGElement>;

export function AlibabaIcon(props: IconProps) {
  // Alibaba — the single-path ribbon mark in brand orange. Per-path fill so
  // the wrapper's `style.color` is ignored (same treatment as VertexIcon).
  return (
    <svg
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M24 14.014c-2.8 1.512-5.62 2.896-8.759 3.524-.7.139-1.476.139-2.187.043-.678-.085-1.017-.682-.776-1.31.23-.585.536-1.181.93-1.671.852-1.065 1.814-2.034 2.678-3.088a15.75 15.75 0 001.422-2.054c.306-.511.164-1.129-.372-1.384-.897-.437-1.859-.745-2.81-1.075-.11-.043-.274.074-.492.149.273.244.47.425.743.67-2.821.48-5.49 1.16-8.08 2.098-.012.053-.033.095-.023.117.383.585.208 1.032-.35 1.394a2.365 2.365 0 00-.568.522c1.706.5 3.226.213 4.68-.735-.087-.127-.175-.244-.262-.372.546.096.874.394.918.862.011.107-.054.213-.087.32-.077-.086-.175-.17-.24-.267-.045-.064-.056-.138-.088-.245-1.728 1.15-3.587 1.438-5.632.842 0 .404-.022.745.011 1.075.022.287-.098.415-.36.564-.591.362-1.204.735-1.696 1.214-.59.585-.371 1.299.427 1.597.907.34 1.859.35 2.81.234 1.126-.139 2.23-.32 3.456-.49-1.433.67-2.844 1.14-4.33 1.33-1.04.14-2.078.214-3.106-.084-1.476-.415-2.133-1.501-1.75-2.96.361-1.363 1.236-2.449 2.176-3.45 3.139-3.332 7.108-5.024 11.7-5.365 1.072-.074 2.155.064 3.16.511 1.411.639 2.002 1.99 1.313 3.354-.448.905-1.072 1.735-1.695 2.555-.612.809-1.301 1.554-1.946 2.331-.186.234-.361.48-.503.745-.274.5-.088.83.492.778 1.213-.118 2.45-.213 3.62-.511 1.716-.437 3.389-1.054 5.084-1.597.175-.043.339-.107.492-.17z"
        fill="#FF6003"
      />
    </svg>
  );
}

export function VertexIcon(props: IconProps) {
  // Google Vertex AI — three Google brand-blue tones (`#4285F4` primary,
  // `#669DF6` mid, `#AECBFA` light) painting a circuit-like figure of
  // dots and a connecting `Y`. Per-path fills explicit so the wrapper's
  // `style.color` is ignored.
  return (
    <svg
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.995 20.216a1.892 1.892 0 100 3.785 1.892 1.892 0 000-3.785zm0 2.806a.927.927 0 11.927-.914.914.914 0 01-.927.914z"
        fill="#4285F4"
      />
      <path
        clipRule="evenodd"
        d="M21.687 14.144c.237.038.452.16.605.344a.978.978 0 01-.18 1.3l-8.24 6.082a1.892 1.892 0 00-1.147-1.508l8.28-6.08a.991.991 0 01.682-.138z"
        fill="#669DF6"
      />
      <path
        clipRule="evenodd"
        d="M10.122 21.842l-8.217-6.066a.952.952 0 01-.206-1.287.978.978 0 011.287-.206l8.28 6.08a1.893 1.893 0 00-1.144 1.479z"
        fill="#AECBFA"
      />
      <path
        d="M4.273 4.475a.978.978 0 01-.965-.965V1.09a.978.978 0 111.943 0v2.42a.978.978 0 01-.978.965zM4.247 13.034a.978.978 0 100-1.956.978.978 0 000 1.956zM4.247 10.19a.978.978 0 100-1.956.978.978 0 000 1.956zM4.247 7.332a.978.978 0 100-1.956.978.978 0 000 1.956z"
        fill="#AECBFA"
      />
      <path
        d="M19.718 7.307a.978.978 0 01-.965-.979v-2.42a.965.965 0 011.93 0v2.42a.964.964 0 01-.965.979zM19.743 13.047a.978.978 0 100-1.956.978.978 0 000 1.956zM19.743 10.151a.978.978 0 100-1.956.978.978 0 000 1.956zM19.743 2.068a.978.978 0 100-1.956.978.978 0 000 1.956z"
        fill="#4285F4"
      />
      <path
        d="M11.995 15.917a.978.978 0 01-.965-.965v-2.459a.978.978 0 011.943 0v2.433a.976.976 0 01-.978.991zM11.995 18.762a.978.978 0 100-1.956.978.978 0 000 1.956zM11.995 10.64a.978.978 0 100-1.956.978.978 0 000 1.956zM11.995 7.783a.978.978 0 100-1.956.978.978 0 000 1.956z"
        fill="#669DF6"
      />
      <path
        d="M15.856 10.177a.978.978 0 01-.965-.965v-2.42a.977.977 0 011.702-.763.979.979 0 01.241.763v2.42a.978.978 0 01-.978.965zM15.869 4.913a.978.978 0 100-1.956.978.978 0 000 1.956zM15.869 15.853a.978.978 0 100-1.956.978.978 0 000 1.956zM15.869 12.996a.978.978 0 100-1.956.978.978 0 000 1.956z"
        fill="#4285F4"
      />
      <path
        d="M8.121 15.853a.978.978 0 100-1.956.978.978 0 000 1.956zM8.121 7.783a.978.978 0 100-1.956.978.978 0 000 1.956zM8.121 4.913a.978.978 0 100-1.957.978.978 0 000 1.957zM8.134 12.996a.978.978 0 01-.978-.94V9.611a.965.965 0 011.93 0v2.445a.966.966 0 01-.952.94z"
        fill="#AECBFA"
      />
    </svg>
  );
}

export function OpenRouterIcon(props: IconProps) {
  // OpenRouter — single monochrome routing mark. Prod renders it with
  // `fill="currentColor"` and `color: var(--foreground)`, NOT the lime
  // `#C8FF00` brand variant, so the wrapper paints it (same convention as
  // AnthropicIcon / OpenAIIcon / MoonshotAIIcon).
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z" />
    </svg>
  );
}
