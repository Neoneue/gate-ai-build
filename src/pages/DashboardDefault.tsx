import { useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, ExternalLink, Download, BarChart2, Zap, ShieldAlert, ArrowLeftRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';


import { KpiRail } from '@/components/ui/kpi-rail';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/copy-button';
import { AnthropicIcon, OpenAIIcon, GeminiIcon, GrokIcon, MetaIcon } from '@/components/icons/model-providers';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Radio } from '@base-ui/react/radio';
import { XIcon, Check } from 'lucide-react';

const GATEWAY_URL = 'https://gateway-staging.constellationgate.ai';
const GATEWAY_KEY_PLACEHOLDER = 'sk-gw-…YOUR_KEY';

// These tabs configure agent apps to route through the gateway — you point
// the tool at Gate, not the model provider. Claude Code + Codex read base-URL
// env vars; OpenClaw is Gate-native and takes a small plugin config.
const HERO_CLAUDE_CODE_BYOK =
`import Anthropic from "@anthropic-ai/sdk";

// BYOK — your own Anthropic key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new Anthropic({
  baseURL: "${GATEWAY_URL}",
  apiKey: "sk-ant-…YOUR_ANTHROPIC_KEY",
  defaultHeaders: {
    "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
    "X-Gate-Upstream-Url": "https://api.anthropic.com",
  },
});

const msg = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.content);`;

const HERO_CLAUDE_CODE_PAYG =
`import Anthropic from "@anthropic-ai/sdk";

// PAYG — single gateway key. The gateway routes to the upstream named
// by \`provider\` and bills your gateway account. Model is namespaced
// as <provider>/<model>.
const client = new Anthropic({
  baseURL: "${GATEWAY_URL}",
  apiKey: "sk-gw-…YOUR_GATEWAY_KEY",
  defaultHeaders: {
    "x-gate-api-key": "sk-gw-…YOUR_GATEWAY_KEY",
  },
});

const msg = await client.messages.create({
  model: "anthropic/claude-sonnet-4-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Hello!" }],
  // Gateway extension — names the meta-provider to route through.
  // SDK types don't include it, so we extend the request body directly.
  ...({ provider: "OpenRouter" } as { provider: string }),
});
console.log(msg.content);`;

const HERO_CODEX_BYOK =
`import OpenAI from "openai";

// BYOK — your own OpenAI key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new OpenAI({
  baseURL: "${GATEWAY_URL}/v1",
  apiKey: "sk-…YOUR_OPENAI_KEY",
  defaultHeaders: {
    "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
    "X-Gate-Upstream-Url": "https://api.openai.com",
  },
});

const msg = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.choices[0].message.content);`;

const HERO_CODEX_PAYG =
`import OpenAI from "openai";

// PAYG — single gateway key. The gateway routes to the upstream named
// by \`provider\` and bills your gateway account. Model is namespaced
// as <provider>/<model>.
const client = new OpenAI({
  baseURL: "${GATEWAY_URL}/v1",
  apiKey: "sk-gw-…YOUR_GATEWAY_KEY",
  defaultHeaders: {
    "x-gate-api-key": "sk-gw-…YOUR_GATEWAY_KEY",
  },
});

const msg = await client.chat.completions.create({
  model: "openai/gpt-4",
  messages: [{ role: "user", content: "Hello!" }],
  // Gateway extension — names the meta-provider to route through.
  // OpenAI SDK forwards unknown top-level fields directly to the body.
  // @ts-expect-error provider is a gateway-specific extension
  provider: "OpenRouter",
});
console.log(msg.choices[0].message.content);`;

const HERO_OPENCLAW_BYOK =
`import { OpenClawGenAI } from "@openclaw/genai";

// BYOK — your own OpenClaw API key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new OpenClawGenAI({
  apiKey: "YOUR_OPENCLAW_API_KEY",
  apiVersion: "v1",
  httpOptions: {
    baseUrl: "${GATEWAY_URL}/openclaw",
    headers: {
      "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
      "X-Gate-Upstream-Url": "https://generativelanguage.googleapis.com",
    },
  },
});

const res = await client.models.generateContent({
  model: "gemini-2.5-pro",
  contents: "Hello!",
});
console.log(res.text);`;

const HERO_OPENCLAW_PAYG =
`import { OpenClawGenAI } from "@openclaw/genai";

// PAYG — single gateway key. The gateway routes to the upstream named
// by \`provider\` and bills your gateway account. Model is namespaced
// as <provider>/<model>.
const client = new OpenClawGenAI({
  apiKey: "sk-gw-…YOUR_GATEWAY_KEY",
  apiVersion: "v1",
  httpOptions: {
    baseUrl: "${GATEWAY_URL}/openclaw",
    headers: {
      "x-gate-api-key": "sk-gw-…YOUR_GATEWAY_KEY",
    },
  },
});

const res = await client.models.generateContent({
  model: "openclaw/gemini-2.5-pro",
  contents: "Hello!",
  // Gateway extension — names the meta-provider to route through.
  // OpenClaw SDK doesn't type this field; cast through unknown to attach it.
  ...({ provider: "OpenRouter" } as { provider: string }),
});
console.log(res.text);`;

const HERO_GEMINI_BYOK =
`import { GoogleGenAI } from "@google/genai";

// BYOK — your own Google API key. The gateway proxies to the upstream
// you name in X-Gate-Upstream-Url and adds security + audit.
const client = new GoogleGenAI({
  apiKey: "YOUR_GOOGLE_API_KEY",
  apiVersion: "v1",
  httpOptions: {
    baseUrl: "${GATEWAY_URL}/google",
    headers: {
      "X-Gate-Api-Key": "sk-gw-…YOUR_GATEWAY_KEY",
      "X-Gate-Upstream-Url": "https://generativelanguage.googleapis.com",
    },
  },
});

const res = await client.models.generateContent({
  model: "gemini-2.5-pro",
  contents: "Hello!",
});
console.log(res.text);`;

const HERO_GEMINI_PAYG =
`import { GoogleGenAI } from "@google/genai";

// PAYG — single gateway key. The gateway routes to the upstream named
// by \`provider\` and bills your gateway account. Model is namespaced
// as <provider>/<model>.
const client = new GoogleGenAI({
  apiKey: "sk-gw-…YOUR_GATEWAY_KEY",
  apiVersion: "v1",
  httpOptions: {
    baseUrl: "${GATEWAY_URL}/google",
    headers: {
      "x-gate-api-key": "sk-gw-…YOUR_GATEWAY_KEY",
    },
  },
});

const res = await client.models.generateContent({
  model: "google/gemini-2.5-pro",
  contents: "Hello!",
  // Gateway extension — names the meta-provider to route through.
  // Google SDK doesn't type this field; cast through unknown to attach it.
  ...({ provider: "OpenRouter" } as { provider: string }),
});
console.log(res.text);`;

export const HERO_SNIPPETS: Record<string, string> = {
  'claude-code': HERO_CLAUDE_CODE_BYOK,
  codex: HERO_CODEX_BYOK,
  gemini: HERO_GEMINI_BYOK,
  openclaw: HERO_OPENCLAW_BYOK,
};

const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var',
  'await', 'new', 'async', 'function', 'return', 'class',
]);

type CodeToken = { text: string; type: 'keyword' | 'string' | 'plain' };

function tokenizeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === ch) { j++; break; }
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: 'string' });
      i = j;
    } else if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ text: word, type: KEYWORDS.has(word) ? 'keyword' : 'plain' });
      i = j;
    } else {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'plain') {
        tokens[tokens.length - 1].text += ch;
      } else {
        tokens.push({ text: ch, type: 'plain' });
      }
      i++;
    }
  }
  return tokens;
}

export function CodePanel({ snippet }: { snippet: string }) {
  const lines = snippet.split('\n');
  return (
    <div className="p-4 overflow-x-auto">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-4 leading-relaxed">
          <span className="font-mono text-xs text-neutral-400 select-none tabular-nums w-4 text-right shrink-0">
            {i + 1}
          </span>
          <span className="font-mono text-xs whitespace-pre flex-1">
            {tokenizeLine(line).map((tok, j) =>
              tok.type === 'keyword' ? (
                <span key={j} className="text-indigo-600">{tok.text}</span>
              ) : tok.type === 'string' ? (
                <span key={j} className="text-red-600">{tok.text}</span>
              ) : (
                <span key={j} className="text-neutral-800">{tok.text}</span>
              )
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Caption shown to the right of the BYOK/PAYG selector strip. */
const HERO_MODE_CAPTIONS: Record<'byok' | 'payg', string> = {
  byok: 'Bring your own provider key — gateway adds security + audit.',
  payg: 'Pay-as-you-go on the gateway. Single key, no provider account needed.',
};

/**
 * Hero code tab: an optional BYOK/PAYG selector strip, the scrolling snippet
 * panel, and a bottom-right Copy footer. Pass `byok` + `payg` for tabs that
 * have both billing-mode variants (renders the strip); pass a single
 * `snippet` for tabs that don't (no strip).
 */
function HeroCodeTab({
  snippet,
  byok,
  payg,
  paygOnly = false,
  caption,
  maxHeightClass = 'max-h-[192px]',
}: {
  snippet?: string;
  byok?: string;
  payg?: string;
  /** Force the PAYG snippet and drop the BYOK/PAYG selector (caption stays). */
  paygOnly?: boolean;
  /** Overrides the mode caption with a fixed per-tab string. */
  caption?: string;
  /** Tailwind max-h class for the scrolling snippet panel. */
  maxHeightClass?: string;
}) {
  const hasModes = Boolean(byok && payg);
  const [mode, setMode] = useState<'byok' | 'payg'>('byok');
  const effectiveMode = paygOnly ? 'payg' : mode;
  const code = hasModes ? (effectiveMode === 'byok' ? byok! : payg!) : snippet!;
  return (
    <div className="flex flex-col h-full">
      {hasModes && (
        <div className={`flex items-center gap-4 px-4 border-b border-border ${paygOnly ? 'h-10 justify-start' : 'py-2 justify-between'}`}>
          {!paygOnly && (
            <div
              role="radiogroup"
              aria-label="Gateway billing mode"
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1 h-8 shrink-0"
            >
              {(['byok', 'payg'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={`flex items-center px-2 h-6 rounded-xs text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    mode === m
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <span className="text-xs text-neutral-500">
            {caption ?? HERO_MODE_CAPTIONS[effectiveMode]}
          </span>
        </div>
      )}
      <div className={`${maxHeightClass} overflow-y-auto`}>
        <CodePanel snippet={code} />
      </div>
      <div className="border-t border-border px-4 h-12 flex items-center justify-end">
        <CopyButton mode="label" text="Copy code" value={code} label="code snippet" />
      </div>
    </div>
  );
}

/* ─── Download Gate Connect modal ─────────────────────────────────────────
 * Figma node 514:42. 548px modal, three stacked regions (header / body /
 * footer) each owning its own 24px x-padding. Platform cards = a radiogroup
 * of toggle cards; build rows = a Base UI RadioGroup. Selecting a platform
 * swaps the build matrix, the version/requirements line, and the button
 * label. OS auto-detection drives the initial platform + the "Detected" pill
 * (the pill never moves off the truly-detected OS, even when the user picks
 * a different card).
 * ──────────────────────────────────────────────────────────────────────── */

type PlatformId = 'mac' | 'windows' | 'linux';

type BuildOption = {
  id: string;
  /** "Installer" label prefix. */
  kind: string;
  /** Architecture name, e.g. "x64", "Apple Silicon". */
  arch: string;
  /** Muted parenthetical detail, e.g. "(x86-64 / AMD64)". */
  detail: string;
  size: string;
};

type PlatformSpec = {
  id: PlatformId;
  label: string;
  /** Brand-colored 24px OS icon. */
  icon: string;
  /** App version line. */
  version: string;
  /** Per-platform OS requirement sentence. */
  requires: string;
  builds: BuildOption[];
  /** Default-selected build id on platform switch. */
  defaultBuild: string;
};

const GATE_CONNECT_VERSION = 'v1.4.2';

const PLATFORMS: Record<PlatformId, PlatformSpec> = {
  windows: {
    id: 'windows',
    label: 'Windows',
    icon: '/icons/os/windows-color.svg',
    version: GATE_CONNECT_VERSION,
    requires: 'Requires Windows 10 or later',
    defaultBuild: 'win-x64',
    builds: [
      { id: 'win-x64', kind: 'Installer', arch: 'x64', detail: '(x86-64 / AMD64)', size: '46.1 MB' },
      { id: 'win-arm64', kind: 'Installer', arch: 'ARM64', detail: '(aarch64)', size: '45.0 MB' },
    ],
  },
  mac: {
    id: 'mac',
    label: 'macOS',
    icon: '/icons/os/macos-color.svg',
    version: GATE_CONNECT_VERSION,
    requires: 'Requires macOS 12 or later',
    defaultBuild: 'mac-arm',
    builds: [
      { id: 'mac-arm', kind: 'Installer', arch: 'Apple Silicon', detail: '(arm64)', size: '44.8 MB' },
      { id: 'mac-intel', kind: 'Installer', arch: 'Intel', detail: '(x86-64)', size: '46.3 MB' },
    ],
  },
  linux: {
    id: 'linux',
    label: 'Linux',
    icon: '/icons/os/linux-color.svg',
    version: GATE_CONNECT_VERSION,
    requires: 'Requires a modern 64-bit Linux distribution',
    defaultBuild: 'linux-x64',
    builds: [
      { id: 'linux-x64', kind: 'Installer', arch: 'x64', detail: '(.AppImage / x86-64)', size: '47.2 MB' },
      { id: 'linux-arm64', kind: 'Installer', arch: 'ARM64', detail: '(aarch64)', size: '46.0 MB' },
    ],
  },
};

const PLATFORM_ORDER: PlatformId[] = ['mac', 'windows', 'linux'];

/** Best-effort OS detection. Prefers the modern userAgentData hint, falls
 *  back to navigator.platform / userAgent. Defaults to Windows when unknown. */
function detectPlatform(): PlatformId {
  if (typeof navigator === 'undefined') return 'windows';
  const uaData = (navigator as Navigator & {
    userAgentData?: { platform?: string };
  }).userAgentData;
  const hint = (uaData?.platform || navigator.platform || navigator.userAgent || '').toLowerCase();
  if (hint.includes('mac') || hint.includes('iphone') || hint.includes('ipad')) return 'mac';
  if (hint.includes('linux') || hint.includes('android') || hint.includes('x11')) return 'linux';
  if (hint.includes('win')) return 'windows';
  return 'windows';
}

function DownloadGateConnectDialog() {
  const detected = useMemo(detectPlatform, []);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformId>(detected);
  const [buildId, setBuildId] = useState<string>(PLATFORMS[detected].defaultBuild);

  const spec = PLATFORMS[platform];

  function selectPlatform(next: PlatformId) {
    setPlatform(next);
    setBuildId(PLATFORMS[next].defaultBuild);
  }

  return (
    <Dialog
      open={open}
      // Outside-press must NOT dismiss (operator-tool requirement: scrim is
      // inert, only the X and Escape close). Every other reason — close-press,
      // escape-key, trigger-press — passes through.
      onOpenChange={(next, details) => {
        if (!next && details.reason === 'outside-press') return;
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Download className="size-4" data-icon="inline-start" /> Download Gate Connect
          </Button>
        }
      />
      <DialogContent
        showCloseButton={false}
        // 548px modal; regions own their padding, so strip the primitive's
        // gap-4 / p-6. rounded-xl (16px, LOCKED) stays from the primitive.
        className="w-[548px] max-w-[calc(100%-2rem)] gap-0 p-0 overflow-hidden sm:max-w-[548px]"
      >
        {/* HEADER */}
        <div className="relative flex items-start px-6 pt-4 pb-4 border-b border-border">
          <div className="flex flex-col gap-0 min-w-0 pr-8">
            <DialogTitle className="text-lg font-semibold tracking-tight text-neutral-900 m-0">
              Download Gate <span className="text-blue-700">Connect</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-500 text-pretty m-0">
              The menu-bar app that connects your desktop agents to Gate
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            render={
              <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" />
            }
          >
            <XIcon className="size-5" />
          </DialogClose>
        </div>

        {/* BODY */}
        <div className="flex flex-col gap-4 px-6 pt-5 pb-5">
          {/* Platform picker */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-neutral-900">Choose your platform</span>
            <RadioGroup
              aria-label="Choose your platform"
              value={platform}
              onValueChange={(v) => selectPlatform(v as PlatformId)}
              className="flex gap-3"
            >
              {PLATFORM_ORDER.map((id) => {
                const p = PLATFORMS[id];
                return (
                  <Radio.Root
                    key={id}
                    value={id}
                    className="group/platform relative flex flex-1 flex-col items-center justify-center gap-2 h-[92px] rounded-lg border border-border bg-card transition-[colors,box-shadow,scale] duration-150 ease-out will-change-transform outline-none cursor-pointer hover:border-neutral-300 active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-neutral-900 data-checked:shadow-xs"
                  >
                    {detected === id && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center h-5 rounded-full bg-neutral-900 px-2 text-[10px]/[16px] font-semibold tracking-wide text-white whitespace-nowrap">
                        Detected
                      </span>
                    )}
                    <Radio.Indicator
                      className="absolute top-2 right-2 inline-flex items-center justify-center size-4 rounded-full bg-neutral-900 text-white"
                      keepMounted={false}
                    >
                      <Check className="size-3" strokeWidth={2.5} aria-hidden />
                    </Radio.Indicator>
                    <img src={p.icon} alt="" aria-hidden className="size-6" />
                    <span className="text-sm font-medium text-neutral-900">{p.label}</span>
                  </Radio.Root>
                );
              })}
            </RadioGroup>
          </div>

          {/* Build picker */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-neutral-900">Choose your build</span>
            <RadioGroup
              aria-label="Choose your build"
              value={buildId}
              onValueChange={(v) => setBuildId(v as string)}
              className="gap-3"
            >
              {spec.builds.map((b) => {
                const selected = buildId === b.id;
                return (
                  <label
                    key={b.id}
                    className={`flex items-center gap-3 h-[52px] rounded-lg border bg-card px-4 transition-colors duration-150 ease-out cursor-pointer ${
                      selected ? 'border-neutral-900' : 'border-border hover:border-neutral-300'
                    }`}
                  >
                    <RadioGroupItem value={b.id} className="size-5 [&_[data-slot=radio-group-indicator]]:size-5" />
                    <span className="text-sm font-medium text-neutral-900">{b.kind}</span>
                    <span className="text-sm font-medium text-neutral-900">{b.arch}</span>
                    <span className="text-sm text-neutral-500">{b.detail}</span>
                    <span className="ml-auto text-sm text-neutral-500 tabular-nums whitespace-nowrap">
                      {b.size}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Version + requirement line — two texts, 8px gap (no separator), per Figma */}
          <p className="flex items-center gap-2 text-xs text-neutral-500 m-0">
            <span>{spec.version}</span>
            <span>{spec.requires}</span>
          </p>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-6 border-t border-border">
          <Button
            className="w-full h-12"
            onClick={() => setOpen(false)}
          >
            <Download className="size-4" data-icon="inline-start" /> Download for {spec.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HeroCard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:gap-0">
      {/* Get started card */}
      <Card density="flush" className="flex-1 xl:rounded-r-none xl:border-r-0">
          <div className="p-8 max-xl:p-6 flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-medium tracking-tight text-neutral-900 m-0">
                Get Started with Gate AI
              </h2>
              <p className="text-sm text-neutral-500 text-pretty max-w-[432px] m-0">
                Route your AI tools through Gate to add prompt-injection defense and a tamper-evident audit trail to every request. Set it up in one click with Gate Connect, our tiny menu-bar app, or configure your tool manually. Create an API key below to get started.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/api-keys')}>
                <Plus className="size-4 transition-transform duration-150 ease-out group-hover/button:scale-110 motion-reduce:transition-none" data-icon="inline-start" /> Create key
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://docs.constellationgate.ai', '_blank')}
              >
                Read API docs <ExternalLink className="size-4 transition-transform duration-150 ease-out group-hover/button:translate-x-px group-hover/button:-translate-y-px motion-reduce:transition-none motion-reduce:group-hover/button:translate-x-0 motion-reduce:group-hover/button:translate-y-0" />
              </Button>
            </div>
          </div>
          <WorksWithFooter />
      </Card>

      {/* Connect card */}
      <Card density="flush" className="flex-1 xl:rounded-l-none flex flex-col">
        <div className="flex-1"><ConnectTabs gateConnectOnly /></div>
        <WorksWithFooter label="Manual setup" showMore={false} items={MANUAL_SETUP_ITEMS} asButtons />
      </Card>
    </div>
  );
}

/** A footer chip: either a component icon (`Icon`) or an image (`src`). */
type FooterItem = {
  name: string;
  hide?: string;
  Icon?: ComponentType<{ className?: string }>;
  src?: string;
  /** ConnectTabs tab id to deep-link on the API Keys page (button footers). */
  tab?: string;
};

/** Provider list for the left "Works with" footer. */
const WORKS_WITH_ITEMS: FooterItem[] = [
  { Icon: OpenAIIcon,    name: 'OpenAI' },
  { Icon: GrokIcon,      name: 'xAI' },
  { Icon: AnthropicIcon, name: 'Anthropic' },
  { Icon: GeminiIcon,    name: 'Google', hide: 'xl:max-[1320px]:hidden' },
  { Icon: MetaIcon,      name: 'Meta',   hide: 'xl:max-[1512px]:hidden' },
];

/** Agent/model list for the right "Manual setup" footer — matches the tabs.
 *  `tab` deep-links the matching ConnectTabs tab on /api-keys. (Gemini has no
 *  dedicated tab yet; it points at the openclaw tab, which holds the Google
 *  SDK snippet.) */
const MANUAL_SETUP_ITEMS: FooterItem[] = [
  { Icon: AnthropicIcon, name: 'Claude',   tab: 'claude-code' },
  { Icon: OpenAIIcon,    name: 'Codex',    tab: 'codex' },
  { Icon: GeminiIcon,    name: 'Gemini',   tab: 'gemini' },
  { src: '/icons/providers/openclaw.svg', name: 'OpenClaw', tab: 'openclaw' },
];

/** "<label> <chips> [+ more]" footer bar, shared by both hero cards. When
 *  `asButtons`, each chip is a full-height ghost button with hard (0px) edges. */
function WorksWithFooter({
  label = 'Works with',
  showMore = true,
  items = WORKS_WITH_ITEMS,
  asButtons = false,
}: { label?: string; showMore?: boolean; items?: FooterItem[]; asButtons?: boolean } = {}) {
  const navigate = useNavigate();
  const chips = items.map(({ Icon, src, name, hide, tab }) => {
    const inner = (
      <>
        {Icon ? (
          <Icon className="size-4 text-neutral-600 shrink-0" />
        ) : (
          <img src={src} alt="" aria-hidden className="size-4 shrink-0" />
        )}
        <span className="text-sm text-neutral-700 whitespace-nowrap">{name}</span>
      </>
    );
    return asButtons ? (
      <button
        key={name}
        type="button"
        onClick={() => navigate(`/api-keys${tab ? `?tab=${tab}` : ''}`)}
        className={`flex h-12 items-center gap-2 rounded-none px-3 shrink-0 transition-colors duration-150 ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 ${hide ?? ''}`}
      >
        {inner}
      </button>
    ) : (
      <div key={name} className={`flex items-center gap-2 shrink-0 ${hide ?? ''}`}>
        {inner}
      </div>
    );
  });
  return (
    <div className={`border-t border-border h-12 flex items-center gap-4 ${asButtons ? 'pl-8 max-xl:pl-6' : 'px-8 max-xl:px-6'}`}>
      <span className="text-sm text-neutral-500 whitespace-nowrap shrink-0">{label}</span>
      {asButtons ? <div className="flex h-12 items-center">{chips}</div> : chips}
      {showMore && (
        <span className="text-sm text-neutral-500 italic whitespace-nowrap shrink-0">+ more</span>
      )}
    </div>
  );
}

/** Per-tab captions for the paygOnly strip (e.g. the Models page). */
const PAYG_TAB_CAPTIONS: Record<'claude-code' | 'codex' | 'gemini' | 'openclaw', string> = {
  'claude-code': 'Anthropic-shape CLI. Point base URL + key at the gateway.',
  codex: 'OpenAI Responses CLI. Inline-config the gateway as a provider.',
  gemini: 'Google GenAI SDK. Point the base URL + headers at the gateway.',
  openclaw: 'Edit ~/.openclaw/openclaw.json — gateway as a provider.',
};

/** Default per-breakpoint max-widths for the Gate Connect blurb. */
const CONNECT_TEXT_MAXW =
  'max-w-[368px] min-[1080px]:max-[1280px]:max-w-[440px] xl:max-[1535px]:max-w-[416px] 2xl:max-[1919px]:max-w-[320px] 3xl:max-w-[416px]';

/** Default Gate Connect app-preview image placement — tuned for the Overview
 *  hero (right card nearly full-viewport). Overridable per instance via
 *  ConnectTabs' `imageClassName` so other usages (e.g. the API Keys card) can
 *  reposition without disturbing the hero's responsive settings. */
const CONNECT_IMAGE_CLASS =
  'pointer-events-none select-none absolute top-[calc(50%_+_4px)] right-0 -translate-y-1/2 translate-x-[clamp(0px,calc(400px_-_20.8333vw),80px)] min-[1025px]:max-[1280px]:translate-x-0 min-[768px]:max-[1024px]:translate-x-[clamp(0px,calc(256px_-_25vw),64px)] max-[767px]:translate-x-0 3xl:translate-x-[8px] w-[clamp(479.75px,calc(429.25px_+_3.28776vw),492.375px)] scale-[0.658125] max-[1280px]:scale-[0.62522] origin-right xl:max-[1535px]:hidden';

/**
 * The connect card's tab strip + panels (Gate Connect / Claude Code / Codex /
 * OpenClaw). Shared between the Overview hero and the API Keys "Using your
 * key" section so they never drift. Drop it inside any flush <Card>.
 *
 * `textMaxWidth` overrides the Gate Connect blurb's max-width set so a given
 * usage (e.g. the narrower API Keys section) can size it independently.
 */
export function ConnectTabs({
  textMaxWidth = CONNECT_TEXT_MAXW,
  imageClassName = CONNECT_IMAGE_CLASS,
  titleClassName = 'text-2xl font-medium tracking-tight text-neutral-900 m-0',
  showGateConnect = true,
  paygOnly = false,
  gateConnectOnly = false,
  fillHeight = false,
  codeMaxHeight,
  defaultTab,
}: { textMaxWidth?: string; imageClassName?: string; titleClassName?: string; showGateConnect?: boolean; paygOnly?: boolean; gateConnectOnly?: boolean; fillHeight?: boolean; codeMaxHeight?: string; defaultTab?: string } = {}) {
  return (
    <Tabs defaultValue={defaultTab ?? (showGateConnect ? 'gate-connect' : 'claude-code')} className="flex flex-col flex-1 gap-0">
      {!gateConnectOnly && (
      <div className="flex items-center px-4 border-b border-border">
        <TabsList variant="line" className="px-0 border-b-0 h-12">
          {showGateConnect && (
            <TabsTrigger value="gate-connect">
              <img src="/gate-ai-logo-mark.png" alt="" aria-hidden className="h-4 w-auto" />Gate Connect
            </TabsTrigger>
          )}
          <TabsTrigger value="claude-code">
            <AnthropicIcon className="size-4" />Claude Code
          </TabsTrigger>
          <TabsTrigger value="codex">
            <OpenAIIcon className="size-4" />Codex
          </TabsTrigger>
          <TabsTrigger value="gemini">
            <GeminiIcon className="size-4" />Gemini
          </TabsTrigger>
          <TabsTrigger value="openclaw">
            <img src="/icons/providers/openclaw.svg" alt="" aria-hidden className="size-4" />OpenClaw
          </TabsTrigger>
        </TabsList>
      </div>
      )}
      {showGateConnect && (
      <TabsContent value="gate-connect" className={`mt-0 ${fillHeight ? 'flex-1 flex flex-col' : ''}`}>
        <div className={`relative h-full overflow-hidden ${fillHeight ? 'flex-1' : 'min-h-[232px]'}`}>
          {/* Decorative app preview — pre-faded asset, anchored right.
              Scale/position tuned per instruction. */}
          <img
            src="/gateconnect-app-fade.png"
            alt=""
            aria-hidden
            className={imageClassName}
          />
          <div className={`relative z-10 flex flex-col gap-6 p-8 max-xl:p-6 ${fillHeight ? 'h-full' : ''}`}>
            <div className="flex flex-col gap-2">
              <h3 className={titleClassName}>
                1-Click setup with Gate Connect
              </h3>
              <p className={`text-sm text-neutral-500 text-pretty ${textMaxWidth} m-0`}>
                Gate Connect is a tiny desktop app living in your menu bar. Install, flip a switch, and your AI coding tools route through Gate automatically. No config files, no environment variables, no terminal. Claude Code, Cowork, Codex, and more are supported.
              </p>
            </div>
            <div className="flex">
              <DownloadGateConnectDialog />
            </div>
          </div>
        </div>
      </TabsContent>
      )}
      <TabsContent value="claude-code" className="mt-0">
        <HeroCodeTab byok={HERO_CLAUDE_CODE_BYOK} payg={HERO_CLAUDE_CODE_PAYG} paygOnly={paygOnly} caption={paygOnly ? PAYG_TAB_CAPTIONS['claude-code'] : undefined} maxHeightClass={codeMaxHeight} />
      </TabsContent>
      <TabsContent value="codex" className="mt-0">
        <HeroCodeTab byok={HERO_CODEX_BYOK} payg={HERO_CODEX_PAYG} paygOnly={paygOnly} caption={paygOnly ? PAYG_TAB_CAPTIONS.codex : undefined} maxHeightClass={codeMaxHeight} />
      </TabsContent>
      <TabsContent value="gemini" className="mt-0">
        <HeroCodeTab byok={HERO_GEMINI_BYOK} payg={HERO_GEMINI_PAYG} paygOnly={paygOnly} caption={paygOnly ? PAYG_TAB_CAPTIONS.gemini : undefined} maxHeightClass={codeMaxHeight} />
      </TabsContent>
      <TabsContent value="openclaw" className="mt-0">
        <HeroCodeTab byok={HERO_OPENCLAW_BYOK} payg={HERO_OPENCLAW_PAYG} paygOnly={paygOnly} caption={paygOnly ? PAYG_TAB_CAPTIONS.openclaw : undefined} maxHeightClass={codeMaxHeight} />
      </TabsContent>
    </Tabs>
  );
}


function OverviewUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
            <BarChart2 className="size-5 text-neutral-700" strokeWidth={1.75} />
          </div>
          <span className="text-sm text-neutral-500">No usage data yet</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TokenSavingsStrip() {
  return (
    <KpiRail columns={3}>
      <div className="flex flex-col items-center justify-center gap-3 bg-card p-6 min-h-[120px]">
        <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
          <BarChart2 className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
        <span className="text-sm text-neutral-500">No requests yet</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 bg-card p-6 min-h-[120px]">
        <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
          <Zap className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
        <span className="text-sm text-neutral-500">No token savings yet</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 bg-card p-6 min-h-[120px]">
        <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
          <ShieldAlert className="size-5 text-neutral-700" strokeWidth={1.75} />
        </div>
        <span className="text-sm text-neutral-500">No threats yet</span>
      </div>
    </KpiRail>
  );
}

function LatestRequestsTable() {
  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-neutral-900 m-0">Latest requests</h3>
        <Link
          to="/requests"
          className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm px-2 py-2 -mx-2 -my-2"
        >
          View all →
        </Link>
      </div>
      <table className="w-full text-sm" aria-label="Latest requests">
        <tbody>
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
                  <ArrowLeftRight className="size-5 text-neutral-700" strokeWidth={1.75} />
                </div>
                <span className="text-sm text-neutral-500">No requests yet</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RecentConversationsTable() {
  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-neutral-900 m-0">Latest conversations</h3>
        <Link
          to="/conversations"
          className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm px-2 py-2 -mx-2 -my-2"
        >
          View all →
        </Link>
      </div>
      <table className="w-full text-sm" aria-label="Latest conversations">
        <tbody>
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
                  <MessageSquare className="size-5 text-neutral-700" strokeWidth={1.75} />
                </div>
                <span className="text-sm text-neutral-500">No conversations yet</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SecurityEventsTable() {
  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-neutral-900 m-0">Latest security events</h3>
        <Link
          to="/security"
          className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm px-2 py-2 -mx-2 -my-2"
        >
          View all →
        </Link>
      </div>
      <table className="w-full text-sm" aria-label="Latest security events">
        <tbody>
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div aria-hidden className="size-12 rounded-md bg-muted flex items-center justify-center">
                  <ShieldAlert className="size-5 text-neutral-700" strokeWidth={1.75} />
                </div>
                <span className="text-sm text-neutral-500">No security events yet</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function DashboardDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
      activeNavId="overview"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Overview</PageTitle>
        <p className="font-sans text-neutral-600 text-base tracking-tight text-pretty m-0">
          Monitor request volume, token usage, spend, and security signals across your gateway.
        </p>
      </div>
      <div className="mb-2"><HeroCard /></div>
      <div className="flex flex-col gap-4">
        <h2 className="font-sans text-lg/6 font-medium tracking-snug text-neutral-900 text-balance m-0">
          Activity This Week
        </h2>
        <TokenSavingsStrip />
        <OverviewUsageChart />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LatestRequestsTable />
        <RecentConversationsTable />
        <SecurityEventsTable />
      </div>
    </DashboardChrome>
  );
}
