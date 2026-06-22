# Task 8 Brief: Weekly report — shared grid + commit overlay

## Context
Task 8 of 10. Modifies `src/app/(plan)/reports/weekly/page.tsx`.

`TrainingWeekGrid` and `toYmd` were created in Task 7. Now the weekly report should:
1. Replace its local `TrainingGrid` with the shared `TrainingWeekGrid`
2. Add `ymdLabels` array (YYYY-MM-DD strings for each of the 7 days)
3. Add a `useQuery` call to fetch which of the 7 days had commits
4. Pass commit data to the grid

## Required changes

### Step 1: Add imports

Add at the top of the file (alongside existing imports):
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toYmd } from '@/lib/utils';
import TrainingWeekGrid from '@/components/reports/TrainingWeekGrid';
```

### Step 2: Add ymdLabels to the date loop

In `WeeklyReportContent`, find the existing loop that builds `dayLabels` and `dateLabels`:
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

Add `ymdLabels` to this loop:
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

After the loop, add:
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

### Step 4: Replace TrainingGrid with TrainingWeekGrid

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
  committedDates={commitRows}
  maxExercises={4}
/>
```

### Step 5: Remove the local TrainingGrid component

Delete the entire `function TrainingGrid(...)` definition (lines 31-87 in the original file). It is no longer needed.

### Step 6: Remove unused import (if any)

Check if the `DAY_FULL` constant is now unused after removing `TrainingGrid`. If it is, delete it too.

## Verification
Run `npm run build` — must pass with no TypeScript errors.

## Commit message
`feat: weekly report — shared TrainingWeekGrid + commit overlay`

## Report
Write to `.sdd/task-8-report.md`.
Return: status, commit hash, build result, concerns.
