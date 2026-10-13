import { CircleCheck, KeyRound, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList, DetailRow } from "@/components/ui/detail-list";
import { Monogram } from "@/components/ui/monogram";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SettingsRow } from "@/components/ui/settings-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Switch } from "@/components/ui/switch";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Timestamp } from "@/components/ui/timestamp";
import { DEMO_NOW } from "@/lib/demo-clock";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import {
  KeysTableDemo,
  PaginationFooterAllDemo,
  PaginationFooterDemo,
} from "@/pages/component-canvas/demos";
import {
  SAMPLE_KEY,
  SAMPLE_PERSON,
} from "@/pages/component-canvas/sample-data";

/* Lists, tables, facts and status (design.md "Lists and tables", "Badges
 * and status"). Table examples read the real API key seed rows. */

const table: CanvasGroup = {
  id: "table",
  title: "Table",
  files: ["table.tsx"],
  columns: 2,
  examples: [
    {
      label: 'Table in Card density="flush"',
      render: () => <KeysTableDemo mode="basic" />,
    },
    {
      label: "SortableTableHead (text + numeric)",
      render: () => <KeysTableDemo mode="sortable" />,
    },
    {
      label: 'NavTableRow + data-state="selected"',
      render: () => <KeysTableDemo mode="navigable" />,
    },
    {
      label: "TableFooter + TableCaption",
      render: () => <KeysTableDemo mode="footer" />,
    },
    {
      label: "overflowing (min-w-[1000px], scroll fades)",
      render: () => <KeysTableDemo mode="overflow" />,
    },
  ],
};

const tablePaginationFooter: CanvasGroup = {
  id: "table-pagination-footer",
  title: "TablePaginationFooter",
  files: ["table-pagination-footer.tsx"],
  columns: 1,
  examples: [
    {
      label: "total={8} (one page: count line only)",
      render: () => <PaginationFooterDemo total={8} />,
    },
    {
      label: "total={120} page={1}",
      render: () => <PaginationFooterDemo total={120} />,
    },
    {
      label: "total={120} page={6} (both ellipses)",
      render: () => <PaginationFooterDemo initialPage={6} total={120} />,
    },
    {
      label: 'rowsPerPage="All"',
      render: () => <PaginationFooterAllDemo total={120} />,
    },
  ],
};

const pagination: CanvasGroup = {
  id: "pagination",
  title: "Pagination",
  files: ["pagination.tsx"],
  columns: 2,
  examples: [
    {
      label: "PaginationLink isActive + PaginationEllipsis",
      render: () => (
        <Pagination className="mx-0 w-fit">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="w-auto min-w-8 px-2">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="w-auto min-w-8 px-2" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="w-auto min-w-8 px-2">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="w-auto min-w-8 px-2">
                12
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ),
    },
    {
      label: "PaginationPrevious disabled",
      render: () => (
        <Pagination className="mx-0 w-fit">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious disabled />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="w-auto min-w-8 px-2" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ),
    },
  ],
};

const tableEmptyState: CanvasGroup = {
  id: "table-empty-state",
  title: "TableEmptyState",
  files: ["table-empty-state.tsx"],
  columns: 2,
  examples: [
    {
      label: "default icon",
      render: () => (
        <Card className="w-full" density="flush">
          <TableEmptyState
            body="Keys you create show up here."
            title="No API keys"
          />
        </Card>
      ),
    },
    {
      label: "icon + action + footnote",
      render: () => (
        <Card className="w-full" density="flush">
          <TableEmptyState
            action={
              <Button size="default" variant="default">
                <Plus aria-hidden data-icon="inline-start" strokeWidth={1.75} />
                Create key
              </Button>
            }
            body="Keys you create show up here."
            footnote="Revoked keys stay in the audit trail."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <KeyRound
                  aria-hidden
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
            }
            title="No API keys"
          />
        </Card>
      ),
    },
  ],
};

function keyFacts() {
  return [
    <DetailRow key="name" label="Name" value={SAMPLE_KEY.name} />,
    <DetailRow
      key="key"
      label="Key"
      value={<span className="type-mono-14">{SAMPLE_KEY.masked}</span>}
    />,
    <DetailRow
      key="created"
      label="Created"
      value={<Timestamp date={SAMPLE_KEY.createdAt} />}
    />,
  ];
}

const detailList: CanvasGroup = {
  id: "detail-list",
  title: "DetailList",
  files: ["detail-list.tsx"],
  columns: 2,
  examples: [
    {
      label: 'variant="boxed" (default)',
      render: () => (
        <DetailList className="w-full" variant="boxed">
          {keyFacts()}
        </DetailList>
      ),
    },
    {
      label: 'variant="flush"',
      render: () => (
        <DetailList className="w-full" variant="flush">
          {keyFacts()}
        </DetailList>
      ),
    },
  ],
};

const settingsRow: CanvasGroup = {
  id: "settings-row",
  title: "SettingsRow",
  files: ["settings-row.tsx"],
  columns: 2,
  examples: [
    {
      label: 'titleAs="label" (default) + first',
      render: () => (
        <div className="w-full">
          <SettingsRow
            control={<Switch defaultChecked id="canvas-settings-label" />}
            first
            id="canvas-settings-label"
            subtitle="Send an email when a budget hits 80%."
            title="Budget alerts"
          />
        </div>
      ),
    },
    {
      label: "not first (hairline above)",
      render: () => (
        <div className="w-full">
          <SettingsRow
            control={<Switch defaultChecked id="canvas-settings-rule" />}
            id="canvas-settings-rule"
            subtitle="Send an email when a budget hits 80%."
            title="Budget alerts"
          />
        </div>
      ),
    },
    {
      label: "static (titleAs span)",
      render: () => (
        <div className="w-full">
          <SettingsRow
            control={<Badge variant="neutral">Off</Badge>}
            first
            static
            subtitle="Send an email when a budget hits 80%."
            title="Budget alerts"
          />
        </div>
      ),
    },
    {
      label: 'titleAs="h4"',
      render: () => (
        <div className="w-full">
          <SettingsRow
            control={<Switch aria-label="Budget alerts" defaultChecked />}
            first
            subtitle="Send an email when a budget hits 80%."
            title="Budget alerts"
            titleAs="h4"
          />
        </div>
      ),
    },
    {
      label: "alignTop",
      render: () => (
        <div className="w-full">
          <SettingsRow
            alignTop
            control={<Switch defaultChecked id="canvas-settings-top" />}
            first
            id="canvas-settings-top"
            subtitle="Send an email when a budget hits 80%. Members with the admin role get a copy."
            title="Budget alerts"
          />
        </div>
      ),
    },
  ],
};

const timestamp: CanvasGroup = {
  id: "timestamp",
  title: "Timestamp",
  files: ["timestamp.tsx"],
  columns: 4,
  examples: [
    {
      label: 'format="timestamp" (default)',
      render: () => <Timestamp anchor={DEMO_NOW} date={SAMPLE_KEY.createdAt} />,
    },
    {
      label: 'format="dateNumeric"',
      render: () => (
        <Timestamp
          anchor={DEMO_NOW}
          date={SAMPLE_KEY.createdAt}
          format="dateNumeric"
        />
      ),
    },
    {
      label: 'format="relative"',
      render: () => (
        <Timestamp
          anchor={DEMO_NOW}
          date={SAMPLE_KEY.createdAt}
          format="relative"
        />
      ),
    },
    {
      label: "date={null}",
      render: () => <Timestamp date={null} />,
    },
  ],
};

const MONOGRAM_TONES = ["blue", "rose", "emerald", "amber", "ink"] as const;

const monogram: CanvasGroup = {
  id: "monogram",
  title: "Monogram",
  files: ["monogram.tsx"],
  columns: 4,
  examples: [
    ...MONOGRAM_TONES.map((tone) => ({
      label: `tone="${tone}"${tone === "blue" ? ' (size="md", default)' : ""}`,
      render: () => (
        <Monogram initials={SAMPLE_PERSON.initials} size="md" tone={tone} />
      ),
    })),
    {
      label: 'size="sm"',
      render: () => (
        <Monogram initials={SAMPLE_PERSON.initials} size="sm" tone="blue" />
      ),
    },

    {
      label: "beside its name",
      render: () => (
        <span className="flex items-center gap-2">
          <Monogram initials={SAMPLE_PERSON.initials} size="md" tone="blue" />
          <span className="type-label-14 text-foreground">
            {SAMPLE_PERSON.name}
          </span>
        </span>
      ),
    },
  ],
};

/** Every Badge `variant`, in the order badge.tsx declares them. */
const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
  "success",
  "warning",
  "info",
  "neutral",
  "enterprise",
  "pro",
] as const;

const badge: CanvasGroup = {
  id: "badge",
  title: "Badge",
  files: ["badge.tsx"],
  columns: 4,
  examples: [
    ...BADGE_VARIANTS.map((variant) => ({
      label: `variant="${variant}"`,
      render: () => <Badge variant={variant}>Active</Badge>,
    })),
    {
      label: 'size="xs"',
      render: () => (
        <Badge size="xs" variant="default">
          Active
        </Badge>
      ),
    },
    {
      label: "with a 12px icon (capability label)",
      render: () => (
        <Badge variant="default">
          <CircleCheck aria-hidden strokeWidth={1.75} />
          Active
        </Badge>
      ),
    },
  ],
};

const statusBadge: CanvasGroup = {
  id: "status-badge",
  title: "StatusBadge",
  files: ["status-badge.tsx"],
  columns: 4,
  examples: [
    { label: "on", render: () => <StatusBadge on /> },
    { label: "on={false}", render: () => <StatusBadge on={false} /> },
  ],
};

const STATUS_DOT_KINDS = [
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
] as const;

const statusDot: CanvasGroup = {
  id: "status-dot",
  title: "StatusDot",
  files: ["status-dot.tsx"],
  columns: 4,
  examples: STATUS_DOT_KINDS.map((kind) => ({
    label: `kind="${kind}"`,
    render: () => <StatusDot kind={kind} />,
  })),
};

export const DATA_GROUPS: CanvasGroup[] = [
  table,
  tablePaginationFooter,
  pagination,
  tableEmptyState,
  detailList,
  settingsRow,
  timestamp,
  monogram,
  badge,
  statusBadge,
  statusDot,
];
