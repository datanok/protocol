# Task 9 Brief: Debrief — shared grid + commit overlay + summary panel

## Context
Task 9 of 10. Modifies `src/app/(plan)/reports/debrief/page.tsx`.

Same pattern as Task 8 applied to the debrief page. The debrief already has `directives` array with 4 coaching notes.

## Required changes

### Step 1: Add imports

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toYmd } from '@/lib/utils';
import TrainingWeekGrid from '@/components/reports/TrainingWeekGrid';
```

### Step 2: Add ymdLabels to the date loop

Find the loop:
```tsx
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
```tsx
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
```

### Step 3: Add commit data query

After the loop:
```tsx
const startYmd = ymdLabels[0]!;
const endYmd   = ymdLabels[6]!;

const { data: commitRows } = useQuery({
  queryKey: ['week-commits', user?.id, startYmd, endYmd],
  queryFn:  async () => {
    if (!user?.id) return [];
    const { data, error } = await supabase
      .from('daily_commits')
      .select('committed_date')
      .eq('user_id', user.id)
      .gte('committed_date', startYmd)
      .lte('committed_date', endYmd);
    if (error) throw error;
    return (data ?? []).map((r: { committed_date: string }) => r.committed_date);
  },
  enabled: !!user?.id,
});
```

### Step 4: Replace TrainingSchedule with TrainingWeekGrid

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
  committedDates={commitRows}
/>
```

(No `maxExercises` — debrief shows all exercises)

### Step 5: Remove local TrainingSchedule component

Delete the entire `function TrainingSchedule(...)` definition (lines 30-78 in the original file).

### Step 6: Remove unused DAY_FULL constant

Check if `DAY_FULL` is still used after removing `TrainingSchedule`. If not, delete it.

### Step 7: Add summary panel above the system directives section

The debrief already has a "System Directive" panel (lines ~192-211). Add a small summary panel ABOVE it (before the existing `border: 1px solid T.rule` panel).

This new panel has:
- A 4px accent bar on the left (using a flex layout)
- `{last7}/7` sessions committed this week
- `{plan.habits.length}` habits tracked
- The first directive coaching note (already in `directives[0]`)

```tsx
{/* ── Week summary panel ────────────────────────────────────── */}
<div style={{ display: 'flex', marginBottom: 32 }}>
  <div style={{ width: 4, flexShrink: 0, background: T.accent }} />
  <div style={{ flex: 1, padding: '16px 20px', border: `1px solid ${T.rule}`, borderLeft: 'none' }}>
    <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 4 }}>
          Committed
        </div>
        <div style={{ fontFamily: T.serifD, fontSize: 24, color: T.ink, lineHeight: 1 }}>
          {last7}<span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone }}>/7</span>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 4 }}>
          Habits
        </div>
        <div style={{ fontFamily: T.serifD, fontSize: 24, color: T.ink, lineHeight: 1 }}>
          {plan.habits.length}
        </div>
      </div>
    </div>
    <div style={{ fontFamily: T.serifT, fontSize: 14, color: T.stone, lineHeight: 1.6, fontStyle: 'italic' }}>
      {directives[0]}
    </div>
  </div>
</div>
```

Place this JSX immediately before the existing `{/* ── System directives ── */}` section.

## Verification
Run `npm run build` — must pass.

## Commit message
`feat: debrief — shared grid + commit overlay + week summary panel`

## Report
Write to `.sdd/task-9-report.md`.
Return: status, commit hash, build result, concerns.
