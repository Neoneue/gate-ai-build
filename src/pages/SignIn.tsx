import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react"

import { AuthLayout } from "@/layouts/AuthLayout"
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
import { GoogleG } from "@/components/ui/google-g"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { TextLink } from "@/components/ui/text-link"

export function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <AuthLayout>
      <Card className="w-100 rounded-xl shadow-(--shadow-modal) data-[density=default]:py-6">
        <CardHeader className="gap-y-2 px-6">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Welcome back. Pick any of the methods below to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="text-neutral-600">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password" className="text-neutral-600">Password</FieldLabel>
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

              <Button type="submit" size="lg" className="relative w-full">
                Sign in
                <ArrowRight
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden
                />
              </Button>

              <FieldSeparator>or</FieldSeparator>

              <Button type="button" variant="outline" size="lg" className="w-full">
                <KeyRound className="size-4" />
                Continue with a passkey
              </Button>

              <Button type="button" variant="outline" size="lg" className="w-full">
                <GoogleG />
                Continue with Google
              </Button>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="justify-center p-6 pt-2">
          <p className="text-xs text-neutral-500">
            New to Constellation Gate?{" "}
            <TextLink className="text-xs" onClick={() => navigate("/sign-up")}>
              Create an account
            </TextLink>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
