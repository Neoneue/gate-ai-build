import { ArrowRight } from "lucide-react";
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
import { TextLink } from "@/components/ui/text-link";

export function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <Card className="w-100 rounded-lg shadow-(--shadow-modal) data-[density=default]:py-6">
      <CardHeader className="gap-y-2 px-6">
        <CardTitle className="type-heading-20">
          Enter your invite code
        </CardTitle>
        <CardDescription>
          Sign-ups are currently invite-only. Drop your code in to continue.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel className="text-neutral-600" htmlFor="email">
                Work email
              </FieldLabel>
              <Input
                autoComplete="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                spellCheck={false}
                type="email"
                value={email}
              />
            </Field>

            <Field>
              <FieldLabel className="text-neutral-600" htmlFor="invite">
                Invite code
              </FieldLabel>
              <Input
                autoComplete="off"
                className="font-mono"
                id="invite"
                onChange={(e) => setInvite(e.target.value)}
                placeholder="e.g. ABC123-XYZ789"
                spellCheck={false}
                type="text"
                value={invite}
              />
            </Field>

            <Button className="relative w-full" size="lg" type="submit">
              Continue with email
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
              <GoogleG />
              Continue with Google
            </Button>
          </FieldGroup>

          <p className="type-copy-12 mt-4 text-center text-muted-foreground leading-5">
            Your invite code is single-use. Find it in your welcome email.
          </p>
        </form>
      </CardContent>

      <CardFooter className="justify-center p-6 pt-2">
        <p className="type-copy-12 text-muted-foreground">
          Already have an account?{" "}
          <TextLink
            className="type-copy-12"
            onClick={() => navigate("/sign-in")}
          >
            Sign in
          </TextLink>
        </p>
      </CardFooter>
    </Card>
  );
}
