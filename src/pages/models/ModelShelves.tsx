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
        <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
          The Gate team's suggested starting points for your project. Each one
          is a strong default for a different kind of work, so you can see what
          it costs and pick one with confidence.
        </p>
      </div>

      {/* 4-up switches at @7xl (1280px main), not @5xl. The card's stat grid
          is 216px of fixed tracks plus 32px of gaps = 248px, and a quarter
          track only clears that once the page column passes 1280 (card 308,
          content 274). At @5xl the card was 244 wide and the prices clipped.
          Between @5xl and @7xl the row stays 2-up, which is also where the
          cards are wide enough to earn the 24px stat gap. */}
      <div className="grid @7xl:grid-cols-4 @xl:grid-cols-2 grid-cols-1 gap-4">
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
  /** Overrides the default Context + Input + Output set. Three entries. */
  stats?: { label: string; value: string }[];
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
      {/* One 16px rhythm: `gap-4` sets badge -> identity here and identity ->
          stats on the inner group, so the three rows read as peers. With
          `p-4` and the 16px `size="xs"` badge the card lands at 138px; the
          earlier 124px cap was lifted for the extra air. */}
      <RowActionButton
        aria-label={`Inspect ${model.name}`}
        className="relative h-full justify-start gap-4 rounded-md p-4 focus-visible:ring-inset"
        layout="stack"
        onClick={() => onSelect(model)}
      >
        {/* Positioning line, mirroring the marketing site's `.model-badge`.
            `Badge` already bakes in the badge/pill voice (`design.md` §3:
            mono, 500, 12px, UPPERCASE, `h-5`), so the tagline ships in
            sentence case and the primitive does the casing. Not `Eyebrow` —
            that voice is reserved for the nav rail and KPI tiles. */}
        {tagline ? (
          <Badge size="xs" variant="neutral">
            {tagline}
          </Badge>
        ) : null}

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
                    className="type-label-16 truncate text-foreground"
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
              `$184.80/M` (9 chars, 76px), so the tracks are 56 / 80 / 80 on
              the 8pt grid. `131.1K` and `1.0M` therefore share one track
              width, prices share another, and every card in the row puts its
              labels and its mono values on the same x. Equal thirds gave
              Context as much room as a price and floated it away from Input;
              content-sized tracks drifted the third stat by up to 9px card to
              card. Whatever width is left over is trailing space, not track.

              The Free card's two stats keep the same 56px first track, so its
              second label starts on the Featured x; the second track takes
              the remainder because `Free (Pro plan only)` is a phrase, not a
              number to align.

              Gap ladder, keyed to card inline-size, no half steps: 16px up to
              @md/card (448px) and 24px above it. Every 4-up card (308-395px)
              sits at 16px, a 2-up card at 24px from ~1024px of page width up,
              and a 1-up card is back at 16px on a phone (358px) - width buys
              the air, not the column count. */}
          <span
            className={cn(
              "grid w-full min-w-0 @md/card:gap-6 gap-4",
              statRow.length === 2
                ? "grid-cols-[56px_1fr]"
                : "grid-cols-[56px_80px_80px]"
            )}
          >
            {statRow.map((stat) => (
              <FeaturedStat
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

function FeaturedStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="type-copy-12 text-muted-foreground">{label}</span>
      <span className="type-mono-14 whitespace-nowrap text-foreground">
        {value}
      </span>
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
