# Pages — Notion-Style Freeform Tracking

## Goal

Folio's plan model is locked to 4 fixed module types (workout, skill, study, nutrition). Anything that doesn't fit those shapes — guitar practice, journaling, reading, finance — has no good home. Add **Pages**: a freeform, block-based area that sits alongside the structured plan system, giving Notion-like flexibility for anything a user wants to track, without touching what already works.

## Non-goals

Pages do **not** replace modules. Workout/skill/study/nutrition keep their existing specialized UX (splits, XP, node progressions, macros) — that structure is a strength, not a limitation to engineer away. Pages exist for everything outside that structure.

## Architecture

Three pieces:

1. **`pages` table** — a new, standalone Supabase table. Independent of `plans` entirely: no relationship to the one-active-plan trigger, so pages persist across plan switches.
2. **Manual builder UI** — `/pages` (list + create) and `/pages/[id]` (block editor).
3. **Dashboard integration** — tracker blocks (and only tracker blocks) surface on the daily dashboard as loggable items, via a new self-contained section that queries `pages` independently of `buildDashboardViewModel`.

AI generation is extended as a secondary path: the existing Gemini flow can also emit `pages`, created via a separate best-effort action after the plan is created.

---

## Data Model

### Migration — `supabase/migrations/20260507000000_pages_table.sql`

Follows the same shape and RLS pattern as the existing `plans` migration (`supabase/migrations/20260503000000_plans_table.sql`):

```sql
create table if not exists public.pages (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  icon        text,
  blocks      jsonb       not null default '[]',
  order_idx   int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pages_user_id_idx on public.pages (user_id);

-- touch_updated_at trigger, same pattern as plans_touch_updated_at

alter table public.pages enable row level security;

-- pages_select_own / pages_insert_own / pages_update_own / pages_delete_own
-- policies scoped to user_id = auth.uid(), same pattern as plans policies
```

### Types — `src/types/schema.ts` additions

```ts
export type Block =
  | { id: string; type: "text"; content: string }
  | {
      id: string;
      type: "checklist";
      items: { id: string; label: string; done: boolean }[];
    }
  | { id: string; type: "table"; columns: string[]; rows: string[][] }
  | {
      id: string;
      type: "tracker";
      label: string;
      unit: string;
      entries: { date: string; value: number }[];
    };

export type Page = {
  id: string;
  title: string;
  icon?: string;
  blocks: Block[];
  order: number;
};
```

`Block` is a discriminated union on `type`, same convention as `PlanModule`. Each block carries its own `id` (client-generated, e.g. `crypto.randomUUID()`) so it can be targeted for edit/delete/reorder without positional indexing.

`entries[].date` is a `YYYY-MM-DD` string, consistent with `daily_commits.date` elsewhere in the codebase.

---

## Server Actions — `src/actions/pageActions.ts`

Mirrors the structure of `planActions.ts`.

```ts
export async function getUserPages(userId: string): Promise<Page[]>;

export async function createPage(
  userId: string,
  input: { title: string; icon?: string },
): Promise<Page>;
// Inserts with blocks: [], order_idx = max(existing order_idx) + 1

export async function updatePage(
  pageId: string,
  userId: string,
  blocks: Block[],
): Promise<void>;
// Replaces the whole blocks array — same "full replace" pattern as updatePlan

export async function deletePage(pageId: string, userId: string): Promise<void>;

export async function reorderPages(
  userId: string,
  orderedIds: string[],
): Promise<void>;
// Writes order_idx = index for each id

export async function logTrackerEntry(
  pageId: string,
  userId: string,
  blockId: string,
  value: number,
): Promise<void>;
// Reads the page, finds the tracker block by blockId, upserts today's
// entry (replace if an entry for today's date already exists, else push),
// writes blocks back. Scoped update so the dashboard doesn't need to
// round-trip an entire page's blocks to log one number.
```

All actions validate `user_id` ownership via the `.eq('user_id', userId)` pattern already used throughout `planActions.ts`. Errors throw via the same `dbErr` helper convention (or a local equivalent in the new file).

---

## Hooks — `src/hooks/usePages.ts`

React Query wrapper, same shape as `useUserPlans.ts`:

```ts
export function usePages(userId: string) {
  return useQuery<Page[]>({
    queryKey: ["pages", userId],
    queryFn: () => (userId ? getUserPages(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
}

export function useInvalidatePages() {
  const qc = useQueryClient();
  return (userId: string) =>
    qc.invalidateQueries({ queryKey: ["pages", userId] });
}
```

---

## Manual UI

### Nav

Add a `Pages` entry to `navItems` in `AppTopNav.tsx`, alongside Dashboard/Commit/Plan/Reports/Builder.

### `/pages` — list view

- Grid/list of page cards: icon, title, block count.
- "+ New Page" → inline title + optional icon (emoji text input) → creates an empty page, navigates to `/pages/[id]`.
- Reorder via up/down affordance per card (calls `reorderPages`).
- Delete via a confirm-then-delete action per card.

### `/pages/[id]` — block editor

- Header: title (editable inline), icon.
- Block list, each rendered per its `type`:
  - **text** — textarea, autosaves on blur.
  - **checklist** — list of `{ label, done }` rows with checkbox, "+ Add item", remove button per row.
  - **table** — editable grid; "+ Add column" appends to `columns` and to every row; "+ Add row" appends an empty row sized to `columns.length`.
  - **tracker** — label + unit fields, plus a reverse-chronological entry list (date, value) with inline edit/delete per entry, and a "log entry" input for arbitrary backfill (separate from the dashboard's "log today" shortcut, which calls `logTrackerEntry` directly).
- "+ Add Block" → menu of the 4 types → appended to `blocks`, calls `updatePage` with the full array.
- Reorder blocks via up/down buttons (no drag-and-drop — kept out of scope to bound the editor's complexity).
- Visual language matches existing brutalist tokens (`T.mono` labels, `T.serifD` headings, 0px radius, tonal surface shifts, no 1px borders where a surface shift will do) — no new design primitives introduced.

---

## Dashboard Integration

A new `TrackersSection` component added to `src/app/(plan)/dashboard/page.tsx`, positioned after `HabitsSection`. It:

1. Calls `usePages(user.id)` directly — independent of `useDashboardVM()` / `buildDashboardViewModel`, since Pages are not part of `AestheticOSPlan` and this keeps the existing plan-rendering path completely untouched.
2. Flattens every `tracker` block across all pages into a single list.
3. Renders each as a compact row: tracker label, most recent value, a numeric input + "Log" button that calls `logTrackerEntry` for today's date.
4. Renders nothing (section omitted) if there are zero tracker blocks across all pages — same "don't render empty sections" convention as `ModulesSection`/`HabitsSection`.

Checklist, text, and table blocks are **not** surfaced on the dashboard — they're visited via `/pages/[id]` only. Only trackers get the daily-loggable treatment, since only trackers have a meaningful "value for today" concept.

---

## AI Generation

### `SCHEMA_PROMPT` addition (`src/actions/generatePlanAction.ts`)

Add an optional top-level `pages` array to the schema documentation, alongside `metadata`/`habits`/`modules`:

```
"pages": [
  {
    "title": "Guitar Practice",
    "icon": "🎸",
    "blocks": [
      { "type": "tracker", "label": "Practice time", "unit": "minutes", "entries": [] }
    ]
  }
]
```

Guidance added to the rules section: generate a `pages` entry (rather than a skill/study module) when the user describes something they want to _track freeform_ rather than follow a structured curriculum — e.g. "log my guitar practice time" → a tracker page; "teach me guitar with a curriculum" → a skill module. This keeps the model/page distinction aligned with the existing skill-vs-study distinction already documented in the prompt.

### Action flow

After `createPlan(userId, parsed)` succeeds in `generatePlan()`:

```ts
if (Array.isArray(parsed.pages)) {
  await createPagesFromAI(userId, parsed.pages).catch(() => {
    // best-effort — page creation failure does not fail plan generation
  });
}
```

`createPagesFromAI` is a small helper in `pageActions.ts` that inserts each page with a generated `id` per block, matching the manual `createPage` schema.

---

## Files

| Action | File                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `supabase/migrations/20260507000000_pages_table.sql`                                   |
| Modify | `src/types/schema.ts` — add `Block`, `Page` types                                      |
| Create | `src/actions/pageActions.ts`                                                           |
| Create | `src/hooks/usePages.ts`                                                                |
| Create | `src/app/pages/page.tsx` — list view                                                   |
| Create | `src/app/pages/[id]/page.tsx` — block editor                                           |
| Modify | `src/components/navigation/AppTopNav.tsx` — add nav item                               |
| Modify | `src/app/(plan)/dashboard/page.tsx` — add `TrackersSection`                            |
| Modify | `src/actions/generatePlanAction.ts` — extend `SCHEMA_PROMPT`, call `createPagesFromAI` |

---

## Out of Scope

- Nested/sub-pages (flat list only).
- Drag-and-drop reordering (up/down buttons instead).
- Image and embed blocks.
- Rich text formatting inside `text` blocks (plain text/textarea only).
- Publishing pages to the `templates` system.
- Cross-page linking or references.
- Per-tracker dashboard visibility toggle (all trackers show; can be added later if the dashboard gets cluttered).
