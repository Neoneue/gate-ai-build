import { ArrowRight, Loader2, Plus, XIcon } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { FeedbackFab } from "@/components/ui/feedback-fab";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { RowActionButton } from "@/components/ui/row-action-button";
import { TextLink } from "@/components/ui/text-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { SAMPLE_KEY } from "@/pages/component-canvas/sample-data";

/* Actions: buttons and small action controls. Style comparisons change
 * `variant` only; size, shape and state comparisons use `variant="default"`
 * and the same "Continue" label (skill "Variants"). */

/** Every Button `variant`, in the order button.tsx declares them. Typed
 *  against the exported `ButtonVariant`, so a new variant fails tsc here
 *  until the canvas shows it. */
export const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "ghost-to-outline",
  "destructive",
  "link",
  "raised",
  "promo",
  "info-outline",
  "lift",
  "lift-pro",
  "lift-enterprise",
  "lift-ghost",
] as const;

const BUTTON_TEXT_SIZES = ["xs", "sm", "default", "touch"] as const;
const BUTTON_ICON_SIZES = [
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-action",
] as const;

const button: CanvasGroup = {
  id: "button",
  title: "Button",
  files: ["button.tsx"],
  columns: 4,
  examples: [
    ...BUTTON_VARIANTS.map((variant) => ({
      label: `variant="${variant}"`,
      render: () => (
        <Button size="default" variant={variant}>
          Continue
        </Button>
      ),
    })),
    ...BUTTON_TEXT_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => (
        <Button size={size} variant="default">
          Continue
        </Button>
      ),
    })),
    ...BUTTON_ICON_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => (
        <Button aria-label="Continue" size={size} variant="default">
          <Plus aria-hidden strokeWidth={1.75} />
        </Button>
      ),
    })),
    {
      label: 'shape="pill"',
      render: () => (
        <Button shape="pill" size="default" variant="default">
          Continue
        </Button>
      ),
    },
    {
      label: 'shape="circle"',
      render: () => (
        <Button
          aria-label="Continue"
          shape="circle"
          size="icon"
          variant="default"
        >
          <Plus aria-hidden strokeWidth={1.75} />
        </Button>
      ),
    },
    {
      label: 'data-icon="inline-start"',
      render: () => (
        <Button size="default" variant="default">
          <Plus aria-hidden data-icon="inline-start" strokeWidth={1.75} />
          Continue
        </Button>
      ),
    },
    {
      label: 'data-icon="inline-end"',
      render: () => (
        <Button size="default" variant="default">
          Continue
          <ArrowRight aria-hidden data-icon="inline-end" strokeWidth={1.75} />
        </Button>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <Button disabled size="default" variant="default">
          Continue
        </Button>
      ),
    },
    {
      label: "pending",
      render: () => (
        <Button disabled size="default" variant="default">
          <Loader2
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
            data-icon="inline-start"
            strokeWidth={1.75}
          />
          Continue
        </Button>
      ),
    },
  ],
};

const iconActionButton: CanvasGroup = {
  id: "icon-action-button",
  title: "IconActionButton",
  files: ["icon-action-button.tsx"],
  columns: 4,
  examples: [
    {
      label: "default",
      render: () => (
        <IconActionButton aria-label="Clear">
          <XIcon aria-hidden className="size-3" strokeWidth={1.75} />
        </IconActionButton>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <IconActionButton aria-label="Clear" disabled>
          <XIcon aria-hidden className="size-3" strokeWidth={1.75} />
        </IconActionButton>
      ),
    },
  ],
};

const copyButton: CanvasGroup = {
  id: "copy-button",
  title: "CopyButton",
  files: ["copy-button.tsx"],
  columns: 4,
  examples: [
    {
      label: 'mode="icon" size="icon-sm"',
      render: () => (
        <CopyButton
          label="key id"
          mode="icon"
          size="icon-sm"
          value="sk-gw-c4ae"
        />
      ),
    },
    {
      label: 'mode="icon" size="icon-action"',
      render: () => (
        <CopyButton
          label="key id"
          mode="icon"
          size="icon-action"
          value="sk-gw-c4ae"
        />
      ),
    },
    {
      label: 'mode="icon" size="inline-xs"',
      render: () => (
        <CopyButton
          label="key id"
          mode="icon"
          size="inline-xs"
          value="sk-gw-c4ae"
        />
      ),
    },
    {
      label: 'mode="label" size="compact"',
      render: () => (
        <CopyButton
          label="key id"
          mode="label"
          size="compact"
          value="sk-gw-c4ae"
        />
      ),
    },
    {
      label: 'mode="label" size="sm"',
      render: () => (
        <CopyButton label="key id" mode="label" size="sm" value="sk-gw-c4ae" />
      ),
    },
    {
      label: 'mode="label" size="segment" (ApiKeys.tsx:699 well)',
      render: () => (
        <div className="flex w-full items-stretch overflow-hidden rounded-md border border-border bg-muted">
          <div className="type-mono-14 flex-1 break-all px-3 py-2 text-foreground">
            {SAMPLE_KEY.id}
          </div>
          <CopyButton
            label="API key"
            mode="label"
            size="segment"
            value={SAMPLE_KEY.id}
          />
        </div>
      ),
    },
    {
      label: 'mode="label" text="Copy key"',
      render: () => (
        <CopyButton
          label="key id"
          mode="label"
          size="sm"
          text="Copy key"
          value="sk-gw-c4ae"
        />
      ),
    },
  ],
};

const textLink: CanvasGroup = {
  id: "text-link",
  title: "TextLink",
  files: ["text-link.tsx"],
  columns: 4,
  examples: [
    {
      label: 'as="button" (default)',
      render: () => <TextLink>View details</TextLink>,
    },
    {
      label: 'as="a" href="#canvas-group-button"',
      render: () => (
        <TextLink as="a" href="#canvas-group-button">
          View details
        </TextLink>
      ),
    },
    {
      label: 'to="/settings" (MemoryRouter)',
      render: () => <TextLink to="/settings">View details</TextLink>,
    },
    {
      label: "disabled",
      render: () => <TextLink disabled>View details</TextLink>,
    },
    {
      label: "inside a sentence",
      render: () => (
        <p className="type-copy-14 m-0 text-muted-foreground">
          Keys rotate every 90 days. <TextLink>View details</TextLink>
        </p>
      ),
    },
  ],
};

const backLink: CanvasGroup = {
  id: "back-link",
  title: "BackLink",
  files: ["back-link.tsx"],
  columns: 4,
  examples: [
    {
      label: "button (no href)",
      render: () => <BackLink label="API keys" />,
    },
    {
      label: 'href="/api-keys" (MemoryRouter)',
      render: () => <BackLink href="/api-keys" label="API keys" />,
    },
  ],
};

const rowActionButton: CanvasGroup = {
  id: "row-action-button",
  title: "RowActionButton",
  files: ["row-action-button.tsx"],
  columns: 4,
  examples: [
    {
      label: 'layout="row"',
      render: () => (
        <RowActionButton aria-label={`Open ${SAMPLE_KEY.name}`} layout="row">
          <span className="type-label-14 text-foreground">
            {SAMPLE_KEY.name}
          </span>
          <span className="type-mono-12 text-muted-foreground">
            {SAMPLE_KEY.masked}
          </span>
        </RowActionButton>
      ),
    },
    {
      label: 'layout="stack"',
      render: () => (
        <RowActionButton aria-label={`Open ${SAMPLE_KEY.name}`} layout="stack">
          <span className="type-label-14 text-foreground">
            {SAMPLE_KEY.name}
          </span>
          <span className="type-mono-12 text-muted-foreground">
            {SAMPLE_KEY.masked}
          </span>
        </RowActionButton>
      ),
    },
    {
      label: 'layout="inline"',
      render: () => (
        <RowActionButton aria-label={`Open ${SAMPLE_KEY.name}`} layout="inline">
          <span className="type-label-14 text-foreground">
            {SAMPLE_KEY.name}
          </span>
        </RowActionButton>
      ),
    },
    {
      label: 'href="/api-keys" (MemoryRouter)',
      render: () => (
        <RowActionButton
          aria-label={`Open ${SAMPLE_KEY.name}`}
          href="/api-keys"
          layout="row"
        >
          <span className="type-label-14 text-foreground">
            {SAMPLE_KEY.name}
          </span>
        </RowActionButton>
      ),
    },
  ],
};

const themeToggle: CanvasGroup = {
  id: "theme-toggle",
  title: "ThemeToggle",
  files: ["theme-toggle.tsx"],
  columns: 4,
  examples: [
    {
      label: "default (toggles the canvas theme)",
      render: () => <ThemeToggle />,
    },
  ],
};

const feedbackFab: CanvasGroup = {
  id: "feedback-fab",
  title: "FeedbackFab",
  files: ["feedback-fab.tsx"],
  columns: 2,
  examples: [
    {
      label: "askAiOpen={false}",
      render: () => (
        // `transform-gpu` makes this box the containing block for the FAB's
        // `position: fixed`, so it sits in the slot instead of the window.
        <div className="relative h-24 w-full transform-gpu">
          <FeedbackFab />
        </div>
      ),
    },
    {
      label: "askAiOpen (lg: shifts left of the 368px panel)",
      render: () => (
        <div className="relative h-24 w-full transform-gpu">
          <FeedbackFab askAiOpen />
        </div>
      ),
    },
  ],
};

export const ACTION_GROUPS: CanvasGroup[] = [
  button,
  iconActionButton,
  copyButton,
  textLink,
  backLink,
  rowActionButton,
  themeToggle,
  feedbackFab,
];
