# Task 3 Brief: Dashboard — stats loading placeholders + remove false affordance

## Context
Task 3 of 10. Modifies `src/app/(plan)/dashboard/page.tsx`.

Two changes:
1. While `useDashboardStats` is loading, the dashboard shows `0` for streak and weekPct. Change to show `—` instead.
2. Each row in the Today section has a decorative `□` (13×13 square border) that looks interactive but does nothing. Remove it.

## Change 1: Stats loading placeholder

### Step 1a — destructure isLoading
Find:
```tsx
const { data: stats } = useDashboardStats(user?.id);
```
Replace with:
```tsx
const { data: stats, isLoading: statsLoading } = useDashboardStats(user?.id);
```

### Step 1b — add `loading` prop to GlossPanel
Find the GlossPanel function signature:
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

In the GlossPanel JSX body, find the streak number (it's in a div with `fontSize: 72`):
```tsx
{streak}
```
Replace with:
```tsx
{loading ? '—' : streak}
```

Find the weekPct number (it's in a span with `fontSize: 36`):
```tsx
{weekPct}
```
Replace with:
```tsx
{loading ? '—' : weekPct}
```

### Step 1c — add `loading` prop to MobileStatStrip
Find the MobileStatStrip function — it takes streak and weekPct as props. Add `loading: boolean` to both the destructured params and the TypeScript type annotation.

In the MobileStatStrip JSX body:
- Find the streak number in the `fontSize: 28` span and change `{streak}` to `{loading ? '—' : streak}`
- Find the weekPct number (it's inside `color: T.ink`) and change `{weekPct}%` to `{loading ? '—' : weekPct}%`

### Step 1d — pass loading prop to both components
Find `<GlossPanel` usage and add `loading={statsLoading}`.
Find `<MobileStatStrip` usage and add `loading={statsLoading}`.

## Change 2: Remove decorative checkbox from Today rows

In the `TodaySection` component, find the directive row div with:
```tsx
gridTemplateColumns: '110px 1fr 22px',
```
Change to:
```tsx
gridTemplateColumns: '110px 1fr',
```

Then find and delete the decorative square div (it immediately follows the subtitle div inside the row):
```tsx
<div style={{
  width: 13, height: 13,
  border: `1px solid ${T.stone}`,
  flexShrink: 0,
}} />
```
Delete it entirely.

## Verification
Run `npm run build` — must pass.

## Commit message
`fix: dashboard stats loading placeholders, remove decorative checkbox`

## Report
Write to `.sdd/task-3-report.md`.
Return: status, commit hash, build result, concerns.
