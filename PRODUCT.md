# Product

## Register

product

## Users

Operators and engineering leads running AI workloads in production. They live in this dashboard during incidents, budget reviews, and compliance audits — not casual browsers. Primary persona: technical operator who owns the API gateway and needs to spot problems fast, control costs, and prove to stakeholders that AI usage is auditable and safe.

## Product Purpose

Constellation Gate AI is an AI gateway dashboard. It sits between an organization's code and AI providers (Anthropic, OpenAI, Google, etc.), routing requests, enforcing guardrails, caching responses, and anchoring an immutable audit trail to Constellation's Digital Evidence layer. The dashboard surfaces that activity: spend, token usage, request patterns, security events, and cryptographically verifiable audit records. Success looks like: an operator opens the dashboard and in under 30 seconds knows if something is wrong, what it cost, and whether it's auditable.

## Brand Personality

Precise, direct, trustworthy. Not flashy. The interface should feel like a tool built by engineers for engineers — no marketing speak, no decorative flourish. Every element earns its space.

## Anti-references

- Generic SaaS dashboards (pastel gradients, big hero illustrations, "Welcome back, Alex!" onboarding carousels)
- Crypto/Web3 aesthetics (dark mode neon, on-chain language, blockchain terminology)
- Enterprise software that looks like it was designed in 2014 (excessive chrome, nested modals, wizard flows)
- Datadog/Grafana clones (pure monitoring aesthetic, no product identity)

## Design Principles

1. **Signal over decoration** — every visual element either communicates data or aids navigation. Decoration that doesn't carry information is removed.
2. **Operator time is scarce** — information hierarchy is ruthless. The most important number is biggest. Secondary context is muted. Nothing competes for equal attention.
3. **Tamper-evident by default** — audit and security features are not buried. They're first-class citizens alongside cost and usage.
4. **Dense but not cramped** — this is a power tool. Compact layouts are correct; whitespace is used for rhythm, not to pad thin content.
5. **Consistent above clever** — shared components and patterns everywhere. One-off implementations are bugs, not features.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Keyboard navigation required for all interactive elements. Focus indicators must be visible. Color is never the sole signal (badges have text labels, status has icons). Reduced motion respected via `motion-reduce:` Tailwind utilities.
