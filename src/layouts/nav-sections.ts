import {
  Activity,
  ArrowLeftRight,
  Box,
  Coins,
  CreditCard,
  Home,
  KeyRound,
  Lock,
  MessageSquare,
  Settings2,
  Shield,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import type { SidebarSection } from '@/components/ui/sidebar';

/* Single source of truth for the production-shell sidebar. Active state is
 * derived from the page's `activeNavId` matched against `SidebarItem.id`.
 * The `pageId` field holds the URL path navigated to on click — the page
 * passes it straight to react-router's navigate(). Items without a path
 * are inert affordances (Token Savings, Guardrails, etc.) pending real
 * surfaces. */

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [
      { id: 'overview',      icon: Home,           label: 'Overview' },
      { id: 'requests',      icon: ArrowLeftRight, label: 'Requests',      pageId: '/requests' },
      { id: 'conversations', icon: MessageSquare,  label: 'Conversations', pageId: '/conversations' },
    ],
  },
  {
    label: 'Gateway',
    items: [
      { id: 'models',        icon: Box,         label: 'Models', pageId: '/models' },
      { id: 'token-savings', icon: Coins,       label: 'Token Savings' },
      { id: 'guardrails',    icon: ShieldCheck, label: 'Guardrails' },
    ],
  },
  {
    label: 'Security',
    items: [
      { id: 'security-events', icon: TriangleAlert, label: 'Events', pageId: '/security' },
      { id: 'policies',        icon: Shield,        label: 'Policies' },
    ],
  },
  {
    label: 'Audit',
    items: [{ id: 'audit-trail', icon: Lock, label: 'Audit Trail' }],
  },
  {
    label: 'Workspace Admin',
    items: [
      { id: 'activity', icon: Activity,   label: 'Activity', pageId: '/activity' },
      { id: 'team',     icon: Users,      label: 'Team',     pageId: '/team' },
      { id: 'billing',  icon: CreditCard, label: 'Billing' },
      { id: 'api-keys', icon: KeyRound,   label: 'API Access', pageId: '/api-keys' },
      { id: 'settings', icon: Settings2,  label: 'Settings', pageId: '/settings' },
    ],
  },
];
