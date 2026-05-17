import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KpiRail } from '@/components/ui/kpi-rail';
import { KpiTile } from '@/components/ui/kpi-tile';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { DashboardChrome } from '@/layouts/DashboardChrome';

export function TokenSavings() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  return (
    <DashboardChrome
      activeNavId="token-savings"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <KpiRailSection />
      <MechanismGrid />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <PageTitle>Token Savings</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0 max-w-1/2">
        Cache, compress and deduplicate to spend less per request. Every saved token is anchored on Constellation DE for verifiable cost reporting.
      </p>
    </div>
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

function KpiRailSection() {
  return (
    <KpiRail columns={3}>
      <KpiTile title="Total saved" value="0" valueSuffix="%" />
      <KpiTile title="Caching" value="0" valueSuffix="%" />
      <KpiTile title="Compression" value="0" valueSuffix="%" />
    </KpiRail>
  );
}

/* ─── Mechanism cards ───────────────────────────────────────────────── */

function MechanismGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CachingCard />
      <CompressionCard />
    </div>
  );
}

function CardChromeHeader({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <CardHeader className="border-b border-border">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h3 className="font-sans text-base font-medium text-neutral-900 m-0">
            {title}
          </h3>
          <p className="font-sans text-sm text-neutral-500 m-0">{description}</p>
        </div>
        <Badge variant={enabled ? 'success' : 'neutral'}>
          {enabled ? 'ON' : 'OFF'}
        </Badge>
      </div>
    </CardHeader>
  );
}

const TTL_OPTIONS = [
  { value: '5m', label: '5m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
] as const;

function CachingCard() {
  const [enabled, setEnabled] = useState(true);
  const [ttl, setTtl] = useState('1h');

  return (
    <Card>
      <CardChromeHeader
        title="Caching"
        description="Reuse identical or semantically similar responses"
        enabled={enabled}
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p id="caching-switch-label" className="font-sans text-sm font-medium text-neutral-900 m-0">
              Enable response caching
            </p>
            <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
              Serve cached responses instead of round-tripping to providers. Identical concurrent requests are deduplicated automatically.
            </p>
          </div>
          <Switch
            aria-labelledby="caching-switch-label"
            checked={enabled}
            onCheckedChange={(next) => {
              setEnabled(next);
              toast.success('Response caching saved');
            }}
            className="mt-1 shrink-0"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p id="ttl-label" className="font-sans text-sm font-medium text-neutral-900 m-0">
              TTL
            </p>
            <p className="font-sans text-sm text-neutral-500 m-0">
              How long cached entries live before re-fetching.
            </p>
          </div>
          <Select
            value={ttl}
            onValueChange={(next) => {
              setTtl(next);
              toast.success('TTL saved');
            }}
          >
            <SelectTrigger className="w-24 shrink-0" aria-labelledby="ttl-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function CompressionCard() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Card>
      <CardChromeHeader
        title="Compression"
        description="Shrink prompts before they reach the provider"
        enabled={enabled}
      />
      <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <p id="compression-switch-label" className="font-sans text-sm font-medium text-neutral-900 m-0">
                Enable compression
              </p>
              <p className="font-sans text-sm text-neutral-500 m-0 text-pretty">
                Strip envelopes, condense embedded tool output (git diff, cargo, pytest…), and apply lossless prose heuristics. Deterministic and cache-friendly.
              </p>
            </div>
            <Switch
              aria-labelledby="compression-switch-label"
              checked={enabled}
              onCheckedChange={setEnabled}
              className="mt-1 shrink-0"
            />
          </div>
        </CardContent>
    </Card>
  );
}
