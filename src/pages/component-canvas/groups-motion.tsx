import { Moon, Sun } from "lucide-react";
import type { ComponentType } from "react";
import { BellIcon } from "@/components/ui/bell";
import { Button } from "@/components/ui/button";
import { CalendarDaysIcon } from "@/components/ui/calendar-days";
import { CreditCardIcon } from "@/components/ui/credit-card";
import { Dotm3x3_11 } from "@/components/ui/dotm-3x3-11";
import { DownloadIcon } from "@/components/ui/download";
import { ExternalLinkIcon } from "@/components/ui/external-link";
import { IconCrossFade } from "@/components/ui/icon-cross-fade";
import { LogoutIcon } from "@/components/ui/logout";
import { ReceiptIcon } from "@/components/ui/receipt";
import { RefreshCWIcon } from "@/components/ui/refresh-cw";
import { SlidersHorizontalIcon } from "@/components/ui/sliders-horizontal";
import { SparklesIcon } from "@/components/ui/sparkles";
import { SquareArrowUpIcon } from "@/components/ui/square-arrow-up";
import { UploadIcon } from "@/components/ui/upload";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { Stateful } from "@/pages/component-canvas/demos";

/* Motion parts and the animated icon set (`motion/react`, the bell.tsx
 * pattern). Each icon animates on hover of its host button; the canvas adds
 * no motion of its own. Sizes: the 16 and 20px steps of design.md's icon
 * ladder, then the component's own 28px default. */

interface AnimatedIconProps {
  "aria-hidden"?: boolean;
  size?: number;
}

const ANIMATED_ICONS: {
  id: string;
  title: string;
  file: string;
  Icon: ComponentType<AnimatedIconProps>;
}[] = [
  { id: "bell-icon", title: "BellIcon", file: "bell.tsx", Icon: BellIcon },
  {
    id: "calendar-days-icon",
    title: "CalendarDaysIcon",
    file: "calendar-days.tsx",
    Icon: CalendarDaysIcon,
  },
  {
    id: "credit-card-icon",
    title: "CreditCardIcon",
    file: "credit-card.tsx",
    Icon: CreditCardIcon,
  },
  {
    id: "download-icon",
    title: "DownloadIcon",
    file: "download.tsx",
    Icon: DownloadIcon,
  },
  {
    id: "external-link-icon",
    title: "ExternalLinkIcon",
    file: "external-link.tsx",
    Icon: ExternalLinkIcon,
  },
  {
    id: "logout-icon",
    title: "LogoutIcon",
    file: "logout.tsx",
    Icon: LogoutIcon,
  },
  {
    id: "receipt-icon",
    title: "ReceiptIcon",
    file: "receipt.tsx",
    Icon: ReceiptIcon,
  },
  {
    id: "refresh-cw-icon",
    title: "RefreshCWIcon",
    file: "refresh-cw.tsx",
    Icon: RefreshCWIcon,
  },
  {
    id: "sliders-horizontal-icon",
    title: "SlidersHorizontalIcon",
    file: "sliders-horizontal.tsx",
    Icon: SlidersHorizontalIcon,
  },
  {
    id: "sparkles-icon",
    title: "SparklesIcon",
    file: "sparkles.tsx",
    Icon: SparklesIcon,
  },
  {
    id: "square-arrow-up-icon",
    title: "SquareArrowUpIcon",
    file: "square-arrow-up.tsx",
    Icon: SquareArrowUpIcon,
  },
  {
    id: "upload-icon",
    title: "UploadIcon",
    file: "upload.tsx",
    Icon: UploadIcon,
  },
];

const ICON_SIZES = [16, 20, 28] as const;

const animatedIconGroups: CanvasGroup[] = ANIMATED_ICONS.map(
  ({ id, title, file, Icon }) => ({
    id,
    title,
    files: [file],
    columns: 4,
    examples: [
      ...ICON_SIZES.map((size) => ({
        label: `size={${size}}${size === 28 ? " (default)" : ""}`,
        render: () => (
          <span className="text-foreground">
            <Icon aria-hidden size={size} />
          </span>
        ),
      })),
      {
        label: "in a ghost Button (hover animates)",
        render: () => (
          <Button aria-label={title} size="icon" variant="ghost">
            <Icon aria-hidden size={16} />
          </Button>
        ),
      },
    ],
  })
);

const iconCrossFade: CanvasGroup = {
  id: "icon-cross-fade",
  title: "IconCrossFade",
  files: ["icon-cross-fade.tsx"],
  columns: 4,
  examples: [
    {
      label: "active={false}",
      render: () => (
        <IconCrossFade
          active={false}
          first={<Sun aria-hidden strokeWidth={1.75} />}
          second={<Moon aria-hidden strokeWidth={1.75} />}
        />
      ),
    },
    {
      label: "active",
      render: () => (
        <IconCrossFade
          active
          first={<Sun aria-hidden strokeWidth={1.75} />}
          second={<Moon aria-hidden strokeWidth={1.75} />}
        />
      ),
    },
    {
      label: "toggle (click)",
      render: () => (
        <Stateful initial={false}>
          {(active, setActive) => (
            <Button
              aria-label="Toggle icon"
              aria-pressed={active}
              onClick={() => setActive(!active)}
              size="icon"
              variant="ghost"
            >
              <IconCrossFade
                active={active}
                first={<Sun aria-hidden strokeWidth={1.75} />}
                second={<Moon aria-hidden strokeWidth={1.75} />}
              />
            </Button>
          )}
        </Stateful>
      ),
    },
  ],
};

const dotMatrix: CanvasGroup = {
  id: "dotm-3x3-11",
  title: "Dotm3x3_11",
  files: ["dotm-3x3-11.tsx"],
  columns: 4,
  examples: [
    {
      label: "default (animated)",
      render: () => (
        <span className="text-foreground">
          <Dotm3x3_11 />
        </span>
      ),
    },
    {
      label: "animated={false}",
      render: () => (
        <span className="text-foreground">
          <Dotm3x3_11 animated={false} />
        </span>
      ),
    },
    {
      label: "hoverAnimated (animated={false})",
      render: () => (
        <span className="text-foreground">
          <Dotm3x3_11 animated={false} hoverAnimated />
        </span>
      ),
    },
    {
      label: 'dotShape="square"',
      render: () => (
        <span className="text-foreground">
          <Dotm3x3_11 dotShape="square" />
        </span>
      ),
    },
    {
      label: "cellPadding={2} dotSize={4} (thinking row)",
      render: () => (
        <span className="text-muted-foreground">
          <Dotm3x3_11 cellPadding={2} dotSize={4} />
        </span>
      ),
    },
  ],
};

export const MOTION_GROUPS: CanvasGroup[] = [
  iconCrossFade,
  dotMatrix,
  ...animatedIconGroups,
];
