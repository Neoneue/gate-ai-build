import { freeModelRows } from "@/data/free-models";
import { formatTokenCount, type Model } from "@/data/models";
import { CapabilityStrip } from "../Models";
import { FeaturedCard } from "./ModelShelves";

/* ─────────────────────────────────────────────────────────────────────────
 * Free models from Gate — the operator-enabled catalog models a customer can
 * call at no cost (Notion "Free models", AG-829).
 *
 * Deliberately the SAME card as Featured, not a second card design: this
 * block sits directly under Featured on the same page, so a second anatomy
 * at the same size would read as a mistake rather than as a distinction.
 * `FeaturedCard` takes the badge text and the stat pair as props and this
 * block supplies a positioning tagline for the badge (same vocabulary as
 * Featured) and the price ("Free"; every plan, Free and Pro, gets the same
 * set); everything else, padding, gaps, the 146px height, truncate + tooltip
 * on the name, the drill-in press recipe, comes from the one component.
 *
 * A card opens the FREE detail page (constellation id, "Free" prices); the
 * catalog row for the same model opens the paid one. `Models.tsx` routes the
 * two by which callback fired.
 * ───────────────────────────────────────────────────────────────────────── */

export function FreeModels({ onSelect }: { onSelect: (model: Model) => void }) {
  const rows = freeModelRows();
  if (rows.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="type-heading-24 m-0 text-foreground">
          Free models from Gate
        </h2>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground">
          Models Gate supports at no cost for your plan, so you can ship without
          a paid balance.
        </p>
      </div>

      {/* Two cards, so half the Featured row's column count at the same
          breakpoint — the cards keep their width band instead of stretching
          across four tracks. */}
      <div className="grid @4xl:grid-cols-2 grid-cols-1 gap-4">
        {rows.map(({ free, model }) => (
          <FeaturedCard
            badge={free.tagline}
            focusId={free.id}
            key={free.id}
            model={model}
            onSelect={onSelect}
            stats={[
              {
                label: "Context",
                value: formatTokenCount(model.contextWindow),
              },
              {
                label: "Input / output",
                value: "Free",
              },
              // Same strip the Featured cards and the catalog rows render,
              // imported rather than rebuilt: a free model states what it can
              // do in the same place a paid one does.
              {
                label: "Features",
                value: <CapabilityStrip capabilities={model.capabilities} />,
              },
            ]}
          />
        ))}
      </div>
    </section>
  );
}
