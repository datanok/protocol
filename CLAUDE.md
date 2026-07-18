# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint (no --fix flag by default)
npm run start    # Start production server
```

There is no test suite in this project.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

## What This App Is

**Protocol** — a personal life OS. Users build structured plans across four module types: **workout** (weekly splits + exercise logging), **skill** (node-based learning paths + XP), **study** (daily minute targets + subject nodes), and **nutrition** (WFO/WFH meal plans + macros). Plans are generated via the Gemini or Claude API (user-selectable) or built manually in a visual editor, then committed to daily.

## Architecture

### Data Flow

1. `AuthContext` holds the Supabase session (sign-in → token persisted in browser)
2. `PlanContext` fetches the active plan via `usePlanParser` and runs it through `buildDashboardViewModel` to compute today's directives
3. All DB writes go through server actions in `src/actions/`
4. A Supabase DB trigger enforces one active plan per user — activating a plan auto-deactivates all others

### Plan Schema (`src/types/schema.ts`)

`AestheticOSPlan` is the canonical shape stored as `plan_json: jsonb` in the `plans` table:

```ts
{
  metadata: { goal, level, version, planType },
  habits: [{ id, name, category }],
  modules: Array<
    | { type: 'workout'; data: { split: Record<Day, Exercise[]>; focus } }
    | { type: 'skill';   data: { subject; nodes: ModuleNode[] } }
    | { type: 'study';   data: { subject; nodes; dailyGoalMin } }
    | { type: 'nutrition'; data: { wfo; wfh; notes } }
  >
}
```

`modules` is a **discriminated union on `type`** — narrow before accessing `data`.

### Plan Migration (`src/lib/planMigration.ts`)

Every plan fetch transparently upgrades v1 (flat schema) → v2 (module-based). Never write v1-shaped code.

### Provider Stack (`src/components/Providers.tsx`)

`QueryClient → AuthProvider → ThemeProvider → AuthGuard`

`AuthGuard` redirects unauthenticated users to `/login`, except for `/`, `/login`, `/templates`, and `/u/*`.

### Theme System

- **No `tailwind.config.js`** — Tailwind v4 uses `@theme` inside `src/app/globals.css`
- CSS variables: `--protocol-surface`, `--protocol-ink`, `--protocol-accent`, etc.
- `data-theme="dark|light"` and `data-accent="vermillion|slate|forest|aubergine|obsidian"` on `<html>`
- `ThemeContext` persists choices to `localStorage` and the `profiles` table

### Supabase

Client initialized in `src/lib/supabase.ts`. Core tables:

| Table                                    | Purpose                                             |
| ---------------------------------------- | --------------------------------------------------- |
| `plans`                                  | Plan JSON blobs; `is_active` enforced by DB trigger |
| `profiles`                               | Username, bio, avatar, accent color                 |
| `daily_commits`                          | Daily habit logs                                    |
| `skill_sessions` / `skill_node_progress` | Skill practice tracking                             |
| `visual_logs`                            | Progress image uploads                              |
| `templates`                              | Community-published plans                           |

All tables use Row Level Security. Server actions in `src/actions/` are the only write path.

## Design Constraints (from DESIGN.md)

This app uses a strict **Hard-Edged Brutalism** aesthetic:

- **0px border radius** — never add `rounded-*` classes
- No traditional 1px borders; use tonal surface shifts instead
- 4px vertical accent blocks as section dividers
- Typography: `DM Sans` for headings, `DM Mono` for labels/technical text
- Status colors: `#4ADE80` positive, `#FB7185` negative
- Dark mode is default; 5 accent themes (vermillion is primary)

## Key Files

- `src/lib/viewModels.ts` — `buildDashboardViewModel`: transforms a plan + today's date into what the dashboard renders
- `src/actions/planActions.ts` — all CRUD for plans (create, update, activate, delete)
- `src/actions/templateActions.ts` — fork, publish, profile management
- `src/contexts/PlanContext.tsx` — central plan + dashboard state
- `src/types/schema.ts` — authoritative type definitions
