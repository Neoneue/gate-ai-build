import { useState } from 'react';
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { AnthropicIcon, OpenAIIcon, GeminiIcon, GrokIcon, MetaIcon, MistralIcon } from '@/components/icons/model-providers';
import { BrandMark } from '@/components/icons/brand-mark';
import { Badge } from '@/components/ui/badge';

const GATEWAY_URL = 'https://gateway-staging.constellationgate.ai';
const GATEWAY_KEY_PLACEHOLDER = 'sk-gw-…YOUR_KEY';

const HERO_ANTHROPIC_SNIPPET =
`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: "${GATEWAY_URL}",
  apiKey: "${GATEWAY_KEY_PLACEHOLDER}",
});

const msg = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.content);`;

const HERO_OPENAI_SNIPPET =
`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_URL}",
  apiKey: "${GATEWAY_KEY_PLACEHOLDER}",
});

const msg = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(msg.choices[0].message.content);`;

const HERO_GOOGLE_SNIPPET =
`import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("${GATEWAY_KEY_PLACEHOLDER}");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const result = await model.generateContent("Hello!");
console.log(result.response.text());`;

export const HERO_SNIPPETS: Record<string, string> = {
  anthropic: HERO_ANTHROPIC_SNIPPET,
  openai: HERO_OPENAI_SNIPPET,
  google: HERO_GOOGLE_SNIPPET,
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

function HeroCard() {
  const navigate = useNavigate();
  const [activeHeroTab, setActiveHeroTab] = useState<'gate-connect' | 'anthropic' | 'openai' | 'google'>('gate-connect');

  return (
    <Card density="flush">
      <div className="flex h-[340px] overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 overflow-hidden">
            {/* Decorative app preview — pre-faded/cropped asset, fit cleanly inside, right-aligned + vertically centered */}
            <img
              src="/gateconnect-app-fade.png"
              alt=""
              aria-hidden
              className="pointer-events-none select-none absolute inset-0 size-full object-contain object-right translate-y-[10px] scale-90 origin-right"
            />
            <div className="relative z-10 flex flex-col gap-6 p-8">
              <div className="flex flex-col gap-2">
                {false && <Badge variant="info">Recommended</Badge>}
                <h3 className="text-2xl font-semibold tracking-tight text-neutral-900 m-0">
                  Get started with our Gate Connect App
                </h3>
                <p className="text-sm text-neutral-500 text-pretty max-w-[480px] m-0">
                  Connect your providers or individual models to Gate AI using our app. Gate Connect writes the config for you, so every request flows right through the gateway. <span className="font-semibold">No code required.</span>
                </p>
              </div>
              <div className="flex">
                <Dialog disablePointerDismissal>
                  <DialogTrigger
                    render={
                      <Button size="lg">
                        <Download className="size-4" data-icon="inline-start" /> Download Gate Connect
                      </Button>
                    }
                  />
                  <DialogContent showCloseButton={false} className="p-0 gap-0 overflow-hidden sm:max-w-[440px]">
                    {/* Image slot */}
                    <div className="aspect-video bg-neutral-100 border-b border-border flex items-center justify-center px-6 pt-10 pb-4">
                      <img
                        src="/gateconnect-app.png"
                        alt="Gate Connect desktop app"
                        className="max-h-full max-w-full object-contain scale-[1.125] -translate-y-1"
                      />
                    </div>
                    {/* Body */}
                    <div className="flex flex-col gap-6 p-6">
                      <div className="flex flex-col gap-2">
                        <DialogTitle className="text-lg leading-none font-medium text-neutral-900 m-0">
                          Get started with our Gate Connect App
                        </DialogTitle>
                        <DialogDescription className="text-sm text-neutral-500 text-pretty m-0">
                          Connect your providers or individual models to Gate AI using our app. Gate Connect writes the config for you, so every request flows right through the gateway.
                          <br />
                          <span className="font-semibold">No code required.</span>
                        </DialogDescription>
                      </div>
                      <div className="flex items-center justify-between">
                        <DialogClose render={<Button variant="outline">Skip</Button>} />
                        <Button>
                          <Download className="size-4" data-icon="inline-start" /> Download Gate Connect
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className="border-t border-border px-8 py-4 flex items-center gap-4">
            <span className="text-sm text-neutral-500">Works with</span>
            {[
              { Icon: OpenAIIcon,    name: 'OpenAI' },
              { Icon: GrokIcon,      name: 'xAI' },
              { Icon: AnthropicIcon, name: 'Anthropic' },
              { Icon: GeminiIcon,    name: 'Google' },
              { Icon: MetaIcon,      name: 'Meta' },
              { Icon: MistralIcon,   name: 'Mistral' },
            ].map(({ Icon, name }) => (
              <div key={name} className="flex items-center gap-2">
                <Icon className="size-4 text-neutral-600 shrink-0" />
                <span className="text-sm text-neutral-700">{name}</span>
              </div>
            ))}
            <span className="text-sm text-neutral-500 italic">+ many more</span>
          </div>
        </div>

        {/* Right panel — code snippet (hidden; kept for easy restore) */}
        {false && (
        <div className="flex-1 border-l border-border flex flex-col">
          <Tabs defaultValue="gate-connect" className="flex flex-col flex-1" onValueChange={(v) => setActiveHeroTab(v as 'gate-connect' | 'anthropic' | 'openai' | 'google')}>
            <div className="flex items-center justify-between px-4 border-b border-border">
              <TabsList variant="line" className="px-0 border-b-0">
                <TabsTrigger value="gate-connect">
                  <BrandMark className="size-4 text-blue-700" />Gate Connect
                </TabsTrigger>
                <TabsTrigger value="anthropic">
                  <AnthropicIcon className="size-4" />Anthropic
                </TabsTrigger>
                <TabsTrigger value="openai">
                  <OpenAIIcon className="size-4" />OpenAI
                </TabsTrigger>
                <TabsTrigger value="google">
                  <GeminiIcon className="size-4" />Google
                </TabsTrigger>
              </TabsList>
              {activeHeroTab !== 'gate-connect' && (
                <CopyButton mode="label" text="Copy code" value={HERO_SNIPPETS[activeHeroTab]} label="code snippet" />
              )}
            </div>
            <TabsContent value="gate-connect" className="flex-1 mt-0">
              <div className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 m-0">
                    Start using Constellation Gate AI
                  </h2>
                  <p className="text-sm text-neutral-500 text-pretty max-w-md m-0">
                    Built on the AI SDK, Constellation Gate lets you switch between hundreds of models without managing rate limits or provider accounts.
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
            </TabsContent>
            <TabsContent value="anthropic" className="flex-1 mt-0">
              <CodePanel snippet={HERO_ANTHROPIC_SNIPPET} />
            </TabsContent>
            <TabsContent value="openai" className="flex-1 mt-0">
              <CodePanel snippet={HERO_OPENAI_SNIPPET} />
            </TabsContent>
            <TabsContent value="google" className="flex-1 mt-0">
              <CodePanel snippet={HERO_GOOGLE_SNIPPET} />
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>
    </Card>
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
