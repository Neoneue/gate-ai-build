import { useState } from "react"
import { ArrowRight, Eye, EyeOff, Fingerprint, KeyRound, ShieldCheck, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { TextLink } from "@/components/ui/text-link"

// ─── Google G SVG ────────────────────────────────────────────────────────────
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-4 shrink-0" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

// ─── Feature bullets ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: ShieldCheck,
    title: "Cryptographic audit",
    sub: "Every prompt and response signed in Constellation.",
  },
  {
    Icon: Fingerprint,
    title: "Passkey-first access",
    sub: "Phishing-resistant sign-in, no shared secrets.",
  },
  {
    Icon: Zap,
    title: "Sub-millisecond gate decisions",
    sub: "Policy checks run inline without slowing your app.",
  },
] as const

export function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background split — full-bleed, behind everything */}
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="bg-neutral-950" />
        <div className="bg-background" />
      </div>

      {/* Page-level 12-col grid — 64px outer margin */}
      <div className="relative grid h-full grid-cols-12 grid-rows-[auto_1fr_auto] gap-x-4 px-16 py-10">
        {/* Brand mark — top-left, 4 cols */}
        <div className="col-span-4 row-start-1 flex items-center gap-2">
          <img
            src="/logomark.svg"
            alt="Gate AI"
            className="size-6 brightness-0 invert"
          />
          <span className="text-sm font-medium text-white">Gate AI</span>
        </div>

        {/* Hero block — cols 1-4, vertically centered */}
        <div className="col-span-4 col-start-1 row-start-2 self-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white">
            The source-of-truth for every agent call.
          </h1>
          <p className="mt-4 text-base/7 text-neutral-400">
            Every prompt, response, and policy decision is signed into a
            tamper-evident tree anchored to Constellation's Digital Evidence
            layer, so your audit trail is cryptographically verifiable.
          </p>

          {/* Feature bullets */}
          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ Icon, title, sub }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-neutral-900 text-white">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="pt-1">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs/5 text-neutral-400">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Sign-in card — right half (cols 7-12), centered */}
        <div className="col-span-6 col-start-7 row-start-2 flex justify-center self-center">
        <Card className="w-100">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Welcome back. Pick any of the methods below to continue.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {/* Email */}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                {/* Password */}
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <TextLink className="text-xs">Forgot password?</TextLink>
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      id="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        onClick={() => setShowPwd((v) => !v)}
                      >
                        {showPwd ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                {/* Primary CTA */}
                <Button type="submit" size="lg" className="relative w-full">
                  Sign in
                  <ArrowRight
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-hidden
                  />
                </Button>

                <FieldSeparator>or</FieldSeparator>

                {/* Passkey */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <KeyRound className="size-4" />
                  Continue with a passkey
                </Button>

                {/* Google */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <GoogleG />
                  Continue with Google
                </Button>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-xs text-neutral-500">
              New to Constellation Gate?{" "}
              <TextLink className="text-xs">Create an account</TextLink>
            </p>
          </CardFooter>
        </Card>
        </div>

        {/* Bottom trust strip — cols 1-4, bottom row */}
        <p className="col-span-4 col-start-1 row-start-3 self-end text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Zero-knowledge verification&nbsp;&nbsp;·&nbsp;&nbsp;SOC 2 trajectory&nbsp;&nbsp;·&nbsp;&nbsp;SSO readiness
        </p>
      </div>
    </div>
  )
}
