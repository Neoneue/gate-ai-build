import { CircleCheck, KeyRound, MoreHorizontal } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CompactKpi,
  CompactSpark,
  DeltaTag,
} from "@/components/ui/compact-kpi";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { KpiRail } from "@/components/ui/kpi-rail";
import { KpiTile } from "@/components/ui/kpi-tile";
import { Separator } from "@/components/ui/separator";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import {
  SAMPLE_KEY,
  SAMPLE_SPARK,
  SAMPLE_SPARK_LABELS,
} from "@/pages/component-canvas/sample-data";

/* Surfaces, KPIs and feedback (design.md "Cards and containers", "Numbers,
 * KPIs and charts", "Feedback and loading", "Skeleton"). Card examples keep
 * one header + content + footer and change one prop each. */

function cardParts() {
  return (
    <>
      <CardHeader>
        <CardTitle>{SAMPLE_KEY.name}</CardTitle>
        <CardDescription>Production web traffic.</CardDescription>
        <CardAction>
          <Button aria-label="Key actions" size="icon-sm" variant="ghost">
            <MoreHorizontal aria-hidden strokeWidth={1.75} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="type-mono-14 m-0 text-foreground">{SAMPLE_KEY.masked}</p>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline">
          Rename key
        </Button>
      </CardFooter>
    </>
  );
}

const card: CanvasGroup = {
  id: "card",
  title: "Card",
  files: ["card.tsx"],
  columns: 3,
  examples: [
    {
      label: "default (header, action, content, footer)",
      render: () => <Card className="w-full">{cardParts()}</Card>,
    },
    {
      label: 'size="sm"',
      render: () => (
        <Card className="w-full" size="sm">
          {cardParts()}
        </Card>
      ),
    },
    {
      label: 'density="flush"',
      render: () => (
        <Card className="w-full" density="flush">
          {cardParts()}
        </Card>
      ),
    },
    {
      label: 'tone="danger"',
      render: () => (
        <Card className="w-full" tone="danger">
          {cardParts()}
        </Card>
      ),
    },
    {
      label: 'tone="pro"',
      render: () => (
        <Card className="w-full" tone="pro">
          {cardParts()}
        </Card>
      ),
    },
    {
      label: 'tone="enterprise"',
      render: () => (
        <Card className="w-full" tone="enterprise">
          {cardParts()}
        </Card>
      ),
    },
    {
      label: 'elevation="raised"',
      render: () => (
        <Card className="w-full" elevation="raised">
          {cardParts()}
        </Card>
      ),
    },
    {
      label: "interactive",
      render: () => (
        <Card className="w-full" interactive>
          {cardParts()}
        </Card>
      ),
    },
    {
      label: 'variant="inset" (inside a Card)',
      render: () => (
        <Card className="w-full">
          <CardContent>
            <Card variant="inset">{cardParts()}</Card>
          </CardContent>
        </Card>
      ),
    },
  ],
};

const KPI_RAIL_COLUMNS = [2, 3, 4, 5, 6] as const;

const kpiRail: CanvasGroup = {
  id: "kpi-rail",
  title: "KpiRail",
  files: ["kpi-rail.tsx"],
  columns: 1,
  examples: KPI_RAIL_COLUMNS.map((columns) => ({
    label: `columns={${columns}}`,
    render: () => (
      <KpiRail className="w-full" columns={columns}>
        {Array.from({ length: columns }, (_, index) => (
          <KpiTile
            key={index}
            title={`Requests ${index + 1}`}
            value={String(SAMPLE_SPARK[index] ?? 0)}
          />
        ))}
      </KpiRail>
    ),
  })),
};

function sparkFor(props: Partial<ComponentProps<typeof CompactSpark>>) {
  return (
    <CompactSpark
      colorVar="var(--color-chart-1)"
      data={SAMPLE_SPARK}
      labels={SAMPLE_SPARK_LABELS}
      {...props}
    />
  );
}

function tileFrame(children: ReactNode) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-border bg-card shadow-xs">
      {children}
    </div>
  );
}

const kpiTile: CanvasGroup = {
  id: "kpi-tile",
  title: "KpiTile",
  files: ["kpi-tile.tsx"],
  columns: 3,
  examples: [
    {
      label: "title + value (AuditTrail.tsx frame)",
      render: () => tileFrame(<KpiTile title="Requests" value="2,860" />),
    },
    {
      label: "delta + deltaNote",
      render: () =>
        tileFrame(
          <KpiTile
            delta="+12.4%"
            deltaNote="vs last week"
            title="Requests"
            value="2,860"
          />
        ),
    },
    {
      label: "deltaRow",
      render: () =>
        tileFrame(
          <KpiTile
            delta="+12.4%"
            deltaNote="vs last week"
            deltaRow
            title="Requests"
            value="2,860"
          />
        ),
    },
    {
      label: 'valueSuffix="%"',
      render: () =>
        tileFrame(<KpiTile title="Compression" value="22.4" valueSuffix="%" />),
    },
    {
      label: "liveDot",
      render: () =>
        tileFrame(<KpiTile liveDot title="Requests" value="2,860" />),
    },
    {
      label: "caption",
      render: () =>
        tileFrame(
          <KpiTile
            caption="Across every key in this workspace."
            title="Requests"
            value="2,860"
          />
        ),
    },
    {
      label: "spark",
      render: () =>
        tileFrame(
          <KpiTile
            spark={sparkFor({ tooltip: true })}
            title="Requests"
            value="2,860"
          />
        ),
    },
    {
      label: "href + linkLabel (canvas blocks the link)",
      render: () =>
        tileFrame(
          <KpiTile
            href="https://example.com/explorer"
            linkLabel="Open in Explorer"
            title="Last fingerprint"
            value="2 hours ago"
          />
        ),
    },
    {
      label: "titleInfo",
      render: () =>
        tileFrame(
          <KpiTile
            title="Requests"
            titleInfo={
              <CircleCheck
                aria-hidden
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.75}
              />
            }
            value="2,860"
          />
        ),
    },
    {
      label: "loading",
      render: () =>
        tileFrame(
          <KpiTile
            delta="+12.4%"
            loading
            spark={sparkFor({})}
            title="Requests"
            value="2,860"
          />
        ),
    },
  ],
};

/** CompactKpi sizes to its content; in the app it fills a grid cell, so
 *  each example sits in a full-width cell the same way. */
function compactKpiCell(props: ComponentProps<typeof CompactKpi>) {
  return (
    <div className="w-full">
      <CompactKpi {...props} />
    </div>
  );
}

const compactKpi: CanvasGroup = {
  id: "compact-kpi",
  title: "CompactKpi",
  files: ["compact-kpi.tsx"],
  columns: 3,
  examples: [
    {
      label: "default (bordered)",
      render: () => compactKpiCell({ title: "Requests", value: "2,860" }),
    },
    {
      label: "flat (inside a bordered cell)",
      render: () => (
        <div className="w-full rounded-md border border-border">
          <CompactKpi flat title="Requests" value="2,860" />
        </div>
      ),
    },
    {
      label: "delta + deltaNote",
      render: () =>
        compactKpiCell({
          delta: "+12.4%",
          deltaNote: "vs last week",
          title: "Requests",
          value: "2,860",
        }),
    },
    {
      label: "deltaInverted (rise is bad)",
      render: () =>
        compactKpiCell({
          delta: "+12.4%",
          deltaInverted: true,
          title: "Latency",
          value: "412",
          valueSuffix: "ms",
        }),
    },
    {
      label: 'deltaSize="md"',
      render: () =>
        compactKpiCell({
          delta: "+12.4%",
          deltaSize: "md",
          title: "Requests",
          value: "2,860",
        }),
    },
    {
      label: "noteLine",
      render: () =>
        compactKpiCell({
          noteLine: "last 7 days",
          title: "Requests",
          value: "2,860",
        }),
    },
    {
      label: "spark",
      render: () =>
        compactKpiCell({
          spark: sparkFor({}),
          title: "Requests",
          value: "2,860",
        }),
    },
    {
      label: "loading",
      render: () =>
        compactKpiCell({
          delta: "+12.4%",
          loading: true,
          spark: sparkFor({}),
          title: "Requests",
          value: "2,860",
        }),
    },
  ],
};

const deltaTag: CanvasGroup = {
  id: "delta-tag",
  title: "DeltaTag",
  files: ["compact-kpi.tsx"],
  columns: 4,
  examples: [
    { label: 'delta="+12.4%"', render: () => <DeltaTag delta="+12.4%" /> },
    { label: 'delta="-3.1%"', render: () => <DeltaTag delta="-3.1%" /> },
    {
      label: "inverted",
      render: () => <DeltaTag delta="+12.4%" inverted />,
    },
    {
      label: 'size="md"',
      render: () => <DeltaTag delta="+12.4%" size="md" />,
    },
    {
      label: 'note="vs last week"',
      render: () => <DeltaTag delta="+12.4%" note="vs last week" />,
    },
    {
      label: "loading",
      render: () => <DeltaTag delta="+12.4%" loading />,
    },
  ],
};

const compactSpark: CanvasGroup = {
  id: "compact-spark",
  title: "CompactSpark",
  files: ["compact-kpi.tsx"],
  columns: 4,
  examples: [
    { label: "default (endDot, grid)", render: () => sparkFor({}) },
    { label: "endDot={false}", render: () => sparkFor({ endDot: false }) },
    { label: "noGrid", render: () => sparkFor({ noGrid: true }) },
    { label: "tooltip + labels", render: () => sparkFor({ tooltip: true }) },
  ],
};

const heroNumeric: CanvasGroup = {
  id: "hero-numeric",
  title: "HeroNumeric",
  files: ["hero-numeric.tsx"],
  columns: 4,
  examples: [
    {
      label: 'size="default"',
      render: () => <HeroNumeric size="default">2,860</HeroNumeric>,
    },
    {
      label: 'size="lg"',
      render: () => <HeroNumeric size="lg">2,860</HeroNumeric>,
    },
    {
      label: "loading",
      render: () => (
        <HeroNumeric loading size="default">
          2,860
        </HeroNumeric>
      ),
    },
    {
      label: 'size="lg" loading',
      render: () => (
        <HeroNumeric loading size="lg">
          2,860
        </HeroNumeric>
      ),
    },
  ],
};

const EMPTY_STATE_SIZES = ["page", "card"] as const;

const emptyState: CanvasGroup = {
  id: "empty-state",
  title: "EmptyState",
  files: ["empty-state.tsx"],
  columns: 2,
  examples: [
    // Title size (design.md TableEmptyState, owner 2026-10-13): `page` is
    // the 20px foreground block heading, `card` the 16px muted card-title
    // heading, so an empty state inside a card never outranks its title.
    ...EMPTY_STATE_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => (
        <EmptyState
          body="Keys you create show up here."
          className="w-full"
          size={size}
          title="No API keys"
        />
      ),
    })),
    {
      label: "icon + action + footnote",
      render: () => (
        <EmptyState
          action={
            <Button size="default" variant="default">
              Create key
            </Button>
          }
          body="Keys you create show up here."
          className="w-full"
          footnote="Revoked keys stay in the audit trail."
          icon={
            <KeyRound
              aria-hidden
              className="size-6 text-muted-foreground"
              strokeWidth={1.75}
            />
          }
          title="No API keys"
        />
      ),
    },
  ],
};

const callout: CanvasGroup = {
  id: "callout",
  title: "Callout",
  files: ["callout.tsx"],
  columns: 2,
  examples: [
    {
      label: "default",
      render: () => (
        <Callout className="w-full">
          Your organization sets retention. Changes apply to new requests.
        </Callout>
      ),
    },
    {
      label: 'action (Button variant="info-outline")',
      render: () => (
        <Callout
          action={
            <Button size="sm" variant="info-outline">
              View policy
            </Button>
          }
          className="w-full"
        >
          Your organization sets retention. Changes apply to new requests.
        </Callout>
      ),
    },
  ],
};

const SKELETON_TEXT_SIZES = ["sm", "default", "hero", "heroLg"] as const;

const skeleton: CanvasGroup = {
  id: "skeleton",
  title: "Skeleton",
  files: ["skeleton.tsx"],
  columns: 4,
  examples: [
    {
      label: "Skeleton (h-9 w-full)",
      render: () => <Skeleton className="h-9 w-full" />,
    },
    ...SKELETON_TEXT_SIZES.map((size) => ({
      label: `SkeletonText size="${size}"`,
      render: () => <SkeletonText className="w-32" size={size} />,
    })),
  ],
};

const toaster: CanvasGroup = {
  id: "toaster",
  title: "Toaster (sonner)",
  files: ["sonner.tsx"],
  columns: 4,
  examples: [
    {
      label: "toast.success",
      render: () => (
        <Button
          onClick={() => toast.success("Key renamed")}
          size="default"
          variant="outline"
        >
          Show toast
        </Button>
      ),
    },
    {
      label: "toast.info",
      render: () => (
        <Button
          onClick={() => toast.info("Key renamed")}
          size="default"
          variant="outline"
        >
          Show toast
        </Button>
      ),
    },
    {
      label: "toast.warning",
      render: () => (
        <Button
          onClick={() => toast.warning("Key renamed")}
          size="default"
          variant="outline"
        >
          Show toast
        </Button>
      ),
    },
    {
      label: "toast.error",
      render: () => (
        <Button
          onClick={() => toast.error("Key renamed")}
          size="default"
          variant="outline"
        >
          Show toast
        </Button>
      ),
    },
    {
      label: "toast.loading",
      render: () => (
        <Button
          onClick={() => toast.loading("Key renamed")}
          size="default"
          variant="outline"
        >
          Show toast
        </Button>
      ),
    },
    {
      label: "toast (plain) + description",
      render: () => (
        <Button
          onClick={() =>
            toast("Key renamed", { description: "prod-web is now prod-web-2." })
          }
          size="default"
          variant="outline"
        >
          Show toast
        </Button>
      ),
    },
  ],
};

const separator: CanvasGroup = {
  id: "separator",
  title: "Separator",
  files: ["separator.tsx"],
  columns: 2,
  examples: [
    {
      label: 'orientation="horizontal" (default)',
      render: () => <Separator orientation="horizontal" />,
    },
    {
      label: 'orientation="vertical"',
      render: () => (
        <div className="flex h-8 items-center gap-3">
          <span className="type-label-14 text-foreground">Keys</span>
          <Separator orientation="vertical" />
          <span className="type-label-14 text-foreground">Usage</span>
        </div>
      ),
    },
  ],
};

export const SURFACE_GROUPS: CanvasGroup[] = [
  card,
  kpiRail,
  kpiTile,
  compactKpi,
  deltaTag,
  compactSpark,
  heroNumeric,
  emptyState,
  callout,
  skeleton,
  toaster,
  separator,
];
