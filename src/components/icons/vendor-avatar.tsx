import {
  PROVIDER_META,
  type ProviderId,
  VENDOR_META,
  type Vendor,
} from "./vendor-meta";

type VendorAvatarSize = "sm" | "md" | "lg";

const VENDOR_AVATAR_SIZE: Record<VendorAvatarSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function VendorAvatar({
  vendor,
  decorative = false,
  size = "sm",
}: {
  vendor: Vendor;
  decorative?: boolean;
  size?: VendorAvatarSize;
}) {
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
        aria-hidden="true"
        className={VENDOR_AVATAR_SIZE[size]}
        style={{ color: meta.color }}
      />
      {decorative ? null : <span className="sr-only">{meta.label}</span>}
    </span>
  );
}

export function ProviderAvatar({
  provider,
  decorative = false,
}: {
  provider: ProviderId;
  decorative?: boolean;
}) {
  const meta = PROVIDER_META[provider];
  const Icon = meta.icon;
  return (
    <span className="inline-flex shrink-0 items-center">
      <Icon
        aria-hidden="true"
        className="size-4"
        style={{ color: meta.color }}
      />
      {decorative ? null : <span className="sr-only">{meta.label}</span>}
    </span>
  );
}
