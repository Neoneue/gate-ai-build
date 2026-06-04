# Credentials — Findings Reference (Gate AI)

> **Purpose:** the source of truth for how the gateway detects leaked **credentials /
> secrets** (API keys, tokens) via **regex + Shannon entropy**, and exactly which finding
> values are real detector outputs. Companion to `Presidio-findings.md` (which covers PII).
> Use this when building any modal/UI that surfaces a credential finding. Grounded in
> context7 research (2026-06-03) against `yelp/detect-secrets` and `gitleaks/gitleaks`.
>
> **Hard rule:** if a value isn't traceable to a row in the tables below, it does not go on
> screen as a detector fact. Credential detection is **NOT** Presidio — see §0.

---

## 0. TL;DR scope

| Capability | Source | Notes |
| --- | --- | --- |
| Credential / API-key detection | regex + entropy | not a Presidio built-in |
| Where it runs | a custom Presidio `EntityRecognizer` (regex + entropy in `validate_result`) **or** a dedicated scanner (detect-secrets / gitleaks) | same finding shape either way |
| Detection result | **binary** (matched / not) | no graded 0–1 score like Presidio; the *measured entropy* is the meaningful number |
| Canonical tools | `detect-secrets` (Yelp), `gitleaks` | both combine regex detectors + high-entropy detection |

**One-line takeaway:** regex finds the candidate by *shape*; Shannon entropy confirms it's
*random* (a real secret, not a placeholder). Two complementary filters.

---

## 1. How the two methods work

### Regex — "does it look like a key?"

A candidate is matched by a fixed prefix + charset + length, usually gated by a nearby
keyword as a cheap prefilter.

- **gitleaks rule fields:** `regex` (detection), `secretGroup` (which capture group to
  entropy-check), `entropy` (min Shannon threshold), `keywords` (pre-regex filter), `path`.
- **gitleaks regex builders:** `GenerateSemiGenericRegex(identifiers, secretRegex, caseInsensitive)`
  for tokens that need an identifier word nearby; `GenerateUniqueTokenRegex(secretRegex, …)`
  for self-identifying tokens like `sk-…`.
- **Shipped example (Beamer):** regex `b_[a-z0-9=_\-]{44}`, keywords `["beamer"]`.
- **detect-secrets** ships dedicated regex detectors: `AWSKeyDetector`, `ArtifactoryDetector`,
  `BasicAuthDetector`, etc.

Canonical patterns (high confidence on AWS; OpenAI prefix high, exact body length varies by
key era):

| Provider | Regex | Note |
| --- | --- | --- |
| AWS access key | `AKIA[0-9A-Z]{16}` | canonical |
| OpenAI key | `sk-[A-Za-z0-9]{20,}` | also `sk-proj-…` newer form |

### Entropy — "is it actually random?"

Shannon entropy measured in **bits per character** over the candidate's charset. Above a
limit → confirmed random → real secret; below → likely a word/placeholder, rejected.

- `detect-secrets` defaults (cited): `Base64HighEntropyString` limit **4.5**,
  `HexHighEntropyString` limit **3.0**.
- Worked example from the docs: the string `"Base64HighEntropyString"` measures **4.089**
  bits/char → flagged at limit 4, ignored at limit 5. (Compute entropy → compare to limit →
  `≥ limit` confirms.)
- In gitleaks, the `entropy` field on a rule sets the minimum Shannon threshold; `secretGroup`
  picks which part of the regex match is entropy-checked.

---

## 2. Field → source legend (for a credential finding modal)

Legend: **✅ real detector output** · **⚙️ gateway/request data (not the detector)** ·
**🧮 derived by us**

| Modal field | Source |
| --- | --- |
| Entity type | ✅ our custom entity (e.g. `OPENAI_API_KEY`) |
| Detector / method | ✅ `entropy+regex` |
| Recognizer | ✅ our recognizer name (e.g. `OpenAIKeyRecognizer`) |
| Rule / pattern | ✅ the regex |
| Match substring | ✅ `text[start:end]` |
| Offset in evidence | ✅ derive via `indexOf` / scanner span — never hardcode |
| Entropy | ✅ measured bits/char + the threshold |
| Score | ✅ binary match → `1.0` (or our custom-recognizer value) |
| Redaction placeholder (`<OPENAI_API_KEY>`) | ✅ replace operator / our masking |
| Bytes redacted | 🧮 `len(match)` |
| Action (Redact / Block) | ⚙️ gateway policy |
| Turn, Policy name, Provider / Model | ⚙️ gateway / request metadata |

---

## 3. Example — OpenAI API key

Caught `sk-…` in `"…Sign it with my API key: sk-…"`.

### Finding card

| Field | Value | Source |
| --- | --- | --- |
| Title | Credential · OpenAI key | label for `OPENAI_API_KEY` ✅ |
| Detector | entropy+regex | ✅ |
| Score | `1.0` | regex + entropy both pass ✅ |
| Match | `sk-…` | `text[start:end]` ✅ |
| Action | Redact / Block | ⚙️ gateway policy |

### Why this fired

| Row | Value | Source |
| --- | --- | --- |
| Entity type | `OPENAI_API_KEY` | ✅ our entity |
| Recognizer | `OpenAIKeyRecognizer` | ✅ our recognizer |
| Rule | `sk-[A-Za-z0-9]{20,}` | ✅ regex (gitleaks unique-token style) |
| Entropy | `5.2 bits/char (≥ 4.5)` | ✅ measured vs detect-secrets Base64 limit |
| Offset in evidence | `start–end (N chars)` | ✅ `indexOf` / scanner span |
| Score | `1.0` (regex + entropy pass) | ✅ binary match |

### What we sent upstream

| Row | Value | Source |
| --- | --- | --- |
| Redaction | `sk-…` → `<OPENAI_API_KEY>` | ✅ replace / mask |
| Bytes redacted | `len(match)` | 🧮 |
| Policy / Provider / Model | gateway / request data | ⚙️ |

---

## 4. Example — AWS access key

Caught `AKIA…` in a config blob.

| Row | Value | Source |
| --- | --- | --- |
| Entity type | `AWS_ACCESS_KEY` | ✅ our entity |
| Recognizer | `AWSKeyDetector` | ✅ detect-secrets detector |
| Rule | `AKIA[0-9A-Z]{16}` | ✅ regex (canonical) |
| Entropy | `n/a (fixed-format key)` | AWS keys are format-validated, not entropy-gated |
| Score | `1.0` | ✅ regex match |
| Redaction | `AKIA…` → `<AWS_ACCESS_KEY>` | ✅ replace / mask |

> Note: not every credential needs entropy — fixed-format keys (AWS `AKIA…`) are confirmed by
> regex + checksum/format alone. Entropy matters most for **generic** high-randomness tokens
> where regex shape isn't distinctive enough on its own.

---

## 5. What is NOT a detector output (never label it as one)

- **Action** (redact / block / flag) — gateway policy.
- **Policy name, upstream provider, model** — gateway / request metadata.
- **Turn numbers** — gateway; the scanner sees a string.
- **"Bytes redacted"** — our derivation (`len(match)`).
- A graded confidence score — detect-secrets and gitleaks are binary; any 0–1 score is ours
  (e.g. a custom Presidio recognizer assigning `0.9` regex-only, `1.0` regex+entropy).

---

## 6. Guardrails when building a credential finding modal

1. **Compute offsets** from the actual text; never hardcode.
2. **Surface the measured entropy + its threshold** (e.g. `5.2 bits/char ≥ 4.5`) — it's the
   most honest "why" for a generic secret.
3. **Don't claim Presidio.** Credential detection is regex + entropy in a custom recognizer or
   a separate scanner. See `Presidio-findings.md` §0.
4. **Binary, not graded.** If you show a score, know it's our convention, not a scanner output.
5. **Use real recognizer/pattern values** from the tables above; mark provider regexes whose
   exact body length is uncertain (e.g. OpenAI) rather than inventing a precise count.
6. **Sensitivity = the entropy threshold** (+ regex strictness): lowering the limit (e.g. base64 4.5 -> 4.0) catches more candidates with more false positives. This is the credential analog of Presidio's `score_threshold` (see `Presidio-findings.md` §7).

---

## 7. Sources

- context7 `/yelp/detect-secrets` — high-entropy plugins (`Base64HighEntropyString` limit 4.5,
  `HexHighEntropyString` limit 3.0), regex detectors (`AWSKeyDetector`, etc.), the 4.089
  worked example.
- context7 `/gitleaks/gitleaks` — rule format (`regex` / `secretGroup` / `entropy` /
  `keywords`), `GenerateSemiGenericRegex` / `GenerateUniqueTokenRegex`, Beamer rule example.
- Research run 2026-06-03. Companion doc: `Presidio-findings.md` (PII).
