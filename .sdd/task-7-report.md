# Task 7 Report: toYmd util + TrainingWeekGrid component

## Status
COMPLETE

## Commit
`73098f1` — feat: toYmd util + TrainingWeekGrid shared component

## Build Result
PASS — `next build` compiled successfully with no TypeScript errors, 16/16 static pages generated.

## What Was Done

### src/lib/utils.ts
Added `toYmd(d: Date): string` export that formats a Date to `YYYY-MM-DD` using local time (getFullYear / getMonth / getDate with zero-padding).

### src/components/reports/TrainingWeekGrid.tsx
Created new shared component. Key decisions:

- Used the **corrected interface** from the brief's correction note: added `ymdLabels?: string[]` alongside `dateLabels` so commit lookup compares YYYY-MM-DD to YYYY-MM-DD, not to display strings like `"22 JUN"`.
- `committed` is only non-null when both `committedDates` and `ymdLabels` are provided, making the commit dot opt-in.
- `isToday` is determined by the last index (`dayLabels.length - 1`), matching the brief — callers are expected to pass the current week ending today as the last column.
- Exercise list typed as `string[]` matching `WorkoutModuleData.split: Record<string, string[]>` in schema.ts.
- All styles via inline `T.*` tokens (no Tailwind classes), consistent with the app's brutalist design system.

## Concerns
None. The component is pure (no side effects, no hooks) and makes no assumptions about how callers construct `dayLabels` / `dateLabels` / `ymdLabels` — that responsibility lies with Tasks 8 and 9.
