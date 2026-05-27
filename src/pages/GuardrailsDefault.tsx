import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ShieldAlert, EyeOff, KeyRound, SlidersHorizontal, Coins, Shield, Plus, MousePointer2 } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { HeroCard, type PlanFeature } from '@/pages/SecurityDefault';

const EASE_OUT = 'power3.out';
const FOCUS_RING = 'border-ring ring-[3px] ring-ring/50';

// Local option sets mirroring the real Create Limit dialog (Guardrails.tsx).
const TYPE_OPTS = [
  { v: 'spend', l: 'Spend ($)' },
  { v: 'tokens', l: 'Tokens' },
  { v: 'requests', l: 'Requests' },
];
const PERIOD_OPTS = [
  { v: '1h', l: '1 hour' },
  { v: '1d', l: '1 day' },
  { v: '1w', l: '1 week' },
  { v: '1mo', l: '1 month' },
];
const SCOPE_OPTS = [
  { v: 'org', l: 'Org-wide (all keys)' },
  { v: 'project', l: 'Project' },
  { v: 'key', l: 'Key' },
];

// Animated preview for the Guardrails upsell hero's right panel — the whole
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
function GuardrailsLimitPreview() {
  const scope = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [ctaHover, setCtaHover] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [amountVal, setAmountVal] = useState('');
  const [nameFocus, setNameFocus] = useState(false);
  const [amountFocus, setAmountFocus] = useState(false);
  const [createHover, setCreateHover] = useState(false);

  useGSAP(() => {
    const card = cardRef.current;
    const cursor = cursorRef.current;
    const cta = ctaRef.current;
    const dialog = dialogRef.current;
    const nameEl = nameRef.current;
    const amountEl = amountRef.current;
    const createEl = createRef.current;
    const table = tableRef.current;
    if (!card || !cursor || !cta || !dialog || !nameEl || !amountEl || !createEl || !table) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Reduced motion → land on the end state: the created-limit table.
      gsap.set([card, dialog, cursor], { opacity: 0 });
      gsap.set(table, { opacity: 1 });
      return;
    }

    // Measure everything at natural layout (scale 1) before any gsap.set, so
    // cursor destinations are accurate. All deltas are absolute translations
    // from the cursor's origin (its transform-0 position).
    const origin = cursor.getBoundingClientRect();
    const target = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top };
    };
    const ctaT = target(cta);
    const nameT = target(nameEl);
    const amountT = target(amountEl);
    const createT = target(createEl);

    gsap.set(card, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%', filter: 'blur(0px)' });
    gsap.set(cursor, { opacity: 0 });
    gsap.set(dialog, { opacity: 0, scale: 0.96, transformOrigin: '50% 50%' });
    gsap.set(table, { opacity: 0 });

    // Cursor-only press — for clicking into inputs (focus, no element scale).
    const clickInput = (tl: gsap.core.Timeline) => {
      tl.to(cursor, { scale: 0.85, duration: 0.09, ease: 'power2.out' }, '+=0.1')
        .to(cursor, { scale: 1, duration: 0.18 });
    };
    // Button press — cursor blip + the element scales down, like a real press.
    const clickButton = (tl: gsap.core.Timeline, el: Element) => {
      tl.to(cursor, { scale: 0.85, duration: 0.09, ease: 'power2.out' }, '+=0.1')
        .to(el, { scale: 0.96, duration: 0.09, ease: 'power2.out' }, '<')
        .to(cursor, { scale: 1, duration: 0.18 })
        .to(el, { scale: 1, duration: 0.18 }, '<');
    };
    const type = (tl: gsap.core.Timeline, text: string, setter: (s: string) => void) => {
      const p = { i: 0 };
      tl.to(p, {
        i: text.length,
        duration: Math.max(text.length * 0.06, 0.2),
        ease: 'none',
        onUpdate: () => setter(text.slice(0, Math.round(p.i))),
      });
    };

    const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });
    // 1–2: card in, cursor in
    tl.to(card, { opacity: 1, scale: 1, duration: 0.5 })
      .to(cursor, { opacity: 1, duration: 0.3 }, '+=0.15')
      // 3: → CTA, hover, click
      .to(cursor, { x: ctaT.x, y: ctaT.y, duration: 0.7, ease: 'power2.inOut' }, '+=0.2')
      .add(() => setCtaHover(true));
    clickButton(tl, cta);
    // 4: spawn dialog over the blurred card
    tl.add(() => setCtaHover(false))
      .to(card, { filter: 'blur(2.5px)', duration: 0.3 }, '+=0.05')
      .to(dialog, { opacity: 1, scale: 1, duration: 0.35 }, '<');
    // 5: → Name, focus, type
    tl.to(cursor, { x: nameT.x, y: nameT.y, duration: 0.5, ease: 'power2.inOut' }, '+=0.15')
      .add(() => setNameFocus(true));
    clickInput(tl);
    type(tl, 'Test limit', setNameVal);
    // 6: → Amount, focus, type
    tl.add(() => { setNameFocus(false); })
      .to(cursor, { x: amountT.x, y: amountT.y, duration: 0.45, ease: 'power2.inOut' }, '+=0.15')
      .add(() => setAmountFocus(true));
    clickInput(tl);
    type(tl, '500', setAmountVal);
    // 7: → Create, hover, click
    tl.add(() => { setAmountFocus(false); })
      .to(cursor, { x: createT.x, y: createT.y, duration: 0.45, ease: 'power2.inOut' }, '+=0.15')
      .add(() => setCreateHover(true));
    clickButton(tl, createEl);
    // 8: limit created — swap the empty card for the table behind the dialog,
    // then close the dialog and retire the cursor to reveal the result.
    tl.to(card, { opacity: 0, duration: 0.25 }, '+=0.2')
      .to(table, { opacity: 1, duration: 0.25 }, '<')
      .to(dialog, { opacity: 0, scale: 0.96, duration: 0.3 }, '+=0.05')
      .to(cursor, { opacity: 0, duration: 0.3 }, '<');
  }, { scope });

  return (
    <div ref={scope} className="relative w-full">
      <div ref={cardRef}>
        <EmptyState
          icon={
            <div aria-hidden className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Shield className="size-5 text-neutral-700" />
            </div>
          }
          title="No limits configured"
          body="Create one to cap spend, throttle traffic, or shape usage per project or key."
          action={
            <div ref={ctaRef} className="inline-block" style={{ transformOrigin: '50% 50%' }}>
              <Button tabIndex={-1} aria-hidden className={cn('pointer-events-none', ctaHover && 'bg-primary/85')}>
                <Plus className="size-4" /> Add a new limit
              </Button>
            </div>
          }
          className="flex w-full shadow-card-soft py-8"
        />
      </div>

      {/* Result table — the limit the dialog creates. Mounted hidden behind
          the dialog; revealed after Create as the empty card fades out. */}
      <div ref={tableRef} className="absolute inset-0 flex items-center" aria-hidden>
        <Card density="flush" className="w-full shadow-card-soft overflow-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[26%] whitespace-nowrap">Name</TableHead>
                <TableHead className="w-[18%] whitespace-nowrap">Type</TableHead>
                <TableHead className="w-[18%] whitespace-nowrap">Amount</TableHead>
                <TableHead className="w-[16%] whitespace-nowrap">Period</TableHead>
                <TableHead className="w-[22%] whitespace-nowrap">Scope</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="whitespace-nowrap text-neutral-900">Test limit</TableCell>
                <TableCell className="whitespace-nowrap text-neutral-800">Spend</TableCell>
                <TableCell className="whitespace-nowrap font-mono tabular-nums text-neutral-800">$500</TableCell>
                <TableCell className="whitespace-nowrap text-neutral-800">1 day</TableCell>
                <TableCell className="whitespace-nowrap text-neutral-800">Org-wide</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialog — the real Create-limit card, minified, spawned over the card.
          Always mounted (for measurement); revealed by the timeline. Inert. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <div
          ref={dialogRef}
          className="w-3/4 rounded-xl border border-border bg-white shadow-(--shadow-modal) p-4 flex flex-col gap-3 text-left"
        >
          <div className="flex flex-col gap-1">
            <h3 className="font-sans text-base font-medium text-neutral-900 m-0">Create limit</h3>
            <p className="font-sans text-xs text-neutral-500 m-0">Block requests that exceed the threshold (returns 429).</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-neutral-600 font-medium text-sm">Name</Label>
            <div ref={nameRef}>
              <Input readOnly value={nameVal} placeholder="e.g. eu-payments daily spend" className={cn(nameFocus && FOCUS_RING)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-600 font-medium text-sm">Type</Label>
              <Select value="spend">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-600 font-medium text-sm">Amount</Label>
              <div ref={amountRef}>
                <Input readOnly inputMode="decimal" value={amountVal} placeholder="e.g. 250" className={cn('font-mono text-sm tabular-nums', amountFocus && FOCUS_RING)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-600 font-medium text-sm">Period</Label>
              <Select value="1d">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-600 font-medium text-sm">Scope</Label>
              <Select value="org">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-2">
            <Button variant="outline" tabIndex={-1}>Cancel</Button>
            <div ref={createRef} className="inline-block" style={{ transformOrigin: '50% 50%' }}>
              <Button tabIndex={-1} disabled={nameVal.trim().length === 0} className={cn(createHover && 'bg-primary/85')}>Create</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cursor — drives the whole sequence, painted above everything. */}
      <div ref={cursorRef} aria-hidden className="absolute bottom-2 right-2">
        <MousePointer2 className="size-6 fill-neutral-900 text-neutral-900" strokeWidth={1.5} />
      </div>
    </div>
  );
}

// Guardrails Pro benefits — the shared Security feature set plus the two
// surfaces Pro now also gates (Limits & quotas, Token Savings), minus
// per-key risk scoring. Passed to the shared HeroCard so only this page's
// list changes; SecurityDefault / TokenSavings keep the default list.
const GUARDRAILS_PRO_FEATURES: PlanFeature[] = [
  { Icon: ShieldAlert,       title: 'Prompt injection scanning', detail: 'Block or flag before tokens reach the model' },
  { Icon: EyeOff,            title: 'PII & PHI redaction',        detail: 'Detect and redact before sensitive data reaches the model' },
  { Icon: KeyRound,          title: 'Credential leak prevention', detail: 'Stop API keys and secrets from leaking in requests or responses' },
  { Icon: SlidersHorizontal, title: 'Spend, token & rate limits', detail: 'Caps at the org, project, or key level, to stay within your budget' },
  { Icon: Coins,             title: 'Token savings',              detail: 'Cache and compression per request to cut excess token costs' },
];

// Pro-upsell default for the Guardrails surface, mirroring SecurityDefault.
// Reuses SecurityDefault's HeroCard with a Guardrails-specific feature list.
export function GuardrailsDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="guardrails"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Limits & quotas</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Enforce spend, token, and request rate caps at the org, project, or key level. Limits run inline with no separate billing system to wire up.
        </p>
      </div>
      <HeroCard
        features={GUARDRAILS_PRO_FEATURES}
        preview={<GuardrailsLimitPreview />}
      />
    </DashboardChrome>
  );
}
