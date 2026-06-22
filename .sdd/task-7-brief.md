# Task 7 Brief: toYmd util + TrainingWeekGrid component

## Context
Task 7 of 10. Creates infrastructure for Tasks 8 and 9.

**File 1: `src/lib/utils.ts`** — add `toYmd`
**File 2: `src/components/reports/TrainingWeekGrid.tsx`** — new file, shared 7-col training grid

## Change 1: Add toYmd to utils.ts

Read the current `src/lib/utils.ts` (it currently only exports `cn`). Add:

```ts
/** Returns YYYY-MM-DD string for the given date in local time. */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

## Change 2: Create TrainingWeekGrid

Create `src/components/reports/TrainingWeekGrid.tsx` with this exact content:

```tsx
import type { WorkoutModuleData } from '@/types/schema';
import { T } from '@/lib/tokens';

const DAY_FULL: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

interface TrainingWeekGridProps {
  workoutData:     WorkoutModuleData;
  dayLabels:       string[];   // e.g. ['MON','TUE',...]
  dateLabels:      string[];   // e.g. ['5 JAN','6 JAN',...]
  committedDates?: string[];   // YYYY-MM-DD strings for days with a commit
  maxExercises?:   number;     // truncate; undefined = show all
}

export default function TrainingWeekGrid({
  workoutData,
  dayLabels,
  dateLabels,
  committedDates,
  maxExercises,
}: TrainingWeekGridProps) {
  const commitSet = new Set(committedDates ?? []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${T.rule}` }}>
      {dayLabels.map((label, i) => {
        const isToday   = i === dayLabels.length - 1;
        const exercises = workoutData.split?.[DAY_FULL[label] ?? label] ?? [];
        const isRest    = exercises.length === 0;
        const committed = committedDates != null ? commitSet.has(dateLabels[i] ?? '') : null;

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
            {/* Commit dot (only when data supplied) */}
            {committed !== null && (
              <div style={{ width: 4, height: 4, background: committed ? T.positive : T.rule, marginBottom: 6 }} />
            )}

            {/* Day label */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: isToday ? T.accent : T.stone }}>
                {label}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, marginTop: 1 }}>
                {dateLabels[i]}
              </div>
            </div>

            {/* Exercises */}
            {isRest ? (
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Rest
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(maxExercises != null ? exercises.slice(0, maxExercises) : exercises).map((ex: string, ei: number) => (
                  <div key={ei} style={{ fontFamily: T.mono, fontSize: 9, color: isToday ? T.ink : T.stone, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                    {ex}
                  </div>
                ))}
                {maxExercises != null && exercises.length > maxExercises && (
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}>
                    +{exercises.length - maxExercises}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Note on `committedDates` vs `dateLabels`:** The `committedDates` prop is YYYY-MM-DD strings (e.g. `["2026-06-22"]`). The `dateLabels` are display strings like `"22 JUN"`. These are incompatible for direct comparison. The `committed` variable in the code above is WRONG as written (compares YYYY-MM-DD to "22 JUN"). 

**Correct approach:** Change the component to accept `ymdLabels: string[]` (YYYY-MM-DD) alongside `dateLabels`, and compare against that:

```ts
const committed = committedDates != null ? commitSet.has(ymdLabels[i] ?? '') : null;
```

Updated interface:
```ts
interface TrainingWeekGridProps {
  workoutData:     WorkoutModuleData;
  dayLabels:       string[];   // e.g. ['MON','TUE',...]
  dateLabels:      string[];   // e.g. ['5 JAN','6 JAN',...]  (display)
  ymdLabels?:      string[];   // e.g. ['2026-06-16','2026-06-17',...]  (for commit lookup)
  committedDates?: string[];   // YYYY-MM-DD strings for days with a commit
  maxExercises?:   number;     // truncate; undefined = show all
}
```

And in the render:
```ts
const committed = (committedDates != null && ymdLabels != null) ? commitSet.has(ymdLabels[i] ?? '') : null;
```

Use this corrected version.

## Verification
Run `npm run build` — must pass.

## Commit message
`feat: toYmd util + TrainingWeekGrid shared component`

## Report
Write to `.sdd/task-7-report.md`.
Return: status, commit hash, build result, concerns.
