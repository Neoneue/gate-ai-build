import { ArrowRight, Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleG } from "@/components/icons/google-g";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import {
  markMobileATab,
  ONBOARDING_AUTH,
  ONBOARDING_ROUTES,
  ONBOARDING_SIGNUP_STATE,
  type PhoneDemoVersion,
  rememberSignupName,
} from "@/pages/onboarding/onboarding-routes";

/* ─────────────────────────────────────────────────────────────────────────
 * OnboardingSignUp: the Onboarding demo's "Create your account" card on
 * `/sign-up-onboarding` (owner 2026-10-12, from the live product). Its own
 * file so `/sign-up` (`pages/SignUp.tsx`, the invite-code card) stays
 * untouched (`.claude/rules/no-thrash.md`). Mounted under
 * `OnboardingAuthLayout`, which draws the logo and the copyright line.
 *
 * Gates (demo): the EULA checkbox enables Continue with Google; Create
 * account also needs a full name, a work email (any text) and all five
 * password criteria. Pressing either disables both and shows "Creating
 * account" with a spinner on the pressed one; after CREATE_ACCOUNT_DELAY_MS
 * signup finishes the way SignUp.tsx does on the onboarding route: mark the
 * Mobile A tab, then open Gate Chat. Mobile B (`/sign-up-onboarding/b`,
 * owner 2026-10-13) skips the mark and opens the 2-card phone start.
 *
 * Phone touch targets, below md (owner 2026-10-12): both full-width actions
 * are Button `default`, which steps up to 44px on a touch screen by itself
 * (design.md, Touch targets); the show-password toggle keeps its 24px box and 14px eye
 * and gets a 36x36 tap area from a centred `after:` box (owner: "make the
 * show password 36 for now"), the checkbox's hit-area recipe. It reaches at
 * most 6px into the input's 8px end padding, so it never covers typed text.
 * The EULA checkbox's own hit area (38x30) already clears 24x24. md+ is
 * unchanged.
 * ───────────────────────────────────────────────────────────────────────── */

const MIN_PASSWORD_LENGTH = 12;

/** The mock "Creating account" wait before Gate Chat opens (owner
 *  2026-10-12). */
const CREATE_ACCOUNT_DELAY_MS = 3000;

type SignupPath = "email" | "google";

const LOWERCASE_RE = /\p{Ll}/u;
const UPPERCASE_RE = /\p{Lu}/u;
const NUMBER_RE = /\p{N}/u;
// Anything that is not a letter, a number or whitespace counts as a symbol.
const SYMBOL_RE = /[^\p{L}\p{N}\s]/u;

const CRITERIA = [
  {
    id: "length",
    label: "At least 12 characters",
    // Code points, so an emoji counts once.
    test: (value: string) => [...value].length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value: string) => LOWERCASE_RE.test(value),
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value: string) => UPPERCASE_RE.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value: string) => NUMBER_RE.test(value),
  },
  {
    id: "symbol",
    label: "One symbol",
    test: (value: string) => SYMBOL_RE.test(value),
  },
] as const;

/* Meter fill by criteria met, per design.md "Data bars & meters": a status
 * family runs its 500 step to its 400 step. 1-2 danger, 3-4 warning, 5
 * success; at 0 the fill is scaled to nothing, so its family is moot. */
function strengthFill(met: number): string {
  if (met >= CRITERIA.length) {
    return "from-success-500 to-success-400";
  }
  if (met >= 3) {
    return "from-warning-500 to-warning-400";
  }
  return "from-danger-500 to-danger-400";
}

/* Inert legal links (mockup): anchors, not buttons, because the EULA link
 * sits inside a <label>, which may not hold another labelable control. */
const preventNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
};

export function OnboardingSignUp({ version }: { version: PhoneDemoVersion }) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const results = CRITERIA.map((criterion) => ({
    ...criterion,
    met: criterion.test(password),
  }));
  const metCount = results.filter((r) => r.met).length;
  const canCreate =
    agreed &&
    name.trim() !== "" &&
    email.trim() !== "" &&
    metCount === CRITERIA.length;

  // Which path is creating the account; null at rest. While set, both
  // buttons are disabled and the pressed one shows the spinner.
  const [pending, setPending] = useState<SignupPath | null>(null);

  // The mock create (owner 2026-10-12): wait, then finish signup the way
  // SignUp.tsx does on the onboarding route. Cleared if the card unmounts.
  useEffect(() => {
    if (pending === null) {
      return;
    }
    const timer = setTimeout(() => {
      if (version === "b") {
        navigate(ONBOARDING_ROUTES.start, { state: ONBOARDING_SIGNUP_STATE });
        return;
      }
      markMobileATab();
      navigate(ONBOARDING_ROUTES.chat, { state: ONBOARDING_SIGNUP_STATE });
    }, CREATE_ACCOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pending, navigate, version]);

  function startSignup(path: SignupPath) {
    if (pending !== null) {
      return;
    }
    // The Activity page's Top users row reads this; Google carries no name.
    rememberSignupName(path === "email" ? name : "");
    setPending(path);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (canCreate && pending === null) {
      startSignup("email");
    }
  }

  return (
    // `flex-1 max-w-100`: SignUp.tsx's 400px card that also shrinks to fit.
    // Below md the -8px inline margins turn the layout's 24px gutter into
    // the 16px phone gutter (design.md Spacing, step 4).
    <Card className="max-w-100 flex-1 rounded-lg shadow-lg data-[density=default]:py-6 max-md:-mx-2">
      <CardHeader className="gap-y-2 px-6">
        <CardTitle className="type-heading-20">Create your account</CardTitle>
        <CardDescription>
          Start tracking every agent call. Audit-ready from day one.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6">
        <form noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            {/* Confirmation gate, same shape as the API key "saved" check
                (ApiKeys.tsx): it enables both signup paths below. */}
            <Field orientation="horizontal">
              <Checkbox
                checked={agreed}
                id="onboarding-signup-eula"
                onCheckedChange={(next) => setAgreed(next === true)}
              />
              <FieldContent>
                <FieldLabel
                  className="type-label-14 text-muted-foreground"
                  htmlFor="onboarding-signup-eula"
                >
                  {/* One span keeps the sentence and its link in one
                      inline run: FieldLabel is a flex row. */}
                  <span>
                    I have read and agree to the{" "}
                    <TextLink as="a" href="#" onClick={preventNavigation}>
                      Gate AI End User License Agreement
                    </TextLink>
                    .
                  </span>
                </FieldLabel>
              </FieldContent>
            </Field>

            <Button
              aria-busy={pending === "google"}
              className="w-full"
              disabled={!agreed || pending !== null}
              onClick={() => startSignup("google")}
              size="default"
              type="button"
              variant="outline"
            >
              {pending === "google" ? (
                <>
                  <Loader2
                    aria-hidden
                    className="animate-spin motion-reduce:animate-none"
                    data-icon="inline-start"
                  />
                  Creating account
                </>
              ) : (
                <>
                  <GoogleG />
                  Continue with Google
                </>
              )}
            </Button>

            <FieldSeparator>or sign up with email</FieldSeparator>

            <Field>
              <FieldLabel
                className="text-muted-foreground"
                htmlFor="onboarding-signup-name"
              >
                Full name
              </FieldLabel>
              <Input
                autoComplete="name"
                id="onboarding-signup-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                type="text"
                value={name}
              />
            </Field>

            <Field>
              <FieldLabel
                className="text-muted-foreground"
                htmlFor="onboarding-signup-email"
              >
                Work email
              </FieldLabel>
              <Input
                autoComplete="email"
                id="onboarding-signup-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                spellCheck={false}
                type="email"
                value={email}
              />
            </Field>

            <Field>
              <FieldLabel
                className="text-muted-foreground"
                htmlFor="onboarding-signup-password"
              >
                Password
              </FieldLabel>
              <InputGroup>
                {/* InputGroupInput zeroes Input's ring but not its 2px ring
                    offset, which paints a background-colour box inside the
                    group on focus. The group draws the one focus ring, so
                    drop the offset here (combobox.tsx precedent). */}
                <InputGroupInput
                  aria-describedby="onboarding-signup-criteria"
                  autoComplete="new-password"
                  className="focus-visible:ring-offset-0"
                  id="onboarding-signup-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Pick something strong"
                  spellCheck={false}
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <InputGroupAddon align="inline-end">
                  {/* Below md: a 36x36 tap area, centred on the 24px box. */}
                  <InputGroupButton
                    aria-controls="onboarding-signup-password"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="max-md:after:-translate-1/2 max-md:relative max-md:after:absolute max-md:after:top-1/2 max-md:after:left-1/2 max-md:after:size-9"
                    onClick={() => setShowPassword((shown) => !shown)}
                    size="icon-xs"
                    variant="ghost"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden strokeWidth={1.75} />
                    ) : (
                      <Eye aria-hidden strokeWidth={1.75} />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>

              {/* 16px under the input to the meter, 12px to the list (Field's
                  own 8px gap plus mt-2). */}
              <div className="mt-2 flex flex-col gap-3">
                {/* Track and fill per design.md "Data bars & meters"; the
                    fill scales from the left (SummaryCard.tsx precedent) and
                    its gradient stops ease between families. */}
                <div
                  aria-label="Password strength"
                  aria-valuemax={CRITERIA.length}
                  aria-valuemin={0}
                  aria-valuenow={metCount}
                  aria-valuetext={`${metCount} of ${CRITERIA.length} requirements met`}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="meter"
                >
                  <div
                    className={cn(
                      "h-full w-full origin-left rounded-full bg-gradient-to-r transition-[scale,--tw-gradient-from,--tw-gradient-to] duration-200 ease-out motion-reduce:transition-none",
                      strengthFill(metCount)
                    )}
                    data-met={metCount}
                    data-slot="password-strength-fill"
                    style={{ scale: `${metCount / CRITERIA.length} 1` }}
                  />
                </div>

                <ul
                  className="grid grid-cols-2 gap-x-4 gap-y-1"
                  id="onboarding-signup-criteria"
                >
                  {results.map((criterion) => (
                    <li
                      className={cn(
                        "type-copy-12 flex items-center gap-2",
                        criterion.met
                          ? "text-success-700 dark:text-success-300"
                          : "text-muted-foreground"
                      )}
                      data-met={criterion.met}
                      key={criterion.id}
                    >
                      {criterion.met ? (
                        <Check
                          aria-hidden
                          className="size-4 shrink-0"
                          strokeWidth={1.75}
                        />
                      ) : (
                        <X
                          aria-hidden
                          className="size-4 shrink-0"
                          strokeWidth={1.75}
                        />
                      )}
                      {/* Copy placeholder: the met / not met words for
                          screen readers, pending the copywriter. */}
                      <span className="sr-only">
                        {criterion.met ? "Met:" : "Not met:"}
                      </span>
                      <span>{criterion.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Field>

            <Button
              aria-busy={pending === "email"}
              className="relative w-full"
              disabled={!canCreate || pending !== null}
              size="default"
              type="submit"
            >
              {pending === "email" ? (
                <>
                  <Loader2
                    aria-hidden
                    className="animate-spin motion-reduce:animate-none"
                    data-icon="inline-start"
                  />
                  Creating account
                </>
              ) : (
                <>
                  Create account
                  {/* Pinned to the inline end, the label stays centered
                      (owner screenshot). */}
                  <ArrowRight
                    aria-hidden
                    className="absolute end-3"
                    data-icon="inline-end"
                    strokeWidth={1.75}
                  />
                </>
              )}
            </Button>
          </FieldGroup>

          <p className="type-copy-12 mt-4 text-center text-muted-foreground leading-5">
            By creating an account you agree to the{" "}
            <TextLink as="a" href="#" onClick={preventNavigation}>
              Terms
            </TextLink>{" "}
            and{" "}
            <TextLink as="a" href="#" onClick={preventNavigation}>
              Privacy Policy
            </TextLink>
            .
          </p>
        </form>
      </CardContent>

      <CardFooter className="justify-center p-6 pt-2">
        <p className="type-copy-12 text-muted-foreground">
          Already have an account?{" "}
          {/* Below md: a 36px-tall tap area on the 16px line, the
              show-password recipe. */}
          <TextLink
            className="type-copy-12 max-md:relative max-md:after:absolute max-md:after:inset-x-0 max-md:after:top-1/2 max-md:after:h-9 max-md:after:-translate-y-1/2"
            to={ONBOARDING_AUTH[version].signIn}
          >
            Sign in
          </TextLink>
        </p>
      </CardFooter>
    </Card>
  );
}
