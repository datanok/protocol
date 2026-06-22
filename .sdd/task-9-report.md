# Task 9 Report: Debrief — shared grid + commit overlay + summary panel

## Status: COMPLETE

## Commit
`5c02736` — feat: debrief — shared grid + commit overlay + week summary panel

## Build result
PASS — `npm run build` compiled successfully (Turbopack, 3.0s), TypeScript clean, all 16 pages generated.

## Changes made (all 7 steps)

1. **Added imports** — `useQuery`, `supabase`, `toYmd`, `TrainingWeekGrid`
2. **Added `ymdLabels` to the date loop** — third parallel array alongside `dayLabels` / `dateLabels`
3. **Added commit data query** — `useQuery(['week-commits', ...])` fetches `daily_commits` for the 7-day window
4. **Replaced `<TrainingSchedule>` with `<TrainingWeekGrid>`** — passes `ymdLabels` and `committedDates={commitRows}`, no `maxExercises` (full list)
5. **Removed local `TrainingSchedule` function** — 49 lines deleted
6. **Removed `DAY_FULL` constant** — no longer used after removing `TrainingSchedule`
7. **Added week summary panel** — 4px accent bar + `{last7}/7` sessions + `{plan.habits.length}` habits + `directives[0]` coaching note, placed above the System Directive section

## Concerns
None. Clean removal of the local component, no type errors, no unused imports remaining.
