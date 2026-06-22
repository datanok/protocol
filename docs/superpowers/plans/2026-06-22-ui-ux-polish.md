# UI/UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix visual and interaction issues across all pages in priority order — daily-use screens first (dashboard, commit), then detail pages (training, skills), then reports, then mobile.

**Architecture:** Pure UI layer changes — no DB schema changes, no new server actions. Each task is self-contained and can be reviewed independently. Changes are in-place edits to existing files plus one new shared component.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Supabase client, @tanstack/react-query, inline styles using `T` tokens from `@/lib/tokens`.

## Global Constraints

- 0px border-radius everywhere — never add `rounded-*`
- All design tokens from `@/lib/tokens` — never hardcode hex values
- No animation except transitions already in the codebase
- `npm run build` is the verification command (no test suite)
- No comments unless the WHY is non-obvious

---

## File Map

| Status | File | Change |
|---|---|---|
| Modify | `src/components/ui/FolioUI.tsx` | Add `FolioInput`, `FolioTextarea` exports |
| Modify | `src/app/(plan)/commit/page.tsx` | Import shared primitives; add retry button; add auto-redirect |
| Modify | `src/app/(plan)/dashboard/page.tsx` | Stats loading placeholders; remove false affordance; mobile sticky CTA |
| Modify | `src/app/(plan)/training/page.tsx` | Rest day typography |
| Modify | `src/app/(plan)/skills/[subject]/page.tsx` | Swap inline modal for shared component; add node loading skeleton |
| Create | `src/components/reports/TrainingWeekGrid.tsx` | Shared week grid with commit overlay |
| Modify | `src/lib/utils.ts` | Add `toYmd` export |
| Modify | `src/app/(plan)/reports/weekly/page.tsx` | Use shared grid; add commit overlay |
| Modify | `src/app/(plan)/reports/debrief/page.tsx` | Use shared grid; add commit overlay + summary panel |
| Create | `src/app/(plan)/mobile/page.tsx` | Real-data mobile view |
| Delete | `src/app/mobile/page.tsx` | Replaced by `(plan)` version |

---

### Task 1: Add FolioInput and FolioTextarea to FolioUI

**Files:**
- Modify: `src/components/ui/FolioUI.tsx`

**Interfaces:**
- Produces: `export function FolioInput(props: React.InputHTMLAttributes<HTMLInputElement>): JSX.Element`
- Produces: `export function FolioTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element`

- [ ] **Step 1: Add imports and two new exports to FolioUI.tsx**

Replace the entire file with:

```tsx
// Shared primitive components. Use className from globals.css @layer utilities
// so the inline style clutter doesn't repeat in every page file.
import { T } from '@/lib/tokens';

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="folio-label">{children}</div>;
}

export function LabelXS({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="folio-label" style={style}>{children}</div>;
}

export function Hr({ ink }: { ink?: boolean }) {
  return <div className={ink ? 'folio-hr-ink' : 'folio-hr'} />;
}

export function FolioInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        background: T.tint, border: `1px solid ${T.rule}`, outline: 'none',
        padding: '7px 10px', fontFamily: T.mono, fontSize: 12, color: T.ink,
        width: '100%', boxSizing: 'border-box', textAlign: 'center',
        ...props.style,
      }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.accent; props.onFocus?.(e); }}
      onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = T.rule;   props.onBlur?.(e);  }}
    />
  );
}

export function FolioTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%', background: T.tint, border: `1px solid ${T.rule}`,
        outline: 'none', padding: '10px 12px', fontFamily: T.mono, fontSize: 11,
        color: T.ink, resize: 'none', boxSizing: 'border-box', lineHeight: 1.6,
        ...props.style,
      }}
      onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = T.accent; props.onFocus?.(e); }}
      onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = T.rule;   props.onBlur?.(e);  }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/FolioUI.tsx
git commit -m "feat: add FolioInput and FolioTextarea to shared UI"
```

---

### Task 2: Commit page — shared primitives, retry button, auto-redirect

**Files:**
- Modify: `src/app/(plan)/commit/page.tsx`

**Interfaces:**
- Consumes: `FolioInput`, `FolioTextarea` from `@/components/ui/FolioUI` (Task 1)

- [ ] **Step 1: Replace inline FolioInput/FolioTextarea with import**

At the top of `src/app/(plan)/commit/page.tsx`, find the existing imports and add:

```tsx
import { FolioInput, FolioTextarea } from '@/components/ui/FolioUI';
```

Then delete the two inline function definitions (lines ~41–71, the `function FolioInput` and `function FolioTextarea` blocks).

- [ ] **Step 2: Add retry button to the error banner**

Find this block in the page:
```tsx
{error && (
  <div style={{ marginBottom: 16, padding: '12px 16px', border: `1px solid ${T.negative}`, background: T.tint, fontFamily: T.mono, fontSize: 11, color: T.negative }}>
    {error}
  </div>
)}
```

Replace with:
```tsx
{error && (
  <div style={{ marginBottom: 16, padding: '12px 16px', border: `1px solid ${T.negative}`, background: T.tint, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.negative }}>{error}</span>
    <button
      type="button"
      onClick={handleCommit}
      disabled={saving}
      style={{ background: 'none', border: `1px solid ${T.negative}`, padding: '4px 12px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: T.mono, fontSize: 10, color: T.negative, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}
    >
      Retry
    </button>
  </div>
)}
```

- [ ] **Step 3: Add useEffect for auto-redirect after success**

At the top of the `CommitPageContent` function body, import `useEffect` (it is already imported — check; if not, add it to the React import). Then add this effect anywhere after the `const [success, setSuccess] = useState(false);` line:

```tsx
useEffect(() => {
  if (!success) return;
  const t = setTimeout(() => router.push('/dashboard'), 3000);
  return () => clearTimeout(t);
}, [success, router]);
```

Also clear the error when any field changes by adding `setError(null)` inside the relevant `onChange` handlers, OR add this simple approach: clear error on retry click (already handled by `setError(null)` at start of `handleCommit`).

- [ ] **Step 4: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. The auto-redirect fires 3s after `setSuccess(true)`, giving the user time to read the summary; the manual "Go to dashboard →" button remains for immediate navigation.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(plan\)/commit/page.tsx
git commit -m "feat: commit page — shared primitives, retry button, auto-redirect"
```

---

### Task 3: Dashboard — stats loading placeholders + remove false affordance

**Files:**
- Modify: `src/app/(plan)/dashboard/page.tsx`

- [ ] **Step 1: Destructure isLoading from useDashboardStats**

Find:
```tsx
const { data: stats } = useDashboardStats(user?.id);
```

Replace with:
```tsx
const { data: stats, isLoading: statsLoading } = useDashboardStats(user?.id);
```

- [ ] **Step 2: Update GlossPanel to accept and use `loading` prop**

Find the `GlossPanel` function signature:
```tsx
function GlossPanel({
  streak,
  completedHabits,
  totalHabits,
  totalDirectives,
  todayCommitted,
  weekPct,
}: {
  streak: number;
  completedHabits: number;
  totalHabits: number;
  totalDirectives: number;
  todayCommitted: boolean;
  weekPct: number;
}) {
```

Replace with:
```tsx
function GlossPanel({
  streak,
  completedHabits,
  totalHabits,
  totalDirectives,
  todayCommitted,
  weekPct,
  loading,
}: {
  streak: number;
  completedHabits: number;
  totalHabits: number;
  totalDirectives: number;
  todayCommitted: boolean;
  weekPct: number;
  loading: boolean;
}) {
```

In the GlossPanel JSX, find the streak number render:
```tsx
{streak}
```
(inside the `fontSize: 72` div) — replace with `{loading ? '—' : streak}`.

Find the weekPct number render:
```tsx
{weekPct}
```
(inside the `fontSize: 36` div) — replace with `{loading ? '—' : weekPct}`.

- [ ] **Step 3: Update MobileStatStrip to accept and use `loading` prop**

Find `MobileStatStrip` function signature and add `loading: boolean` to both the destructured params and the type annotation.

In the render, replace the streak number:
```tsx
{streak}
```
(inside the `fontSize: 28` span) → `{loading ? '—' : streak}`.

Replace the weekPct number:
```tsx
{weekPct}%
```
(the `color: T.ink` span inside the "this week" text) → `{loading ? '—' : weekPct}%`.

- [ ] **Step 4: Pass `loading={statsLoading}` to both GlossPanel and MobileStatStrip**

Find the `<GlossPanel` call and add `loading={statsLoading}`.

Find the `<MobileStatStrip` call and add `loading={statsLoading}`.

- [ ] **Step 5: Remove the decorative checkbox from TodaySection**

In `TodaySection`, find each directive row's `gridTemplateColumns`:
```tsx
gridTemplateColumns: '110px 1fr 22px',
```
Change to:
```tsx
gridTemplateColumns: '110px 1fr',
```

Then delete the `<div>` immediately following the subtitle div:
```tsx
<div style={{
  width: 13, height: 13,
  border: `1px solid ${T.stone}`,
  flexShrink: 0,
}} />
```

- [ ] **Step 6: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. Visually: GlossPanel shows `—` for streak and weekPct while stats load, then updates with real numbers.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(plan\)/dashboard/page.tsx
git commit -m "fix: dashboard stats loading placeholders, remove decorative checkbox"
```

---

### Task 4: Dashboard — mobile sticky commit CTA

**Files:**
- Modify: `src/app/(plan)/dashboard/page.tsx`

- [ ] **Step 1: Add CSS for the mobile CTA bar**

In the `<style>` block inside `FolioDashboard`, add these lines at the end (before the closing backtick):

```css
.db-mobile-cta { display: none; }
@media (max-width: 820px) {
  .db-mobile-cta { display: flex !important; }
}
```

- [ ] **Step 2: Add sticky commit bar JSX**

At the very end of the returned JSX, just before the closing `</div>` of the outer wrapper, add:

```tsx
{/* Sticky commit bar — mobile only, shown when day is not yet committed */}
{!todayCommitted && hasContent && (
  <div className="db-mobile-cta" style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: 56,
    alignItems: 'center', justifyContent: 'center',
    background: T.surface, borderTop: `1px solid ${T.rule}`,
    zIndex: 40,
  }}>
    <Link href="/commit" style={{
      fontFamily: T.mono, fontSize: 10, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: T.accent, textDecoration: 'none',
    }}>
      → Commit today
    </Link>
  </div>
)}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. On a narrow viewport (≤820px) with an uncommitted day, a sticky bar appears at the bottom with the commit link. It disappears once the day is committed.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(plan\)/dashboard/page.tsx
git commit -m "feat: mobile sticky commit CTA on dashboard"
```

---

### Task 5: Training page — rest day typography

**Files:**
- Modify: `src/app/(plan)/training/page.tsx`

- [ ] **Step 1: Change rest day render from mono to serifD**

In `SplitGrid`, find:
```tsx
<div style={{ fontFamily: T.mono, fontSize: 12, color: T.stone, fontStyle: 'italic' }}>Rest day</div>
```

Replace with:
```tsx
<div style={{ fontFamily: T.serifD, fontSize: 13, color: T.stone, fontStyle: 'italic' }}>Rest day</div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. Rest day cells in the training grid now show italic serif text matching the design system.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(plan\)/training/page.tsx
git commit -m "fix: rest day typography in training split grid"
```

---

### Task 6: Skills page — swap inline modal for shared component + loading skeleton

**Files:**
- Modify: `src/app/(plan)/skills/[subject]/page.tsx`

**Interfaces:**
- Consumes: `LogSkillSessionModal` from `@/components/skills/LogSkillSessionModal`
  - Props: `open`, `onClose`, `userId`, `subject`, `benchmarks: SkillBenchmark[]`, `defaultBenchmarkId?: string | null`, `onSaved?: () => void`

- [ ] **Step 1: Add import for the shared modal**

At the top of the file add:
```tsx
import LogSkillSessionModal from '@/components/skills/LogSkillSessionModal';
```

- [ ] **Step 2: Remove the inline LogSessionModal function**

Delete the entire `function LogSessionModal(...)` block at the top of the file (approximately lines 23–180 — from `// ─── Log Session Modal` through the closing `}` of the function). The function starts with `function LogSessionModal({` and ends before `// ─── Migration notice`.

- [ ] **Step 3: Remove unused imports**

In the import line `import { Check, X, Loader2 } from 'lucide-react';`, remove `X` and `Loader2` (they were only used in the inline modal). If `Check` is also unused in the rest of the file, remove it too. Also remove `import { logSkillSession } from '@/actions/skillActions';` if it exists and is now unused.

- [ ] **Step 4: Update the modal call site**

Find:
```tsx
<LogSessionModal
  open={logOpen}
  onClose={() => setLogOpen(false)}
  userId={user.id}
  subject={skillData.subject}
  nodes={planNodes}
  defaultNodeId={planNodes[0]?.id ?? null}
  onSaved={() => {
    qc.invalidateQueries({ queryKey: ['skill-progress', user.id, urlSubject || planSubject] });
    setLogOpen(false);
  }}
/>
```

Replace with:
```tsx
<LogSkillSessionModal
  open={logOpen}
  onClose={() => setLogOpen(false)}
  userId={user.id}
  subject={skillData.subject}
  benchmarks={planNodes}
  defaultBenchmarkId={planNodes[0]?.id ?? null}
  onSaved={() => {
    qc.invalidateQueries({ queryKey: ['skill-progress', user.id, urlSubject || planSubject] });
    setLogOpen(false);
  }}
/>
```

(`SkillBenchmark = ModuleNode` per schema.ts — the type is compatible, only the prop names differ.)

- [ ] **Step 5: Add node list loading skeleton**

In the node list render, find:
```tsx
{planNodes.length === 0 ? (
  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, padding: '24px 0' }}>
    No nodes defined. ...
  </div>
) : planNodes.map((node, idx) => {
```

Change to:
```tsx
{historyLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {[0, 1, 2, 3].map(i => (
      <div key={i} style={{
        padding: '14px 0',
        borderBottom: i < 3 ? `1px solid ${T.rule}` : 'none',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 8, height: 8, background: T.tint, flexShrink: 0 }} />
        <div style={{ height: 13, width: '55%', background: T.tint }} />
      </div>
    ))}
  </div>
) : planNodes.length === 0 ? (
  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, padding: '24px 0' }}>
    No nodes defined. ...
  </div>
) : planNodes.map((node, idx) => {
```

- [ ] **Step 6: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. The shared `LogSkillSessionModal` opens when "Log Session →" is clicked.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(plan\)/skills/\[subject\]/page.tsx
git commit -m "refactor: skills page — use shared LogSkillSessionModal, add node loading skeleton"
```

---

### Task 7: Add toYmd to utils + create TrainingWeekGrid

**Files:**
- Modify: `src/lib/utils.ts`
- Create: `src/components/reports/TrainingWeekGrid.tsx`

**Interfaces:**
- Produces: `export function toYmd(d: Date): string` — returns `'YYYY-MM-DD'`
- Produces: `export default function TrainingWeekGrid(props: TrainingWeekGridProps): JSX.Element`
  ```ts
  type TrainingWeekGridProps = {
    workoutData: WorkoutModuleData;
    dayLabels: string[];       // e.g. ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    dateLabels: string[];      // e.g. ['16 JUN', '17 JUN', ...]
    ymdLabels: string[];       // e.g. ['2026-06-16', ...]
    committedDates: Set<string>;
    todayYmd: string;
    maxExercises?: number;     // undefined = show all; provide 4 for weekly truncated view
  }
  ```

- [ ] **Step 1: Add toYmd to utils.ts**

Append to `src/lib/utils.ts`:
```ts
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Create TrainingWeekGrid.tsx**

Create `src/components/reports/TrainingWeekGrid.tsx`:

```tsx
import type { WorkoutModuleData } from '@/types/schema';
import { T } from '@/lib/tokens';

const DAY_FULL: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

type Props = {
  workoutData: WorkoutModuleData;
  dayLabels: string[];
  dateLabels: string[];
  ymdLabels: string[];
  committedDates: Set<string>;
  todayYmd: string;
  maxExercises?: number;
};

export default function TrainingWeekGrid({
  workoutData, dayLabels, dateLabels, ymdLabels, committedDates, todayYmd, maxExercises,
}: Props) {
  return (
    <div>
      {/* Exercise grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${T.rule}` }}>
        {dayLabels.map((label, i) => {
          const isToday = ymdLabels[i] === todayYmd;
          const exercises: string[] = workoutData.split?.[DAY_FULL[label] ?? label] ?? [];
          const isRest = exercises.length === 0;
          const shown = maxExercises != null ? exercises.slice(0, maxExercises) : exercises;
          const overflow = maxExercises != null ? Math.max(0, exercises.length - maxExercises) : 0;

          return (
            <div
              key={i}
              style={{
                borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
                background: isToday ? T.tint : 'transparent',
                padding: '12px 10px',
                minHeight: 88,
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: isToday ? T.accent : T.stone }}>
                  {label}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, marginTop: 1 }}>
                  {dateLabels[i]}
                </div>
              </div>
              {isRest ? (
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Rest
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {shown.map((ex, ei) => (
                    <div key={ei} style={{ fontFamily: T.mono, fontSize: 9, color: isToday ? T.ink : T.stone, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                      {ex}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}>+{overflow}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Committed row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderLeft: `1px solid ${T.rule}`, borderRight: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
        {ymdLabels.map((ymd, i) => {
          const isFuture = ymd > todayYmd;
          const isToday  = ymd === todayYmd;
          const isKept   = !isFuture && committedDates.has(ymd);

          let bg     = 'transparent';
          let border = `1px solid ${T.rule}`;
          if (isToday && isKept)  { bg = T.accent; border = 'none'; }
          else if (isToday)       { border = `1px solid ${T.accent}`; }
          else if (isKept)        { bg = T.ink;    border = 'none'; }
          else if (isFuture)      { border = `1px dashed ${T.rule}`; }

          return (
            <div key={ymd} style={{
              borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
              padding: '6px 10px',
              display: 'flex', alignItems: 'center',
            }}>
              <div style={{ width: 14, height: 14, background: bg, border, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 8, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
        Committed
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/components/reports/TrainingWeekGrid.tsx
git commit -m "feat: add toYmd util and shared TrainingWeekGrid component"
```

---

### Task 8: Weekly report — use shared grid + add commit overlay

**Files:**
- Modify: `src/app/(plan)/reports/weekly/page.tsx`

**Interfaces:**
- Consumes: `TrainingWeekGrid` from `@/components/reports/TrainingWeekGrid` (Task 7)
- Consumes: `toYmd` from `@/lib/utils` (Task 7)

- [ ] **Step 1: Add new imports**

At the top of `src/app/(plan)/reports/weekly/page.tsx` add:
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toYmd } from '@/lib/utils';
import TrainingWeekGrid from '@/components/reports/TrainingWeekGrid';
```

- [ ] **Step 2: Delete the local TrainingGrid function**

Delete the entire `function TrainingGrid(...)` block (approximately lines 31–87 in the original file).

- [ ] **Step 3: Generate ymdLabels alongside dayLabels/dateLabels**

Find the loop that builds `dayLabels` and `dateLabels`:
```ts
const dayLabels:  string[] = [];
const dateLabels: string[] = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
  dateLabels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase());
}
```

Replace with:
```ts
const dayLabels:  string[] = [];
const dateLabels: string[] = [];
const ymdLabels:  string[] = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
  dateLabels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase());
  ymdLabels.push(toYmd(d));
}
const todayYmd = toYmd(now);
```

- [ ] **Step 4: Add commit data query**

After the `ymdLabels` / `todayYmd` block, add:
```ts
const { data: weekCommits } = useQuery({
  queryKey: ['week-commits', user?.id, ymdLabels[0]],
  enabled: !!user?.id,
  staleTime: 30_000,
  queryFn: async () => {
    const { data } = await supabase
      .from('daily_commits')
      .select('date')
      .eq('user_id', user!.id)
      .gte('date', ymdLabels[0])
      .lte('date', ymdLabels[6]);
    return new Set<string>((data ?? []).map((r: { date: string }) => r.date));
  },
});
const committedDates = weekCommits ?? new Set<string>();
```

- [ ] **Step 5: Replace TrainingGrid usage with TrainingWeekGrid**

Find:
```tsx
<TrainingGrid workoutData={workoutData} dayLabels={dayLabels} dateLabels={dateLabels} />
```

Replace with:
```tsx
<TrainingWeekGrid
  workoutData={workoutData}
  dayLabels={dayLabels}
  dateLabels={dateLabels}
  ymdLabels={ymdLabels}
  committedDates={committedDates}
  todayYmd={todayYmd}
  maxExercises={4}
/>
```

- [ ] **Step 6: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. The weekly training grid now shows a "Committed" row below the exercises.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(plan\)/reports/weekly/page.tsx
git commit -m "feat: weekly report — shared grid, commit overlay row"
```

---

### Task 9: Debrief report — shared grid + commit overlay + summary panel

**Files:**
- Modify: `src/app/(plan)/reports/debrief/page.tsx`

**Interfaces:**
- Consumes: `TrainingWeekGrid` from `@/components/reports/TrainingWeekGrid` (Task 7)
- Consumes: `toYmd` from `@/lib/utils` (Task 7)

- [ ] **Step 1: Add new imports**

At the top of `src/app/(plan)/reports/debrief/page.tsx` add:
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toYmd } from '@/lib/utils';
import TrainingWeekGrid from '@/components/reports/TrainingWeekGrid';
```

- [ ] **Step 2: Delete the local TrainingSchedule function**

Delete the entire `function TrainingSchedule(...)` block (approximately lines 30–78 in the original file).

- [ ] **Step 3: Add ymdLabels, todayYmd, and commit query in DebriefContent**

Find the day label loop and replace with the same pattern as Task 8 (add `ymdLabels`, `todayYmd`, commit query — identical logic).

After the loop, add:
```ts
const todayYmd = toYmd(now);

const { data: weekCommits } = useQuery({
  queryKey: ['week-commits', user?.id, ymdLabels[0]],
  enabled: !!user?.id,
  staleTime: 30_000,
  queryFn: async () => {
    const { data } = await supabase
      .from('daily_commits')
      .select('date, completed_habits')
      .eq('user_id', user!.id)
      .gte('date', ymdLabels[0])
      .lte('date', ymdLabels[6]);
    return {
      datesSet: new Set<string>((data ?? []).map((r: { date: string }) => r.date)),
      totalHabitsLogged: (data ?? []).reduce((acc, r: { completed_habits: unknown }) => {
        return acc + (Array.isArray(r.completed_habits) ? r.completed_habits.length : 0);
      }, 0),
    };
  },
});
const committedDates  = weekCommits?.datesSet ?? new Set<string>();
const habitsThisWeek  = weekCommits?.totalHabitsLogged ?? 0;
```

- [ ] **Step 4: Replace TrainingSchedule usage with TrainingWeekGrid**

Find:
```tsx
<TrainingSchedule workoutData={workoutData} dayLabels={dayLabels} dateLabels={dateLabels} />
```

Replace with:
```tsx
<TrainingWeekGrid
  workoutData={workoutData}
  dayLabels={dayLabels}
  dateLabels={dateLabels}
  ymdLabels={ymdLabels}
  committedDates={committedDates}
  todayYmd={todayYmd}
/>
```

- [ ] **Step 5: Add summary panel below the training schedule section**

After the closing `</div>` of the training schedule section (the `{workoutMod && workoutData && (...)}` block), add:

```tsx
{/* Summary panel */}
{(() => {
  const coachNote =
    last7 >= 5 ? 'Strong week. Maintain cadence.'
    : last7 >= 3 ? 'Solid effort. Push for consistency next week.'
    : 'Light week. Recommit tomorrow.';
  return (
    <div style={{ marginBottom: 32, display: 'flex', gap: 16 }}>
      <div style={{ width: 4, background: T.accent, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.ink }}>
          <span style={{ color: T.stone }}>Sessions committed: </span>{last7} / 7
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.ink }}>
          <span style={{ color: T.stone }}>Habits logged this week: </span>{habitsThisWeek}
        </div>
        <div style={{ fontFamily: T.serifD, fontSize: 14, fontStyle: 'italic', color: T.stone, marginTop: 2 }}>
          {coachNote}
        </div>
      </div>
    </div>
  );
})()}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. Debrief page shows commit overlay on the training grid and a summary panel below it.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(plan\)/reports/debrief/page.tsx
git commit -m "feat: debrief — shared grid, commit overlay, summary panel"
```

---

### Task 10: Mobile page — wire to real data and move to (plan) route group

**Files:**
- Create: `src/app/(plan)/mobile/page.tsx`
- Delete: `src/app/mobile/page.tsx`

- [ ] **Step 1: Create the real-data mobile page**

Create `src/app/(plan)/mobile/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useDashboardVM, usePlan } from '@/contexts/PlanContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { T } from '@/lib/tokens';

export default function MobileCommandView() {
  const { user }   = useAuth();
  const vm         = useDashboardVM();
  const plan       = usePlan();
  const { data: stats } = useDashboardStats(user?.id);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  }).toUpperCase();

  const streak        = stats?.commits.streakDays ?? 0;
  const todayCommitted = stats?.commits.todayCommitted ?? false;

  const directives = vm.today.directives;
  const totalItems = directives.length + plan.habits.length;
  const donePct    = totalItems === 0 ? 0 : todayCommitted ? 100 : 0;

  return (
    <div style={{ background: T.surface, color: T.ink, minHeight: '100vh', fontFamily: T.sans }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: T.surface, borderBottom: `1px solid ${T.rule}`,
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink }}>
          FOLIO
        </span>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: `1px solid ${T.rule}` }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent }}>
              {streak}D STREAK
            </span>
          </div>
        )}
      </header>

      <main style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* Date + progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 6 }}>
            {today}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: T.serifD, fontSize: 48, lineHeight: 1, color: T.ink }}>{donePct}</span>
            <span style={{ fontFamily: T.serifD, fontSize: 24, color: T.accent }}>%</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone, marginLeft: 4 }}>
              Daily alignment
            </span>
          </div>
          <div style={{ height: 3, background: T.rule, width: '100%', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', background: T.ink, transform: `scaleX(${(donePct / 100).toFixed(3)})`, transformOrigin: 'left center', transition: 'transform 0.25s ease-out' }} />
          </div>
        </div>

        {/* Today's sessions */}
        {directives.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone, marginBottom: 12 }}>
              Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {directives.map((d, i) => (
                <div key={d.moduleId} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 0',
                  borderBottom: i < directives.length - 1 ? `1px solid ${T.rule}` : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.moduleColors[d.type as keyof typeof T.moduleColors] ?? T.stone, marginBottom: 3 }}>
                      {d.type}
                    </div>
                    <div style={{ fontFamily: T.serifD, fontSize: 15, color: T.ink }}>{d.title}</div>
                    {d.subtitle && (
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, marginTop: 2 }}>{d.subtitle}</div>
                    )}
                  </div>
                  {todayCommitted && (
                    <div style={{ width: 5, height: 5, background: T.positive, flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick commit buttons */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone, marginBottom: 12 }}>
            Quick commit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Full daily commit', href: '/commit', color: T.ink },
              { label: 'Go to dashboard',   href: '/dashboard', color: T.stone },
            ].map((item, i, arr) => (
              <Link
                key={i}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.rule}` : 'none',
                  textDecoration: 'none',
                  fontFamily: T.mono, fontSize: 11,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: item.color,
                }}
              >
                {item.label}
                <span style={{ color: T.stone }}>→</span>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
```

- [ ] **Step 2: Delete the old static mobile page**

Delete `src/app/mobile/page.tsx`. The route `/mobile` now resolves to `src/app/(plan)/mobile/page.tsx` which inherits the `(plan)` layout's `AuthGuard`.

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no errors. Navigating to `/mobile` shows real streak, real directives, and the commit link.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(plan\)/mobile/page.tsx
git rm src/app/mobile/page.tsx
git commit -m "feat: mobile page — real data, auth guard via (plan) layout"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Dashboard loading skeleton (stats) | Task 3 |
| Remove false affordance (Today checkboxes) | Task 3 |
| Mobile sticky commit CTA | Task 4 |
| Extract FolioInput/FolioTextarea | Task 1 |
| Commit save feedback | Task 2 (auto-redirect) — overlay already existed |
| Commit inline error recovery with retry | Task 2 |
| Training rest day typography | Task 5 |
| Skills modal deduplication | Task 6 |
| Skills node loading skeleton | Task 6 |
| Extract TrainingWeekGrid | Task 7 |
| Weekly report commit overlay | Task 8 |
| Debrief commit overlay | Task 9 |
| Debrief summary panel | Task 9 |
| Mobile page real data | Task 10 |
| Mobile auth guard | Task 10 |

All spec requirements covered. No TBDs, no placeholders. Type signatures are consistent across tasks.
