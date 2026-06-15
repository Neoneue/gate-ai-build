import { Bell, Settings } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";

/* ─────────────────────────────────────────────────────────────────────────
 * NotificationsMenu — top-bar bell dropdown. Follows the user-menu pattern:
 * takes the bell <Button> as `children` and wraps it as the PopoverTrigger
 * via the `render` prop. Built on our Popover, so it inherits the standard
 * dropdown enter/exit animation + the `data-closed:fill-mode-forwards`
 * flicker fix automatically (no hand-rolled animation).
 *
 * There is no notification data on this product yet (project rule: no
 * synthetic data), so BOTH tabs render an empty state only. The
 * "Mark all as read" / "Clear all" actions are intentionally inert until a
 * real notification entity exists.
 * ───────────────────────────────────────────────────────────────────────── */

type NotificationsMenuProps = {
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

const TAB_OPTIONS = [
  { value: "unread", label: "Unread" },
  { value: "all", label: "All" },
];

function NotificationsMenu({
  children,
  side = "bottom",
  align = "end",
  sideOffset = 8,
}: NotificationsMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unread" | "all">("unread");

  const isUnread = tab === "unread";
  const actionLabel = isUnread ? "Mark all as read" : "Clear all";
  const emptyLabel = isUnread ? "No unread notifications" : "All caught up!";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={children} />
      <PopoverContent
        align={align}
        aria-label="Notifications"
        className="w-80 p-0"
        side={side}
        sideOffset={sideOffset}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 py-2 pr-2 pl-4">
          <h2 className="m-0 font-medium font-sans text-neutral-900 text-sm">
            Notifications
          </h2>
          <Button
            aria-label="Notification settings"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
            size="icon-sm"
            variant="ghost"
          >
            <Settings
              aria-hidden
              className="text-neutral-700"
              strokeWidth={1.75}
            />
          </Button>
        </div>

        {/* Toolbar strip */}
        <div className="flex items-center justify-between gap-2 border-border border-y bg-muted py-2 pr-2 pl-4">
          <Segmented
            aria-label="Filter notifications"
            onChange={(value) => setTab(value as "unread" | "all")}
            options={TAB_OPTIONS}
            size="sm"
            value={tab}
          />
          <Button
            className="text-neutral-700"
            size="sm"
            type="button"
            variant="ghost"
          >
            {actionLabel}
          </Button>
        </div>

        {/* Body / empty state */}
        <div className="flex flex-col items-center gap-4 px-6 py-12">
          <div
            aria-hidden
            className="flex size-12 items-center justify-center rounded-full bg-muted"
          >
            <Bell className="size-5 text-neutral-700" strokeWidth={1.75} />
          </div>
          <p className="m-0 text-neutral-500 text-sm">{emptyLabel}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationsMenu };
