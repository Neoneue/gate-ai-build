# Presidio — Findings Reference (Gate AI)

> **Purpose:** the single source of truth for what Microsoft Presidio can and cannot do,
> and exactly which finding values are real Presidio outputs. Use this when building any
> modal/UI that surfaces PII or credential findings, so every label and value on screen is
> something the library can actually produce. Derived from context7 research (2026-06-02)
> against `microsoft/presidio` docs, plus the accuracy review on 2026-06-03.
>
> **Hard rule for this project:** if a value isn't traceable to a row in the tables below,
> it does not go on screen as a Presidio fact.

---

## 0. TL;DR scope

| Capability | Presidio? | How |
| --- | --- | --- |
| **PII detection** (email, phone, SSN, credit card, person, IP, IBAN, crypto, …) | ✅ Built-in | `AnalyzerEngine.analyze()` |
| **Email detection** | ✅ Built-in | `EmailRecognizer` (entity `EMAIL_ADDRESS`) |
| **Redaction / masking** | ✅ Built-in | `AnonymizerEngine.anonymize()` |
| **Explainability** (recognizer, pattern, score breakdown) | ✅ Built-in | `analyze(..., return_decision_process=True)` |
| **Credential / API-key detection** (OpenAI `sk-…`, AWS, etc.) | ⚠️ Custom only | a `PatternRecognizer` / `EntityRecognizer` you write + register |
| **Prompt-injection detection** | ❌ Not possible | Presidio has no classifier and no meaningful recognizer for this. Use a separate tool (ML classifier / Lakera / Rebuff). **Never label injection as Presidio.** |

**One-line takeaway:** Email = Presidio out of the box. Credentials = Presidio *engine* via a recognizer we author. Injection = not Presidio, full stop.

---

## 1. The Presidio data model (what the API returns)

Everything we display flows from these three objects. Field names are exact.

### `RecognizerResult` (one per finding, from `analyze()`)

| Field | Meaning |
| --- | --- |
| `entity_type` | canonical entity, e.g. `EMAIL_ADDRESS` |
| `start` | start char offset in the analyzed text |
| `end` | end char offset (`text[start:end]` == the matched substring) |
| `score` | confidence `0.0–1.0` |
| `analysis_explanation` | the object below (only when `return_decision_process=True`) |

### `AnalysisExplanation` (the "Why this fired" data)

| Field | Meaning |
| --- | --- |
| `recognizer` | recognizer class name, e.g. `EmailRecognizer` |
| `pattern_name` | named pattern, e.g. `Email (Medium)` |
| `pattern` | the raw regex string |
| `original_score` | score from the pattern before validation/context |
| `score` | final score after validation + context boost |
| `validation_result` | `True`/`False`/`None` (e.g. email domain validated) |
| `score_context_improvement` / `supportive_context_word` | context-enhancer detail |
| `textual_explanation` | optional free-text (often `None` for predefined recognizers) |

### `AnonymizerEngine.anonymize()` → `EngineResult`

| Field | Meaning |
| --- | --- |
| `.text` | the redacted text we send upstream |
| `.items[]` | one `OperatorResult` per change: `.start`, `.end`, `.entity_type`, `.operator`, `.text` |

Operators available: `replace` (default → `<ENTITY_TYPE>`), `redact`, `mask`, `hash`, `encrypt`.

**Config, not output:** `score_threshold` is an *input* to `analyze()` (per-engine or per-call). It is **not** a per-finding field — don't render it as if Presidio emitted it.

---

## 2. Field → source legend (for any finding modal)

Legend: **✅ real Presidio output** · **⚙️ gateway/request data (not Presidio)** · **🧮 derived by us**

| Modal field | Source |
| --- | --- |
| Entity type | ✅ `RecognizerResult.entity_type` |
| Detector ("Presidio") | ✅ the source itself |
| Match substring | ✅ `text[start:end]` |
| Offset in evidence | ✅ `start` / `end` (compute on the real text — never hardcode) |
| Score | ✅ `RecognizerResult.score` |
| Recognizer | ✅ `AnalysisExplanation.recognizer` |
| Rule / pattern | ✅ `AnalysisExplanation.pattern_name` |
| Redaction placeholder (`<EMAIL>`) | ✅ `AnonymizerEngine` `replace` operator |
| Bytes redacted | 🧮 `len(match)` (or UTF-8 byte length) — not a Presidio field |
| Action (Redact / Block) | ⚙️ gateway policy decision (Presidio only *detects*) |
| Turn (e.g. "turn 4") | ⚙️ gateway assigns turns; Presidio has no concept of turns |
| Policy name | ⚙️ gateway-owned |
| Upstream provider / model | ⚙️ request metadata |

---

## 3. Example — Email (built-in `EmailRecognizer`)

Caught `j.doe@acme.com` in the text
`"…Also please ping me at j.doe@acme.com once you're done…"`.

### Finding card

| Field | Value | Source |
| --- | --- | --- |
| Title | PII · email | label for `EMAIL_ADDRESS` ✅ |
| Detector | Presidio | ✅ |
| Score | **1.00** | `RecognizerResult.score` ✅ |
| Match | `j.doe@acme.com` | `text[start:end]` ✅ |
| Action | Redact | ⚙️ gateway policy |
| Turn | turn 4 | ⚙️ gateway |

### Why this fired

| Row | Value | Source |
| --- | --- | --- |
| Entity type | `EMAIL_ADDRESS` | ✅ `entity_type` |
| Recognizer | `EmailRecognizer` | ✅ `recognizer` |
| Rule | `Email (Medium)` | ✅ `pattern_name` |
| Offset in evidence | `94–108 (14 chars)` | ✅ `start`/`end`, computed on the real text |
| Score | `1.00` (regex `original_score` 0.50 → domain validated → 1.00) | ✅ `original_score` + `score` |

### What we sent upstream

| Row | Value | Source |
| --- | --- | --- |
| Redaction | `j.doe@acme.com` → `<EMAIL_ADDRESS>` (default) / `<EMAIL>` (if `new_value` configured) | ✅ anonymizer `replace` |
| Bytes redacted | `14` | 🧮 `len(match)` |
| Policy | `customer-pii-redact-v2` | ⚙️ gateway |
| Provider / Model | `anthropic` / `claude-sonnet-4` | ⚙️ request metadata |

**Why the score is 1.00, not 0.97:** `EmailRecognizer`'s regex pattern scores **0.50**; the recognizer then validates the address (domain has a valid suffix) and bumps the result to **1.00**. So a valid email is `1.0`, a regex-only match is `0.5`. There is no `0.97` — that was fabricated. Context words (`email`, `e-mail`, `mail`) can also raise low scores, but validation already maxes this one out.

```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

analyzer = AnalyzerEngine()
results = analyzer.analyze(text=msg, language="en",
                           entities=["EMAIL_ADDRESS"],
                           return_decision_process=True)
# results[0].entity_type == "EMAIL_ADDRESS", .start, .end, .score == 1.0
# results[0].analysis_explanation.recognizer == "EmailRecognizer"
# results[0].analysis_explanation.pattern_name == "Email (Medium)"

redacted = AnonymizerEngine().anonymize(
    text=msg, analyzer_results=results,
    operators={"EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "<EMAIL>"})})
# redacted.text -> sent upstream;  redacted.items[0].start/.end -> span changed
```

---

## 4. Example — Credentials / OpenAI key (CUSTOM recognizer)

**Not built-in.** We register our own recognizer; it then flows through the *same* engine, so
the finding has the *same* `RecognizerResult` / `AnalysisExplanation` shape as a built-in.
The values below are **ours to define** (marked 🛠️), not Presidio defaults.

Caught an OpenAI key in `"…Sign it with my API key: sk-…"`.

### Finding card

| Field | Value | Source |
| --- | --- | --- |
| Title | Credential · OpenAI key | label for our entity 🛠️ |
| Detector | Presidio (custom recognizer) | ✅ engine, 🛠️ recognizer |
| Score | `0.95` | ✅ `score` (value we assign) |
| Match | `sk-…` | `text[start:end]` ✅ |
| Action | Redact / Block | ⚙️ gateway policy |

### Why this fired

| Row | Value | Source |
| --- | --- | --- |
| Entity type | `OPENAI_API_KEY` | 🛠️ our `supported_entity` |
| Recognizer | `OpenAIKeyRecognizer` | 🛠️ our class name (✅ via `.recognizer`) |
| Rule | `OpenAI secret key (sk-)` | 🛠️ our `pattern_name` |
| Pattern | `\bsk-[A-Za-z0-9]{20,}\b` (also `sk-proj-…` variants) | 🛠️ our regex |
| Offset in evidence | `start–end (N chars)` | ✅ `start`/`end` |
| Score | `0.95` (regex 0.90 → entropy check ≥ 4.0 bits/char → 0.95) | ✅ score; entropy logic 🛠️ |

### What we sent upstream

| Row | Value | Source |
| --- | --- | --- |
| Redaction | `sk-…` → `<OPENAI_API_KEY>` | ✅ anonymizer `replace` |
| Bytes redacted | `len(match)` | 🧮 |
| Policy / Provider / Model | gateway / request data | ⚙️ |

```python
from presidio_analyzer import PatternRecognizer, Pattern, AnalyzerEngine

openai_key = PatternRecognizer(
    supported_entity="OPENAI_API_KEY",
    patterns=[Pattern(name="OpenAI secret key (sk-)",
                      regex=r"\bsk-[A-Za-z0-9]{20,}\b", score=0.9)],
    context=["api key", "secret", "token", "sk-"],
)
analyzer = AnalyzerEngine()
analyzer.registry.add_recognizer(openai_key)
# For entropy-aware scoring, subclass EntityRecognizer and compute Shannon
# entropy in analyze(), returning a higher score for high-entropy matches.
```

> **Note on scores:** because this recognizer is ours, its score is a value we choose, not a
> Presidio constant. Pick deliberately (e.g. regex 0.90, entropy-validated 0.95) and keep it
> consistent. Don't borrow the email "0.5→1.0 validation" story — that's specific to
> `EmailRecognizer`.

---

## 5. What is NOT Presidio (never label these as Presidio)

- **Prompt injection** — no recognizer, no classifier. A regex deny-list is *not* injection
  detection. Attribute to a separate detector or leave it out.
- **Action** (redact vs block vs flag) — gateway policy.
- **Policy name, upstream provider, model** — gateway / request metadata.
- **Turn numbers** — gateway; Presidio sees a string, not a conversation.
- **"Bytes redacted"** — our derivation (`len(match)`), not a Presidio field.
- **Threshold** — an input config, not a per-finding output.

---

## 6. Guardrails when building a finding modal

1. **Compute offsets** from the actual evidence string (`evidence.indexOf(match)` / Presidio
   `start`/`end`). Never hardcode an offset number.
2. **Use real names:** `EMAIL_ADDRESS` / `EmailRecognizer` / `Email (Medium)`. Custom entities
   use the names we register.
3. **Scores are bounded and meaningful:** email `0.5` (regex) or `1.0` (validated); custom
   detectors use values we set. No invented mid-values.
4. **One Presidio block per Presidio finding.** The "Why this fired" (recognizer/pattern/score)
   attaches only to PII or our custom-recognizer findings — never to injection.
5. **Prefer the broken-out list** (Entity type → Recognizer → Rule → Offset → Score) over a
   single sentence: no truncation, scannable, extensible.
6. **Mark non-Presidio fields** (action, policy, provider, model, turn) as gateway data in the
   data model so they're never confused for detector output.

---

## 7. Sensitivity / detection threshold (configurable)

Detection **sensitivity** is not fixed by Presidio — it maps to the analyzer's
`score_threshold`, which a deployment sets. Findings scoring below the threshold are
dropped. Sensitivity is the human-facing inverse of the threshold:

- **High sensitivity -> low threshold** (e.g. 0.3): catches weak/ambiguous matches, more false positives.
- **Low sensitivity -> high threshold** (e.g. 0.85): only high-confidence matches, fewer false positives.

Set it per deployment via `analyze(..., score_threshold=X)` (or an engine default), or via
per-recognizer scores in the YAML registry config. The pattern-strength label
(`Email (Medium)`) is cosmetic; the **score** and **threshold** are the real levers.

Caveats:

- **Not uniform across entities.** Validated entities are near-certain regardless of
  threshold — email scores `1.0` after domain validation, credit cards pass a checksum.
  Sensitivity mainly affects ambiguous entities (names, locations, weak/partial patterns,
  context-boosted scores).
- **Credentials use a different knob.** The credential scanner (regex + entropy) tunes
  sensitivity via the **entropy threshold** (+ regex strictness), not `score_threshold` —
  see `Credentials-findings.md`.

**UI mapping:** this is the real backing for a "Sensitivity" control on a PII/PHI scanner
policy card (alongside Scan direction + Action on detection) and for the modal's "Tune
policy" action. Suggested shape: a Low / Balanced / High segmented control mapping to
concrete thresholds, with the threshold shown as a sub-label to stay honest.

## 8. Sources

- context7 `microsoft/presidio` docs — analyzer, recognizers, anonymizer, decision process
  (research run 2026-06-02; verdicts: PII ✅, credentials ⚠️ custom, injection ❌).
- Accuracy review 2026-06-03 (this project): corrected fabricated values
  (`presidio.entity.email`, `RFC-5322`, offset `142-156`, score `0.97`) to the real outputs
  documented above.
