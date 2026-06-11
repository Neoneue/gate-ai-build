import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { GoogleG } from "@/components/ui/google-g";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { TextLink } from "@/components/ui/text-link";

export function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <Card className="w-100 rounded-lg shadow-(--shadow-modal) data-[density=default]:py-6">
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
              <FieldLabel className="text-neutral-600" htmlFor="email">
                Email
              </FieldLabel>
              <Input
                autoComplete="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
                value={email}
              />
            </Field>

            <Field>
              <FieldLabel className="text-neutral-600" htmlFor="password">
                Password
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  autoComplete="current-password"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    onClick={() => setShowPwd((v) => !v)}
                    size="icon-sm"
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

            <Button className="relative w-full" size="lg" type="submit">
              Sign in
              <ArrowRight
                aria-hidden
                className="absolute top-1/2 right-3 -translate-y-1/2"
              />
            </Button>

            <FieldSeparator>or</FieldSeparator>

            <Button
              className="w-full"
              size="lg"
              type="button"
              variant="outline"
            >
              <KeyRound className="size-4" />
              Continue with a passkey
            </Button>

            <Button
              className="w-full"
              size="lg"
              type="button"
              variant="outline"
            >
              <GoogleG />
              Continue with Google
            </Button>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-center p-6 pt-2">
        <p className="text-neutral-500 text-xs">
          New to Constellation Gate?{" "}
          <TextLink className="text-xs" onClick={() => navigate("/sign-up")}>
            Create an account
          </TextLink>
        </p>
      </CardFooter>
    </Card>
  );
}
