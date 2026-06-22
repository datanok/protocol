# AI Plan Generation — In-App Paragraph Input

## Goal

Replace the copy-paste external LLM flow with a single in-app textarea that calls Gemini directly, so users can describe their goals in one paragraph and get a complete plan without leaving Folio.

## Architecture

Three pieces:
1. **`src/actions/generatePlanAction.ts`** — server action that calls Gemini and creates the plan
2. **`src/app/builder/page.tsx`** — `AIPanels` component replaced with `AIGenerator` textarea + button
3. The existing `LLM_PROMPT` constant — reused as the Gemini system instruction, with the "ASK THE USER FOR" section removed

The manual builder tab is untouched. Both tabs coexist.

---

## Server Action — `generatePlanAction.ts`

**Signature:**
```ts
export async function generatePlan(
  userId: string,
  userInput: string,
): Promise<{ ok: true } | { ok: false; error: string }>
```

**Steps:**
1. Build the Gemini request:
   - Model: `gemini-2.0-flash`
   - System instruction: the `LLM_PROMPT` schema string (copied verbatim from `builder/page.tsx`), with the `## 🧠 ASK THE USER FOR` section removed — that section was instruction for an external chatbot, not for direct generation
   - User message: `userInput` (the paragraph the user typed)
2. Call Gemini via REST: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
3. Extract `candidates[0].content.parts[0].text` from the response
4. Clean the text with the same logic already in `handleInitialize`:
   - Strip leading ` ```json ` / ` ``` ` fences
   - Trim to the last `}` character
5. `JSON.parse` the cleaned string
6. Call `createPlan(userId, parsed)` — existing action handles schema validation and migration
7. Return `{ ok: true }` on success; catch all errors and return `{ ok: false, error: message }` — never throw

**Error cases (all caught, none thrown):**
- Gemini API error (non-2xx, network failure) → `"AI generation failed. Check your API key or try again."`
- JSON parse failure (Gemini returned non-JSON) → `"Could not parse the generated plan. Try rephrasing your goals."`
- `createPlan` failure (schema mismatch, DB error) → `err.message` from the thrown error

---

## UI — `AIPanels` → `AIGenerator`

Replace the two-panel layout (600px prompt display + JSON paste area) with a single panel:

```
┌─────────────────────────────────────────────────────┐
│  GENERATE WITH AI                                   │
│  ─────────────────────────────────────────────────  │
│  YOUR GOALS                                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ e.g. I want to train 4 days a week for      │   │
│  │ hypertrophy, learn guitar on the side, and  │   │
│  │ track sleep and water as habits.             │   │
│  │ Intermediate level, home gym.               │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [error banner if present]                          │
│                                                     │
│  Cancel ←                    Generate Plan →        │
└─────────────────────────────────────────────────────┘
```

**States:**
- **Idle**: textarea + disabled button (until textarea has content)
- **Loading**: button shows spinner + "Generating…", textarea disabled
- **Error**: red banner above the footer with message + Retry button; textarea re-enabled
- **Success**: `window.location.href = '/dashboard'` (same as current flow)

**Component name:** `AIGenerator` (replaces `AIPanels`)

---

## What changes in `LLM_PROMPT`

Remove the `## 🧠 ASK THE USER FOR` section entirely. That section instructed an external chatbot to run a multi-turn Q&A interview. When calling Gemini directly with the user's paragraph already provided, it causes the model to ask questions instead of generating JSON.

The remaining sections stay verbatim:
- `⚠️ CRITICAL RULES`
- `📦 REQUIRED JSON SCHEMA`

The system instruction becomes: "Given this goal description, output the JSON plan. Follow the schema exactly."

---

## Files

| Action | File |
|---|---|
| Create | `src/actions/generatePlanAction.ts` — contains the schema prompt constant (moved from builder) |
| Modify | `src/app/builder/page.tsx` — replace `AIPanels` with `AIGenerator`; delete `LLM_PROMPT` constant (it moves to the server action) |

---

## Out of scope

- Streaming the Gemini response (full JSON must be complete before parsing)
- Showing a preview of the generated plan before saving (redirect immediately on success)
- Follow-up questions if fields are missing (generate best-effort, user edits via `/plan`)
- Any changes to the manual builder tab
