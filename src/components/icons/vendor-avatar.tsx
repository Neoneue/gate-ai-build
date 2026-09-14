import { cn } from "@/lib/utils";
import {
  PROVIDER_META,
  type ProviderId,
  type VendorSlug,
  vendorLabel,
  vendorMeta,
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
  vendor: VendorSlug;
  decorative?: boolean;
  size?: VendorAvatarSize;
}) {
  const meta = vendorMeta(vendor);
  const label = vendorLabel(vendor);
  if (!meta) {
    // Vendors without a brand mark (most of the 50+ `owned_by` slugs in the
    // live feed) get a two-letter initials tile, the same fallback prod's
    // Models table shows for Z.ai and friends.
    const initials = vendor.replace(/[^a-z0-9]/gi, "").slice(0, 2);
    return (
      <span className="inline-flex shrink-0 items-center">
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex items-center justify-center rounded-sm bg-muted font-medium font-mono text-2xs text-muted-foreground uppercase",
            VENDOR_AVATAR_SIZE[size]
          )}
        >
          {initials}
        </span>
        {decorative ? null : <span className="sr-only">{label}</span>}
      </span>
    );
  }
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
