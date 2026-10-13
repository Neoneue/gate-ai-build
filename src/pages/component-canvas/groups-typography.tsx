import { Eyebrow } from "@/components/ui/eyebrow";
import { InlineCode } from "@/components/ui/inline-code";
import { PageTitle } from "@/components/ui/page-title";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionTitle } from "@/components/ui/section-title";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";

/* Type primitives (design.md "Type primitives"). The heading tag examples
 * hold the text constant and change only `as`. */

const pageTitle: CanvasGroup = {
  id: "page-title",
  title: "PageTitle",
  files: ["page-title.tsx"],
  columns: 2,
  examples: [
    {
      label: 'as="h1" (default)',
      render: () => <PageTitle>API keys</PageTitle>,
    },
    {
      label: 'as="h2"',
      render: () => <PageTitle as="h2">API keys</PageTitle>,
    },
  ],
};

const sectionTitle: CanvasGroup = {
  id: "section-title",
  title: "SectionTitle",
  files: ["section-title.tsx"],
  columns: 2,
  examples: [
    {
      label: 'as="h3" (default)',
      render: () => <SectionTitle>Usage limits</SectionTitle>,
    },
    {
      label: 'as="h2"',
      render: () => <SectionTitle as="h2">Usage limits</SectionTitle>,
    },
  ],
};

const sectionHeading: CanvasGroup = {
  id: "section-heading",
  title: "SectionHeading",
  files: ["section-heading.tsx"],
  columns: 2,
  examples: [
    {
      label: 'as="h3" (default)',
      render: () => <SectionHeading>Request details</SectionHeading>,
    },
    {
      label: 'as="h4"',
      render: () => <SectionHeading as="h4">Request details</SectionHeading>,
    },
  ],
};

const eyebrow: CanvasGroup = {
  id: "eyebrow",
  title: "Eyebrow",
  files: ["eyebrow.tsx"],
  columns: 3,
  examples: [
    { label: 'as="span" (default)', render: () => <Eyebrow>Requests</Eyebrow> },
    { label: 'as="div"', render: () => <Eyebrow as="div">Requests</Eyebrow> },
    {
      label: 'as="label"',
      render: () => <Eyebrow as="label">Requests</Eyebrow>,
    },
  ],
};

const inlineCode: CanvasGroup = {
  id: "inline-code",
  title: "InlineCode",
  files: ["inline-code.tsx"],
  columns: 3,
  examples: [
    {
      label: 'size="default"',
      render: () => <InlineCode>GATE_API_KEY</InlineCode>,
    },
    {
      label: 'size="sm"',
      render: () => <InlineCode size="sm">GATE_API_KEY</InlineCode>,
    },
    {
      label: "inside a sentence",
      render: () => (
        <p className="type-copy-14 m-0 text-muted-foreground">
          Set <InlineCode>GATE_API_KEY</InlineCode> in each client.
        </p>
      ),
    },
  ],
};

export const TYPOGRAPHY_GROUPS: CanvasGroup[] = [
  pageTitle,
  sectionTitle,
  sectionHeading,
  eyebrow,
  inlineCode,
];
