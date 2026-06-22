# Task 2 Report: Commit page — shared primitives, retry button, auto-redirect

## Status: DONE

## Commit
`e717220` — feat: commit page — shared primitives, retry button, auto-redirect

## Build result
✓ Compiled successfully in 2.7s — TypeScript clean, all 16 routes generated, no new errors.

## Changes made

### 1. Added shared import
Added `import { FolioInput, FolioTextarea } from '@/components/ui/FolioUI';` after the `T` token import.

### 2. Deleted inline duplicates
Removed the two local `function FolioInput(...)` and `function FolioTextarea(...)` definitions (lines 41–71 in the original), consolidating onto the shared primitives from Task 1.

### 3. Error banner — retry button
Replaced the plain `<div>{error}</div>` banner with a flex row: error text on the left, an uppercase monospace "Retry" button on the right that calls `handleCommit` and is disabled (cursor `not-allowed`) while `saving` is true.

### 4. Auto-redirect useEffect
Added a `useEffect` immediately after the `success` state declaration. When `success` becomes `true`, a 3-second `setTimeout` fires `router.push('/dashboard')`. The timeout is cleaned up on unmount or if `success` resets.

## Concerns
None. The shared `FolioUI` components have identical prop signatures to the deleted inline versions, so all existing call sites (`FolioInput` for weight/reps inputs, `FolioTextarea` for notes) are fully compatible. The auto-redirect coexists cleanly with the existing manual "Go to dashboard →" button in the success overlay.
