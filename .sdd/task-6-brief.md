# Task 6 Brief: Skills page — node loading skeleton

## Context
Task 6 of 10. Modifies `src/app/(plan)/skills/[subject]/page.tsx`.

**NOTE ON SCOPE CHANGE:** The original plan included swapping the inline `LogSessionModal` for the shared `LogSkillSessionModal`. After reviewing both files, the shared modal uses light-mode-only Tailwind color classes (`bg-surface-l1`, `bg-background`, `text-text-secondary`, `bg-gold`) that break in dark mode (the app default). The `--color-*` tokens don't override under `[data-theme="dark"]`. The inline modal is already correct. Skip the modal swap entirely.

## Required change

When `historyLoading` is true, the **nodes list** shows skeleton rows instead of the node data (which would all show as "locked" with 0 XP). This prevents confusing zero-state during the first load.

### Location
In `SkillPageContent`, the nodes list is rendered starting around line 408:
```tsx
{planNodes.length === 0 ? (
  <div ...>No nodes defined. ...</div>
) : planNodes.map((node, idx) => {
  ...
  return (<div key={node.id} ...>...</div>);
})}
```

### Change
Wrap the `planNodes.map(...)` block in a `historyLoading` conditional. When loading, show 3 skeleton rows:

```tsx
{planNodes.length === 0 ? (
  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, padding: '24px 0' }}>
    No nodes defined. <Link href="/plan" style={{ color: T.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>Edit plan →</Link>
  </div>
) : historyLoading ? (
  <>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ height: 56, borderBottom: `1px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 0', opacity: 0.4 - i * 0.1 }}>
        <div style={{ width: 8, height: 8, background: T.rule, flexShrink: 0 }} />
        <div style={{ height: 10, width: `${120 + i * 40}px`, background: T.rule }} />
      </div>
    ))}
  </>
) : planNodes.map((node, idx) => {
  // ... existing map code stays exactly the same
```

`historyLoading` is already in scope (line 263: `const { data: history, isLoading: historyLoading, error: historyError } = useSkillProgress(...)`).

## Verification
Run `npm run build` — must pass.

## Commit message
`feat: skills page — node loading skeleton`

## Report
Write to `.sdd/task-6-report.md`.
Return: status, commit hash, build result, concerns.
