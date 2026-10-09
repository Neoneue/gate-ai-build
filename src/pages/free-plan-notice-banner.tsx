import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SparklesIcon } from "@/components/ui/sparkles";
import { PlanComparisonDialog } from "@/pages/plan-comparison-dialog";

/* ─────────────────────────────────────────────────────────────────────────
 * Free-plan notice banner: "You're on the Free plan." plus one sentence on
 * what Pro adds for this surface, and the promo "Upgrade to Pro" button that
 * opens the plan comparison dialog. Lifted verbatim from Policies (Free) on
 * 2026-10-07 when Settings > Data retention became its second consumer; only
 * the sentence after the lead-in varies per surface.
 * ───────────────────────────────────────────────────────────────────────── */

export function FreePlanNoticeBanner({
  children,
}: {
  /** What Pro adds here, one short sentence after the lead-in. */
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <>
      {/* Same promo surface as <SidebarUpgradeCard>: `bg-card` + the
          --promo-* chrome family (border + shadow ink) with the
          `.sidebar-upgrade-texture` wash + dot field full-bleed underneath.
          The utility's tile is 10.5x21 and repeats, so it fills this wide,
          short box at the same pitch it uses in the narrow rail. Card
          already supplies `overflow-hidden`, which rounds the texture's
          corners; `relative` is what gives it a positioning context.
          The COPY is not blue — lead-in on --foreground, body on
          --muted-foreground (2026-08-04), matching the sidenav card. */}
      <Card className="shadow-(color:--promo-shadow) relative rounded-sm border-promo-border shadow-sm">
        <div
          aria-hidden
          className="sidebar-upgrade-texture sidebar-upgrade-texture-quiet pointer-events-none absolute inset-0"
        />
        <CardContent className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
                <span className="type-label-14 text-foreground">
                  You&apos;re on the Free plan.
                </span>{" "}
                {children}
              </p>
            </div>
            <Button
              className="shrink-0"
              onClick={() => setCompareOpen(true)}
              size="sm"
              type="button"
              variant="promo"
            >
              <SparklesIcon aria-hidden data-icon="inline-start" size={14} />
              <span>Upgrade to Pro</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      <PlanComparisonDialog
        onOpenChange={setCompareOpen}
        onUpgrade={() => navigate("/billing")}
        open={compareOpen}
      />
    </>
  );
}
