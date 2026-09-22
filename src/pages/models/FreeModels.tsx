import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SparklesIcon } from "@/components/ui/sparkles";
import { effectivePlan, freeModelRows } from "@/data/free-models";
import { formatTokenCount, type Model } from "@/data/models";
import { isDefaultSurface } from "@/lib/plan";
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
 * Featured) and the price ("Free", or "Free (Pro plan only)" on a Pro-only
 * row, which is where the plan is stated); everything else, padding, gaps, the
 * 146px height,
 * truncate + tooltip on the name, the drill-in press recipe, comes from the
 * one component.
 * ───────────────────────────────────────────────────────────────────────── */

export function FreeModels({ onSelect }: { onSelect: (model: Model) => void }) {
  const { pathname } = useLocation();
  const rows = freeModelRows();
  if (rows.length === 0) {
    return null;
  }
  // The banner only has something to sell while the user cannot reach one of
  // the rows above: Free plan (i.e. the `-free` and `-default` surfaces) AND
  // a Pro-only row actually present in the data.
  const proOnly = rows.find(({ free }) => free.access === "pro-only");
  const plan = effectivePlan(pathname);
  const showUpgrade = plan === "free" && proOnly;
  return (
    <section className="flex flex-col gap-4">
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
            dimmed={plan === "free" && free.access === "pro-only"}
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
                value:
                  plan === "free" && free.access === "pro-only"
                    ? "Free (Pro plan only)"
                    : "Free",
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

      {showUpgrade ? <UpgradeBanner /> : null}
    </section>
  );
}

/** Wide promo surface, the same recipe as the Policies free-plan banner and
 *  <SidebarUpgradeCard>: `bg-card` from the primitive, the --promo-* chrome
 *  family for border + shadow ink, and the `.sidebar-upgrade-texture` wash /
 *  dot field full-bleed underneath on its `-quiet` twin (the wide-surface
 *  pitch). Copy is NOT on promo ink — title on --foreground, body on
 *  --muted-foreground — matching both of those surfaces. */
function UpgradeBanner() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Same rule DashboardChrome uses for `upgradePath`: the nested Manage
  // subscription page lands the user on the plan ladder rather than on
  // Billing to hunt for it.
  const upgradePath = isDefaultSurface(pathname)
    ? "/billing-default/plans"
    : "/billing-free/plans";
  return (
    <Card
      aria-label="Upgrade to Pro"
      className="shadow-(color:--promo-shadow) relative border-promo-border shadow-sm"
      role="region"
    >
      <div
        aria-hidden
        className="sidebar-upgrade-texture sidebar-upgrade-texture-quiet pointer-events-none absolute inset-0"
      />
      <CardContent className="relative flex @3xl:flex-row flex-col @3xl:items-center gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <SparklesIcon
            aria-hidden
            className="shrink-0 text-promo-accent"
            size={20}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="type-label-14 m-0 text-foreground">
              Pro comes with a premium free model
            </p>
            <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
              Upgrade and a more capable model joins your free set at no cost,
              alongside everything the Free plan already includes.
            </p>
          </div>
        </div>
        <Button
          className="@3xl:w-auto w-full shrink-0"
          onClick={() => navigate(upgradePath)}
          size="default"
          type="button"
          variant="promo"
        >
          <SparklesIcon aria-hidden data-icon="inline-start" size={16} />
          Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  );
}
