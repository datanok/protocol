# UI/UX Polish — Experience-First Pass
**Date:** 2026-06-22
**Approach:** B — fix highest-traffic screens first, then detail pages, then reports, then mobile.

---

## Scope

Four phases, executed in priority order. Each phase is independent and can be shipped separately.

---

## Phase 1: Dashboard

### 1a. Loading skeleton
While `usePlan()` and `useDashboardStats()` are resolving, the dashboard renders blank. Add placeholder blocks that match the real layout:
- Hero: two lines of placeholder text at the correct font sizes
- Today section: two skeleton directive rows
- Habits section: three skeleton pill shapes
- Modules section: two skeleton module rows

Use `background: T.tint` fills and no animation (consistent with the brutalist no-decoration principle).

### 1b. Fix false affordance on Today directive rows
Each row in the Today section has a decorative `□` (13×13 square with a border) at the right edge. It implies interactivity but does nothing. **Remove it.** The commit flow handles session tracking — the dashboard Today section is read-only.

### 1c. Mobile sticky commit CTA
On screens ≤820px, when `todayCommitted === false`, render a sticky bottom bar (height 56px, `background: T.surface`, `border-top: 1px solid T.rule`) containing the "→ Commit today" link centred in mono caps. Hide it once committed. This ensures the CTA is always reachable on mobile without scrolling.

---

## Phase 2: Commit Flow

### 2a. Extract shared form primitives
`FolioInput` and `FolioTextarea` are defined inline in `src/app/(plan)/commit/page.tsx`. They belong in `src/components/ui/FolioUI.tsx` alongside the existing UI components. Move them there and update the commit page to import from that path. No behaviour change.

### 2b. Save confirmation state
After a successful commit save, the page currently redirects silently. Before the router push:
- Set a local `committed` boolean state to `true`
- Render a brief confirmation: a green dot (`background: T.positive`, 5×5) + mono label "Committed." in `T.positive`
- After 1500ms, execute `router.push('/dashboard')`

### 2c. Inline error recovery
If the commit save throws, display an inline error block below the submit button:
- `background: T.tint`, `border-left: 4px solid T.negative`, padding `12px 16px`
- Mono text: the error message or "Something went wrong. Try again."
- A "Retry" button that re-triggers the save function
- Clear the error block when the user edits any field

---

## Phase 3: Training + Skills Pages

### 3a. Training page — exercise prescription hierarchy
The exercise parser already splits strings on ` — ` into `{ name, prescription }`. Currently both parts render in the same colour. Change:
- `name` → `color: T.ink`
- `prescription` → `color: T.stone`, `fontSize: 11` (one step smaller)

### 3b. Training page — rest day presence
Rest day cells currently show `"REST"` in a 9px mono label. Replace with:
```
fontFamily: T.serifD, fontSize: 13, fontStyle: 'italic', color: T.stone
text: "Rest day"
```
Centred vertically within the cell.

### 3c. Skills page — deduplicate LogSessionModal
`src/app/(plan)/skills/[subject]/page.tsx` contains a full `LogSessionModal` implementation inline. `src/components/skills/LogSkillSessionModal.tsx` already exists as the canonical version. Delete the inline modal from the skills page and import from the shared component path. Verify props match before deleting.

### 3d. Skills page — node list loading state
While `useSkillProgress()` resolves, render 3–4 skeleton node rows (same height as real rows, `background: T.tint` fill, no animation) instead of a blank list.

---

## Phase 4: Reports (Weekly + Debrief)

### 4a. Extract shared TrainingWeekGrid component
`src/app/(plan)/reports/weekly/page.tsx` defines `TrainingGrid`.
`src/app/(plan)/reports/debrief/page.tsx` defines `TrainingSchedule`.
These are near-identical. Extract to `src/components/reports/TrainingWeekGrid.tsx`:

```ts
type Props = {
  workoutData: WorkoutModuleData;
  dayLabels: string[];    // ['MON', 'TUE', ...]
  dateLabels: string[];   // ['16 JUN', '17 JUN', ...]
  maxExercises?: number;  // undefined = show all; 4 = weekly truncated view
};
```

Both report pages import and use this component. Delete the inline duplicates.

### 4b. Commit overlay row
Below the existing exercise grid, add a "Committed" row — one cell per day:
- Fetch `daily_commits` for the displayed 7-day window (same `useQuery` pattern as the dashboard consistency grid)
- Past days: filled square (`background: T.ink`) if committed, empty square (`border: 1px solid T.rule`) if missed
- Today: accent square (`background: T.accent`) if committed, empty if not
- Future days: dashed border square
- Row label: `"COMMITTED"` in 9px mono at left edge (same style as day label)

### 4c. Debrief summary panel
Below the grid, add a text summary block with a 4px left accent bar:
- **Sessions committed this week:** count of committed days in the 7-day window
- **Habits completed:** aggregate from `daily_commits.completed_habit_ids` for the week
- **One-line coaching note:** derived from a simple threshold:
  - ≥5 days: `"Strong week. Maintain cadence."`
  - 3–4 days: `"Solid effort. Push for consistency next week."`
  - ≤2 days: `"Light week. Recommit tomorrow."`

No AI call — pure data logic.

---

## Phase 5: Mobile Page

### 5a. Wire to real data
Replace all static data in `src/app/mobile/page.tsx`:
- `ITEMS` → today's directives from `useDashboardVM()` mapped to `{ label: d.title, sub: d.subtitle, done: todayCommitted }`
- `47D STREAK` → real streak from `useDashboardStats()`
- Remove the `METRICS` block entirely (fake data, no real equivalent yet)
- `donePct` → derive from actual committed habits + directives

### 5b. Auth guard
Move `src/app/mobile/page.tsx` into `src/app/(plan)/mobile/page.tsx` so it inherits the `(plan)` layout's `AuthGuard` automatically. The URL stays `/mobile` — route groups don't affect paths.

---

## What This Does Not Cover

- New features (nutrition logging, PR tracking, AI insights)
- Reports data depth (skill session history, volume charts) — separate initiative
- Builder page UX — separate initiative
- Design token consolidation in `builder/page.tsx` — low risk, can be a 5-minute cleanup PR

---

## Files Affected

| File | Change |
|---|---|
| `src/app/(plan)/dashboard/page.tsx` | Loading skeleton, remove false affordance, mobile sticky CTA |
| `src/app/(plan)/commit/page.tsx` | Remove `FolioInput`/`FolioTextarea`, add save feedback + error recovery |
| `src/components/ui/FolioUI.tsx` | Add `FolioInput`, `FolioTextarea` |
| `src/app/(plan)/training/page.tsx` | Exercise name/prescription colour split, rest day typography |
| `src/app/(plan)/skills/[subject]/page.tsx` | Remove inline modal, import shared component, add loading skeleton |
| `src/app/(plan)/reports/weekly/page.tsx` | Use shared grid component, add commit overlay row |
| `src/app/(plan)/reports/debrief/page.tsx` | Use shared grid component, add commit overlay + summary panel |
| `src/components/reports/TrainingWeekGrid.tsx` | New shared component (extracted) |
| `src/app/mobile/page.tsx` | Wire to real data, add auth guard |
