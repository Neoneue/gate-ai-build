import type { CodeLine } from "@/components/ui/code-card";
import { API_KEY_SEED_ROWS } from "@/data/api-keys";

/* Mock data for the canvas examples. Where the app already has a seed for
 * the thing an example shows (API keys), the example reads it, so the
 * canvas shows real product strings. People are placeholders only
 * ("Alex Rivera", example.com). Nothing here is written anywhere. */

const ACTIVE_KEYS = API_KEY_SEED_ROWS.filter((row) => !row.revoked);

/** One real, active API key row (`prod-web`). */
export const SAMPLE_KEY = ACTIVE_KEYS[0] ?? API_KEY_SEED_ROWS[0];

/** Active API key rows for table and list examples. */
export const SAMPLE_KEYS = ACTIVE_KEYS.slice(0, 5);

export const SAMPLE_PERSON = {
  name: "Alex Rivera",
  email: "alex@example.com",
  initials: "AR",
} as const;

export const SAMPLE_MODELS = [
  { value: "anthropic/claude-opus-4.7", label: "Claude Opus 4.7" },
  { value: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "mistral/mistral-large", label: "Mistral Large" },
] as const;

export const SAMPLE_MODEL_OPTIONS = SAMPLE_MODELS.map((model) => ({
  value: model.value,
  label: model.label,
}));

export const SAMPLE_MODEL_OPTIONS_WITH_DESCRIPTION = SAMPLE_MODELS.map(
  (model) => ({
    value: model.value,
    label: model.label,
    description: model.value,
  })
);

/** Seven days of a two-series count, for the chart examples. */
export const SAMPLE_SERIES = [
  { date: "Oct 7", time: "Oct 7 12:00", allowed: 412, blocked: 18 },
  { date: "Oct 8", time: "Oct 8 12:00", allowed: 468, blocked: 22 },
  { date: "Oct 9", time: "Oct 9 12:00", allowed: 391, blocked: 9 },
  { date: "Oct 10", time: "Oct 10 12:00", allowed: 520, blocked: 31 },
  { date: "Oct 11", time: "Oct 11 12:00", allowed: 288, blocked: 12 },
  { date: "Oct 12", time: "Oct 12 12:00", allowed: 305, blocked: 7 },
  { date: "Oct 13", time: "Oct 13 12:00", allowed: 476, blocked: 25 },
];

export const SAMPLE_SPARK = SAMPLE_SERIES.map((point) => point.allowed);
export const SAMPLE_SPARK_LABELS = SAMPLE_SERIES.map((point) => point.date);

/** A short request body, tokenised for CodeBlock. */
export const SAMPLE_CODE_LINES: CodeLine[] = [
  [
    { text: "curl", tone: "keyword" },
    {
      text: " https://gateway.example.com/v1/chat/completions",
      tone: "string",
    },
  ],
  [
    { text: "  -H ", tone: "default" },
    { text: '"Authorization: Bearer $GATE_API_KEY"', tone: "string" },
  ],
  [
    { text: "  -d ", tone: "default" },
    { text: "'{", tone: "muted" },
  ],
  [
    { text: '    "model"', tone: "property" },
    { text: ": ", tone: "default" },
    { text: '"anthropic/claude-opus-4.7"', tone: "string", highlight: true },
  ],
  [
    { text: '    "max_tokens"', tone: "property" },
    { text: ": ", tone: "default" },
    { text: "1024", tone: "number" },
  ],
  [{ text: "  }'", tone: "muted" }],
];

/** The same request as plain text, for CodePanel. */
export const SAMPLE_SNIPPET = [
  "// Send a request through the gateway",
  'import OpenAI from "openai";',
  "const client = new OpenAI({",
  '  baseURL: "https://gateway.example.com/v1",',
  "  apiKey: process.env.GATE_API_KEY,",
  "});",
].join("\n");

export const SAMPLE_REPLY_MARKDOWN = [
  "### Rotating a key",
  "",
  "Create the new key first, then move each client over.",
  "",
  "1. Open **API keys** and create a key.",
  "2. Update `GATE_API_KEY` in each client.",
  "3. Revoke the old key once traffic stops.",
].join("\n");
