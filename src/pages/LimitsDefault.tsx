import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Check,
  Coins,
  EyeOff,
  KeyRound,
  MousePointer2,
  Plus,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/ui/page-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { cn } from "@/lib/utils";
import type { PlanFeature } from "@/pages/plan-comparison-dialog";
import { HeroCard } from "@/pages/SecurityDefault";

const EASE_OUT = "power3.out";
const FOCUS_RING = "border-ring ring-[3px] ring-ring/50";

// Local option sets mirroring the real Create Limit dialog (Limits.tsx).
const TYPE_OPTS = [
  { v: "spend", l: "Spend ($)" },
  { v: "tokens", l: "Tokens" },
  { v: "requests", l: "Requests" },
];
const PERIOD_OPTS = [
  { v: "1h", l: "1 hour" },
  { v: "1d", l: "1 day" },
  { v: "1w", l: "1 week" },
  { v: "1mo", l: "1 month" },
];
const SCOPE_OPTS = [
  { v: "org", l: "Org-wide (all keys)" },
  { v: "project", l: "Project" },
  { v: "key", l: "Key" },
];

type LimitRow = {
  name: string;
  type: string;
  threshold: string;
  period: string;
  scope: string;
};
const ROW1: LimitRow = {
  name: "Test limit",
  type: "Spend ($)",
  threshold: "$500",
  period: "1 day",
  scope: "Org-wide (all keys)",
};
const ROW2: LimitRow = {
  name: "Test limit 2",
  type: "Tokens",
  threshold: "1,000,000",
  period: "1 day",
  scope: "Org-wide (all keys)",
};
const ROW3: LimitRow = {
  name: "Test limit 3",
  type: "Requests",
  threshold: "10,000",
  period: "1 day",
  scope: "Org-wide (all keys)",
};

// Animated preview for the Limits upsell hero's right panel — the whole
// create-a-limit experience minified into the window. Sequence:
//  1. empty-state card fades + scales in from center
//  2. cursor fades in bottom-right
//  3. cursor → CTA, hover, press-click
//  4. the real Create-limit dialog card spawns over the (blurred) card
//  5. cursor → Name, click, types "Test limit"
//  6. cursor → Amount, click, types "500"
//  7. cursor → Create, hover, press-click
// Everything is display-only (pointer-events-none); a fake cursor can't fire
// CSS :hover/:focus, so those states are driven by React state, and motion is
// driven by a single GSAP timeline. Positions are measured once at natural
// layout so the card's entry scale doesn't skew the cursor's destinations.
function LimitsPreview() {
  const scope = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);
  const pingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableCtaRef = useRef<HTMLDivElement>(null);
  const typeTriggerRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const tokensOptRef = useRef<HTMLDivElement>(null);
  const requestsOptRef = useRef<HTMLDivElement>(null);

  const [ctaHover, setCtaHover] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [amountVal, setAmountVal] = useState("");
  const [nameFocus, setNameFocus] = useState(false);
  const [amountFocus, setAmountFocus] = useState(false);
  const [createHover, setCreateHover] = useState(false);
  const [rows, setRows] = useState<LimitRow[]>([]);
  const [tableCtaHover, setTableCtaHover] = useState(false);
  const [typeVal, setTypeVal] = useState("spend");
  const [hoveredOpt, setHoveredOpt] = useState<string | null>(null);

  useGSAP(
    () => {
      const card = cardRef.current;
      const cursor = cursorRef.current;
      const icon = iconRef.current;
      const ping = pingRef.current;
      const cta = ctaRef.current;
      const dialog = dialogRef.current;
      const nameEl = nameRef.current;
      const amountEl = amountRef.current;
      const createEl = createRef.current;
      const table = tableRef.current;
      const tableCta = tableCtaRef.current;
      const typeTrigger = typeTriggerRef.current;
      const typeMenu = typeMenuRef.current;
      const tokensOpt = tokensOptRef.current;
      const requestsOpt = requestsOptRef.current;
      if (
        !(
          card &&
          cursor &&
          icon &&
          ping &&
          cta &&
          dialog &&
          nameEl &&
          amountEl &&
          createEl &&
          table &&
          tableCta &&
          typeTrigger &&
          typeMenu &&
          tokensOpt &&
          requestsOpt
        )
      ) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // Reduced motion → land on the end state: the table with both limits.
        gsap.set([card, dialog, cursor, ping], { opacity: 0 });
        gsap.set(table, { opacity: 1 });
        setRows([ROW1, ROW2, ROW3]);
        setTypeVal("requests");
        return;
      }

      // Measure every target at natural layout (scale 1) before any gsap.set so
      // cursor destinations are accurate. Deltas are absolute translations from
      // the cursor's origin. The table is top-anchored so adding rows doesn't
      // shift the header CTA we measured here.
      const origin = cursor.getBoundingClientRect();
      const target = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - origin.left,
          y: r.top + r.height / 2 - origin.top,
        };
      };
      const ctaT = target(cta);
      const nameT = target(nameEl);
      const amountT = target(amountEl);
      const createT = target(createEl);
      const tableCtaT = target(tableCta);
      const typeT = target(typeTrigger);
      const tokensT = target(tokensOpt);
      const requestsT = target(requestsOpt);

      // Radial click pulse from the pointer tip. Independent of the icon press
      // scale (ping is a sibling of the icon), so it reads as a clean ring.
      const firePing = () =>
        gsap.fromTo(
          ping,
          { scale: 0.3, opacity: 0.6 },
          {
            scale: 1.6,
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
            transformOrigin: "50% 50%",
          }
        );
      // Cursor-only press — clicking into inputs/options (no element scale).
      const clickInput = (tl: gsap.core.Timeline) => {
        tl.to(
          icon,
          { scale: 0.85, duration: 0.09, ease: "power2.out" },
          "+=0.1"
        )
          .add(firePing, "<")
          .to(icon, { scale: 1, duration: 0.18 });
      };
      // Button press — cursor blip + the element scales down, like a real press.
      const clickButton = (tl: gsap.core.Timeline, el: Element) => {
        tl.to(
          icon,
          { scale: 0.85, duration: 0.09, ease: "power2.out" },
          "+=0.1"
        )
          .to(el, { scale: 0.96, duration: 0.09, ease: "power2.out" }, "<")
          .add(firePing, "<")
          .to(icon, { scale: 1, duration: 0.18 })
          .to(el, { scale: 1, duration: 0.18 }, "<");
      };
      const moveTo = (
        tl: gsap.core.Timeline,
        t: { x: number; y: number },
        dur = 0.45
      ) =>
        tl.to(
          cursor,
          { x: t.x, y: t.y, duration: dur, ease: "power2.inOut" },
          "+=0.15"
        );
      const type = (
        tl: gsap.core.Timeline,
        text: string,
        setter: (s: string) => void
      ) => {
        const p = { i: 0 };
        tl.to(p, {
          i: text.length,
          duration: Math.max(text.length * 0.06, 0.2),
          ease: "none",
          onUpdate: () => setter(text.slice(0, Math.round(p.i))),
        });
      };

      const tl = gsap.timeline({ repeat: -1, defaults: { ease: EASE_OUT } });
      // t=0 reset: runs at the start of every loop iteration. All elements are already
      // invisible (the prior loop's outro faded everything out), so these instant sets
      // produce no visible flash.
      tl.set(card, {
        opacity: 0,
        scale: 0.9,
        transformOrigin: "50% 50%",
        filter: "blur(0px)",
      })
        .set(cursor, { opacity: 0, x: 0, y: 0, scale: 1 })
        .set(icon, { scale: 1 })
        .set(ping, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" })
        .set(dialog, { opacity: 0, scale: 0.96, transformOrigin: "50% 50%" })
        .set(table, { opacity: 0, filter: "blur(0px)" })
        .set(tableCta, { opacity: 1 })
        .set(typeMenu, { opacity: 0 })
        .add(() => {
          setRows([]);
          setNameVal("");
          setAmountVal("");
          setTypeVal("spend");
          setHoveredOpt(null);
          setCtaHover(false);
          setTableCtaHover(false);
          setCreateHover(false);
          setNameFocus(false);
          setAmountFocus(false);
        });
      // 1–2: card in, cursor in
      tl.to(card, { opacity: 1, scale: 1, duration: 0.5 }).to(
        cursor,
        { opacity: 1, duration: 0.3 },
        "+=0.15"
      );
      // 3: → CTA, hover, click
      moveTo(tl, ctaT, 0.7).add(() => setCtaHover(true));
      clickButton(tl, cta);
      // 4: spawn dialog over the blurred card
      tl.add(() => setCtaHover(false))
        .to(card, { filter: "blur(2.5px)", duration: 0.3 }, "+=0.05")
        .to(dialog, { opacity: 1, scale: 1, duration: 0.35 }, "<");
      // 5–7: fill Name / Amount, click Create
      moveTo(tl, nameT, 0.5).add(() => setNameFocus(true));
      clickInput(tl);
      type(tl, "Test limit", setNameVal);
      tl.add(() => setNameFocus(false));
      moveTo(tl, amountT).add(() => setAmountFocus(true));
      clickInput(tl);
      type(tl, "500", setAmountVal);
      tl.add(() => setAmountFocus(false));
      moveTo(tl, createT).add(() => setCreateHover(true));
      clickButton(tl, createEl);
      // 8: row 1 created — swap empty card → table behind the dialog, close dialog
      tl.add(() => setRows([ROW1]))
        .to(card, { opacity: 0, duration: 0.25 }, "+=0.2")
        .to(table, { opacity: 1, duration: 0.25 }, "<")
        .to(dialog, { opacity: 0, scale: 0.96, duration: 0.3 }, "+=0.05")
        .add(() => setCreateHover(false));
      // 9: 1-second beat
      tl.to({}, { duration: 1 });
      // 10: → table's add CTA, click
      moveTo(tl, tableCtaT, 0.6).add(() => setTableCtaHover(true));
      clickButton(tl, tableCta);
      // 11: reopen dialog over blurred table, with fields reset
      tl.add(() => {
        setTableCtaHover(false);
        setNameVal("");
        setAmountVal("");
        setTypeVal("spend");
      })
        .to(table, { filter: "blur(2.5px)", duration: 0.3 }, "+=0.05")
        .to(dialog, { opacity: 1, scale: 1, duration: 0.35 }, "<");
      // 12: Name "Test limit 2"
      moveTo(tl, nameT, 0.5).add(() => setNameFocus(true));
      clickInput(tl);
      type(tl, "Test limit 2", setNameVal);
      tl.add(() => setNameFocus(false));
      // 13: open Type dropdown
      moveTo(tl, typeT);
      clickInput(tl);
      tl.to(typeMenu, { opacity: 1, duration: 0.2 });
      // 14: → Tokens option, select, close dropdown
      moveTo(tl, tokensT, 0.4).add(() => setHoveredOpt("tokens"));
      clickInput(tl);
      tl.add(() => setTypeVal("tokens"))
        .to(typeMenu, { opacity: 0, duration: 0.2 })
        .add(() => setHoveredOpt(null));
      // 15: Amount "1000000"
      moveTo(tl, amountT).add(() => setAmountFocus(true));
      clickInput(tl);
      type(tl, "1000000", setAmountVal);
      tl.add(() => setAmountFocus(false));
      // 16: Create
      moveTo(tl, createT).add(() => setCreateHover(true));
      clickButton(tl, createEl);
      // 17: row 2 added — close dialog, un-blur table (cursor stays for entry 3)
      tl.add(() => setRows([ROW1, ROW2]))
        .to(table, { filter: "blur(0px)", duration: 0.3 }, "+=0.05")
        .to(dialog, { opacity: 0, scale: 0.96, duration: 0.3 }, "<")
        .add(() => setCreateHover(false))
        .add(() => {
          /* no-op label — holds the timeline position for the loop seam */
        });
      // 18: 1-second beat
      tl.to({}, { duration: 1 });
      // 19: cursor to the Create-limit button, click
      moveTo(tl, tableCtaT, 0.6).add(() => setTableCtaHover(true));
      clickButton(tl, tableCta);
      // 20: reopen dialog over blurred table, fields reset
      tl.add(() => {
        setTableCtaHover(false);
        setNameVal("");
        setAmountVal("");
        setTypeVal("spend");
      })
        .to(table, { filter: "blur(2.5px)", duration: 0.3 }, "+=0.05")
        .to(dialog, { opacity: 1, scale: 1, duration: 0.35 }, "<");
      // 21: Name "Test limit 3"
      moveTo(tl, nameT, 0.5).add(() => setNameFocus(true));
      clickInput(tl);
      type(tl, "Test limit 3", setNameVal);
      tl.add(() => setNameFocus(false));
      // 22: open Type dropdown
      moveTo(tl, typeT);
      clickInput(tl);
      tl.to(typeMenu, { opacity: 1, duration: 0.2 });
      // 23: cursor to Requests option, select, close dropdown
      moveTo(tl, requestsT, 0.4).add(() => setHoveredOpt("requests"));
      clickInput(tl);
      tl.add(() => setTypeVal("requests"))
        .to(typeMenu, { opacity: 0, duration: 0.2 })
        .add(() => setHoveredOpt(null));
      // 24: Threshold "10000"
      moveTo(tl, amountT).add(() => setAmountFocus(true));
      clickInput(tl);
      type(tl, "10000", setAmountVal);
      tl.add(() => setAmountFocus(false));
      // 25: Create
      moveTo(tl, createT).add(() => setCreateHover(true));
      clickButton(tl, createEl);
      // 26: row 3 added, close dialog, un-blur table, retire cursor
      tl.add(() => setRows([ROW1, ROW2, ROW3]))
        .to(table, { filter: "blur(0px)", duration: 0.3 }, "+=0.05")
        .to(dialog, { opacity: 0, scale: 0.96, duration: 0.3 }, "<")
        .add(() => setCreateHover(false))
        .to(cursor, { opacity: 0, duration: 0.3 }, "+=0.25")
        // Loop outro: hold 1 s, fade Create-limit button, stagger rows out, fade table
        .to({}, { duration: 1 })
        .to(tableCta, { opacity: 0, duration: 0.22 })
        .add(() => {
          // Row stagger targets live DOM nodes — rows are React state and don't exist
          // at timeline build time, so we query inside the callback.
          const liveRows = scope.current?.querySelectorAll("tbody tr");
          if (liveRows && liveRows.length > 0) {
            gsap.to(liveRows, {
              opacity: 0,
              y: 6,
              stagger: 0.08,
              duration: 0.22,
              ease: EASE_OUT,
            });
          }
        })
        // Wait for the nested stagger to finish before collapsing the table wrapper
        .to({}, { duration: 0.22 + 2 * 0.08 + 0.05 })
        .to(table, { opacity: 0, duration: 0.22 });
    },
    { scope }
  );

  return (
    <div className="relative w-full" ref={scope}>
      <div ref={cardRef}>
        <EmptyState
          action={
            <div
              className="inline-block"
              ref={ctaRef}
              style={{ transformOrigin: "50% 50%" }}
            >
              <Button
                aria-hidden
                className={cn(
                  "pointer-events-none",
                  ctaHover && "bg-primary/85"
                )}
                tabIndex={-1}
              >
                <Plus className="size-4" /> Add a new limit
              </Button>
            </div>
          }
          body="Create one to cap spend, throttle traffic, or shape usage per project or key."
          className="flex w-full py-8 shadow-card-soft"
          icon={
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-full bg-muted"
            >
              <Shield className="size-5 text-neutral-700" />
            </div>
          }
          title="No limits configured"
        />
      </div>

      {/* Result table — top-anchored so adding rows grows downward and the
          Add-limit button (above the table) stays put. Mounted hidden;
          revealed after Create. */}
      <div
        aria-hidden
        className="absolute inset-0 flex flex-col items-stretch justify-start gap-3"
        ref={tableRef}
      >
        <div className="flex justify-end">
          <div
            className="inline-block"
            ref={tableCtaRef}
            style={{ transformOrigin: "50% 50%" }}
          >
            <Button
              className={cn(tableCtaHover && "bg-primary/85")}
              size="sm"
              tabIndex={-1}
            >
              <Plus aria-hidden data-icon="inline-start" />
              Create limit
            </Button>
          </div>
        </div>
        <Card
          className="w-full overflow-hidden shadow-card-soft"
          density="flush"
        >
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[26%] whitespace-nowrap">
                  Name
                </TableHead>
                <TableHead className="w-[18%] whitespace-nowrap">
                  Type
                </TableHead>
                <TableHead className="w-[18%] whitespace-nowrap">
                  Threshold
                </TableHead>
                <TableHead className="w-[16%] whitespace-nowrap">
                  Period
                </TableHead>
                <TableHead className="w-[22%] whitespace-nowrap">
                  Scope
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="whitespace-nowrap text-neutral-900">
                    {r.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-neutral-800">
                    {r.type}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-neutral-800 tabular-nums">
                    {r.threshold}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-neutral-800">
                    {r.period}
                  </TableCell>
                  <TableCell
                    className="truncate text-neutral-800"
                    title={r.scope}
                  >
                    {r.scope}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialog — the real Create-limit card, minified, spawned over the card.
          Always mounted (for measurement); revealed by the timeline. Inert. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="flex w-3/4 flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-(--shadow-modal)"
          ref={dialogRef}
        >
          <div className="flex flex-col gap-1">
            <h3 className="m-0 font-medium font-sans text-base text-neutral-900">
              Create limit
            </h3>
            <p className="m-0 font-sans text-neutral-500 text-xs">
              Block requests that exceed the threshold (returns 429).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-medium text-neutral-600 text-sm">Name</Label>
            <div ref={nameRef}>
              <Input
                className={cn(nameFocus && FOCUS_RING)}
                placeholder="e.g. eu-payments daily spend"
                readOnly
                value={nameVal}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Type
              </Label>
              <div className="relative" ref={typeTriggerRef}>
                <Select value={typeVal}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTS.map((o) => (
                      <SelectItem key={o.v} value={o.v}>
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Fake dropdown — the real Select can't open for a fake cursor.
                    Always mounted (for measurement), revealed by the timeline. */}
                <div
                  className="absolute top-full left-0 z-30 mt-1 w-full rounded-sm border border-border bg-card p-1 shadow-(--shadow-popup)"
                  ref={typeMenuRef}
                >
                  {TYPE_OPTS.map((o) => (
                    <div
                      className={cn(
                        "flex h-8 items-center justify-between rounded-xs px-2 text-neutral-900 text-sm",
                        o.v === hoveredOpt && "bg-muted"
                      )}
                      key={o.v}
                      ref={
                        o.v === "tokens"
                          ? tokensOptRef
                          : o.v === "requests"
                            ? requestsOptRef
                            : undefined
                      }
                    >
                      {o.l}
                      {typeVal === o.v ? (
                        <Check className="size-4 text-neutral-500" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Threshold
              </Label>
              <div ref={amountRef}>
                <Input
                  className={cn(
                    "font-mono text-sm tabular-nums",
                    amountFocus && FOCUS_RING
                  )}
                  inputMode="decimal"
                  placeholder="e.g. 250"
                  readOnly
                  value={amountVal}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Period
              </Label>
              <Select value="1d">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTS.map((o) => (
                    <SelectItem key={o.v} value={o.v}>
                      {o.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Scope
              </Label>
              <Select value="org">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTS.map((o) => (
                    <SelectItem key={o.v} value={o.v}>
                      {o.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button tabIndex={-1} variant="outline">
              Cancel
            </Button>
            <div
              className="inline-block"
              ref={createRef}
              style={{ transformOrigin: "50% 50%" }}
            >
              <Button
                className={cn(createHover && "bg-primary/85")}
                disabled={nameVal.trim().length === 0}
                tabIndex={-1}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cursor — drives the whole sequence, painted above everything. */}
      <div aria-hidden className="absolute right-2 bottom-2" ref={cursorRef}>
        {/* Ping anchored at the pointer tip (top-left of the icon). Independent of
            the press scale so it reads as a clean radial pulse. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary opacity-0"
          ref={pingRef}
        />
        <MousePointer2
          className="size-6 fill-neutral-900 text-neutral-900"
          ref={iconRef}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}

// Limits Pro benefits — the shared Security feature set plus the two
// surfaces Pro now also gates (Limits & quotas, Token Savings), minus
// per-key risk scoring. Passed to the shared HeroCard so only this page's
// list changes; SecurityDefault / TokenSavings keep the default list.
const LIMITS_PRO_FEATURES: PlanFeature[] = [
  {
    Icon: ShieldAlert,
    title: "Prompt injection scanning",
    detail: "Block or flag before tokens reach the model",
  },
  {
    Icon: EyeOff,
    title: "PII & PHI redaction",
    detail: "Detect and redact before sensitive data reaches the model",
  },
  {
    Icon: KeyRound,
    title: "Credential leak prevention",
    detail: "Stop API keys and secrets from leaking in requests or responses",
  },
  {
    Icon: SlidersHorizontal,
    title: "Spend, token & rate limits",
    detail:
      "Caps at the org, project, or key level, to stay within your budget",
  },
  {
    Icon: Coins,
    title: "Token savings",
    detail: "Cache and compression per request to cut excess token costs",
  },
];

// Pro-upsell default for the Limits surface, mirroring SecurityDefault.
// Reuses SecurityDefault's HeroCard with a Limits-specific feature list.
export function LimitsDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="limits"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-tight">
          Enforce spend, token, and request rate caps at the org, project, or
          key level. Limits run inline with no separate billing system to wire
          up.
        </p>
      </div>
      <HeroCard features={LIMITS_PRO_FEATURES} preview={<LimitsPreview />} />
    </DashboardChrome>
  );
}
