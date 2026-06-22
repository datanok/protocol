# Task 8 Report: Weekly report — shared grid + commit overlay

## Status
DONE

## Commit
`81a9ed2` — feat: weekly report — shared TrainingWeekGrid + commit overlay

## Build result
Clean. TypeScript passed, all 16 routes compiled (3.1s compile, 5.9s type-check).

## Changes made

All 6 required changes applied to `src/app/(plan)/reports/weekly/page.tsx`:

1. **Imports added** — `useQuery`, `supabase`, `toYmd`, `TrainingWeekGrid`
2. **`ymdLabels` array** — populated in the existing 7-day loop via `toYmd(d)`
3. **Commit query** — `useQuery(['week-commits', ...])`  fetches `committed_date` from `daily_commits` for the 7-day window; disabled when no `user.id`
4. **JSX replaced** — `<TrainingGrid>` → `<TrainingWeekGrid>` with `ymdLabels`, `committedDates={commitRows}`, `maxExercises={4}`
5. **Local `TrainingGrid` removed** — entire 57-line function deleted
6. **`DAY_FULL` removed** — constant was only used by the deleted `TrainingGrid`

Net diff: +34 / -66 lines.

## Concerns
None. The commit query is gracefully disabled (`enabled: !!user?.id`) so the grid renders without dots if the user is unauthenticated or the query is still loading — same behaviour as before, just with real data when available.
