import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { DeltaTag } from "@/components/ui/compact-kpi";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { Skeleton } from "@/components/ui/skeleton";
import { TextLink } from "@/components/ui/text-link";

export function KpiTile({
  title,
  titleInfo,
  value,
  valueSuffix,
  liveDot,
  delta,
  caption,
  spark,
  href,
  linkLabel,
  deltaRow,
  deltaNote,
  loading = false,
}: {
  title: string;
  /** Optional adornment rendered after the title, e.g. an info-icon tooltip. */
  titleInfo?: ReactNode;
  value: string;
  valueSuffix?: string;
  liveDot?: boolean;
  delta?: string;
  caption?: string;
  spark?: ReactNode;
  href?: string;
  linkLabel?: string;
  /** Opt-in: render the delta tag / link on a dedicated third row below the
   *  value (instead of inline beside it) so a rail's cards share a meta row.
   *  Off by default — existing inline layout is preserved for all other rails. */
  deltaRow?: boolean;
  /** Trailing comparison copy for the delta tag, e.g. "vs last 7d". */
  deltaNote?: string;
  /** Swap the value, the delta tag and the sparkline for skeletons of the
   *  same box while the reading is in flight. Optional and off by default,
   *  so no other rail changes. The Eyebrow title, the `valueSuffix` unit,
   *  the live dot and the outbound link all stay — none of them is waiting
   *  on the fetch. */
  loading?: boolean;
}) {
  const deltaEl = delta ? (
    <DeltaTag delta={delta} loading={loading} note={deltaNote} />
  ) : null;
  const linkEl = href ? (
    <TextLink
      as="a"
      className="type-label-14 inline-flex shrink-0 items-center gap-1"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {linkLabel}
      <ArrowUpRight aria-hidden className="size-3.5" />
    </TextLink>
  ) : null;
  return (
    <div className="flex flex-col gap-2 bg-card p-4">
      <div className="flex items-center gap-2">
        {liveDot ? (
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-success-600"
          />
        ) : null}
        <Eyebrow as="div">{title}</Eyebrow>
        {titleInfo}
      </div>
      <div className="flex items-baseline gap-2">
        <HeroNumeric loading={loading}>{value}</HeroNumeric>
        {valueSuffix ? (
          <span className="type-heading-24 text-muted-foreground">
            {valueSuffix}
          </span>
        ) : null}
        {deltaRow ? null : deltaEl}
        {deltaRow ? null : linkEl}
      </div>
      {deltaRow && (deltaEl || linkEl) ? (
        <div className="flex items-center gap-2">
          {deltaEl}
          {linkEl}
        </div>
      ) : null}
      {caption ? (
        <p className="type-copy-14 m-0 text-muted-foreground">{caption}</p>
      ) : null}
      {spark ? (
        <div className="mt-1">
          {loading ? <Skeleton className="mt-1 h-9 w-full" /> : spark}
        </div>
      ) : null}
    </div>
  );
}
