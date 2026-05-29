import { type ReactNode } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/copy-button';
import { AnthropicIcon, OpenAIIcon, GeminiIcon } from '@/components/icons/model-providers';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import type { LayoutContext } from '@/App';

const GATEWAY_URL = 'https://gateway-staging.constellationgate.ai';
const GATEWAY_KEY_PLACEHOLDER = 'sk-gw-…YOUR_KEY';

const ANTHROPIC_SNIPPET =
`export ANTHROPIC_AUTH_TOKEN="sk-ant-oat01-<your-token>"
export ANTHROPIC_BASE_URL="${GATEWAY_URL}"
export ANTHROPIC_CUSTOM_HEADERS="X-Gateway-Api-Key: ${GATEWAY_KEY_PLACEHOLDER}"`;

const OPENAI_SNIPPET =
`export OPENAI_BASE_URL="${GATEWAY_URL}"
export OPENAI_API_KEY="${GATEWAY_KEY_PLACEHOLDER}"`;

const GOOGLE_SNIPPET =
`export GOOGLE_BASE_URL="${GATEWAY_URL}"
export GOOGLE_API_KEY="${GATEWAY_KEY_PLACEHOLDER}"`;

const ENV_SNIPPET = `GATE_AI_API_KEY=${GATEWAY_KEY_PLACEHOLDER}`;

function CodeBlock({ filename, snippet }: { filename: string; snippet: string }) {
  const lines = snippet.split('\n');
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-neutral-50">
        <span className="flex items-center gap-2 font-mono text-xs text-neutral-500">
          <span className="text-neutral-400">&gt;_</span>
          {filename}
        </span>
        <CopyButton value={snippet} label={filename} />
      </div>
      <div className="bg-card p-4 flex flex-col gap-1">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-4 items-baseline">
            <span className="font-mono text-xs text-neutral-400 select-none tabular-nums w-4 text-right shrink-0">
              {i + 1}
            </span>
            <pre className="font-mono text-xs text-neutral-800 m-0 whitespace-pre">{line}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderSnippet({ snippet }: { snippet: string }) {
  return <CodeBlock filename="terminal" snippet={snippet} />;
}

function QuickStepCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card density="flush">
      <div className="pt-6 pr-6 pb-6 pl-4 flex gap-4 items-start">
        <div className="shrink-0 size-6 rounded-md bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600">
          {number}
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium text-neutral-900 m-0">{title}</h3>
            <p className="text-sm text-neutral-500 m-0">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}

export function GetStarted() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<LayoutContext>();

  return (
    <DashboardChrome
      activeNavId="get-started"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Get started</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Follow these steps to connect Gate AI and start routing requests.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-1/2">
        <QuickStepCard
          number={1}
          title="Read the docs"
          description="Get familiar with Gate AI architecture, authentication, and routing concepts."
        >
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://docs.constellationgate.ai', '_blank')}
            >
              Open docs <ExternalLink className="size-4 transition-transform duration-150 ease-out group-hover/button:translate-x-px group-hover/button:-translate-y-px motion-reduce:transition-none motion-reduce:group-hover/button:translate-x-0 motion-reduce:group-hover/button:translate-y-0" />
            </Button>
          </div>
        </QuickStepCard>

        <QuickStepCard
          number={2}
          title="Create an API key"
          description="Gate AI uses its own API keys to authenticate requests and track usage per key."
        >
          <div className="flex flex-col gap-4">
            <div>
              <Button size="sm" onClick={() => navigate('/api-keys')}>
                Create key
              </Button>
            </div>
            <CodeBlock filename=".env.local" snippet={ENV_SNIPPET} />
          </div>
        </QuickStepCard>

        <QuickStepCard
          number={3}
          title="Connect your SDK"
          description="Point your provider SDK at the gateway URL and set your credentials as environment variables."
        >
          <Tabs defaultValue="anthropic">
            <TabsList variant="line" className="px-0">
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
            <TabsContent value="anthropic" className="pt-2">
              <ProviderSnippet snippet={ANTHROPIC_SNIPPET} />
            </TabsContent>
            <TabsContent value="openai" className="pt-2">
              <ProviderSnippet snippet={OPENAI_SNIPPET} />
            </TabsContent>
            <TabsContent value="google" className="pt-2">
              <ProviderSnippet snippet={GOOGLE_SNIPPET} />
            </TabsContent>
          </Tabs>
        </QuickStepCard>

        <QuickStepCard
          number={4}
          title="Set a spend limit"
          description="Add a guardrail to cap monthly spend and prevent runaway costs."
        >
          <div>
            <Button size="sm" variant="outline" onClick={() => navigate('/guardrails?create=1')}>
              Set limit
            </Button>
          </div>
        </QuickStepCard>

        <QuickStepCard
          number={5}
          title="Add a security policy"
          description="Configure injection detection, PII redaction, and credential scanning."
        >
          <div>
            <Button size="sm" variant="outline" onClick={() => navigate('/policies')}>
              Add policy
            </Button>
          </div>
        </QuickStepCard>

        <QuickStepCard
          number={6}
          title="Invite your team"
          description="Give teammates access with scoped roles and per-key usage visibility."
        >
          <div>
            <Button size="sm" variant="outline" onClick={() => navigate('/team')}>
              Invite team
            </Button>
          </div>
        </QuickStepCard>
      </div>
    </DashboardChrome>
  );
}
