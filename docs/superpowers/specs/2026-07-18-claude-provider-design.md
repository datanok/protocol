# Claude Provider for AI Plan Generation — Design

**Date:** 2026-07-18
**Status:** Approved

## Goal

Let the user choose between Gemini and Claude when generating a plan with AI. Gemini remains the default; Claude (Haiku 4.5) is offered as a second option via a toggle in the builder UI.

## Background

Plan generation is a single server action, `generatePlan` in `src/actions/generatePlanAction.ts`. It sends `SCHEMA_PROMPT` as the system prompt plus the user's goal text to Gemini 2.0 Flash via raw `fetch`, then strips markdown fences, parses the JSON, and calls `createPlan` / `createPagesFromAI`. The prompt and all post-processing are provider-agnostic; only the HTTP call shape differs per provider.

## Design

### Server action (`src/actions/generatePlanAction.ts`)

- `generatePlan(userId, userInput, accessToken, provider)` — new fourth parameter `provider: "gemini" | "claude"`, defaulting to `"gemini"` so existing callers are unaffected.
- Extract the existing Gemini fetch into a private `callGemini(userInput): Promise<string | null>` returning the raw model text.
- Add `callClaude(userInput): Promise<string | null>`:
  - `POST https://api.anthropic.com/v1/messages`
  - Headers: `x-api-key: process.env.ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`, `content-type: application/json`
  - Body: `{ model: "claude-haiku-4-5-20251001", max_tokens: 4096, temperature: 0.7, system: SCHEMA_PROMPT, messages: [{ role: "user", content: userInput }] }`
  - Returns `data.content[0].text`.
- Shared downstream logic (fence stripping, trailing-brace trim, `JSON.parse`, `createPlan`, best-effort `createPagesFromAI`) is unchanged and runs identically for both providers.
- Missing key for the selected provider returns the existing configuration error, naming the provider (e.g. "Claude generation is not configured.").
- Remove the stray `console.log(response, ...)` debug line.

### UI (`AIGenerator` in `src/app/builder/page.tsx`)

- New local state `provider: "gemini" | "claude"`, default `"gemini"`.
- A two-option segmented toggle labelled `GEMINI` / `CLAUDE` rendered above the textarea, styled to the app's brutalist system: DM Mono, 10px, uppercase, letter-spaced labels; 1px `T.rule` borders; active segment filled `T.ink` with `T.surface` text; 0px border radius.
- The selected provider is passed as the fourth argument to `generatePlan`. Retry reuses the same selection.

### Environment

- New optional env var `ANTHROPIC_API_KEY`. Document it in CLAUDE.md and README alongside `GEMINI_API_KEY`. Either key may be absent; only the selected provider's key is required at call time.

## Error handling

Unchanged pattern: provider/API failures surface through the existing error banner with Retry. No fallback between providers — a failed Claude call does not silently retry on Gemini.

## Testing

No test suite exists in this project. Verification is manual: generate a plan with each provider selected and confirm the plan and any pages are created; confirm the missing-key error message appears when the selected provider's key is unset.

## Out of scope

- Automatic fallback between providers.
- Model selection within Claude (fixed to Haiku 4.5).
- Persisting the provider choice.
