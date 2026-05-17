import type { ReactNode } from 'react';
import { DeltaTag } from '@/components/ui/compact-kpi';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';

export function KpiTile({
  title,
  value,
  valueSuffix,
  liveDot,
  delta,
  caption,
  spark,
}: {
  title: string;
  value: string;
  valueSuffix?: string;
  liveDot?: boolean;
  delta?: string;
  caption?: string;
  spark?: ReactNode;
}) {
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
          <span className="font-sans text-2xl/8 font-medium text-ink-500">
            {valueSuffix}
          </span>
        ) : null}
        {delta ? <DeltaTag delta={delta} /> : null}
      </div>
      {caption ? (
        <p className="font-sans text-sm text-ink-500 m-0">{caption}</p>
      ) : null}
      {spark ? <div className="mt-1">{spark}</div> : null}
    </div>
  );
}
