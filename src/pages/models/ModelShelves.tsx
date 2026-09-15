import type { ReactNode } from "react";
import { LobeMark } from "@/components/icons/lobe-mark";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RowActionButton } from "@/components/ui/row-action-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatPricePerM,
  formatTokenCount,
  listPrice,
  type Model,
} from "@/data/models";
import { useIsTruncated } from "@/hooks/use-is-truncated";
import { cn } from "@/lib/utils";
import { CapabilityStrip, NumericCell, ProviderStack } from "@/pages/Models";
import {
  featuredModels,
  featuredTagline,
  SHELVES,
  type Shelf,
  shelfRows,
} from "./curation";

/* ─────────────────────────────────────────────────────────────────────────
 * Curated blocks for the Models LIST page — the Featured row and the four
 * shelves that sit between the page header and the full catalog table.
 *
 * Every value a card or shelf row shows is read off the same `Model` the
 * catalog table renders (see `curation.ts`), so a shelf and the table below
 * it cannot disagree. The cell renderers are IMPORTED from `Models.tsx`
 * rather than re-implemented, for the same reason.
 *
 * Shelf tables are the catalog table minus its Model ID column and minus
 * sorting: a shelf is an editorial answer, so letting the reader re-sort it
 * would undo the point of it.
 * ───────────────────────────────────────────────────────────────────────── */

/** Featured: four compact cards. No image, no description — a positioning
 *  badge, the model identity, and two stats. The card's only job is to open
 *  the model. Anything more and it competes with the shelves below it. */
export function FeaturedModels({
  onSelect,
}: {
  onSelect: (model: Model) => void;
}) {
  const models = featuredModels();
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="type-heading-24 m-0 text-foreground">Featured models</h2>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          The Gate team's suggested starting points for your project. Each one
          is a strong default for a different kind of work, so you can see what
          it costs and pick one with confidence.
        </p>
      </div>

      {/* 2 x 2 from @4xl, stacked below it. There is no 4-up tier: the fourth
          stat (Features) takes the stat block to 344px of fixed tracks plus
          48px of gaps = 392px, so a card needs 424px of width (p-4 both sides)
          to hold all four stats in one row, and a quarter of the page column
          never clears that on any width this dashboard runs at (a 4-up card at
          1280 main is 308 wide, 274 of content).

          A 2-up card is (main - 16) / 2, so 424px of card needs 864px of page
          column. @4xl (896 main, card 440, content 408) is the first rung that
          clears it; @3xl would give a 376px card, and at @xl (576 main, card
          280) the stat row clipped by 66px. Below @4xl the row stacks, where a
          1-up card is wide again. */}
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        {/* No mount animation: cards render in place on load. A staggered
            entrance fits a marketing page, not a dashboard someone refreshes
            all day (removed 2026-09-15). */}
        {models.map((model) => (
          <FeaturedCard key={model.id} model={model} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

/** The Featured card is also the Free-models card (`FreeModels.tsx`): same
 *  anatomy, same 138px height, only the badge text and the stat values
 *  differ. Both are props with the Featured reading as the default, so the two
 *  blocks cannot drift apart the way two copies of this markup would. */
export function FeaturedCard({
  model,
  onSelect,
  badge,
  stats,
  dimmed = false,
}: {
  model: Model;
  onSelect: (model: Model) => void;
  /** Overrides the curated positioning tagline. */
  badge?: string;
  /** Overrides the default Context + Input + Output set. Three entries. A
   *  value may be a node (the capability strip) rather than a string. */
  stats?: { label: string; value: ReactNode }[];
  /** Rests at 75% opacity (well above the primitives' 50% disabled wash so
   *  every line stays legible) with no hover fill. The drill-in stays live so
   *  the detail page is reachable. Used for a Pro-only free model on a Free
   *  surface; the upgrade banner below is the action. */
  dimmed?: boolean;
}) {
  const tagline = badge ?? featuredTagline(model);
  const { ref: nameRef, isTruncated } = useIsTruncated();
  const context = formatTokenCount(model.contextWindow);
  const input = formatPricePerM(listPrice(model, "inputPer1M"));
  const output = formatPricePerM(listPrice(model, "outputPer1M"));
  const statRow = stats ?? [
    { label: "Context", value: context },
    { label: "Input", value: input },
    { label: "Output", value: output },
    // The same strip the catalog table renders, imported rather than rebuilt
    // (`Models.tsx`), so a card and its row cannot disagree about what a model
    // can do. Four glyphs plus the `+N` chip, tooltips and all.
    {
      label: "Features",
      value: <CapabilityStrip capabilities={model.capabilities} />,
    },
  ];
  return (
    // `density="flush"` hands the padding to the button so the whole card is
    // the hit target, not a padded box with a button inside it. Press + focus
    // are the house recipe: hover fill and the 0.98 press scale live on the
    // Card (`interactive`) so the whole framed card presses as one object;
    // the button keeps the focus ring.
    <Card
      className={cn(
        // `@container/card` makes the stat grid below answer to THIS card's
        // width rather than to the page's. The same card is 274px wide in a
        // 4-up row, 450px in a 2-up row and 574px 1-up, and only the card
        // knows which it is.
        "group/card @container/card relative",
        dimmed && "cursor-pointer opacity-75"
      )}
      density="flush"
      interactive={!dimmed}
    >
      {/* Hover reveal (user call 2026-09-14): the monochrome vendor mark,
          clipped in the top-right corner, fades from 0 to 10% ink on hover.
          At rest the card is plain so it does not read as OpenRouter's
          watermark motif; on hover it is the reward for the pointer. Skipped
          on a dimmed card, which has no hover state. */}
      {dimmed ? null : (
        <LobeMark
          className="pointer-events-none absolute -top-4 -right-4 text-foreground/10 opacity-0 transition-opacity duration-150 ease-out group-hover/card:opacity-100 motion-reduce:transition-none"
          size={96}
          vendor={model.vendor}
        />
      )}
      {/* `gap-5` (20px) sets badge -> identity here; the inner group keeps
          `gap-4` between identity and stats, so the badge sits 4px further
          from the name than the name does from the stats. With `p-4`, the
          default 20px `Badge` and the `type-label-18` name (18/20, was
          `type-label-16` at 16/24) the card measures 146px. */}
      <RowActionButton
        aria-label={`Inspect ${model.name}`}
        className="relative h-full justify-start gap-5 rounded-md p-4 focus-visible:ring-inset"
        layout="stack"
        onClick={() => onSelect(model)}
      >
        {/* Positioning line, mirroring the marketing site's `.model-badge`.
            `Badge` already bakes in the badge/pill voice (`design.md` §3:
            mono, 500, 12px, UPPERCASE, `h-5`), so the tagline ships in
            sentence case and the primitive does the casing. Not `Eyebrow` —
            that voice is reserved for the nav rail and KPI tiles. */}
        {tagline ? <Badge variant="neutral">{tagline}</Badge> : null}

        <span className="flex w-full min-w-0 flex-col gap-4">
          <span className="flex w-full min-w-0 items-center gap-2">
            <VendorAvatar size="md" vendor={model.vendor} />
            {/* The name span IS the tooltip trigger — `render` puts Base UI's
                hover handlers on the existing element rather than wrapping it,
                so the flex row is unchanged. `TooltipContent` mounts ONLY when
                the name is really clipped, so a short name gets no tooltip and
                no second one from a native `title`. The trigger renders as a
                <span>, never a nested <button> inside the card's drill-in
                button; `closeOnClick` (Base UI default) keeps a click on the
                card from leaving a tooltip hanging over the next view. */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className="type-label-18 truncate text-foreground"
                    ref={nameRef}
                  />
                }
              >
                {model.name}
              </TooltipTrigger>
              {isTruncated ? (
                <TooltipContent>{model.name}</TooltipContent>
              ) : null}
            </Tooltip>
          </span>

          {/* The card's own grid: FIXED, unequal tracks, sized to the widest
              value each column class can ever hold, never to the value this
              card happens to have. Across all 416 catalog models the widest
              context is `131.1K` (6 mono chars, 50px) and the widest price is
              `$184.80/M` (9 chars, 76px). The fourth track holds the
              capability strip: 4 glyphs at 16px plus 3 x 8px gaps = 88, then
              the 8px gap and the default `Badge` (h-5, px-2 = 16px of padding
              around the 12px mono `+N`, measured at 32px). 88 + 8 + 32 = 128
              exactly, and `CAPABILITY_ORDER` holds 11 entries against an inline
              max of 4, so `+7` is the widest chip that can ever render and 32
              is the real ceiling, not a sample. Tracks are 56 / 80 / 80 / 128 =
              344.
              `131.1K` and `1.0M` therefore share one track
              width, prices share another, and every card in the row puts its
              labels and its mono values on the same x. Equal thirds gave
              Context as much room as a price and floated it away from Input;
              content-sized tracks drifted the third stat by up to 9px card to
              card. Whatever width is left over is trailing space, not track.

              The Free card's three stats keep the same 56px first track, so
              its second label starts on the Featured x. The second track is
              `max-content`: the price is a word or a short phrase, and
              Features must sit one gap after it, not at the card's far edge
              (a `1fr` track sent it there) and not a fixed 176px away on a
              card that only says `Free`. Cross-card alignment of Features is
              given up on purpose here; closeness wins. The third is the same
              128px Features track: 56 / max-content / 128. Below @md/card it
              folds to 56 / 1fr with Features on its own row, as the 4-stat
              set does.

              Below @md/card (448px) the card cannot hold four columns at all,
              so Features drops to its own full-width row under the three
              numbers (`col-span-3`) while the first three keep their x. The
              8px `gap-y-2` between the two rows is deliberately tighter than
              the column gap: this is one stat block folding, not two blocks
              stacked.

              Column-gap ladder, keyed to card inline-size, no half steps:
              16px up to @lg/card (512px) and 24px above it. The 24px tier
              needs 344 of track plus 72 of gap = 416 of content, so a 448px
              card; @md/card (448) sat exactly on that edge and clipped by 8px
              at 1200px of viewport with the old tracks, so the tier stays at
              @lg. The 16px tier needs 392 of content, a 424px card, which the
              @md/card four-column rung (448) clears. Width buys the air, not
              the column count. */}
          <span
            className={cn(
              "grid w-full min-w-0 @lg/card:gap-x-6 gap-x-4 gap-y-2",
              statRow.length === 2 && "grid-cols-[56px_1fr]",
              statRow.length === 3 &&
                "@md/card:grid-cols-[56px_max-content_128px] grid-cols-[56px_1fr]",
              statRow.length === 4 &&
                "@md/card:grid-cols-[56px_80px_80px_128px] grid-cols-[56px_80px_80px]"
            )}
          >
            {statRow.map((stat, i) => (
              <FeaturedStat
                className={
                  // Features is always the LAST stat and always the one that
                  // wraps: its own full-width row until the card can hold the
                  // extra column. Keyed to the last index rather than to a
                  // fixed number, so the 3-stat Free set and the 4-stat
                  // Featured set fold the same way.
                  i === statRow.length - 1 && statRow.length > 2
                    ? cn(
                        "@md/card:col-span-1",
                        statRow.length === 4 ? "col-span-3" : "col-span-2"
                      )
                    : undefined
                }
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </span>
        </span>
      </RowActionButton>
    </Card>
  );
}

function FeaturedStat({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Grid placement only (the Features stat's wrap span). */
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span className="type-copy-12 text-muted-foreground">{label}</span>
      {/* A string value takes the mono numeric voice. A node (the capability
          strip) brings its own voice and only needs the same 20px line box,
          so the two kinds of stat sit on one baseline grid. */}
      {typeof value === "string" ? (
        <span className="type-mono-14 whitespace-nowrap text-foreground">
          {value}
        </span>
      ) : (
        <span className="flex h-5 items-center">{value}</span>
      )}
    </span>
  );
}

/** The four shelves, stacked full width. `gap-8` between them and `gap-4`
 *  inside one keeps a shelf reading as a sub-section of this block rather
 *  than as a peer of Featured or the catalog. */
export function ModelShelves({
  onSelect,
}: {
  onSelect: (model: Model) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      {SHELVES.map((shelf) => (
        <ShelfSection key={shelf.id} onSelect={onSelect} shelf={shelf} />
      ))}
    </div>
  );
}

function ShelfSection({
  shelf,
  onSelect,
}: {
  shelf: Shelf;
  onSelect: (model: Model) => void;
}) {
  const rows = shelfRows(shelf);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="type-heading-20 m-0 text-foreground">{shelf.title}</h2>
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          {shelf.subtitle}
        </p>
      </div>

      {/* The shelf table needs ~831px to hold six columns without wrapping or
          truncating anything, so below that the Card scrolls horizontally
          rather than compressing the columns. */}
      <Card className="overflow-x-auto" density="flush">
        <ShelfTable onSelect={onSelect} rows={rows} />
      </Card>
    </section>
  );
}

function ShelfTable({
  rows,
  onSelect,
}: {
  rows: Model[];
  onSelect: (model: Model) => void;
}) {
  return (
    <Table className="min-w-[52rem]">
      <TableHeader>
        {/* Percentage widths pinned on the heads (the Conversations.tsx
            pattern — no `table-fixed`) so all four shelves lay out
            identically. Auto sizing let each table size its own columns from
            its own rows, so the Model column jumped between shelves and the
            four stacked tables read as four unrelated grids. Measured off the
            first shelf at 1440, then Capabilities cut a quarter and the freed
            7.3 points split evenly onto Input and Output, which were the two
            columns running tightest against their content. */}
        <TableRow className="hover:bg-transparent">
          {/* Rank head shows the leaderboard glyph "#" (user call 2026-09-14):
              one character keeps the 4% column quiet while a titled "Rank"
              would announce the editorial order louder than intended. The
              sr-only text still names the column "Rank" for a screen reader;
              the glyph itself is hidden from assistive tech so it is not read
              as "number". */}
          <TableHead className="w-[4%] whitespace-nowrap text-right">
            <span aria-hidden>#</span>
            <span className="sr-only">Rank</span>
          </TableHead>
          <TableHead className="w-[30%] whitespace-nowrap">Model</TableHead>
          {/* `text-right` so each numeric head sits over its own right-aligned
              NumericCell column, exactly as SortableTableHead's `numeric` does
              on the catalog table below. */}
          <TableHead className="w-[12%] whitespace-nowrap text-right">
            Context
          </TableHead>
          <TableHead className="w-[16%] whitespace-nowrap text-right">
            Input
          </TableHead>
          <TableHead className="w-[16%] whitespace-nowrap text-right">
            Output
          </TableHead>
          <TableHead className="w-[12%] whitespace-nowrap">Features</TableHead>
          <TableHead className="w-[10%] whitespace-nowrap">Providers</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((model, index) => (
          <TableRow
            className="cursor-pointer"
            key={model.id}
            onClick={() => onSelect(model)}
          >
            {/* The shelf is an ordered editorial answer, so the position is
                real information — but it is the quietest thing in the row.
                Muted mono, right-aligned, no "#" and no badge: it reads as
                "our first suggestion", not as a leaderboard. `type-mono-14`
                already carries `tabular-nums`, so the digits align without a
                call-site repeat of it. */}
            <TableCell className="type-mono-14 whitespace-nowrap text-right text-muted-foreground">
              {index + 1}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <RowActionButton
                aria-label={`Inspect ${model.name}`}
                onClick={() => onSelect(model)}
              >
                <VendorAvatar vendor={model.vendor} />
                <span className="type-label-14 text-foreground">
                  {model.name}
                </span>
              </RowActionButton>
            </TableCell>
            <NumericCell value={formatTokenCount(model.contextWindow)} />
            <NumericCell
              value={formatPricePerM(listPrice(model, "inputPer1M"))}
            />
            <NumericCell
              value={formatPricePerM(listPrice(model, "outputPer1M"))}
            />
            <TableCell>
              <CapabilityStrip capabilities={model.capabilities} />
            </TableCell>
            <TableCell>
              <ProviderStack providers={model.providers} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
