import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"

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
import { TextLink } from "@/components/ui/text-link"

export function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [invite, setInvite] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <AuthLayout>
      <Card className="w-100 rounded-xl shadow-(--shadow-modal) data-[density=default]:py-6">
        <CardHeader className="gap-y-2 px-6">
          <CardTitle className="text-xl">Enter your invite code</CardTitle>
          <CardDescription>
            Sign-ups are currently invite-only. Drop your code in to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="text-neutral-600">Work email</FieldLabel>
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
                <FieldLabel htmlFor="invite" className="text-neutral-600">Invite code</FieldLabel>
                <Input
                  id="invite"
                  type="text"
                  placeholder="e.g. ABC123-XYZ789"
                  autoComplete="off"
                  spellCheck={false}
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  className="font-mono"
                />
              </Field>

              <Button type="submit" size="lg" className="relative w-full">
                Continue with email
                <ArrowRight
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden
                />
              </Button>

              <FieldSeparator>or</FieldSeparator>

              <Button type="button" variant="outline" size="lg" className="w-full">
                <GoogleG />
                Continue with Google
              </Button>
            </FieldGroup>

            <p className="mt-4 text-center text-xs/5 text-neutral-500">
              Your invite code is single-use. Find it in your welcome email.
            </p>
          </form>
        </CardContent>

        <CardFooter className="justify-center p-6 pt-2">
          <p className="text-xs text-neutral-500">
            Already have an account?{" "}
            <TextLink className="text-xs" onClick={() => navigate("/sign-in")}>
              Sign in
            </TextLink>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
