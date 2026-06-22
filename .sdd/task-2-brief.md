# Task 2 Brief: Commit page — shared primitives, retry button, auto-redirect

## Context
Task 2 of 10. The commit page (`src/app/(plan)/commit/page.tsx`) currently defines `FolioInput` and `FolioTextarea` inline. Task 1 moved these to the shared `src/components/ui/FolioUI.tsx`. This task removes the inline duplicates, adds a retry button to the error banner, and adds an auto-redirect after the success overlay shows.

## Key facts about the current file
- `FolioInput` is defined around lines 41–55, `FolioTextarea` around lines 57–71
- The error banner is rendered as: `{error && (<div style={{ marginBottom: 16, padding: '12px 16px', border: \`1px solid ${T.negative}\`, background: T.tint, fontFamily: T.mono, fontSize: 11, color: T.negative }}>{error}</div>)}`
- The file already has `useState`, `useEffect`, `useMemo` imported from React — `useEffect` is already there
- `success` state is already tracked: `const [success, setSuccess] = useState(false);`
- `router` from `useRouter()` is already in scope
- `handleCommit` is the function to retry

## Required changes

### 1. Add import for shared components
At the top of the file, add:
```tsx
import { FolioInput, FolioTextarea } from '@/components/ui/FolioUI';
```

### 2. Delete inline FolioInput and FolioTextarea function definitions
Delete the two inline `function FolioInput(...)` and `function FolioTextarea(...)` blocks completely.

### 3. Replace error banner with retry button version
Find:
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

### 4. Add auto-redirect useEffect
After the line `const [success, setSuccess] = useState(false);`, add:
```tsx
useEffect(() => {
  if (!success) return;
  const t = setTimeout(() => router.push('/dashboard'), 3000);
  return () => clearTimeout(t);
}, [success, router]);
```

## Verification
Run `npm run build` — must pass with no new TypeScript errors.

## Commit message
`feat: commit page — shared primitives, retry button, auto-redirect`

## Report
Write full report to `.sdd/task-2-report.md`.
Return: status (DONE/BLOCKED/NEEDS_CONTEXT), commit hash, build result one-liner, concerns.
