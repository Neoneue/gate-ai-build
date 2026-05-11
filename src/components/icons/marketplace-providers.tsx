import type { SVGProps } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
 * Marketplace-provider icons — AI-infrastructure hosts that serve other
 * vendors' models (AWS Bedrock, Azure OpenAI, Google Vertex, Together,
 * Fireworks, Groq). Distinct concept from `model-providers.tsx`, which
 * holds the model-creator vendor marks (Anthropic, OpenAI, etc.).
 *
 * Sourced from lobe-icons (same library as the Gemini/Mistral/Cohere
 * multi-color glyphs). 24×24 viewBox, no embedded width/height — sized via
 * Tailwind classes on consumer (`size-4`). Multi-color brands carry per-path
 * fills so the wrapper's `style.color` is ignored. Mono brands (Groq) use
 * `fill="currentColor"` so the wrapper paints them.
 * ───────────────────────────────────────────────────────────────────────── */

type IconProps = SVGProps<SVGSVGElement>;

export function BedrockIcon(props: IconProps) {
  // AWS Bedrock — single complex path filled with a diagonal three-stop
  // gradient (purple → blue → light-blue). Per-path gradient fill so the
  // wrapper's `style.color` is ignored here.
  return (
    <svg
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          id="bedrock-grad"
          x1="80%"
          x2="20%"
          y1="20%"
          y2="80%"
        >
          <stop offset="0%" stopColor="#6350FB" />
          <stop offset="50%" stopColor="#3D8FFF" />
          <stop offset="100%" stopColor="#9AD8F8" />
        </linearGradient>
      </defs>
      <path
        fill="url(#bedrock-grad)"
        d="M13.05 15.513h3.08c.214 0 .389.177.389.394v1.82a1.704 1.704 0 011.296 1.661c0 .943-.755 1.708-1.685 1.708-.931 0-1.686-.765-1.686-1.708 0-.807.554-1.484 1.297-1.662v-1.425h-2.69v4.663a.395.395 0 01-.188.338l-2.69 1.641a.385.385 0 01-.405-.002l-4.926-3.086a.395.395 0 01-.185-.336V16.3L2.196 14.87A.395.395 0 012 14.555L2 14.528V9.406c0-.14.073-.27.192-.34l2.465-1.462V4.448c0-.129.062-.249.165-.322l.021-.014L9.77 1.058a.385.385 0 01.407 0l2.69 1.675a.395.395 0 01.185.336V7.6h3.856V5.683a1.704 1.704 0 01-1.296-1.662c0-.943.755-1.708 1.685-1.708.931 0 1.685.765 1.685 1.708 0 .807-.553 1.484-1.296 1.662v2.311a.391.391 0 01-.389.394h-4.245v1.806h6.624a1.69 1.69 0 011.64-1.313c.93 0 1.685.764 1.685 1.707 0 .943-.754 1.708-1.685 1.708a1.69 1.69 0 01-1.64-1.314H13.05v1.937h4.953l.915 1.18a1.66 1.66 0 01.84-.227c.931 0 1.685.764 1.685 1.707 0 .943-.754 1.708-1.685 1.708-.93 0-1.685-.765-1.685-1.708 0-.346.102-.668.276-.937l-.724-.935H13.05v1.806zM9.973 1.856L7.93 3.122V6.09h-.778V3.604L5.435 4.669v2.945l2.11 1.36L9.712 7.61V5.334h.778V7.83c0 .136-.07.263-.184.335L7.963 9.638v2.081l1.422 1.009-.446.646-1.406-.998-1.53 1.005-.423-.66 1.605-1.055v-1.99L5.038 8.29l-2.26 1.34v1.676l1.972-1.189.398.677-2.37 1.429V14.3l2.166 1.258 2.27-1.368.397.677-2.176 1.311V19.3l1.876 1.175 2.365-1.426.398.678-2.017 1.216 1.918 1.201 2.298-1.403v-5.78l-4.758 2.893-.4-.675 5.158-3.136V3.289L9.972 1.856zM16.13 18.47a.913.913 0 00-.908.92c0 .507.406.918.908.918a.913.913 0 00.907-.919.913.913 0 00-.907-.92zm3.63-3.81a.913.913 0 00-.908.92c0 .508.406.92.907.92a.913.913 0 00.908-.92.913.913 0 00-.908-.92zm1.555-4.99a.913.913 0 00-.908.92c0 .507.407.918.908.918a.913.913 0 00.907-.919.913.913 0 00-.907-.92zM17.296 3.1a.913.913 0 00-.907.92c0 .508.406.92.907.92a.913.913 0 00.908-.92.913.913 0 00-.908-.92z"
      />
    </svg>
  );
}

export function AzureIcon(props: IconProps) {
  // Microsoft Azure — four overlapping path layers form the canonical "A"
  // wedge. Two linear gradients (the dark-blue back wedge and the bright-
  // blue front face) plus a shadow gradient and a solid `#0078D4` inner
  // panel. Per-path fills explicit so the wrapper's `style.color` is
  // ignored.
  return (
    <svg
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          id="azure-back"
          gradientUnits="userSpaceOnUse"
          x1="8.247"
          x2="1.002"
          y1="1.626"
          y2="23.03"
        >
          <stop stopColor="#114A8B" />
          <stop offset="1" stopColor="#0669BC" />
        </linearGradient>
        <linearGradient
          id="azure-shadow"
          gradientUnits="userSpaceOnUse"
          x1="14.042"
          x2="12.324"
          y1="15.302"
          y2="15.888"
        >
          <stop stopOpacity=".3" />
          <stop offset=".071" stopOpacity=".2" />
          <stop offset=".321" stopOpacity=".1" />
          <stop offset=".623" stopOpacity=".05" />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="azure-front"
          gradientUnits="userSpaceOnUse"
          x1="12.841"
          x2="20.793"
          y1="1.626"
          y2="22.814"
        >
          <stop stopColor="#3CCBF4" />
          <stop offset="1" stopColor="#2892DF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#azure-back)"
        d="M7.242 1.613A1.11 1.11 0 018.295.857h6.977L8.03 22.316a1.11 1.11 0 01-1.052.755h-5.43a1.11 1.11 0 01-1.053-1.466L7.242 1.613z"
      />
      <path
        fill="#0078D4"
        d="M18.397 15.296H7.4a.51.51 0 00-.347.882l7.066 6.595c.206.192.477.298.758.298h6.226l-2.706-7.775z"
      />
      <path
        fill="url(#azure-shadow)"
        d="M15.272.857H7.497L0 23.071h7.775l1.596-4.73 5.068 4.73h6.665l-2.707-7.775h-7.998L15.272.857z"
      />
      <path
        fill="url(#azure-front)"
        d="M17.193 1.613a1.11 1.11 0 00-1.052-.756h-7.81.035c.477 0 .9.304 1.052.756l6.748 19.992a1.11 1.11 0 01-1.052 1.466h-.12 7.895a1.11 1.11 0 001.052-1.466L17.193 1.613z"
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
        fill="#4285F4"
        d="M11.995 20.216a1.892 1.892 0 100 3.785 1.892 1.892 0 000-3.785zm0 2.806a.927.927 0 11.927-.914.914.914 0 01-.927.914z"
      />
      <path
        fill="#669DF6"
        clipRule="evenodd"
        d="M21.687 14.144c.237.038.452.16.605.344a.978.978 0 01-.18 1.3l-8.24 6.082a1.892 1.892 0 00-1.147-1.508l8.28-6.08a.991.991 0 01.682-.138z"
      />
      <path
        fill="#AECBFA"
        clipRule="evenodd"
        d="M10.122 21.842l-8.217-6.066a.952.952 0 01-.206-1.287.978.978 0 011.287-.206l8.28 6.08a1.893 1.893 0 00-1.144 1.479z"
      />
      <path
        fill="#AECBFA"
        d="M4.273 4.475a.978.978 0 01-.965-.965V1.09a.978.978 0 111.943 0v2.42a.978.978 0 01-.978.965zM4.247 13.034a.978.978 0 100-1.956.978.978 0 000 1.956zM4.247 10.19a.978.978 0 100-1.956.978.978 0 000 1.956zM4.247 7.332a.978.978 0 100-1.956.978.978 0 000 1.956z"
      />
      <path
        fill="#4285F4"
        d="M19.718 7.307a.978.978 0 01-.965-.979v-2.42a.965.965 0 011.93 0v2.42a.964.964 0 01-.965.979zM19.743 13.047a.978.978 0 100-1.956.978.978 0 000 1.956zM19.743 10.151a.978.978 0 100-1.956.978.978 0 000 1.956zM19.743 2.068a.978.978 0 100-1.956.978.978 0 000 1.956z"
      />
      <path
        fill="#669DF6"
        d="M11.995 15.917a.978.978 0 01-.965-.965v-2.459a.978.978 0 011.943 0v2.433a.976.976 0 01-.978.991zM11.995 18.762a.978.978 0 100-1.956.978.978 0 000 1.956zM11.995 10.64a.978.978 0 100-1.956.978.978 0 000 1.956zM11.995 7.783a.978.978 0 100-1.956.978.978 0 000 1.956z"
      />
      <path
        fill="#4285F4"
        d="M15.856 10.177a.978.978 0 01-.965-.965v-2.42a.977.977 0 011.702-.763.979.979 0 01.241.763v2.42a.978.978 0 01-.978.965zM15.869 4.913a.978.978 0 100-1.956.978.978 0 000 1.956zM15.869 15.853a.978.978 0 100-1.956.978.978 0 000 1.956zM15.869 12.996a.978.978 0 100-1.956.978.978 0 000 1.956z"
      />
      <path
        fill="#AECBFA"
        d="M8.121 15.853a.978.978 0 100-1.956.978.978 0 000 1.956zM8.121 7.783a.978.978 0 100-1.956.978.978 0 000 1.956zM8.121 4.913a.978.978 0 100-1.957.978.978 0 000 1.957zM8.134 12.996a.978.978 0 01-.978-.94V9.611a.965.965 0 011.93 0v2.445a.966.966 0 01-.952.94z"
      />
    </svg>
  );
}

export function TogetherIcon(props: IconProps) {
  // Together AI — three overlapping disks in magenta, lavender, orange.
  // Per-path fills explicit so the wrapper's `style.color` is ignored.
  return (
    <svg
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#EF2CC1"
        d="M23.197 4.503A6 6 0 0015 2.307a5.973 5.973 0 00-2.995 4.933l5.996.008v.515h-5.996c.039.937.298 1.87.8 2.74a6 6 0 1010.39-6z"
      />
      <path
        fill="#CAAEF5"
        d="M.805 4.5A6 6 0 003 12.697a5.972 5.972 0 005.77.127L5.779 7.627l.446-.257 2.997 5.192A6 6 0 10.804 4.5z"
      />
      <path
        fill="#FC4C02"
        d="M12 23.894a6 6 0 005.999-6c0-2.13-1.1-3.996-2.775-5.06l-3.005 5.189-.444-.258 2.997-5.192A6 6 0 1012 23.894z"
      />
    </svg>
  );
}

export function FireworksIcon(props: IconProps) {
  // Fireworks AI — single-color burst in deep purple. `currentColor` would
  // also work since there's only one fill, but the brand purple `#5019C5`
  // is preserved per-path so the icon doesn't drift to wrapper color.
  return (
    <svg
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#5019C5"
        clipRule="evenodd"
        d="M14.8 5l-2.801 6.795L9.195 5H7.397l3.072 7.428a1.64 1.64 0 003.038.002L16.598 5H14.8zm1.196 10.352l5.124-5.244-.699-1.669-5.596 5.739a1.664 1.664 0 00-.343 1.807 1.642 1.642 0 001.516 1.012L16 17l8-.02-.699-1.669-7.303.041h-.002zM2.88 10.104l.699-1.669 5.596 5.739c.468.479.603 1.189.343 1.807a1.643 1.643 0 01-1.516 1.012l-8-.018-.002.002.699-1.669 7.303.042-5.122-5.246z"
      />
    </svg>
  );
}

export function GroqIcon(props: IconProps) {
  // Groq — single monochrome `Q` glyph. Uses `fill="currentColor"` so the
  // wrapper's `style.color` paints it (matches AnthropicIcon / OpenAIIcon /
  // GrokIcon convention).
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z" />
    </svg>
  );
}
