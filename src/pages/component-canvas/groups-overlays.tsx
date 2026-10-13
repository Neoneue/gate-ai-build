import {
  ChevronsUpDown,
  KeyRound,
  LogOut,
  Settings,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogStaticContent,
  DialogTitle,
  DialogTitleBlock,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { NotificationsMenu } from "@/components/ui/notifications-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/ui/user-menu";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { AtPath } from "@/pages/component-canvas/demos";
import { SAMPLE_KEY } from "@/pages/component-canvas/sample-data";

/* Overlays (design.md "Overlays and menus", "Dialogs and sheets"). Every
 * portal example opens from the same outline "Open" trigger, one at a time
 * (skill: never force several modals open at once). Popups stay in their
 * native portal roots at screen size; the library positions them. */

function openTrigger() {
  return <Button size="default" variant="outline" />;
}

function dialogBody() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Rename key</DialogTitle>
        <DialogDescription>
          The new name shows in logs and on invoices.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button size="default" variant="outline" />}>
          Cancel
        </DialogClose>
        <DialogClose render={<Button size="default" variant="default" />}>
          Rename key
        </DialogClose>
      </DialogFooter>
    </>
  );
}

const dialog: CanvasGroup = {
  id: "dialog",
  title: "Dialog",
  files: ["dialog.tsx"],
  columns: 3,
  examples: [
    {
      label: 'density="default"',
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogContent density="default">{dialogBody()}</DialogContent>
        </Dialog>
      ),
    },
    {
      label: 'density="compact"',
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogContent density="compact">{dialogBody()}</DialogContent>
        </Dialog>
      ),
    },
    {
      label: "showCloseButton={false}",
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>{dialogBody()}</DialogContent>
        </Dialog>
      ),
    },
    {
      label: "DialogFooter showCloseButton",
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename key</DialogTitle>
              <DialogDescription>
                The new name shows in logs and on invoices.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      ),
    },
    {
      label: "nestedBackdrop",
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogContent nestedBackdrop>{dialogBody()}</DialogContent>
        </Dialog>
      ),
    },
    {
      label: "DialogScrollContent (header, summary, body, footer)",
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogScrollContent className="sm:max-w-lg">
            <DialogScrollHeader>
              <DialogTitleBlock
                badge={<Badge variant="success">Active</Badge>}
                meta="Created Apr 28, 2026"
              >
                {SAMPLE_KEY.name}
              </DialogTitleBlock>
            </DialogScrollHeader>
            <DialogScrollSummary>
              <p className="type-copy-14 m-0 text-muted-foreground">
                Scroll the body; the header and footer stay put.
              </p>
            </DialogScrollSummary>
            <DialogScrollBody>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 24 }, (_, index) => (
                  <p className="type-copy-14 m-0" key={index}>
                    Request {index + 1} routed through {SAMPLE_KEY.name}.
                  </p>
                ))}
              </div>
            </DialogScrollBody>
            <DialogScrollFooter>
              <DialogClose render={<Button size="default" variant="outline" />}>
                Close
              </DialogClose>
            </DialogScrollFooter>
          </DialogScrollContent>
        </Dialog>
      ),
    },
    {
      label: 'DialogTitleBlock icon + titleFont="mono"',
      render: () => (
        <Dialog>
          <DialogTrigger render={openTrigger()}>Open</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogTitleBlock
              icon={
                <KeyRound aria-hidden className="size-5" strokeWidth={1.75} />
              }
              meta="Created Apr 28, 2026"
              titleFont="mono"
            >
              {SAMPLE_KEY.id}
            </DialogTitleBlock>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      label: 'DialogStaticContent + DialogTitleBlock mode="static" (in flow)',
      render: () => (
        <DialogStaticContent className="w-full p-6" onClose={() => undefined}>
          <DialogTitleBlock
            badge={<Badge variant="success">Active</Badge>}
            meta="Created Apr 28, 2026"
            mode="static"
          >
            {SAMPLE_KEY.name}
          </DialogTitleBlock>
        </DialogStaticContent>
      ),
    },
  ],
};

function alertDialogBody({ media = false }: { media?: boolean } = {}) {
  return (
    <>
      <AlertDialogHeader>
        {media ? (
          <AlertDialogMedia>
            <Trash2 aria-hidden strokeWidth={1.75} />
          </AlertDialogMedia>
        ) : null}
        <AlertDialogTitle>Revoke {SAMPLE_KEY.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          Requests using this key fail right away.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction variant="destructive">Revoke key</AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

const alertDialog: CanvasGroup = {
  id: "alert-dialog",
  title: "AlertDialog",
  files: ["alert-dialog.tsx"],
  columns: 3,
  examples: [
    {
      label: 'size="default"',
      render: () => (
        <AlertDialog>
          <AlertDialogTrigger render={openTrigger()}>Open</AlertDialogTrigger>
          <AlertDialogContent size="default">
            {alertDialogBody()}
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      label: 'size="sm"',
      render: () => (
        <AlertDialog>
          <AlertDialogTrigger render={openTrigger()}>Open</AlertDialogTrigger>
          <AlertDialogContent size="sm">{alertDialogBody()}</AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      label: "AlertDialogMedia",
      render: () => (
        <AlertDialog>
          <AlertDialogTrigger render={openTrigger()}>Open</AlertDialogTrigger>
          <AlertDialogContent size="default">
            {alertDialogBody({ media: true })}
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ],
};

const SHEET_SIDES = ["right", "left", "top", "bottom"] as const;

function sheetBody() {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{SAMPLE_KEY.name}</SheetTitle>
        <SheetDescription>
          Key details while the page stays in view.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1" />
      <SheetFooter>
        <SheetClose render={<Button size="default" variant="outline" />}>
          Close
        </SheetClose>
      </SheetFooter>
    </>
  );
}

const sheet: CanvasGroup = {
  id: "sheet",
  title: "Sheet",
  files: ["sheet.tsx"],
  columns: 3,
  examples: [
    ...SHEET_SIDES.map((side) => ({
      label: `side="${side}"`,
      render: () => (
        <Sheet>
          <SheetTrigger render={openTrigger()}>Open</SheetTrigger>
          <SheetContent side={side}>{sheetBody()}</SheetContent>
        </Sheet>
      ),
    })),
    {
      label: "showCloseButton={false}",
      render: () => (
        <Sheet>
          <SheetTrigger render={openTrigger()}>Open</SheetTrigger>
          <SheetContent showCloseButton={false} side="right">
            {sheetBody()}
          </SheetContent>
        </Sheet>
      ),
    },
    {
      label: "SheetFooter showCloseButton",
      render: () => (
        <Sheet>
          <SheetTrigger render={openTrigger()}>Open</SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{SAMPLE_KEY.name}</SheetTitle>
              <SheetDescription>
                Key details while the page stays in view.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1" />
            <SheetFooter showCloseButton />
          </SheetContent>
        </Sheet>
      ),
    },
  ],
};

const POPOVER_ALIGNS = ["start", "center", "end"] as const;

function popoverBody() {
  return (
    <div className="flex w-64 flex-col gap-1 p-4">
      <p className="type-label-14 m-0 text-foreground">{SAMPLE_KEY.name}</p>
      <p className="type-copy-14 m-0 text-muted-foreground">
        Last used 2 hours ago.
      </p>
    </div>
  );
}

const popover: CanvasGroup = {
  id: "popover",
  title: "Popover",
  files: ["popover.tsx"],
  columns: 3,
  examples: [
    ...POPOVER_ALIGNS.map((align) => ({
      label: `align="${align}"${align === "end" ? " (default)" : ""}`,
      render: () => (
        <Popover>
          <PopoverTrigger render={openTrigger()}>Open</PopoverTrigger>
          <PopoverContent align={align}>{popoverBody()}</PopoverContent>
        </Popover>
      ),
    })),
    {
      label: 'side="top"',
      render: () => (
        <Popover>
          <PopoverTrigger render={openTrigger()}>Open</PopoverTrigger>
          <PopoverContent side="top">{popoverBody()}</PopoverContent>
        </Popover>
      ),
    },
    {
      label: "backdropClassName",
      render: () => (
        <Popover>
          <PopoverTrigger render={openTrigger()}>Open</PopoverTrigger>
          <PopoverContent backdropClassName="bg-overlay">
            {popoverBody()}
          </PopoverContent>
        </Popover>
      ),
    },
  ],
};

const TOOLTIP_SIDES = ["top", "right", "bottom", "left"] as const;

const tooltip: CanvasGroup = {
  id: "tooltip",
  title: "Tooltip",
  files: ["tooltip.tsx"],
  columns: 4,
  examples: TOOLTIP_SIDES.map((side) => ({
    label: `side="${side}"${side === "top" ? " (default)" : ""}`,
    render: () => (
      <Tooltip>
        <TooltipTrigger render={openTrigger()}>Hover</TooltipTrigger>
        <TooltipContent side={side}>Last used 2 hours ago</TooltipContent>
      </Tooltip>
    ),
  })),
};

function menuBody() {
  return (
    <>
      <MenuLabel>
        <span className="type-label-14 text-foreground">{SAMPLE_KEY.name}</span>
        <span className="type-copy-12 text-muted-foreground">
          {SAMPLE_KEY.masked}
        </span>
      </MenuLabel>
      <MenuSeparator />
      <MenuItem active>
        <KeyRound aria-hidden strokeWidth={1.75} />
        Current key
      </MenuItem>
      <MenuItem>
        <Settings aria-hidden strokeWidth={1.75} />
        Rename
      </MenuItem>
      <MenuItem disabled>
        <UserRound aria-hidden strokeWidth={1.75} />
        Transfer
      </MenuItem>
      <MenuSeparator />
      <MenuItem variant="destructive">
        <LogOut aria-hidden strokeWidth={1.75} />
        Revoke
      </MenuItem>
    </>
  );
}

const MENU_ALIGNS = ["start", "end"] as const;

const menu: CanvasGroup = {
  id: "menu",
  title: "Menu",
  files: ["menu.tsx"],
  columns: 3,
  examples: [
    ...MENU_ALIGNS.map((align) => ({
      label: `MenuContent align="${align}"${align === "end" ? " (default)" : ""}`,
      render: () => (
        <Menu>
          <MenuTrigger render={openTrigger()}>
            Open
            <ChevronsUpDown
              aria-hidden
              className="text-muted-foreground"
              data-icon="inline-end"
              strokeWidth={1.75}
            />
          </MenuTrigger>
          <MenuContent align={align}>{menuBody()}</MenuContent>
        </Menu>
      ),
    })),
    {
      label: 'MenuContent side="top"',
      render: () => (
        <Menu>
          <MenuTrigger render={openTrigger()}>
            Open
            <ChevronsUpDown
              aria-hidden
              className="text-muted-foreground"
              data-icon="inline-end"
              strokeWidth={1.75}
            />
          </MenuTrigger>
          <MenuContent side="top">{menuBody()}</MenuContent>
        </Menu>
      ),
    },
  ],
};

const userMenu: CanvasGroup = {
  id: "user-menu",
  title: "UserMenu",
  files: ["user-menu.tsx"],
  columns: 3,
  examples: [
    {
      label: 'side="bottom" align="end" (default)',
      render: () => (
        <UserMenu onNavigate={() => undefined}>
          <Button size="default" variant="outline">
            Open
          </Button>
        </UserMenu>
      ),
    },
    {
      label: 'side="right" align="end" (sidebar)',
      render: () => (
        <UserMenu align="end" onNavigate={() => undefined} side="right">
          <Button size="default" variant="outline">
            Open
          </Button>
        </UserMenu>
      ),
    },
  ],
};

const WORKSPACE_TIERS = [
  { label: "Pro", path: "/overview" },
  { label: "Enterprise", path: "/overview-enterprise" },
  { label: "Free", path: "/overview-free" },
  { label: "Default", path: "/overview-default" },
  { label: "Onboarding", path: "/overview-onboarding" },
] as const;

const workspaceSwitcher: CanvasGroup = {
  id: "workspace-switcher",
  title: "WorkspaceSwitcher",
  files: ["workspace-switcher.tsx"],
  columns: 3,
  examples: [
    ...WORKSPACE_TIERS.map((tier) => ({
      label: `at ${tier.path} (${tier.label})`,
      render: () => (
        <AtPath path={tier.path}>
          <WorkspaceSwitcher />
        </AtPath>
      ),
    })),
    {
      label: "compactBadge (at /overview-enterprise)",
      render: () => (
        <AtPath path="/overview-enterprise">
          <WorkspaceSwitcher compactBadge />
        </AtPath>
      ),
    },
  ],
};

const notificationsMenu: CanvasGroup = {
  id: "notifications-menu",
  title: "NotificationsMenu",
  files: ["notifications-menu.tsx", "notifications-menu-body.tsx"],
  columns: 3,
  examples: [
    {
      label: 'triggerVariant="ghost-to-outline" (default)',
      render: () => <NotificationsMenu triggerVariant="ghost-to-outline" />,
    },
    {
      label: 'triggerVariant="ghost"',
      render: () => <NotificationsMenu triggerVariant="ghost" />,
    },
    {
      label: 'align="start"',
      render: () => <NotificationsMenu align="start" />,
    },
  ],
};

export const OVERLAY_GROUPS: CanvasGroup[] = [
  dialog,
  alertDialog,
  sheet,
  popover,
  tooltip,
  menu,
  userMenu,
  workspaceSwitcher,
  notificationsMenu,
];
