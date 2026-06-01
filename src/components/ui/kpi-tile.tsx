import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DeltaTag } from '@/components/ui/compact-kpi';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { TextLink } from '@/components/ui/text-link';

export function KpiTile({
  title,
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
}: {
  title: string;
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
}) {
  const deltaEl = delta ? <DeltaTag delta={delta} note={deltaNote} /> : null;
  const linkEl = href ? (
    <TextLink
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm shrink-0"
    >
      {linkLabel}
      <ArrowUpRight aria-hidden className="size-3.5" />
    </TextLink>
  ) : null;
  return (
    <div className="flex flex-col gap-2 bg-card p-4">
      <div className="flex items-center gap-2">
        {liveDot ? (
          <span aria-hidden className="size-2 rounded-full bg-success-600 shrink-0" />
        ) : null}
        <Eyebrow as="div">{title}</Eyebrow>
      </div>
      <div className="flex items-baseline gap-2">
        <HeroNumeric>{value}</HeroNumeric>
        {valueSuffix ? (
          <span className="font-sans text-2xl/8 font-medium text-neutral-500">
            {valueSuffix}
          </span>
        ) : null}
        {!deltaRow ? deltaEl : null}
        {!deltaRow ? linkEl : null}
      </div>
      {deltaRow && (deltaEl || linkEl) ? (
        <div className="flex items-center gap-2">
          {deltaEl}
          {linkEl}
        </div>
      ) : null}
      {caption ? (
        <p className="font-sans text-sm text-neutral-500 m-0">{caption}</p>
      ) : null}
      {spark ? <div className="mt-1">{spark}</div> : null}
    </div>
  );
}
