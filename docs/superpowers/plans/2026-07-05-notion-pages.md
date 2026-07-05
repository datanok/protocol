# Pages (Notion-Style Freeform Tracking) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone "Pages" system — a flat list of user pages made of typed blocks (text, checklist, table, tracker) — that sits alongside the existing structured plan modules without changing them, per `docs/superpowers/specs/2026-07-05-notion-pages-design.md`.

**Architecture:** A new `pages` Supabase table (independent of `plans`, no relation to the one-active-plan trigger) backs a CRUD server-action layer (`src/actions/pageActions.ts`), a React Query hook (`src/hooks/usePages.ts`), a list view (`/pages`) and per-page block editor (`/pages/[id]`), a dashboard section that surfaces only `tracker` blocks for daily logging, and an extension to the existing Gemini plan generator so it can optionally emit pages too.

**Tech Stack:** Next.js (App Router, server actions), Supabase (`@supabase/supabase-js`, Postgres + RLS), TanStack Query, TypeScript, no test framework — this project has no test suite (per `CLAUDE.md`), so every task's verification is a real build/type-check plus a manual walkthrough in the browser via `npm run dev`, not automated tests.

## Global Constraints

- **0px border radius** — never use `rounded-*` or CSS `border-radius`.
- No 1px decorative borders where a tonal surface shift (`T.tint` vs `T.surface`) will do instead — but 1px `T.rule` borders are used for structural dividers/panels throughout the existing codebase (see `AppTopNav.tsx`, `plan/page.tsx`); match that convention, don't invent a new one.
- Typography: `T.mono` (`DM Mono`) for labels/technical text, `T.serifD` (`DM Sans` display serif) for headings, `T.sans` for body text — import `T` from `@/lib/tokens`, never redeclare a local token object.
- Status colors: `T.positive` (`#4ADE80`), `T.negative` (`#FB7185`).
- Pages are **not** part of `AestheticOSPlan` / `plan_json` — they live in their own table and are fetched independently of `PlanContext`/`buildDashboardViewModel`.
- Every server action enforces `user_id` ownership via `.eq('user_id', userId)`, matching `src/actions/planActions.ts`.
- No test suite exists in this project (`CLAUDE.md`) — do not write a testing framework or test files as part of this plan. Verify via `bunx tsc --noEmit`, `npm run lint`, and manual browser walkthroughs.
- Package manager is **bun** (`bun.lock` is authoritative) — use `bunx`/`bun` for local commands, not `npx`/`npm exec`.

---

### Task 1: `pages` table migration

**Files:**

- Create: `supabase/migrations/20260507000000_pages_table.sql`

**Interfaces:**

- Produces: Postgres table `public.pages` with columns `id uuid`, `user_id uuid`, `title text`, `icon text` (nullable), `blocks jsonb`, `order_idx int`, `created_at timestamptz`, `updated_at timestamptz`. RLS policies scoped to `user_id = auth.uid()` for select/insert/update/delete. Every later task's `pageActions.ts` code depends on these exact column names.

- [ ] **Step 1: Write the migration**

```sql
-- Pages table — freeform blocks (text/checklist/table/tracker), independent
-- of the plans table. No relationship to the one-active-plan trigger:
-- pages persist across plan switches.

create extension if not exists "pgcrypto";

create table if not exists public.pages (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  icon        text,
  blocks      jsonb       not null default '[]'::jsonb,
  order_idx   int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pages_user_id_idx on public.pages (user_id);

-- Auto-refresh updated_at on every update
create or replace function public.touch_pages_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pages_touch_updated_at on public.pages;
create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute procedure public.touch_pages_updated_at();

-- RLS
alter table public.pages enable row level security;

drop policy if exists "pages_select_own" on public.pages;
create policy "pages_select_own"
  on public.pages for select
  using (user_id = auth.uid());

drop policy if exists "pages_insert_own" on public.pages;
create policy "pages_insert_own"
  on public.pages for insert
  with check (user_id = auth.uid());

drop policy if exists "pages_update_own" on public.pages;
create policy "pages_update_own"
  on public.pages for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pages_delete_own" on public.pages;
create policy "pages_delete_own"
  on public.pages for delete
  using (user_id = auth.uid());
```

- [ ] **Step 2: Apply the migration**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool (fetch its schema first via `ToolSearch` with query `select:mcp__plugin_supabase_supabase__apply_migration` if not already loaded) with:

- `name`: `pages_table`
- `query`: the full SQL body from Step 1

- [ ] **Step 3: Verify the table exists**

Call `mcp__plugin_supabase_supabase__list_tables` (schema `public`) and confirm `pages` appears with columns `id, user_id, title, icon, blocks, order_idx, created_at, updated_at`.

Expected: `pages` is listed with RLS enabled and the 4 policies from Step 1.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260507000000_pages_table.sql
git commit -m "feat: add pages table migration"
```

---

### Task 2: `Block` / `Page` types

**Files:**

- Modify: `src/types/schema.ts` (append after the `AestheticOSPlan` type at the end of the file)

**Interfaces:**

- Consumes: nothing new (standalone types).
- Produces: `Block` (discriminated union on `type: 'text' | 'checklist' | 'table' | 'tracker'`) and `Page`. Every subsequent task imports these two types from `@/types/schema`.

- [ ] **Step 1: Append the types**

Add to the end of `src/types/schema.ts`:

```ts
// ─── Pages (freeform blocks) ─────────────────────────────────────────────────
// Independent of AestheticOSPlan — lives in its own `pages` table, not in
// plan_json. Each block carries its own client-generated `id` so it can be
// targeted for edit/delete/reorder without positional indexing.

export type TextBlock = {
  id: string;
  type: "text";
  content: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ChecklistBlock = {
  id: string;
  type: "checklist";
  items: ChecklistItem[];
};

export type TableBlockData = {
  id: string;
  type: "table";
  columns: string[];
  rows: string[][];
};

export type TrackerEntry = {
  date: string; // YYYY-MM-DD
  value: number;
};

export type TrackerBlockData = {
  id: string;
  type: "tracker";
  label: string;
  unit: string;
  entries: TrackerEntry[];
};

export type Block =
  TextBlock | ChecklistBlock | TableBlockData | TrackerBlockData;

export type Page = {
  id: string;
  title: string;
  icon?: string;
  blocks: Block[];
  order: number;
};
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors (these are additive types with no existing consumers yet).

- [ ] **Step 3: Commit**

```bash
git add src/types/schema.ts
git commit -m "feat: add Block and Page types"
```

---

### Task 3: `pageActions.ts` server actions + `usePages` hook

**Files:**

- Create: `src/actions/pageActions.ts`
- Create: `src/hooks/usePages.ts`

**Interfaces:**

- Consumes: `Page`, `Block` from `@/types/schema` (Task 2); `public.pages` table from Task 1; `supabase` client from `@/lib/supabase`.
- Produces:
  - `getUserPages(userId: string): Promise<Page[]>`
  - `createPage(userId: string, input: { title: string; icon?: string }): Promise<Page>`
  - `updatePageTitle(pageId: string, userId: string, input: { title: string; icon?: string }): Promise<void>`
  - `updatePage(pageId: string, userId: string, blocks: Block[]): Promise<void>`
  - `deletePage(pageId: string, userId: string): Promise<void>`
  - `reorderPages(userId: string, orderedIds: string[]): Promise<void>`
  - `logTrackerEntry(pageId: string, userId: string, blockId: string, value: number, date: string): Promise<void>` — `date` is a client-computed `YYYY-MM-DD` local-date string (matching the `toYmd()` pattern already used by `upsertDailyCommit` elsewhere in this codebase); the server never derives "today" itself, avoiding UTC/local-timezone misfiling near midnight.
  - `createPagesFromAI(userId: string, pages: Array<{ title: string; icon?: string; blocks?: Array<Omit<Block, 'id'>> }>): Promise<void>`
  - `usePages(userId: string)` — React Query hook, queryKey `['pages', userId]`
  - `useInvalidatePages()` — returns `(userId: string) => void`

  These exact names/signatures are used by Tasks 4–8.

- [ ] **Step 1: Write `src/actions/pageActions.ts`**

```ts
"use server";

import { supabase } from "@/lib/supabase";
import type { Page, Block } from "@/types/schema";

function dbErr(label: string, e: { message?: string; code?: string }): never {
  const msg = e?.message ?? "Unknown DB error";
  const code = e?.code ? ` (code: ${e.code})` : "";
  throw new Error(`${label}: ${msg}${code}`);
}

function toPage(row: {
  id: string;
  title: string;
  icon: string | null;
  blocks: unknown;
  order_idx: number;
}): Page {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon ?? undefined,
    blocks: (row.blocks as Block[]) ?? [],
    order: row.order_idx,
  };
}

// ─── read ───────────────────────────────────────────────────────────────────

export async function getUserPages(userId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, icon, blocks, order_idx")
    .eq("user_id", userId)
    .order("order_idx", { ascending: true });

  if (error) dbErr("Failed to fetch pages", error);

  return (data ?? []).map(toPage);
}

// ─── create ─────────────────────────────────────────────────────────────────

async function nextOrderIdx(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("pages")
    .select("order_idx")
    .eq("user_id", userId)
    .order("order_idx", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) dbErr("Failed to determine page order", error);

  return data ? (data.order_idx as number) + 1 : 0;
}

export async function createPage(
  userId: string,
  input: { title: string; icon?: string },
): Promise<Page> {
  const order = await nextOrderIdx(userId);

  const { data, error } = await supabase
    .from("pages")
    .insert({
      user_id: userId,
      title: input.title,
      icon: input.icon ?? null,
      blocks: [],
      order_idx: order,
    })
    .select("id, title, icon, blocks, order_idx")
    .single();

  if (error) dbErr("Failed to create page", error);

  return toPage(data!);
}

// ─── update ─────────────────────────────────────────────────────────────────

export async function updatePageTitle(
  pageId: string,
  userId: string,
  input: { title: string; icon?: string },
): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .update({ title: input.title, icon: input.icon ?? null })
    .eq("id", pageId)
    .eq("user_id", userId);

  if (error) dbErr("Failed to update page title", error);
}

export async function updatePage(
  pageId: string,
  userId: string,
  blocks: Block[],
): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .update({ blocks })
    .eq("id", pageId)
    .eq("user_id", userId);

  if (error) dbErr("Failed to update page", error);
}

// ─── delete ─────────────────────────────────────────────────────────────────

export async function deletePage(
  pageId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId)
    .eq("user_id", userId);

  if (error) dbErr("Failed to delete page", error);
}

// ─── reorder ────────────────────────────────────────────────────────────────

export async function reorderPages(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("pages")
        .update({ order_idx: index })
        .eq("id", id)
        .eq("user_id", userId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) dbErr("Failed to reorder pages", failed.error);
}

// ─── tracker logging ──────────────────────────────────────────────────────────

export async function logTrackerEntry(
  pageId: string,
  userId: string,
  blockId: string,
  value: number,
  date: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("pages")
    .select("blocks")
    .eq("id", pageId)
    .eq("user_id", userId)
    .single();

  if (error) dbErr("Failed to load page for tracker log", error);

  const blocks = ((data!.blocks as Block[]) ?? []).map((block) => {
    if (block.id !== blockId || block.type !== "tracker") return block;
    const entries = block.entries.filter((e) => e.date !== date);
    entries.push({ date, value });
    return { ...block, entries };
  });

  const { error: updateErr } = await supabase
    .from("pages")
    .update({ blocks })
    .eq("id", pageId)
    .eq("user_id", userId);

  if (updateErr) dbErr("Failed to log tracker entry", updateErr);
}

// ─── AI generation ────────────────────────────────────────────────────────────

export async function createPagesFromAI(
  userId: string,
  pages: Array<{
    title: string;
    icon?: string;
    blocks?: Array<Omit<Block, "id">>;
  }>,
): Promise<void> {
  let order = await nextOrderIdx(userId);

  for (const page of pages) {
    const blocks: Block[] = (page.blocks ?? []).map((b) => ({
      ...b,
      id: crypto.randomUUID(),
    })) as Block[];

    const { error } = await supabase.from("pages").insert({
      user_id: userId,
      title: page.title,
      icon: page.icon ?? null,
      blocks,
      order_idx: order,
    });

    if (error) dbErr("Failed to create AI-generated page", error);
    order += 1;
  }
}
```

- [ ] **Step 2: Write `src/hooks/usePages.ts`**

```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserPages } from "@/actions/pageActions";
import type { Page } from "@/types/schema";

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

- [ ] **Step 3: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/actions/pageActions.ts src/hooks/usePages.ts
git commit -m "feat: add pages server actions and usePages hook"
```

---

### Task 4: Nav item + `/pages` list view

**Files:**

- Modify: `src/components/navigation/AppTopNav.tsx`
- Create: `src/app/pages/page.tsx`

**Interfaces:**

- Consumes: `usePages`, `useInvalidatePages` (Task 3); `createPage`, `deletePage`, `reorderPages` (Task 3); `useAuth()` → `{ user }`; `T` from `@/lib/tokens`.
- Produces: `/pages` route — list of pages with create/delete/reorder. Task 5 links here as "back to list" and is linked to from here via `/pages/[id]`.

- [ ] **Step 1: Add the nav item**

In `src/components/navigation/AppTopNav.tsx`, in the `navItems` array (around line 481-504), add a new entry after the Reports entry and before Builder:

```ts
    {
      href: "/reports/weekly",
      label: "Reports",
      active: pathname.startsWith("/reports"),
    },
    {
      href: "/pages",
      label: "Pages",
      active: pathname.startsWith("/pages"),
    },
    {
      href: "/builder",
      label: "Builder",
      active: pathname.startsWith("/builder"),
    },
```

(This replaces the existing Reports/Builder pair with the same two entries plus the new Pages entry in between.)

- [ ] **Step 2: Write `src/app/pages/page.tsx`**

This route sits **outside** the `(plan)` route group deliberately — `(plan)/layout.tsx` wraps children in `PlanProvider`, which blocks rendering entirely (shows a "No active plan" screen) when the user has no active plan. Pages must work regardless of plan state, so this route manages its own auth/loading state via `useAuth()` directly, the same way `src/app/builder/page.tsx` does.

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePages, useInvalidatePages } from "@/hooks/usePages";
import { createPage, deletePage, reorderPages } from "@/actions/pageActions";
import AppTopNav from "@/components/navigation/AppTopNav";
import { T } from "@/lib/tokens";

function NewPageForm({
  onCreate,
}: {
  onCreate: (title: string, icon: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate(title.trim(), icon.trim());
        setTitle("");
        setIcon("");
      }}
      style={{ display: "flex", gap: 8, marginBottom: 32 }}
    >
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="🎸"
        maxLength={4}
        style={{
          width: 48,
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "8px 10px",
          fontFamily: T.mono,
          fontSize: 14,
          color: T.ink,
          textAlign: "center",
          boxSizing: "border-box",
        }}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New page title…"
        style={{
          flex: 1,
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "8px 10px",
          fontFamily: T.mono,
          fontSize: 12,
          color: T.ink,
          boxSizing: "border-box",
        }}
      />
      <button
        type="submit"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: T.ink,
          color: T.surface,
          border: "none",
          cursor: "pointer",
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <Plus style={{ width: 12, height: 12 }} />
        Add
      </button>
    </form>
  );
}

export default function PagesListView() {
  const { user } = useAuth();
  const { data: pages = [], isLoading } = usePages(user?.id ?? "");
  const invalidate = useInvalidatePages();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleCreate(title: string, icon: string) {
    if (!user) return;
    try {
      await createPage(user.id, { title, icon: icon || undefined });
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create page");
    }
  }

  async function handleDelete(pageId: string) {
    if (!user) return;
    setBusy(pageId);
    try {
      await deletePage(pageId, user.id);
      invalidate(user.id);
      toast.success("Page deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!user) return;
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    try {
      await reorderPages(
        user.id,
        reordered.map((p) => p.id),
      );
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        color: T.ink,
        fontFamily: T.sans,
      }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main
        style={{
          paddingTop: 56,
          maxWidth: 720,
          margin: "0 auto",
          padding: "96px 24px 64px",
        }}
      >
        <h1
          style={{
            fontFamily: T.serifD,
            fontSize: 32,
            fontWeight: 400,
            color: T.ink,
            margin: 0,
          }}
        >
          Pages
        </h1>
        <p
          style={{
            fontFamily: T.sans,
            fontSize: 13,
            color: T.stone,
            marginTop: 8,
            marginBottom: 32,
          }}
        >
          Freeform tracking for anything that doesn&apos;t fit a structured
          module.
        </p>

        <NewPageForm onCreate={handleCreate} />

        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: T.stone,
            }}
          >
            <Loader2
              style={{
                width: 14,
                height: 14,
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ fontFamily: T.mono, fontSize: 11 }}>Loading…</span>
          </div>
        ) : pages.length === 0 ? (
          <div
            style={{
              fontFamily: T.serifD,
              fontSize: 16,
              fontStyle: "italic",
              color: T.stone,
              padding: "24px 0",
            }}
          >
            No pages yet — add one above.
          </div>
        ) : (
          <div>
            {pages.map((page, i) => (
              <div
                key={page.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 0",
                  borderBottom:
                    i < pages.length - 1 ? `1px solid ${T.rule}` : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: i === 0 ? "default" : "pointer",
                      color: T.stone,
                      opacity: i === 0 ? 0.3 : 1,
                      padding: 2,
                    }}
                  >
                    <ChevronUp style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === pages.length - 1}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: i === pages.length - 1 ? "default" : "pointer",
                      color: T.stone,
                      opacity: i === pages.length - 1 ? 0.3 : 1,
                      padding: 2,
                    }}
                  >
                    <ChevronDown style={{ width: 12, height: 12 }} />
                  </button>
                </div>

                <span
                  style={{
                    fontSize: 18,
                    width: 24,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {page.icon || "·"}
                </span>

                <Link
                  href={`/pages/${page.id}`}
                  style={{ flex: 1, textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{ fontFamily: T.serifD, fontSize: 17, color: T.ink }}
                  >
                    {page.title}
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: T.stone,
                      marginTop: 2,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {page.blocks.length} block
                    {page.blocks.length !== 1 ? "s" : ""}
                  </div>
                </Link>

                <button
                  onClick={() => handleDelete(page.id)}
                  disabled={busy === page.id}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.stone,
                    opacity: busy === page.id ? 0.5 : 1,
                  }}
                >
                  {busy === page.id ? (
                    <Loader2
                      style={{
                        width: 13,
                        height: 13,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <Trash2 style={{ width: 13, height: 13 }} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `bun run dev`
In the browser: sign in, navigate to `/pages` via the top nav "Pages" link. Confirm:

- The empty state ("No pages yet…") shows on a fresh account.
- Creating a page (icon + title, click Add) shows it in the list immediately.
- The up/down arrows reorder pages and the order persists after a page refresh.
- Deleting a page removes it and shows the "Page deleted" toast.

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/AppTopNav.tsx src/app/pages/page.tsx
git commit -m "feat: add Pages nav item and list view"
```

---

### Task 5: `/pages/[id]` editor shell + Text/Checklist blocks

**Files:**

- Create: `src/components/pages/TextBlockView.tsx`
- Create: `src/components/pages/ChecklistBlockView.tsx`
- Create: `src/app/pages/[id]/page.tsx`

**Interfaces:**

- Consumes: `Block`, `TextBlock`, `ChecklistBlock`, `ChecklistItem`, `Page` from `@/types/schema` (Task 2); `usePages`, `useInvalidatePages`, `updatePage`, `updatePageTitle` from Tasks 3; `T` from `@/lib/tokens`.
- Produces:
  - `TextBlockView(props: { block: TextBlock; onChange: (next: TextBlock) => void; onDelete: () => void })`
  - `ChecklistBlockView(props: { block: ChecklistBlock; onChange: (next: ChecklistBlock) => void; onDelete: () => void })`
  - `/pages/[id]` route rendering the block list, add-block menu, and title/icon editing. Task 6 imports the same `onChange`/`onDelete` prop contract for `TableBlockView`/`TrackerBlockView` and plugs into this shell's block-type switch.

- [ ] **Step 1: Write `src/components/pages/TextBlockView.tsx`**

```tsx
"use client";

import { Trash2 } from "lucide-react";
import type { TextBlock } from "@/types/schema";
import { T } from "@/lib/tokens";

export default function TextBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TextBlock;
  onChange: (next: TextBlock) => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        padding: 16,
        marginBottom: 12,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          Text
        </span>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>
      <textarea
        defaultValue={block.content}
        onBlur={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Write something…"
        rows={4}
        style={{
          width: "100%",
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "10px 12px",
          fontFamily: T.sans,
          fontSize: 13,
          color: T.ink,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/pages/ChecklistBlockView.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import type { ChecklistBlock } from "@/types/schema";
import { T } from "@/lib/tokens";

export default function ChecklistBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: ChecklistBlock;
  onChange: (next: ChecklistBlock) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const label = draft.trim();
    if (!label) return;
    onChange({
      ...block,
      items: [...block.items, { id: crypto.randomUUID(), label, done: false }],
    });
    setDraft("");
  }

  function toggleItem(id: string) {
    onChange({
      ...block,
      items: block.items.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i,
      ),
    });
  }

  function removeItem(id: string) {
    onChange({ ...block, items: block.items.filter((i) => i.id !== id) });
  }

  return (
    <div
      style={{ border: `1px solid ${T.rule}`, padding: 16, marginBottom: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          Checklist
        </span>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {block.items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
          }}
        >
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => toggleItem(item.id)}
            style={{ width: 14, height: 14, flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              fontFamily: T.sans,
              fontSize: 13,
              color: item.done ? T.stone : T.ink,
              textDecoration: item.done ? "line-through" : "none",
            }}
          >
            {item.label}
          </span>
          <button
            onClick={() => removeItem(item.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.stone,
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addItem();
          }}
          placeholder="Add item…"
          style={{
            flex: 1,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.sans,
            fontSize: 12,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={addItem}
          style={{
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "0 10px",
          }}
        >
          <Plus style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/pages/[id]/page.tsx`**

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePages, useInvalidatePages } from "@/hooks/usePages";
import { updatePage, updatePageTitle } from "@/actions/pageActions";
import AppTopNav from "@/components/navigation/AppTopNav";
import TextBlockView from "@/components/pages/TextBlockView";
import ChecklistBlockView from "@/components/pages/ChecklistBlockView";
import TableBlockView from "@/components/pages/TableBlockView";
import TrackerBlockView from "@/components/pages/TrackerBlockView";
import { T } from "@/lib/tokens";
import type { Block } from "@/types/schema";

const BLOCK_LABELS: Record<Block["type"], string> = {
  text: "Text",
  checklist: "Checklist",
  table: "Table",
  tracker: "Tracker",
};

function newBlock(type: Block["type"]): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "text":
      return { id, type, content: "" };
    case "checklist":
      return { id, type, items: [] };
    case "table":
      return { id, type, columns: ["Column 1"], rows: [] };
    case "tracker":
      return { id, type, label: "Tracker", unit: "", entries: [] };
  }
}

export default function PageEditorView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: pages = [], isLoading } = usePages(user?.id ?? "");
  const invalidate = useInvalidatePages();

  const page = useMemo(() => pages.find((p) => p.id === id), [pages, id]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (page) {
      setBlocks(page.blocks);
      setTitle(page.title);
      setIcon(page.icon ?? "");
    }
  }, [page]);

  async function persist(next: Block[]) {
    if (!user || !page) return;
    setBlocks(next);
    try {
      await updatePage(page.id, user.id, next);
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function persistTitle() {
    if (!user || !page) return;
    try {
      await updatePageTitle(page.id, user.id, {
        title: title.trim() || "Untitled",
        icon: icon.trim() || undefined,
      });
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save title");
    }
  }

  function addBlock(type: Block["type"]) {
    persist([...blocks, newBlock(type)]);
    setMenuOpen(false);
  }

  function updateBlock(blockId: string, next: Block) {
    persist(blocks.map((b) => (b.id === blockId ? next : b)));
  }

  function deleteBlock(blockId: string) {
    persist(blocks.filter((b) => b.id !== blockId));
  }

  if (!isLoading && !page) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.surface,
          color: T.ink,
          fontFamily: T.sans,
        }}
      >
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
        >
          <AppTopNav />
        </div>
        <main style={{ paddingTop: 120, textAlign: "center" }}>
          <p
            style={{
              fontFamily: T.serifD,
              fontSize: 18,
              fontStyle: "italic",
              color: T.stone,
            }}
          >
            Page not found.
          </p>
          <button
            onClick={() => router.push("/pages")}
            style={{
              background: "none",
              border: "none",
              color: T.accent,
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 11,
            }}
          >
            ← Back to Pages
          </button>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        color: T.ink,
        fontFamily: T.sans,
      }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main
        style={{
          paddingTop: 56,
          maxWidth: 720,
          margin: "0 auto",
          padding: "96px 24px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            onBlur={persistTitle}
            maxLength={4}
            style={{
              width: 48,
              background: T.tint,
              border: `1px solid ${T.rule}`,
              outline: "none",
              padding: "8px 10px",
              fontFamily: T.mono,
              fontSize: 18,
              color: T.ink,
              textAlign: "center",
              boxSizing: "border-box",
            }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={persistTitle}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: T.serifD,
              fontSize: 28,
              color: T.ink,
              padding: "4px 0",
            }}
          />
        </div>

        {blocks.map((block) => {
          switch (block.type) {
            case "text":
              return (
                <TextBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
            case "checklist":
              return (
                <ChecklistBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
            case "table":
              return (
                <TableBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
            case "tracker":
              return (
                <TrackerBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
          }
        })}

        <div style={{ position: "relative", marginTop: 16 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "none",
              border: `1px dashed ${T.rule}`,
              cursor: "pointer",
              color: T.stone,
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Plus style={{ width: 12, height: 12 }} />
            Add Block
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: T.surface,
                border: `1px solid ${T.rule}`,
                zIndex: 10,
              }}
            >
              {(Object.keys(BLOCK_LABELS) as Block["type"][]).map((type) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${T.rule}`,
                    cursor: "pointer",
                    color: T.ink,
                    fontFamily: T.mono,
                    fontSize: 11,
                  }}
                >
                  {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

Note: this imports `TableBlockView` and `TrackerBlockView` from Task 6, which doesn't exist yet — that's expected, this task is not independently buildable until Task 6 lands. Both tasks together form one deployable unit; keep them in the same PR/branch if executing tasks out of strict order.

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/TextBlockView.tsx src/components/pages/ChecklistBlockView.tsx src/app/pages/[id]/page.tsx
git commit -m "feat: add page editor shell with text and checklist blocks"
```

---

### Task 6: Table + Tracker blocks

**Files:**

- Create: `src/components/pages/TableBlockView.tsx`
- Create: `src/components/pages/TrackerBlockView.tsx`

**Interfaces:**

- Consumes: `TableBlockData`, `TrackerBlockData`, `TrackerEntry` from `@/types/schema` (Task 2); same `onChange`/`onDelete` prop contract as Task 5's block views; `T` from `@/lib/tokens`.
- Produces: `TableBlockView`, `TrackerBlockView` — completing the block-type switch started in Task 5's `src/app/pages/[id]/page.tsx`, which already imports both by name.

- [ ] **Step 1: Write `src/components/pages/TableBlockView.tsx`**

```tsx
"use client";

import { Trash2, Plus } from "lucide-react";
import type { TableBlockData } from "@/types/schema";
import { T } from "@/lib/tokens";

export default function TableBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TableBlockData;
  onChange: (next: TableBlockData) => void;
  onDelete: () => void;
}) {
  function setCell(rowIdx: number, colIdx: number, value: string) {
    const rows = block.rows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? value : cell)) : row,
    );
    onChange({ ...block, rows });
  }

  function setColumnName(colIdx: number, value: string) {
    const columns = block.columns.map((col, c) => (c === colIdx ? value : col));
    onChange({ ...block, columns });
  }

  function addColumn() {
    const columns = [...block.columns, `Column ${block.columns.length + 1}`];
    const rows = block.rows.map((row) => [...row, ""]);
    onChange({ ...block, columns, rows });
  }

  function addRow() {
    const rows = [...block.rows, block.columns.map(() => "")];
    onChange({ ...block, rows });
  }

  return (
    <div
      style={{ border: `1px solid ${T.rule}`, padding: 16, marginBottom: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          Table
        </span>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {block.columns.map((col, c) => (
                <th
                  key={c}
                  style={{ border: `1px solid ${T.rule}`, padding: 0 }}
                >
                  <input
                    value={col}
                    onChange={(e) => setColumnName(c, e.target.value)}
                    style={{
                      width: "100%",
                      background: T.tint,
                      border: "none",
                      outline: "none",
                      padding: "6px 8px",
                      fontFamily: T.mono,
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: T.ink,
                      boxSizing: "border-box",
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    style={{ border: `1px solid ${T.rule}`, padding: 0 }}
                  >
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        outline: "none",
                        padding: "6px 8px",
                        fontFamily: T.sans,
                        fontSize: 12,
                        color: T.ink,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={addColumn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "4px 10px",
            fontFamily: T.mono,
            fontSize: 10,
          }}
        >
          <Plus style={{ width: 10, height: 10 }} /> Column
        </button>
        <button
          onClick={addRow}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "4px 10px",
            fontFamily: T.mono,
            fontSize: 10,
          }}
        >
          <Plus style={{ width: 10, height: 10 }} /> Row
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/pages/TrackerBlockView.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { TrackerBlockData } from "@/types/schema";
import { T } from "@/lib/tokens";

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TrackerBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TrackerBlockData;
  onChange: (next: TrackerBlockData) => void;
  onDelete: () => void;
}) {
  const [date, setDate] = useState(toYmd(new Date()));
  const [value, setValue] = useState("");

  const sortedEntries = [...block.entries].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  function addEntry() {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return;
    const entries = block.entries.filter((e) => e.date !== date);
    entries.push({ date, value: num });
    onChange({ ...block, entries });
    setValue("");
  }

  function removeEntry(entryDate: string) {
    onChange({
      ...block,
      entries: block.entries.filter((e) => e.date !== entryDate),
    });
  }

  return (
    <div
      style={{ border: `1px solid ${T.rule}`, padding: 16, marginBottom: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          Tracker
        </span>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={block.label}
          onChange={(e) => onChange({ ...block, label: e.target.value })}
          placeholder="Label (e.g. Practice time)"
          style={{
            flex: 2,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.sans,
            fontSize: 12,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
        <input
          value={block.unit}
          onChange={(e) => onChange({ ...block, unit: e.target.value })}
          placeholder="Unit (e.g. minutes)"
          style={{
            flex: 1,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.sans,
            fontSize: 12,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.mono,
            fontSize: 11,
            color: T.ink,
          }}
        />
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={block.unit || "value"}
          style={{
            width: 100,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.mono,
            fontSize: 11,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={addEntry}
          style={{
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "0 14px",
            fontFamily: T.mono,
            fontSize: 10,
            textTransform: "uppercase",
          }}
        >
          Log
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}>
          No entries yet.
        </div>
      ) : (
        <div>
          {sortedEntries.slice(0, 10).map((entry) => (
            <div
              key={entry.date}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
                borderBottom: `1px solid ${T.rule}`,
              }}
            >
              <span
                style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}
              >
                {entry.date}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.ink }}>
                {entry.value} {block.unit}
              </span>
              <button
                onClick={() => removeEntry(entry.date)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.stone,
                  fontSize: 11,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors — this is the first point where `src/app/pages/[id]/page.tsx` (Task 5) has all four block components it imports, so this is also the first full type-check of the editor route.

- [ ] **Step 4: Manual verification**

Run: `bun run dev`
In the browser: go to `/pages`, open a page, and for each of the 4 block types via "+ Add Block":

- **Text**: type content, click away, refresh the page — content persists.
- **Checklist**: add 2 items, check one off, remove one, refresh — state persists.
- **Table**: add a column and a row, type into cells, refresh — persists.
- **Tracker**: set label/unit, log an entry for today, log a second entry for a past date, confirm both appear sorted newest-first, remove one, refresh — persists.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/TableBlockView.tsx src/components/pages/TrackerBlockView.tsx
git commit -m "feat: add table and tracker blocks to page editor"
```

---

### Task 7: Dashboard `TrackersSection`

**Files:**

- Modify: `src/app/(plan)/dashboard/page.tsx`

**Interfaces:**

- Consumes: `usePages` (Task 3); `logTrackerEntry` (Task 3, now takes a client-computed `date: string` as its 5th argument — see Task 3); `TrackerBlockData` from `@/types/schema` (Task 2); `useAuth()` → `{ user }` (already imported in this file); `T` (already imported); `toYmd(d: Date): string` — already defined at the top of `src/app/(plan)/dashboard/page.tsx` (used elsewhere in this file for the consistency grid) — reuse it, do not reimplement or reimport it.
- Produces: a `TrackersSection` component rendered in the dashboard's body, after `HabitsSection`. No other file depends on this — it's a leaf UI addition.

- [ ] **Step 1: Add imports**

At the top of `src/app/(plan)/dashboard/page.tsx`, add:

```ts
import { usePages } from "@/hooks/usePages";
import { logTrackerEntry } from "@/actions/pageActions";
import type { TrackerBlockData } from "@/types/schema";
```

- [ ] **Step 2: Add the `TrackersSection` component**

Insert this new function after `HabitsSection` (which ends around line 379) and before the `ModulesSection` comment block:

```tsx
// ─── Trackers section ─────────────────────────────────────────────────────────

function TrackerRow({
  pageId,
  block,
  userId,
  onLogged,
}: {
  pageId: string;
  block: TrackerBlockData;
  userId: string;
  onLogged: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const latest = [...block.entries].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];

  async function handleLog() {
    const num = parseFloat(value);
    if (Number.isNaN(num) || saving) return;
    setSaving(true);
    try {
      await logTrackerEntry(pageId, userId, block.id, num, toYmd(new Date()));
      setValue("");
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: `1px solid ${T.rule}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.serifD, fontSize: 15, color: T.ink }}>
          {block.label || "Tracker"}
        </div>
        {latest && (
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.stone,
              marginTop: 2,
            }}
          >
            Last: {latest.value} {block.unit} ({latest.date})
          </div>
        )}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleLog();
        }}
        placeholder={block.unit || "value"}
        style={{
          width: 90,
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "6px 10px",
          fontFamily: T.mono,
          fontSize: 12,
          color: T.ink,
          boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleLog}
        disabled={saving}
        style={{
          padding: "6px 14px",
          background: T.ink,
          color: T.surface,
          border: "none",
          cursor: saving ? "wait" : "pointer",
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: saving ? 0.5 : 1,
        }}
      >
        Log
      </button>
    </div>
  );
}

function TrackersSection({ userId }: { userId: string }) {
  const { data: pages = [], refetch } = usePages(userId);
  const trackers = pages.flatMap((page) =>
    page.blocks
      .filter((b): b is TrackerBlockData => b.type === "tracker")
      .map((block) => ({ pageId: page.id, block })),
  );

  if (trackers.length === 0) return null;

  return (
    <section style={{ marginTop: 56 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <h2
          style={{
            fontFamily: T.serifD,
            fontSize: 22,
            fontWeight: 400,
            fontStyle: "italic",
            margin: 0,
            color: T.ink,
          }}
        >
          Trackers
        </h2>
        <Eyebrow>{trackers.length} active</Eyebrow>
      </div>
      <div style={{ height: 1, background: T.ruleDark, marginTop: 12 }} />
      <div>
        {trackers.map(({ pageId, block }) => (
          <TrackerRow
            key={block.id}
            pageId={pageId}
            block={block}
            userId={userId}
            onLogged={refetch}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Render it in the page body**

In the `FolioDashboard` component's JSX, add `<TrackersSection userId={user!.id} />` immediately after `<HabitsSection ... />` and before `<ModulesSection ... />` (around line 687-688):

```tsx
            <HabitsSection
              habits={vm.today.habits}
              completed={completed}
              saving={saving}
              onToggle={toggleHabit}
            />
            <TrackersSection userId={user!.id} />
            <ModulesSection modules={vm.modules} weekPct={weekPct} />
```

(`user!` is safe here — `FolioDashboard` only renders once `PlanProvider` has resolved a plan, which requires a signed-in `user`.)

- [ ] **Step 4: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `bun run dev`. With at least one tracker block created in Task 6's verification step, go to `/dashboard` and confirm:

- A "Trackers" section appears after "Habits" showing each tracker with its last-logged value.
- Logging a new value via the dashboard's inline input updates "Last:" immediately and the same entry is visible on the tracker's page (`/pages/[id]`) after a refresh.
- With zero pages/trackers (a fresh test account), the "Trackers" section does not render at all.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(plan)/dashboard/page.tsx"
git commit -m "feat: surface tracker blocks on the dashboard"
```

---

### Task 8: AI generation support for Pages

**Files:**

- Modify: `src/actions/generatePlanAction.ts`

**Interfaces:**

- Consumes: `createPagesFromAI` from `@/actions/pageActions` (Task 3).
- Produces: `generatePlan()` optionally creates pages alongside the plan when Gemini's output includes a `pages` array. No other task depends on this — it's the final integration point.

- [ ] **Step 1: Extend `SCHEMA_PROMPT`**

In `src/actions/generatePlanAction.ts`, add a new rule to the `⚠️ CRITICAL RULES` list (after the existing habits/skill-module rule, before the closing `---`):

```
* If the user describes something they want to track freeform (a running log of practice time, pages read, money saved — with no structured curriculum), add a "pages" entry for it instead of a skill/study module. If they describe wanting a structured curriculum or progression (lessons, techniques, milestones to unlock), use a skill or study module as already documented. Do not create both a page and a module for the same thing.
```

Then add a `pages` field to the `📦 REQUIRED JSON SCHEMA` section, after the closing `]` of `modules` and before the final closing `}` (this field is optional — omit it entirely if the user's input doesn't call for freeform pages):

```
  ,
  "pages": [
    {
      "title": "Guitar Practice",
      "icon": "🎸",
      "blocks": [
        {
          "type": "tracker",
          "label": "Practice time",
          "unit": "minutes",
          "entries": []
        }
      ]
    }
  ]
```

The full updated constant (showing only the changed region, from the rules list through the schema's closing brace):

```ts
const SCHEMA_PROMPT = `You are generating a structured protocol configuration for a web application called "Protocol".

Your task is to convert the user's goals into a STRICT JSON object that follows the exact schema defined below.

---
## ⚠️ CRITICAL RULES
* Output ONLY valid JSON. No markdown, no code blocks, no extra text.
* All fields must be present except "pages", which is optional — omit it entirely if not needed. Do NOT omit any other keys.
* Use consistent kebab-case IDs (e.g. "barre-chords", "squat-form", "chapter-1").
* Keep values realistic, specific, and actionable.
* module "order" values start at 1 and increment by 1. Never use 0.
* For workout splits: each item in a day's array must be a SINGLE EXERCISE with its prescription (e.g. "Pull-ups — 4×8, rest 90s"). NEVER put session titles, durations, or day descriptions as the first array item — those go in "dayFocus" instead.
* Rest days and active recovery days must have an EMPTY array [] in "split". Use "dayFocus" to label them (e.g. "Active Recovery", "Full Rest").
* "focus" must be 1–2 sentences max. No bullet points, no multi-paragraph text.
* If the plan includes a skill module (guitar, coding, language, etc.), do NOT add that skill as an exercise or activity inside the workout split. The skill module and any related habit handle it — duplicating it in the split creates conflicts.
* Habits track DAILY behaviours. Do not add a habit for something already fully tracked by a module (e.g. no "practice guitar" habit if there is a skill module for guitar — unless the user explicitly wants a daily checkbox separate from session logging).
* If the user describes something they want to track freeform (a running log of practice time, pages read, money saved — with no structured curriculum), add a "pages" entry for it instead of a skill/study module. If they describe wanting a structured curriculum or progression (lessons, techniques, milestones to unlock), use a skill or study module as already documented. Do not create both a page and a module for the same thing.

---
## 📦 REQUIRED JSON SCHEMA

{
  "metadata": {
    "title": "short plan name, 2-4 words, e.g. 'Summer Shred', 'Year of Guitar'",
    "goal": "one-sentence primary goal",
    "level": "beginner | intermediate | advanced",
    "version": 2,
    "planType": "describe the plan type, e.g. workout+skill, study-only, full-stack"
  },
  "habits": [
    {
      "id": "unique-slug",
      "name": "Habit Name",
      "category": "fitness | skill | lifestyle | study | health"
    }
  ],
  "modules": [
    {
      "id": "workout-main",
      "type": "workout",
      "title": "Training Protocol",
      "order": 1,
      "data": {
        "focus": "One or two sentences describing the overall training approach and goal.",
        "dayFocus": {
          "Monday": "PULL — 35 min",
          "Tuesday": "PUSH — 35 min",
          "Wednesday": "LEGS + CORE — 40 min",
          "Thursday": "Active Recovery",
          "Friday": "UPPER — 50 min",
          "Saturday": "Full Rest",
          "Sunday": ""
        },
        "split": {
          "Monday": ["Exercise Name — sets×reps, rest Xs", "Exercise Name — sets×reps, rest Xs"],
          "Tuesday": [],
          "Wednesday": ["Exercise Name — sets×reps, rest Xs"],
          "Thursday": [],
          "Friday": ["Exercise Name — sets×reps, rest Xs", "Exercise Name — sets×reps, rest Xs"],
          "Saturday": [],
          "Sunday": []
        }
      }
    },
    {
      "id": "skill-main",
      "type": "skill",
      "title": "Skill Development",
      "order": 2,
      "data": {
        "subject": "Subject name",
        "nodes": [
          { "id": "node-slug", "title": "Node title", "type": "milestone", "metric": { "type": "none" } }
        ]
      }
    }
  ],
  "pages": [
    {
      "title": "Guitar Practice",
      "icon": "🎸",
      "blocks": [
        {
          "type": "tracker",
          "label": "Practice time",
          "unit": "minutes",
          "entries": []
        }
      ]
    }
  ]
}`;
```

- [ ] **Step 2: Wire `createPagesFromAI` into `generatePlan`**

Add the import at the top of the file:

```ts
import { createPagesFromAI } from "./pageActions";
```

In `generatePlan()`, replace:

```ts
await createPlan(userId, parsed);
return { ok: true };
```

with:

```ts
await createPlan(userId, parsed);

if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
  await createPagesFromAI(
    userId,
    parsed.pages as Parameters<typeof createPagesFromAI>[1],
  ).catch(() => {
    // Best-effort — a pages-creation failure should not fail plan generation.
  });
}

return { ok: true };
```

- [ ] **Step 3: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `bun run dev`. In the browser, go to `/builder`, use the AI generator tab, and enter a paragraph that explicitly asks for freeform tracking, e.g.: _"I want to train 3 days a week for strength, and I want to log my guitar practice time daily without a formal curriculum."_ Confirm:

- The generated plan includes a workout module as before.
- A new page (e.g. "Guitar Practice") appears at `/pages` with a tracker block, without a duplicate guitar skill/study module.
- If Gemini's response omits `pages` entirely (test with a plan-only prompt, e.g. "3-day strength program, beginner"), plan generation still succeeds with no error — confirming the best-effort `.catch()` doesn't affect the primary flow either way.

- [ ] **Step 5: Commit**

```bash
git add src/actions/generatePlanAction.ts
git commit -m "feat: extend AI plan generator to optionally create pages"
```

---

## Final verification (whole feature)

- [ ] Run `bunx tsc --noEmit` — no errors across the whole project.
- [ ] Run `npm run lint` — no new lint errors introduced by these files.
- [ ] Run `npm run build` — production build succeeds.
- [ ] Manual end-to-end walkthrough with `bun run dev`: create a page with all 4 block types manually, log a tracker value from the dashboard, generate a plan via AI that includes a freeform tracking request, and confirm the resulting page appears correctly — all without any change in behavior on `/dashboard`'s existing Habits/Modules sections, `/plan`, `/builder`'s manual tab, or any workout/skill/study module rendering.
