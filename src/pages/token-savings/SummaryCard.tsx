/* ─────────────────────────────────────────────────────────────────────────
 * SummaryCard — the Token savings page's "Summary" card.
 *
 * Reads `SummaryModel` and prints it. The card holds NO arithmetic and no
 * copy of its own: every figure, share, flag and sentence comes from
 * `token-savings-summary.ts` (`SUMMARY_COPY`), so the wording lives in one
 * place and the unit test can assert it without rendering. No dollar
 * amounts, no tooltips, nothing focusable — the page's keyboard order stays
 * range pills -> date picker -> Compression switch.
 *
 * It sits as a peer between the "Overview" and "Savings options" section
 * titles, so its own title is a `SectionTitle` (20px), not a 16px CardTitle
 * that would read as a lesser sibling.
 *
 * Loading follows design.md: SKELETON THE VALUE, KEEP THE CHROME. Titles,
 * labels, the basis line and the exclusion are known before the fetch
 * resolves and render as themselves; only the numbers and the bar fills get
 * a skeleton, the meters drop `role="meter"` (a meter with no value would
 * announce a reading the page does not have), and the card announces the
 * wait ONCE via `aria-busy` + a single `sr-only role="status"`.
 * ───────────────────────────────────────────────────────────────────────── */

import type { JSX } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionTitle } from "@/components/ui/section-title";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { formatCompactCount, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  ledeParts,
  SUMMARY_COPY,
  type SummaryBar,
  type SummaryModel,
} from "@/pages/token-savings-summary";

/* The breakdown grid. Three tracks from `@md` (label · bar · value); below
 * it two tracks with the label spanning both so a 390px column never
 * truncates a name. The label track is fixed at w-56 so the longest name
 * ("Cross-conversation de-duplication") holds one line and the rows stay an
 * even ladder. Every row is a `display:contents` wrapper so its cells land
 * directly in these tracks. */
const ROW_GRID =
  "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 @md:grid-cols-[auto_1fr_3.5rem]";
// w-60 with pr-4 keeps the text at 224px and adds 16px of air before the bar
// on top of the grid gap (user 2026-09-17).
// 288px track, 16px inner padding: the longest nested name ("Cross-conversation
// de-duplication", 238px at 14px) fits on one line inside the 32px indent.
// 8pt grid: label track 288 + gap 16 puts every bar's origin at 304px from
// the grid edge. The nested block indents 32 (ml-4 + pl-4, hairline drawn
// as a pseudo so it takes no width) and its track is 256, so 32 + 256 + 16
// lands on the same 304 (user 2026-09-17). The value track is a fixed 56px
// so the mono-14 and mono-12 percentages cannot shift the bars' right edge.
const LABEL_CELL = "col-span-2 @md:col-span-1 @md:w-72 @md:pr-4";
/** Nested rows sit inside a 32px indent (ml-4 + pl-4), so their label track
 *  is 32px narrower and every bar in the block starts on one vertical line. */
const NESTED_LABEL_CELL = "col-span-2 @md:col-span-1 @md:w-64 @md:pr-4";
const FULL_ROW = "col-span-2 @md:col-span-3";

const NOTE = "type-copy-12 m-0 text-pretty text-muted-foreground";

/* ─── Header ───────────────────────────────────────────────────────────── */

function SummaryHeader() {
  return (
    <CardHeader className="border-border border-b">
      <SectionTitle as="h2">{SUMMARY_COPY.title}</SectionTitle>
      {/* One subtitle in the card-description voice (CardChromeHeader) that
          says what the card is for. The period is read in the lede, and the
          epoch caveat sits with the exclusion in the footer, so the header
          never stacks three unrelated facts (user 2026-09-17). */}
      <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
        {SUMMARY_COPY.subtitle}
      </p>
    </CardHeader>
  );
}

/* ─── Lede ─────────────────────────────────────────────────────────────── */

function Lede({ model, loading }: { model: SummaryModel; loading: boolean }) {
  const [before, removed, middle, cached, after] = ledeParts(model);
  return (
    <p className="type-copy-16 m-0 text-pretty text-foreground">
      {before}
      {/* design-allow-raw-type: inline figure emphasis inside a type-copy-16 lede; a voice class here would restate the parent size. */}
      {loading ? (
        <SkeletonText className="w-16" />
      ) : (
        <strong className="font-medium tabular-nums">{removed}</strong>
      )}
      {middle}
      {/* design-allow-raw-type: inline figure emphasis inside a type-copy-16 lede; a voice class here would restate the parent size. */}
      {loading ? (
        <SkeletonText className="w-16" />
      ) : (
        <strong className="font-medium tabular-nums">{cached}</strong>
      )}
      {after}
    </p>
  );
}

/* ─── Figure cells ─────────────────────────────────────────────────────── */

function FigureCell({
  value,
  label,
  note,
  loading,
}: {
  value: string;
  label: string;
  note: string;
  loading: boolean;
}) {
  return (
    <Card className="rounded-xs bg-transparent shadow-none">
      {/* KpiTile composition, the site's KPI pattern: Eyebrow above the
          HeroNumeric, the denominator as the caption line beneath. */}
      <CardContent className="flex flex-col gap-2">
        <Eyebrow as="div">{label}</Eyebrow>
        <HeroNumeric loading={loading}>{value}</HeroNumeric>
        <span className="type-copy-14 text-pretty text-muted-foreground">
          {note}
        </span>
      </CardContent>
    </Card>
  );
}

function Figures({
  model,
  loading,
}: {
  model: SummaryModel;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FigureCell
        label={SUMMARY_COPY.removed.label}
        loading={loading}
        note={SUMMARY_COPY.removed.denominator(model)}
        value={formatCompactCount(model.inputTokensRemoved)}
      />
      <FigureCell
        label={SUMMARY_COPY.cached.label}
        loading={loading}
        note={SUMMARY_COPY.cached.denominator(model)}
        value={formatNumber(model.cacheAnswered)}
      />
    </div>
  );
}

/* ─── Breakdown rows ───────────────────────────────────────────────────── */

function MeterRow({
  bar,
  fill,
  labelVoice,
  valueVoice,
  loading,
  nested = false,
}: {
  bar: SummaryBar;
  fill: string;
  labelVoice: string;
  valueVoice: string;
  loading: boolean;
  nested?: boolean;
}) {
  return (
    <div className="contents">
      <span
        className={cn(
          nested ? NESTED_LABEL_CELL : LABEL_CELL,
          "whitespace-pre-line",
          labelVoice
        )}
      >
        {bar.label}
      </span>
      {loading ? (
        <Skeleton className="h-1.5 w-full rounded-full" />
      ) : (
        <div
          aria-label={SUMMARY_COPY.breakdown.barAlt(bar)}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={bar.share}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
              fill
            )}
            style={{ width: `${bar.share}%` }}
          />
        </div>
      )}
      {loading ? (
        <SkeletonText className={cn(valueVoice, "w-12 justify-self-end")} />
      ) : (
        <span
          className={cn(
            valueVoice,
            "justify-self-end whitespace-nowrap text-foreground"
          )}
        >
          {bar.shareLabel}
        </span>
      )}
    </div>
  );
}

/** Two levels, one basis: each mechanism row, with compression's mechanisms
 *  nested directly beneath it (indented, left hairline), then a hairline and
 *  the next mechanism. The parent ticket's "compression against Gate cache
 *  hits, and the leading compression passes inside that". */
function BreakdownRows({
  model,
  loading,
}: {
  model: SummaryModel;
  loading: boolean;
}) {
  return (
    <div className={ROW_GRID}>
      {model.mechanisms.map((mechanism, index) => (
        <div className="contents" key={mechanism.id}>
          {index > 0 ? (
            <div className={cn(FULL_ROW, "my-3 border-border border-t")} />
          ) : null}
          <MeterRow
            bar={mechanism}
            fill={mechanism.fill}
            labelVoice="type-copy-14 text-foreground"
            loading={loading}
            valueVoice="type-mono-14"
          />
          {mechanism.passes.length > 0 ? (
            <div
              className={cn(
                FULL_ROW,
                "relative ml-4 pl-4 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border"
              )}
            >
              <div className={ROW_GRID}>
                {mechanism.passes.map((pass) => (
                  <MeterRow
                    bar={pass}
                    fill={mechanism.fill}
                    key={pass.id}
                    labelVoice="type-copy-14 text-muted-foreground"
                    loading={loading}
                    nested
                    valueVoice="type-mono-12"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Breakdown({
  model,
  loading,
}: {
  model: SummaryModel;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <SectionHeading as="h4">{SUMMARY_COPY.breakdown.title}</SectionHeading>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {SUMMARY_COPY.breakdown.basis}
        </p>
      </div>
      <BreakdownRows loading={loading} model={model} />
      {model.lowVolume ? (
        <p className={NOTE}>{SUMMARY_COPY.breakdown.lowVolume}</p>
      ) : null}
    </div>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────────── */

export function SummaryCard({
  model,
  loading = false,
}: {
  model: SummaryModel;
  loading?: boolean;
}): JSX.Element {
  // Loading is never no-traffic: an empty state is a conclusion, and the
  // card must not claim "nothing passed through Gate" while it is still
  // asking (design.md, Skeleton).
  if (!loading && model.noTraffic) {
    return (
      <Card aria-busy={false} className="min-w-0">
        <SummaryHeader />
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <SectionHeading as="h4">
            {SUMMARY_COPY.noTraffic.title}
          </SectionHeading>
          <p className="type-copy-14 m-0 max-w-prose text-pretty text-muted-foreground">
            {SUMMARY_COPY.noTraffic.body}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-busy={loading} className="min-w-0">
      {/* One announcement for the whole card; every Skeleton inside is
          aria-hidden by the primitive. */}
      {loading ? (
        <span className="sr-only" role="status">
          Loading…
        </span>
      ) : null}
      <SummaryHeader />
      <CardContent className="flex flex-col gap-6">
        <Lede loading={loading} model={model} />
        <Figures loading={loading} model={model} />
        <Breakdown loading={loading} model={model} />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 border-border border-t">
        {/* The lead is the block's title (SectionHeading, like the breakdown
            heading), with the copy beneath it (user 2026-09-17). */}
        <SectionHeading as="h4">{SUMMARY_COPY.exclusion.lead}</SectionHeading>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {SUMMARY_COPY.exclusion.body}
        </p>
      </CardFooter>
    </Card>
  );
}
